import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAccessToken } from '@/lib/auth/tokens'

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
  const supabase = anonClient()
  const { data: check, error: rpcError } = await supabase.rpc('auth_verify_agent_key', {
    p_key_id: payload.key_id,
    p_agent_id: payload.sub,
  })

  if (rpcError) {
    return NextResponse.json({ active: false, error: 'server_error' }, { status: 500 })
  }

  if (!check?.ok) {
    const status = check?.error === 'inactive_agent' ? 403 : 401
    return NextResponse.json({ active: false, error: check?.error ?? 'revoked_token' }, { status })
  }

  return NextResponse.json({
    active: true,
    agent_id: payload.sub,
    address: payload.address,
    status: check.status,
    audience: payload.aud,
    scope: payload.scope,
    exp: payload.exp,
    key_id: payload.key_id,
  })
}
