import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { markAuthenticatedFromResponse } from '../auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await apiRequest('/LoginController/login', {
        method: 'POST',
        body: { email, password },
      })

      if (!response.ok) {
        setError('Wrong email or password.')
        return
      }

      await markAuthenticatedFromResponse(response)
      navigate('/home')
    } catch {
      setError('Wrong email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__wash" aria-hidden="true" />
      <article className="auth__card">
        <header className="auth__head">
          <span className="auth__eyebrow">Sign in · Members</span>
          <h1 className="auth__title">Welcome back.</h1>
          <p className="auth__sub">
            A short, deliberate list awaits — log in to pick up where you left.
          </p>
        </header>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <label className="auth__field">
            <span className="auth__label">Email</span>
            <input
              className="auth__input"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Password</span>
            <input
              className="auth__input"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <div className="auth__error" role="alert">{error}</div>
          ) : null}

          <button type="submit" className="btn btn--solidDark auth__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <footer className="auth__foot">
          <Link to="/forgot-password" className="auth__foot-link">Forgot password?</Link>
          <span className="auth__foot-text" style={{ margin: '0 8px' }}>·</span>
          <span className="auth__foot-text">New here?</span>
          <Link to="/signup" className="auth__foot-link">Sign up →</Link>
        </footer>
      </article>
    </div>
  )
}
