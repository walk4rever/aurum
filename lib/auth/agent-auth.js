import { hashApiKey } from '@/lib/utils/apikey'

export async function resolveAgentByApiKey(supabase, apiKey) {
  const keyHash = hashApiKey(apiKey)

  const { data: keyRow, error: keyError } = await supabase
    .from('aurum_agent_keys')
    .select('id, agent_id, status')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (keyError) {
    throw keyError
  }

  if (!keyRow) {
    return { ok: false, error: 'invalid_token' }
  }

  if (keyRow.status !== 'active') {
    return { ok: false, error: 'revoked_token' }
  }

  const { data: agentRow, error: agentError } = await supabase
    .from('aurum_agents')
    .select('id, owner_id, handle, status')
    .eq('id', keyRow.agent_id)
    .maybeSingle()

  if (agentError) {
    throw agentError
  }

  if (!agentRow || agentRow.status !== 'active') {
    return { ok: false, error: 'inactive_agent' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('aurum_profiles')
    .select('username')
    .eq('id', agentRow.owner_id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  const addressLocal = profile?.username
    ? `${agentRow.handle}.${profile.username}`
    : agentRow.handle

  await supabase
    .from('aurum_agent_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)

  return {
    ok: true,
    agent: {
      agent_id: agentRow.id,
      owner_id: agentRow.owner_id,
      status: agentRow.status,
      address: `${addressLocal}@air7.fun`,
      key_id: keyRow.id,
    },
  }
}
