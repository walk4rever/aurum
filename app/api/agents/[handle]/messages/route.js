import { createClient } from '@supabase/supabase-js'
import { hashApiKey } from '@/lib/utils/apikey'
import { NextResponse } from 'next/server'

const DOMAIN = 'air7.fun'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function GET(request, { params }) {
  const { handle } = await params

  const auth = request.headers.get('authorization') ?? ''
  const apiKey = auth.replace(/^Bearer\s+/i, '').trim()
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'missing api key' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100)
  const since = url.searchParams.get('since') ?? null

  const supabase = anonClient()
  const { data, error } = await supabase.rpc('get_agent_messages', {
    p_handle: handle,
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

// api channel inbound — public, no auth required (like email inbound)
export async function POST(request, { params }) {
  const { handle } = await params

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const from = String(body.from ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const text = String(body.text ?? '').trim()

  if (!from || !subject) {
    return NextResponse.json(
      { ok: false, error: 'missing required fields: from, subject' },
      { status: 400 }
    )
  }

  const supabase = anonClient()
  const { data: result, error } = await supabase.rpc('receive_message', {
    p_handle: handle,
    p_from: from,
    p_subject: subject,
    p_body_text: text,
    p_body_html: '',
    p_payload: body,
    p_to: `${handle}@${DOMAIN}`,
    p_channel: 'api',
    p_direction: 'inbound',
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (!result?.ok) {
    return NextResponse.json({ ok: false, error: result?.error ?? 'failed' }, { status: 404 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
