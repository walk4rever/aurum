import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

const USERNAME_RE = /^[a-z0-9][a-z0-9_]{1,28}[a-z0-9]$/

export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates = {}

  if ('username' in body) {
    const username = (body.username ?? '').trim().toLowerCase()
    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3–30 characters: lowercase letters, digits, or underscores (no leading/trailing underscores).' },
        { status: 422 }
      )
    }
    updates.username = username
  }

  if ('lang' in body) {
    if (!['en', 'zh'].includes(body.lang)) {
      return NextResponse.json({ success: false, error: 'Invalid language.' }, { status: 422 })
    }
    updates.lang = body.lang
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: 'Nothing to update.' }, { status: 400 })
  }

  const { error } = await supabase.from('aurum_profiles').update(updates).eq('id', user.id)

  if (error) {
    const msg = error.code === '23505'
      ? 'That username is already taken.'
      : error.message
    return NextResponse.json({ success: false, error: msg }, { status: error.code === '23505' ? 422 : 500 })
  }

  const response = NextResponse.json({ success: true })
  if ('lang' in updates) {
    response.cookies.set('aurum.lang', updates.lang, { path: '/', maxAge: 31536000 })
  }
  return response
}

export async function POST(request) {
  const { userId, type, displayName } = await request.json()

  if (!userId || !type) {
    return NextResponse.json({ success: false, error: 'Missing userId or type' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('aurum_profiles')
    .upsert({
      id: userId,
      type,
      display_name: displayName || '',
    })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
