import { createClient } from '@supabase/supabase-js'
import { hashApiKey } from '@/lib/utils/apikey'
import { NextResponse } from 'next/server'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function PATCH(request, { params }) {
  const { handle, id } = await params

  const auth = request.headers.get('authorization') ?? ''
  const apiKey = auth.replace(/^Bearer\s+/i, '').trim()
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'missing api key' }, { status: 401 })
  }

  const supabase = anonClient()
  const { data: result, error } = await supabase.rpc('mark_message_read', {
    p_handle: handle,
    p_api_key_hash: hashApiKey(apiKey),
    p_message_id: id,
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (!result?.ok) {
    return NextResponse.json({ ok: false, error: result?.error ?? 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ ok: true, updated: result.updated })
}
