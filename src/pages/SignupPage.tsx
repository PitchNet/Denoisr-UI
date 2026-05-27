import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setAuthToken } from '../auth'

const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email and a password are both required.')
      return
    }
    if (!email.includes('@')) {
      setError('That email looks off — try again.')
      return
    }

    setAuthToken('signup-token')
    sessionStorage.setItem(
      SIGNUP_CREDENTIALS_KEY,
      JSON.stringify({ email: email.trim(), password }),
    )

    navigate('/dashboard')
  }

  return (
    <div className="auth">
      <div className="auth__wash auth__wash--alt" aria-hidden="true" />
      <article className="auth__card">
        <header className="auth__head">
          <span className="auth__eyebrow">Request invite · Cohort 05</span>
          <h1 className="auth__title">Create your signal.</h1>
          <p className="auth__sub">
            A work email gets you reviewed faster. We reply from a real address —
            no autoresponder, no marketing list.
          </p>
        </header>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <label className="auth__field">
            <span className="auth__label">Work email</span>
            <input
              className="auth__input"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              autoComplete="email"
              placeholder="you@work.com"
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
              autoComplete="new-password"
              placeholder="Eight characters or more"
              required
            />
          </label>

          {error ? (
            <div className="auth__error" role="alert">{error}</div>
          ) : null}

          <button type="submit" className="btn btn--solidDark auth__submit">
            Request invite
          </button>

          <p className="auth__legal">
            By continuing you agree to our{' '}
            <Link to="/terms-of-service" className="auth__legal-link">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="auth__legal-link">Privacy policy</Link>.
          </p>
        </form>

        <footer className="auth__foot">
          <span className="auth__foot-text">Already a member?</span>
          <Link to="/login" className="auth__foot-link">Sign in →</Link>
        </footer>
      </article>
    </div>
  )
}
