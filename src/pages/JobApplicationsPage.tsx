import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { clearAuthToken } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import NavIcon from '../components/ui/NavIcon'
import '../styles/profile.css'
import '../styles/job-applications.css'

type JobApplication = {
  id: string
  kind: string
  headline: string
  subheadline: string
  organization: string
  location: string
  experience: number
  salary: number
  intro: string
  highlights: string[]
  tags: string[]
  sections: Array<{ title: string; items: string[] }>
}

const SWATCHES = [
  'oklch(0.78 0.10 220)',
  'oklch(0.80 0.11 65)',
  'oklch(0.82 0.08 150)',
  'oklch(0.80 0.08 30)',
  'oklch(0.78 0.10 320)',
  'oklch(0.80 0.09 200)',
  'oklch(0.80 0.08 90)',
  'oklch(0.78 0.10 250)',
]

function swatchFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return SWATCHES[h % SWATCHES.length]
}

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0')
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function JobApplicationsPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true)
        const response = await apiRequest('/FeedController/jobApplications', { method: 'GET' })
        if (!response.ok) {
          setError('Failed to load applications')
          return
        }
        const data = (await response.json()) as JobApplication[]
        setApplications(Array.isArray(data) ? data : [])
      } catch {
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  function handleMobileLogout() {
    clearAuthToken()
    setMobileProfileOpen(false)
    navigate('/login')
  }

  if (loading) {
    return (
      <LoadingState
        className="ja-loading"
        label="Loading applications"
        detail="Pulling your submitted applications."
      />
    )
  }

  if (error) {
    return (
      <div className="pr-error">
        <span className="pr-eyebrow">Error</span>
        <p>{error}</p>
        <button type="button" className="btn btn--solidDark" onClick={() => navigate('/home')}>
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="ja">
      <header className="ja-hero">
        <div className="ja-hero__wash" aria-hidden="true" />
        <div className="ja-hero__inner">
          <span className="pr-eyebrow">Applications</span>
          <h1 className="ja-hero__title">
            {applications.length > 0
              ? `${applications.length} application${applications.length !== 1 ? 's' : ''} submitted.`
              : 'No applications yet.'}
          </h1>
          <p className="ja-hero__sub">
            {applications.length > 0
              ? 'Track every role you have applied for across the Denoisr network.'
              : 'Every role you apply for will appear here so you can track your outreach.'}
          </p>
        </div>
      </header>

      {applications.length > 0 ? (
        <div className="ja-grid">
          {applications.map((job) => {
            const swatch = swatchFor(job.id)
            return (
              <article key={job.id} className="ja-card">
                <div className="ja-card__head">
                  <div className="ja-card__avatar" style={{ background: swatch }}>
                    {initialsOf(job.organization || job.headline)}
                  </div>
                  <div className="ja-card__meta">
                    <h2 className="ja-card__title">{job.headline}</h2>
                    <p className="ja-card__org">{job.subheadline}</p>
                  </div>
                </div>

                <div className="ja-card__row">
                  <span>{job.location}</span>
                  <span className="dot">·</span>
                  <span>{pad2(job.experience)} yrs</span>
                  <span className="dot">·</span>
                  <span>${job.salary}k</span>
                </div>

                <p className="ja-card__intro">{job.intro}</p>

                {job.highlights.length > 0 && (
                  <div className="ja-card__chips">
                    {job.highlights.map((item) => (
                      <span key={item} className="pr-chip">{item}</span>
                    ))}
                  </div>
                )}

                {job.tags.length > 0 && (
                  <div className="ja-card__tags el-meta">
                    {job.tags.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                )}

                {job.sections.length > 0 && (
                  <div className="ja-card__sections">
                    {job.sections.map((section) => (
                      <section key={section.title} className="ja-card__section">
                        <span className="pr-eyebrow">{section.title}</span>
                        <ul className="ja-card__sectionList">
                          {section.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="ja-empty">
          <span className="pr-eyebrow">Empty state</span>
          <h2 className="ja-hero__title">No applications yet.</h2>
          <p className="ja-hero__sub">Browse jobs on the home page and apply to see them here.</p>
          <button type="button" className="btn btn--solidDark" onClick={() => navigate('/home')}>
            Browse jobs
          </button>
        </div>
      )}

      <nav className="ja-bottomnav" aria-label="Mobile navigation">
        <button type="button" className="ja-bottomnav__item" onClick={() => navigate('/home')}>
          <NavIcon name="home" />
          <span>Home</span>
        </button>
        <button type="button" className="ja-bottomnav__item" onClick={() => navigate('/messages')}>
          <NavIcon name="connections" />
          <span>Connections</span>
        </button>
        <button type="button" className="ja-bottomnav__item" onClick={() => navigate('/messages')}>
          <NavIcon name="messages" />
          <span>Messages</span>
        </button>
        <div className="ja-bottomnav__profileWrap">
          <button
            type="button"
            className={`ja-bottomnav__item ${mobileProfileOpen ? 'ja-bottomnav__item--active' : ''}`}
            aria-expanded={mobileProfileOpen}
            onClick={() => setMobileProfileOpen((v) => !v)}
          >
            <NavIcon name="profile" />
            <span>Profile</span>
          </button>

          {mobileProfileOpen ? (
            <div className="ja-bottomnav__menu">
              <span className="ja-bottomnav__groupLabel">Account</span>
              <button type="button" className="ja-bottomnav__action" onClick={() => navigate('/profile')}>View profile</button>
              <button type="button" className="ja-bottomnav__action">Job applications</button>
              <div className="ja-bottomnav__divider" />
              <span className="ja-bottomnav__groupLabel">Manage</span>
              <button type="button" className="ja-bottomnav__action" onClick={() => navigate('/company')}>Company</button>
              <button type="button" className="ja-bottomnav__action" onClick={() => navigate('/jobs')}>Jobs</button>
              <div className="ja-bottomnav__divider" />
              <button
                type="button"
                className="ja-bottomnav__action ja-bottomnav__action--danger"
                onClick={handleMobileLogout}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
