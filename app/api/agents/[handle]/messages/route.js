import { createClient } from '@supabase/supabase-js'
import { hashApiKey } from '@/lib/utils/apikey'
import { NextResponse } from 'next/server'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function GET(request, { params }) {
  const { handle } = await params

  const auth = request.headers.get('authorization') ?? ''
  const apiKey = auth.replace(/^Bearer\s+/i, '').trim()
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'missing api key' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100)
  const since = url.searchParams.get('since') ?? null

  const supabase = anonClient()
  const { data, error } = await supabase.rpc('get_agent_messages', {
    p_handle: handle,
    p_api_key_hash: hashApiKey(apiKey),
    p_limit: limit,
    p_since: since,
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (!data?.ok) {
    return NextResponse.json({ ok: false, error: data?.error ?? 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ ok: true, messages: data.messages })
}
