import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'

type ForgotPasswordResponse = {
  message?: string
  // Only present when no email provider is configured server-side — see
  // LoginController.forgot_password. In that mode the API hands the reset
  // token straight back so we can skip the email step entirely.
  token?: string
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await apiRequest('/LoginController/forgotPassword', {
        method: 'POST',
        body: { email },
      })
      const data = (await response.json().catch(() => null)) as ForgotPasswordResponse | null

      if (data?.token) {
        navigate(`/reset-password?token=${encodeURIComponent(data.token)}`)
        return
      }

      // The API always responds the same way whether or not the email is
      // registered, so the UI shows the same confirmation either way.
      setMessage(data?.message ?? 'If that email is registered, a reset link is on its way.')
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
          <h1 className="auth__title">Forgot your password?</h1>
          <p className="auth__sub">
            Enter the email on your account to reset its password.
          </p>
        </header>

        {message ? (
          <div className="auth__success" role="status">{message}</div>
        ) : (
          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            <label className="auth__field">
              <span className="auth__label">Email</span>
              <input
                className="auth__input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                autoFocus
                required
              />
            </label>

            {error ? (
              <div className="auth__error" role="alert">{error}</div>
            ) : null}

            <button type="submit" className="btn btn--solidDark auth__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Continuing…' : 'Continue'}
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
