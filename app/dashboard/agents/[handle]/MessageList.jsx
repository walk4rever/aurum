'use client'

import { useState } from 'react'

function formatAge(ts) {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function MessageList({ messages }) {
  const [tab, setTab] = useState('inbox')
  const [expanded, setExpanded] = useState(null)

  const inbox = messages.filter((m) => m.direction === 'inbound')
  const sent = messages.filter((m) => m.direction === 'outbound')
  const unreadCount = inbox.filter((m) => !m.read_at).length

  const list = tab === 'inbox' ? inbox : sent

  function toggle(id) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  return (
    <div className="msg-container">
      <div className="msg-tabs">
        <button
          className={`msg-tab${tab === 'inbox' ? ' msg-tab-active' : ''}`}
          onClick={() => setTab('inbox')}
        >
          Inbox
          {unreadCount > 0 && <span className="msg-unread-count">{unreadCount}</span>}
        </button>
        <button
          className={`msg-tab${tab === 'sent' ? ' msg-tab-active' : ''}`}
          onClick={() => setTab('sent')}
        >
          Sent
        </button>
      </div>

      <div className="msg-list">
        {list.length === 0 ? (
          <div className="msg-empty">No messages.</div>
        ) : (
          list.map((m) => {
            const isOpen = expanded === m.id
            const isUnread = m.direction === 'inbound' && !m.read_at
            const peer = tab === 'inbox' ? m.from_addr : m.to_address

            return (
              <div
                key={m.id}
                className={`msg-row${isOpen ? ' msg-row-open' : ''}${isUnread ? ' msg-row-unread' : ''}`}
                onClick={() => toggle(m.id)}
              >
                <div className="msg-row-summary">
                  <span className="msg-dot">{isUnread ? '●' : ''}</span>
                  <span className="msg-channel-badge">{m.channel}</span>
                  <span className="msg-peer">{peer}</span>
                  <span className="msg-subject">{m.subject || '(no subject)'}</span>
                  <span className="msg-time">{formatAge(m.received_at)}</span>
                </div>
                {isOpen && (
                  <div className="msg-body">
                    {m.body_text || '(no content)'}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
