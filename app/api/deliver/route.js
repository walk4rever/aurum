import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DOMAIN = 'air7.fun'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// POST /api/deliver — unauthenticated delivery from any external system
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const to = String(body.to ?? '').trim()
  const from = String(body.from ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const text = String(body.text ?? '').trim()

  if (!to || !from || !subject) {
    return NextResponse.json(
      { ok: false, error: 'missing required fields: to, from, subject' },
      { status: 400 }
    )
  }

  // Extract handle from full address: "neo.r129@air7.fun" → "neo.r129"
  const atIdx = to.indexOf('@')
  const local = atIdx !== -1 ? to.slice(0, atIdx) : to

  if (atIdx !== -1 && to.slice(atIdx + 1) !== DOMAIN) {
    return NextResponse.json(
      { ok: false, error: `recipient must be @${DOMAIN}` },
      { status: 422 }
    )
  }

  const supabase = anonClient()
  const { data: result, error } = await supabase.rpc('receive_message', {
    p_handle: local,
    p_from: from,
    p_subject: subject,
    p_body_text: text,
    p_body_html: '',
    p_payload: body,
    p_to: to,
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
