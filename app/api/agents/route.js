import { createClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/utils/apikey'
import { NextResponse } from 'next/server'

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

export async function POST(request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const handle = (body.handle ?? '').trim().toLowerCase()

  if (!HANDLE_RE.test(handle)) {
    return NextResponse.json(
      { success: false, error: 'Handle must be 3–30 characters, lowercase letters, digits, or hyphens (no leading/trailing hyphens).' },
      { status: 422 }
    )
  }

  const { count, error: countError } = await supabase
    .from('aurum_agents')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('status', 'active')

  if (countError) {
    return NextResponse.json({ success: false, error: countError.message }, { status: 500 })
  }

  if (count >= 3) {
    return NextResponse.json({ success: false, error: 'Maximum 3 active agents per account.' }, { status: 422 })
  }

  // Ensure profile exists before inserting agent (FK: aurum_agents.owner_id → aurum_profiles.id).
  // Covers shared-auth users who log in via password and bypass /auth/confirm.
  await supabase.from('aurum_profiles').upsert(
    { id: user.id, type: 'individual', display_name: user.email?.split('@')[0] ?? '' },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  const { data: agent, error: insertError } = await supabase
    .from('aurum_agents')
    .insert({ owner_id: user.id, handle, api_key_hash: apiKeyHash })
    .select('id, handle, status, created_at')
    .single()

  if (insertError) {
    const msg = insertError.message.includes('aurum_agents_handle_unique')
      ? 'That handle is already taken.'
      : insertError.message
    return NextResponse.json({ success: false, error: msg }, { status: 422 })
  }

  return NextResponse.json({ success: true, data: { agent, apiKey } }, { status: 201 })
}
