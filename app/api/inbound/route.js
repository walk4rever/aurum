import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

const DOMAIN = 'air7.fun'

export async function POST(request) {
  const payload = await request.json()

  // Resend inbound payload shape
  const from = payload.from ?? ''
  const toList = Array.isArray(payload.to) ? payload.to : [payload.to]
  const subject = payload.subject ?? ''
  const bodyText = payload.text ?? ''
  const bodyHtml = payload.html ?? ''

  // Extract handle from the first matching recipient
  const handle = toList
    .map((addr) => {
      const local = addr.replace(/.*<(.+)>/, '$1').split('@')
      return local.length === 2 && local[1] === DOMAIN ? local[0] : null
    })
    .find(Boolean)

  if (!handle) {
    return NextResponse.json({ ok: false, error: 'no matching recipient' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: agent, error: agentErr } = await supabase
    .from('aurum_agents')
    .select('id')
    .eq('handle', handle)
    .eq('status', 'active')
    .single()

  if (agentErr || !agent) {
    return NextResponse.json({ ok: false, error: 'agent not found' }, { status: 404 })
  }

  const { error: insertErr } = await supabase.from('aurum_messages').insert({
    agent_id: agent.id,
    from_addr: from,
    subject,
    body_text: bodyText,
    body_html: bodyHtml,
    raw_payload: payload,
  })

  if (insertErr) {
    return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
