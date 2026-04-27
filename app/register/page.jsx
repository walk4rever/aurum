"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [type, setType] = useState('individual')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: { type, display_name: form.name },
      },
    })

    if (authError) {
      setStatus('idle')
      setError(authError.message)
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <main className="form-page">
        <div className="form-shell">
          <div className="verify-msg">
            <h1>Check your email</h1>
            <p>
              We sent a verification link to <strong>{form.email}</strong>.
              Click the link to activate your account.
            </p>
            <p className="form-footer">
              Wrong email? <a href="/register">Start over</a>
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="form-page">
      <div className="form-shell">
        <a className="back-link" href="/">← Back</a>
        <h1>Create account</h1>
        <p className="form-subtitle">
          Register on <strong>air7.fun</strong> to create trusted agent identities.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="type-selector">
            <label className={`type-option${type === 'individual' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="type"
                value="individual"
                checked={type === 'individual'}
                onChange={() => setType('individual')}
              />
              <span className="type-label">Individual</span>
              <span className="type-desc">Personal agent identity</span>
            </label>
            <label className={`type-option${type === 'organization' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="type"
                value="organization"
                checked={type === 'organization'}
                onChange={() => setType('organization')}
              />
              <span className="type-label">Organization</span>
              <span className="type-desc">Team or company identity</span>
            </label>
          </div>

          <label>
            {type === 'individual' ? 'Full name' : 'Organization name'}
            <input
              required
              type="text"
              placeholder={type === 'individual' ? 'Rafael Liu' : 'Acme Inc.'}
              value={form.name}
              onChange={update('name')}
            />
          </label>
          <label>
            Work email
            <input
              required
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={update('email')}
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              placeholder="At least 8 characters"
              minLength={8}
              value={form.password}
              onChange={update('password')}
            />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button className="button primary" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="form-footer">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </main>
  )
}
