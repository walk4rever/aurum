import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { hashApiKey } from '@/lib/utils/apikey'
import { createServiceClient } from '@/lib/supabase/service'

const DOMAIN = 'air7.fun'
const resend = new Resend(process.env.RESEND_API_KEY)
const FALLBACK_FROM = process.env.RESEND_FROM_EMAIL || 'aurum@air7.fun'

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
      return NextResponse.json({ ok: false, error: 'missing required fields: to, subject' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: agent, error: agentErr } = await supabase
      .from('aurum_agents')
      .select('handle, owner_id')
      .eq('api_key_hash', hashApiKey(apiKey))
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (agentErr) {
      return NextResponse.json({ ok: false, error: agentErr.message }, { status: 500 })
    }
    if (!agent) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileErr } = await supabase
      .from('aurum_profiles')
      .select('username')
      .eq('id', agent.owner_id)
      .limit(1)
      .maybeSingle()

    if (profileErr) {
      return NextResponse.json({ ok: false, error: profileErr.message }, { status: 500 })
    }

    const localPart = profile?.username ? `${agent.handle}.${profile.username}` : agent.handle
    const fromAddress = `${localPart}@${DOMAIN}`

    const { error: sendErr } = await resend.emails.send({
      from: `Aurum <${FALLBACK_FROM}>`,
      to: [to],
      subject,
      text,
      html: textToHtml(text),
      replyTo: fromAddress,
    })

    if (sendErr) {
      return NextResponse.json({ ok: false, error: sendErr.message }, { status: 502 })
    }

    return NextResponse.json({ ok: true, from: fromAddress })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message ?? 'unexpected error' }, { status: 500 })
  }
}
