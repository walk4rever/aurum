import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

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
