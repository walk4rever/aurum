import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { hashApiKey } from '@/lib/utils/apikey'

const DOMAIN = 'air7.fun'
const resend = new Resend(process.env.RESEND_API_KEY)
const FALLBACK_FROM = process.env.RESEND_FROM_EMAIL || `aurum@${DOMAIN}`

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function textToHtml(text) {
  return `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(text)}</pre>`
}

export async function POST(request) {
  try {
    const auth = request.headers.get('authorization') ?? ''
    const apiKey = auth.replace(/^Bearer\s+/i, '').trim()
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
      return NextResponse.json({ ok: false, error: result?.error ?? 'unauthorized' }, { status: 401 })
    }

    // Internal delivery: message already written to recipient's inbox
    if (result.is_internal) {
      return NextResponse.json({ ok: true, from: result.from, channel: 'api' })
    }

    // External delivery: send via Resend
    const { error: sendErr } = await resend.emails.send({
      from: `Aurum <${FALLBACK_FROM}>`,
      to: [to],
      subject,
      text,
      html: textToHtml(text),
      replyTo: result.from,
    })

    if (sendErr) {
      return NextResponse.json({ ok: false, error: sendErr.message }, { status: 502 })
    }

    return NextResponse.json({ ok: true, from: result.from, channel: 'email' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message ?? 'unexpected error' }, { status: 500 })
  }
}
