import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest, getAuthTokenFromCookies } from '../api'
import { setAuthToken } from '../auth'

const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'
const LINKEDIN_DATA_KEY = 'denoisr-linkedin-data'

// The import is a single ~20-50s backend call (Apify scrape + Gemini
// restructuring) with no progress events, so we fake staged progress from
// elapsed time and cap it short of 100% until the response actually lands.
const IMPORT_STAGES = [
  { at: 0, label: 'Fetching your LinkedIn profile…' },
  { at: 30, label: 'Reading your experience…' },
  { at: 60, label: 'Structuring your profile with AI…' },
  { at: 85, label: 'Almost done…' },
]
const IMPORT_PROGRESS_CAP = 92

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isLinkedInFlow = searchParams.get('source') === 'linkedin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const importTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const importStage =
    [...IMPORT_STAGES].reverse().find((s) => importProgress >= s.at)?.label ?? IMPORT_STAGES[0].label

  useEffect(() => {
    return () => {
      if (importTimerRef.current) clearInterval(importTimerRef.current)
    }
  }, [])

  function startFakeProgress() {
    setImportProgress(0)
    importTimerRef.current = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= IMPORT_PROGRESS_CAP) return prev
        const step = prev < 50 ? 4 : prev < 75 ? 2 : 0.5
        return Math.min(prev + step, IMPORT_PROGRESS_CAP)
      })
    }, 350)
  }

  function stopFakeProgress() {
    if (importTimerRef.current) {
      clearInterval(importTimerRef.current)
      importTimerRef.current = null
    }
  }

  async function handleLinkedInSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const url = linkedinUrl.trim()
    if (!url.includes('linkedin.com/in/')) {
      setError('Paste a valid LinkedIn profile URL (linkedin.com/in/…).')
      return
    }

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required to create your account.')
      return
    }
    if (!email.includes('@')) {
      setError('That email looks off — try again.')
      return
    }

    setImporting(true)
    setError('')
    startFakeProgress()

    try {
      const token = getAuthTokenFromCookies()
      if (!token) {
        setAuthToken('signup-token')
      }

      const response = await apiRequest('/LoginController/linkedinImport', {
        method: 'POST',
        body: { url },
      })
      if (!response.ok) {
        stopFakeProgress()
        setImportProgress(0)
        setError('Could not import from that LinkedIn URL. Try again or sign up manually.')
        setImporting(false)
        return
      }

      const data = await response.json()
      stopFakeProgress()
      setImportProgress(100)

      setAuthToken('signup-token')
      sessionStorage.setItem(SIGNUP_CREDENTIALS_KEY, JSON.stringify({ email: email.trim(), password }))
      sessionStorage.setItem(LINKEDIN_DATA_KEY, JSON.stringify(data))

      setTimeout(() => navigate('/dashboard'), 250)
    } catch {
      stopFakeProgress()
      setImportProgress(0)
      setError('Could not import from that LinkedIn URL. Try again or sign up manually.')
      setImporting(false)
    }
  }

  function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
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
          <span className="auth__eyebrow">{isLinkedInFlow ? 'Import · One paste' : 'Create your account · Spring 2026'}</span>
          <h1 className="auth__title">{isLinkedInFlow ? 'Import your profile.' : 'Create your signal.'}</h1>
          <p className="auth__sub">
            {isLinkedInFlow
              ? 'Paste your LinkedIn URL, add your email and password, and we fill the rest.'
              : 'A work email is preferred. Sign up in under a minute.'}
          </p>
        </header>

        {isLinkedInFlow ? (
          <form className="auth__form" onSubmit={handleLinkedInSubmit} noValidate>
            <label className="auth__field">
              <span className="auth__label">LinkedIn profile URL</span>
              <input
                className="auth__input"
                type="url"
                value={linkedinUrl}
                onChange={(e) => { setLinkedinUrl(e.target.value); setError('') }}
                placeholder="https://linkedin.com/in/your-profile"
                autoFocus
                required
              />
            </label>

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

            {importing ? (
              <div className="auth__progress" role="status" aria-live="polite">
                <div className="auth__progressTrack">
                  <div className="auth__progressFill" style={{ width: `${importProgress}%` }} />
                </div>
                <div className="auth__progressMeta">
                  <span className="auth__progressStage">{importStage}</span>
                  <span className="auth__progressPct">{Math.round(importProgress)}%</span>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              className="btn btn--solidDark auth__submit"
              disabled={importing || !email.trim() || !password.trim()}
            >
              {importing ? 'Importing…' : 'Import & create account'}
            </button>

            <p className="auth__legal">
              By continuing you agree to our{' '}
              <Link to="/terms-of-service" className="auth__legal-link">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy-policy" className="auth__legal-link">Privacy policy</Link>.
            </p>

            <footer className="auth__foot auth__foot--linkedin">
              <Link to="/signup" className="auth__foot-link">Sign up with email instead →</Link>
            </footer>

            <footer className="auth__foot">
              <span className="auth__foot-text">Already a member?</span>
              <Link to="/login" className="auth__foot-link">Sign in →</Link>
            </footer>
          </form>
        ) : (
          <>
            <form className="auth__form" onSubmit={handleEmailSubmit} noValidate>
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
                Sign up
              </button>

              <p className="auth__legal">
                By continuing you agree to our{' '}
                <Link to="/terms-of-service" className="auth__legal-link">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="auth__legal-link">Privacy policy</Link>.
              </p>
            </form>

            <footer className="auth__foot">
              <Link to="/signup?source=linkedin" className="auth__foot-link">Import from LinkedIn →</Link>
              <span className="auth__foot-text" style={{ margin: '0 8px' }}>·</span>
              <span className="auth__foot-text">Already a member?</span>
              <Link to="/login" className="auth__foot-link">Sign in →</Link>
            </footer>
          </>
        )}

      </article>
    </div>
  )
}
