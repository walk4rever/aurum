import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const agentId = String(body.agent_id ?? '').trim()
  const keyId = String(body.key_id ?? '').trim()

  if (!agentId) {
    return NextResponse.json({ error: 'missing_agent_id' }, { status: 400 })
  }

  const userClient = await createClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: ownedAgent } = await userClient
    .from('aurum_agents')
    .select('id')
    .eq('id', agentId)
    .maybeSingle()

  if (!ownedAgent) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()
  let query = supabase
    .from('aurum_agent_keys')
    .update({ status: 'revoked', revoked_at: now })
    .eq('agent_id', agentId)
    .eq('status', 'active')

  if (keyId) {
    query = query.eq('id', keyId)
  }

  const { error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    agent_id: agentId,
    key_id: keyId || null,
    status: 'revoked',
    effective_within_seconds: 30,
  })
}

