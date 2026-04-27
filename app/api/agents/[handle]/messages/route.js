import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// Authenticate via API key in Authorization: Bearer <key>
async function resolveAgent(request, handle) {
  const auth = request.headers.get('authorization') ?? ''
  const apiKey = auth.replace(/^Bearer\s+/i, '').trim()
  if (!apiKey) return { error: 'missing api key', status: 401 }

  const { hashApiKey } = await import('@/lib/utils/apikey')
  const hash = hashApiKey(apiKey)

  const supabase = createServiceClient()
  const { data: agent, error } = await supabase
    .from('aurum_agents')
    .select('id, handle, status')
    .eq('handle', handle)
    .eq('api_key_hash', hash)
    .eq('status', 'active')
    .single()

  if (error || !agent) return { error: 'unauthorized', status: 401 }
  return { agent, supabase }
}

export async function GET(request, { params }) {
  const { handle } = await params
  const { agent, supabase, error, status } = await resolveAgent(request, handle)
  if (error) return NextResponse.json({ ok: false, error }, { status })

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100)
  const since = url.searchParams.get('since') // ISO timestamp

  let query = supabase
    .from('aurum_messages')
    .select('id, from_addr, subject, body_text, body_html, received_at')
    .eq('agent_id', agent.id)
    .order('received_at', { ascending: false })
    .limit(limit)

  if (since) query = query.gt('received_at', since)

  const { data, error: fetchErr } = await query
  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, messages: data })
}
