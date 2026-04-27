"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const router = useRouter()

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      setStatus('idle')
      setError(authError.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="form-page">
      <div className="form-shell">
        <a className="back-link" href="/">← Back</a>
        <h1>Sign in</h1>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              required
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={update('email')}
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={update('password')}
            />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button className="button primary" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="form-footer">
          No account? <a href="/register">Create one</a>
        </p>
      </div>
    </main>
  )
}
