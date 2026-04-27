"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAgentPage() {
  const [handle, setHandle] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const preview = handle ? `${handle}@air7.fun` : 'handle@air7.fun'

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    })

    const json = await res.json()

    if (!json.success) {
      setStatus('idle')
      setError(json.error)
      return
    }

    setRevealed(json.data.apiKey)
    setStatus('done')
  }

  function copyKey() {
    navigator.clipboard.writeText(revealed)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'done') {
    return (
      <main className="form-page">
        <div className="form-shell">
          <h1>Agent created</h1>
          <p className="form-subtitle">
            Your agent address is <strong>{handle}@air7.fun</strong>.
            Copy your API key now — it will not be shown again.
          </p>

          <div className="key-reveal">
            <div className="key-box">{revealed}</div>
            <button className="button primary small copy-btn" onClick={copyKey}>
              {copied ? 'Copied!' : 'Copy key'}
            </button>
          </div>

          <p className="form-footer" style={{ marginTop: 24 }}>
            <a href="/dashboard">← Back to dashboard</a>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="form-page">
      <div className="form-shell">
        <a className="back-link" href="/dashboard">← Back</a>
        <h1>New agent</h1>
        <p className="form-subtitle">
          Choose a handle for your agent. It will receive messages at <strong>{preview}</strong>.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Handle
            <div className="handle-input-wrap">
              <input
                required
                type="text"
                placeholder="my-agent"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                autoFocus
                minLength={3}
                maxLength={30}
              />
              <span className="handle-domain">@air7.fun</span>
            </div>
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button className="button primary" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creating…' : 'Create agent'}
          </button>
        </form>
      </div>
    </main>
  )
}
