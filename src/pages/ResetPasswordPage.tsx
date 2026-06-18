import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords don’t match.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await apiRequest('/LoginController/resetPassword', {
        method: 'POST',
        body: { token, newPassword: password },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { detail?: string } | null
        setError(data?.detail ?? 'This reset link is invalid or has expired.')
        return
      }

      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setError('Something went wrong. Try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__wash" aria-hidden="true" />
      <article className="auth__card">
        <header className="auth__head">
          <span className="auth__eyebrow">Reset · Account access</span>
          <h1 className="auth__title">Choose a new password.</h1>
          <p className="auth__sub">
            Pick something you haven&rsquo;t used before.
          </p>
        </header>

        {!token ? (
          <div className="auth__error" role="alert">
            This reset link is missing its token. Request a new one from the{' '}
            <Link to="/forgot-password" className="auth__foot-link">forgot password</Link> page.
          </div>
        ) : done ? (
          <div className="auth__success" role="status">
            Password updated. Taking you to sign in…
          </div>
        ) : (
          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            <label className="auth__field">
              <span className="auth__label">New password</span>
              <input
                className="auth__input"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                autoComplete="new-password"
                placeholder="Eight characters or more"
                required
              />
            </label>

            <label className="auth__field">
              <span className="auth__label">Confirm new password</span>
              <input
                className="auth__input"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                autoComplete="new-password"
                required
              />
            </label>

            {error ? (
              <div className="auth__error" role="alert">{error}</div>
            ) : null}

            <button type="submit" className="btn btn--solidDark auth__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <footer className="auth__foot">
          <span className="auth__foot-text">Remembered it?</span>
          <Link to="/login" className="auth__foot-link">Sign in →</Link>
        </footer>
      </article>
    </div>
  )
}
