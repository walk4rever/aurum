import { createClient } from '@supabase/supabase-js'
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

export async function POST(request) {
  const event = await request.json()

  if (event.type !== 'email.received') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const meta = event.data
  const { data: email, error: fetchErr } = await resend.emails.receiving.get(meta.email_id)

  if (fetchErr || !email) {
    return NextResponse.json({ ok: false, error: fetchErr?.message ?? 'fetch failed' }, { status: 500 })
  }

  const toList = Array.isArray(meta.to) ? meta.to : [meta.to]
  const handle = toList
    .map((addr) => {
      const local = String(addr).replace(/.*<(.+)>/, '$1').split('@')
      return local.length === 2 && local[1] === DOMAIN ? local[0] : null
    })
    .find(Boolean)

  if (!handle) {
    return NextResponse.json({ ok: false, error: 'no matching recipient' }, { status: 422 })
  }

  const supabase = anonClient()
  const { data: result, error: rpcErr } = await supabase.rpc('receive_message', {
    p_handle: handle,
    p_from: meta.from ?? '',
    p_subject: meta.subject ?? '',
    p_body_text: email.text ?? '',
    p_body_html: email.html ?? '',
    p_payload: event,
  })

  if (rpcErr) {
    return NextResponse.json({ ok: false, error: rpcErr.message }, { status: 500 })
  }

  if (!result?.ok) {
    return NextResponse.json({ ok: false, error: result?.error ?? 'failed' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
