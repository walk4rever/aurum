import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateApiKey, hashApiKey } from '@/lib/utils/apikey'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const agentId = String(body.agent_id ?? '').trim()
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
  await supabase
    .from('aurum_agent_keys')
    .update({ status: 'revoked', revoked_at: now })
    .eq('agent_id', agentId)
    .eq('status', 'active')

  const apiKey = generateApiKey()
  const keyHash = hashApiKey(apiKey)

  const { data: keyRow, error: insertError } = await supabase
    .from('aurum_agent_keys')
    .insert({
      agent_id: agentId,
      key_hash: keyHash,
      status: 'active',
      label: 'rotated',
    })
    .select('id, created_at')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Backward compatibility while message RPCs still read aurum_agents.api_key_hash.
  await supabase
    .from('aurum_agents')
    .update({ api_key_hash: keyHash })
    .eq('id', agentId)

  return NextResponse.json({
    key_id: keyRow.id,
    api_key: apiKey,
    status: 'active',
    created_at: keyRow.created_at,
  })
}

