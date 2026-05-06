import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../../actions'
import MessageList from './MessageList'

export default async function AgentDetailPage({ params }) {
  const { handle } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('aurum_agents')
    .select('id, handle, status, created_at')
    .eq('handle', handle)
    .eq('owner_id', user.id)
    .single()

  if (!agent) notFound()

  const { data: profile } = await supabase
    .from('aurum_profiles')
    .select('username, display_name, type')
    .eq('id', user.id)
    .single()

  const address = profile?.username
    ? `${agent.handle}.${profile.username}@air7.fun`
    : `${agent.handle}@air7.fun`

  const { data: messages } = await supabase
    .from('aurum_messages')
    .select('id, channel, direction, from_addr, to_address, subject, body_text, read_at, received_at')
    .eq('agent_id', agent.id)
    .order('received_at', { ascending: false })
    .limit(100)

  const displayName = profile?.username
    ? `@${profile.username}`
    : (profile?.display_name || user.email)

  const avatarLetter = (profile?.username || profile?.display_name || user.email || '?')[0].toUpperCase()

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-inner">
          <Link href="/" className="dash-logo">
            <Image src="/assets/aurum-mark.svg" alt="Aurum" width={26} height={26} />
            <span>Aurum</span>
          </Link>

          <div className="dash-identity">
            <div className="dash-avatar">{avatarLetter}</div>
            <div className="dash-identity-info">
              <div className="dash-identity-name">{displayName}</div>
              <div className="dash-identity-type">{user.email?.toLowerCase()}</div>
            </div>
          </div>

          <nav className="dash-nav">
            <span className="dash-nav-label">Workspace</span>
            <Link href="/dashboard" className="dash-nav-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="3"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
              Agents
            </Link>
          </nav>

          <div className="dash-sidebar-footer">
            <Link href="/dashboard/settings" className="dash-footer-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Settings
            </Link>
            <form action={signOut} style={{ margin: 0 }}>
              <button type="submit" className="dash-footer-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-content">
          <div className="agent-detail-header">
            <div className="agent-detail-address">{address}</div>
            <div className="agent-detail-meta">
              <span className="agent-status-dot" />
              <span>{agent.status}</span>
              <span className="agent-detail-sep">·</span>
              <span>created {new Date(agent.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <MessageList messages={messages ?? []} />
        </div>
      </main>
    </div>
  )
}
