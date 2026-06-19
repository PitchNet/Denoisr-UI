import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api'

const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'
const LINKEDIN_DATA_KEY = 'denoisr-linkedin-data'

// The import is two real backend calls (Apify scrape, then Gemini
// restructuring) with no progress events, so we fake staged progress from
// elapsed time within each call and cap it short of each call's share of
// 100% until that call's response actually lands.
const IMPORT_STAGES = [
  { at: 0, label: 'Fetching your LinkedIn profile…' },
  { at: 45, label: 'Reading your experience…' },
  { at: 70, label: 'Structuring your profile with AI…' },
  { at: 85, label: 'Almost done…' },
]
const SCRAPE_PROGRESS_CAP = 45
const STRUCTURE_PROGRESS_CAP = 92

type ImportStep = 'idle' | 'scraping' | 'structuring' | 'done' | 'scrape-failed' | 'structure-failed'

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isLinkedInFlow = searchParams.get('source') === 'linkedin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [error, setError] = useState('')
  const [importStep, setImportStep] = useState<ImportStep>('idle')
  const [importId, setImportId] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const importTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const importing = importStep === 'scraping' || importStep === 'structuring'

  const importStage =
    [...IMPORT_STAGES].reverse().find((s) => importProgress >= s.at)?.label ?? IMPORT_STAGES[0].label

  useEffect(() => {
    return () => {
      if (importTimerRef.current) clearInterval(importTimerRef.current)
    }
  }, [])

  function startFakeProgress(from: number, cap: number) {
    setImportProgress(from)
    importTimerRef.current = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= cap) return prev
        const step = prev < cap * 0.55 ? 4 : prev < cap * 0.85 ? 2 : 0.5
        return Math.min(prev + step, cap)
      })
    }, 350)
  }

  function stopFakeProgress() {
    if (importTimerRef.current) {
      clearInterval(importTimerRef.current)
      importTimerRef.current = null
    }
  }

  async function runStructureStep(id: string) {
    setError('')
    setImportStep('structuring')
    startFakeProgress(SCRAPE_PROGRESS_CAP, STRUCTURE_PROGRESS_CAP)

    try {
      const response = await apiRequest('/LoginController/linkedinImport/structure', {
        method: 'POST',
        body: { importId: id },
      })
      if (!response.ok) {
        stopFakeProgress()
        setImportProgress(SCRAPE_PROGRESS_CAP)
        setImportStep('structure-failed')
        setError("Got your profile, but couldn't finish setting it up. Hit retry — you won't need to re-paste your LinkedIn URL.")
        return
      }

      const data = await response.json()
      stopFakeProgress()
      setImportProgress(100)
      setImportStep('done')

      sessionStorage.setItem(SIGNUP_CREDENTIALS_KEY, JSON.stringify({ email: email.trim() }))
      sessionStorage.setItem(LINKEDIN_DATA_KEY, JSON.stringify(data))

      setTimeout(() => navigate('/dashboard', { state: { password } }), 250)
    } catch {
      stopFakeProgress()
      setImportProgress(SCRAPE_PROGRESS_CAP)
      setImportStep('structure-failed')
      setError("Got your profile, but couldn't finish setting it up. Hit retry — you won't need to re-paste your LinkedIn URL.")
    }
  }

  function handleRetryStructure() {
    if (!importId) return
    runStructureStep(importId)
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

    setError('')
    setImportId(null)
    setImportStep('scraping')
    startFakeProgress(0, SCRAPE_PROGRESS_CAP)

    try {
      const response = await apiRequest('/LoginController/linkedinImport/scrape', {
        method: 'POST',
        body: { url },
      })
      if (!response.ok) {
        stopFakeProgress()
        setImportProgress(0)
        setImportStep('scrape-failed')
        setError('Could not import from that LinkedIn URL. Try again or sign up manually.')
        return
      }

      const data = await response.json()
      setImportId(data.importId)
      await runStructureStep(data.importId)
    } catch {
      stopFakeProgress()
      setImportProgress(0)
      setImportStep('scrape-failed')
      setError('Could not import from that LinkedIn URL. Try again or sign up manually.')
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

    sessionStorage.setItem(
      SIGNUP_CREDENTIALS_KEY,
      JSON.stringify({ email: email.trim() }),
    )

    navigate('/dashboard', { state: { password } })
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
              <div className="auth__error" role="alert">
                <span>{error}</span>
                {importStep === 'structure-failed' ? (
                  <button type="button" className="auth__retryBtn" onClick={handleRetryStructure}>
                    Retry
                  </button>
                ) : null}
              </div>
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
