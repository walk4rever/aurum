import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyAccessToken } from '@/lib/auth/tokens'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ active: false, error: 'invalid_json' }, { status: 400 })
  }

  const token = String(body.token ?? '').trim()
  if (!token) {
    return NextResponse.json({ active: false, error: 'invalid_token' }, { status: 401 })
  }

  const verified = verifyAccessToken(token)
  if (!verified.ok) {
    const status = verified.error === 'expired_token' ? 401 : 400
    return NextResponse.json({ active: false, error: verified.error }, { status })
  }

  const { payload } = verified
  const supabase = createServiceClient()

  const { data: keyRow, error: keyError } = await supabase
    .from('aurum_agent_keys')
    .select('id, agent_id, status')
    .eq('id', payload.key_id)
    .maybeSingle()

  if (keyError) {
    return NextResponse.json({ active: false, error: 'server_error' }, { status: 500 })
  }

  if (!keyRow || keyRow.status !== 'active' || keyRow.agent_id !== payload.sub) {
    return NextResponse.json({ active: false, error: 'revoked_token' }, { status: 401 })
  }

  const { data: agentRow, error: agentError } = await supabase
    .from('aurum_agents')
    .select('id, status')
    .eq('id', payload.sub)
    .maybeSingle()

  if (agentError) {
    return NextResponse.json({ active: false, error: 'server_error' }, { status: 500 })
  }

  if (!agentRow || agentRow.status !== 'active') {
    return NextResponse.json({ active: false, error: 'inactive_agent' }, { status: 403 })
  }

  return NextResponse.json({
    active: true,
    agent_id: payload.sub,
    address: payload.address,
    status: agentRow.status,
    audience: payload.aud,
    scope: payload.scope,
    exp: payload.exp,
    key_id: payload.key_id,
  })
}

