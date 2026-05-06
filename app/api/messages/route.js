import { createClient } from '@supabase/supabase-js'
import { hashApiKey } from '@/lib/utils/apikey'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const DOMAIN = 'air7.fun'
const resend = new Resend(process.env.RESEND_API_KEY)

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function extractApiKey(request) {
  const auth = request.headers.get('authorization') ?? ''
  return auth.replace(/^Bearer\s+/i, '').trim()
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

// GET /api/messages — read inbox
export async function GET(request) {
  const apiKey = extractApiKey(request)
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'missing api key' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100)
  const since = url.searchParams.get('since') ?? null

  const supabase = anonClient()
  const { data, error } = await supabase.rpc('get_agent_messages', {
    p_api_key_hash: hashApiKey(apiKey),
    p_limit: limit,
    p_since: since,
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (!data?.ok) {
    return NextResponse.json({ ok: false, error: data?.error ?? 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ ok: true, messages: data.messages })
}

// POST /api/messages — send a message
export async function POST(request) {
  try {
    const apiKey = extractApiKey(request)
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'missing api key' }, { status: 401 })
    }

    const body = await request.json()
    const to = String(body.to ?? '').trim()
    const subject = String(body.subject ?? '').trim()
    const text = String(body.text ?? '').trim()

    if (!to || !subject) {
      return NextResponse.json(
        { ok: false, error: 'missing required fields: to, subject' },
        { status: 400 }
      )
    }

    const supabase = anonClient()
    const { data: result, error: rpcErr } = await supabase.rpc('send_message', {
      p_api_key_hash: hashApiKey(apiKey),
      p_to: to,
      p_subject: subject,
      p_body_text: text,
      p_channel: 'api',
    })

    if (rpcErr) {
      return NextResponse.json({ ok: false, error: rpcErr.message }, { status: 500 })
    }
    if (!result?.ok) {
      return NextResponse.json({ ok: false, error: result?.error ?? 'failed' }, { status: 400 })
    }

    if (result.is_internal) {
      return NextResponse.json({ ok: true, from: result.from, channel: 'api' })
    }

    const { error: sendErr } = await resend.emails.send({
      from: result.from,
      to: [to],
      subject,
      text,
      html: `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(text)}</pre>`,
    })

    if (sendErr) {
      return NextResponse.json({ ok: false, error: sendErr.message }, { status: 502 })
    }

    return NextResponse.json({ ok: true, from: result.from, channel: 'email' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message ?? 'unexpected error' }, { status: 500 })
  }
}
