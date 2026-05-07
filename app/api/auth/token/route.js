import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mintAccessToken } from '@/lib/auth/tokens'
import { hashApiKey } from '@/lib/utils/apikey'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const grantType = String(body.grant_type ?? '').trim()
  const apiKey = String(body.api_key ?? '').trim()
  const audience = String(body.audience ?? 'default').trim()
  const scope = String(body.scope ?? 'identity:read').trim()
  const ttlSeconds = Number(body.ttl_seconds ?? 900)

  if (grantType !== 'api_key') {
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'missing_api_key' }, { status: 400 })
  }

  const supabase = anonClient()
  const { data: resolved, error: rpcError } = await supabase.rpc('auth_resolve_agent_by_api_key_hash', {
    p_api_key_hash: hashApiKey(apiKey),
  })

  if (rpcError) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  if (!resolved?.ok) {
    const status = resolved?.error === 'inactive_agent' ? 403 : 401
    return NextResponse.json({ error: resolved?.error ?? 'invalid_token' }, { status })
  }

  let token
  try {
    token = mintAccessToken({
      agentId: resolved.agent_id,
      keyId: resolved.key_id,
      address: resolved.address,
      status: resolved.status,
      audience,
      scope,
      ttlSeconds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message === 'missing_token_secret' ? 'server_misconfigured' : 'server_error' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    access_token: token.accessToken,
    token_type: 'Bearer',
    expires_in: token.expiresIn,
  })
}
