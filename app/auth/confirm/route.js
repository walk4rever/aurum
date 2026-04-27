import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('aurum_profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        if (!profile) {
          await supabase.from('aurum_profiles').upsert({
            id: user.id,
            type: user.user_metadata?.type || 'individual',
            display_name: user.user_metadata?.display_name
              || user.user_metadata?.full_name
              || user.email?.split('@')[0]
              || '',
          })
        }
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
