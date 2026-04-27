import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DOMAIN = 'air7.fun'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function POST(request) {
  const payload = await request.json()

  const from = payload.from ?? ''
  const toList = Array.isArray(payload.to) ? payload.to : [payload.to]
  const subject = payload.subject ?? ''
  const bodyText = payload.text ?? ''
  const bodyHtml = payload.html ?? ''

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
  const { data, error } = await supabase.rpc('receive_message', {
    p_handle: handle,
    p_from: from,
    p_subject: subject,
    p_body_text: bodyText,
    p_body_html: bodyHtml,
    p_payload: payload,
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (!data?.ok) {
    return NextResponse.json({ ok: false, error: data?.error ?? 'failed' }, { status: 404 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
