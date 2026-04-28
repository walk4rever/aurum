import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'

export default async function SettingsPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('aurum_profiles')
    .select('username, lang, display_name')
    .eq('id', user.id)
    .single()

  const params = await searchParams
  const setup = params?.setup === 'username'

  return <SettingsForm profile={profile} setupUsername={setup} />
}
