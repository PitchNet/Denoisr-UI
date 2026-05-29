import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { clearAuthToken } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import NavIcon from '../components/ui/NavIcon'
import '../styles/profile.css'

type ProfileData = {
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
  sections: Array<{
    title: string
    items: string[]
  }>
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

function calculateCompleteness(profile: ProfileData | null): number {
  if (!profile) return 0

  const fields = [
    profile.headline,
    profile.subheadline,
    profile.organization,
    profile.location,
    String(profile.experience),
    String(profile.salary),
    profile.intro,
  ]

  const filledFields = fields.filter(
    (field) => field !== undefined && field !== null && field !== '' && field !== '0',
  ).length

  const highlightsScore = Math.min(profile.highlights.length / 3, 1)
  const tagsScore = Math.min(profile.tags.length / 2, 1)

  const sectionsScore = profile.sections.reduce((acc, section) => {
    const filledItems = section.items.filter((item) => item.trim() !== '').length
    return acc + Math.min(filledItems / 2, 1)
  }, 0) / Math.max(profile.sections.length, 1)

  const totalScore =
    (filledFields / fields.length) * 0.5 +
    highlightsScore * 0.2 +
    tagsScore * 0.1 +
    sectionsScore * 0.2

  return Math.round(totalScore * 100)
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Good start'
  if (score >= 30) return 'Needs work'
  return 'Just started'
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--decision-like)'
  if (score >= 40) return '#b8860b'
  return 'var(--decision-pass)'
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const completeness = useMemo(() => calculateCompleteness(profile), [profile])
  const scoreLabel = useMemo(() => getScoreLabel(completeness), [completeness])
  const scoreColor = useMemo(() => getScoreColor(completeness), [completeness])

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const response = await apiRequest('/ProfileController/getProfile', { method: 'GET' })

        if (!response.ok) {
          setError('Failed to load profile')
          return
        }

        const data = (await response.json()) as Record<string, unknown>

        setProfile({
          id: String(data.id ?? ''),
          kind: String(data.kind ?? 'people'),
          headline: String(data.headline ?? ''),
          subheadline: String(data.subheadline ?? ''),
          organization: String(data.organization ?? ''),
          location: String(data.location ?? ''),
          experience: Number(data.experience ?? 0),
          salary: Number(data.salary ?? 0),
          intro: String(data.intro ?? ''),
          highlights: Array.isArray(data.highlights)
            ? data.highlights.filter((h): h is string => typeof h === 'string')
            : [],
          tags: Array.isArray(data.tags)
            ? data.tags.filter((t): t is string => typeof t === 'string')
            : [],
          sections: Array.isArray(data.sections)
            ? data.sections
                .map((s) => {
                  if (
                    typeof s === 'object' &&
                    s !== null &&
                    'title' in s &&
                    'items' in s &&
                    typeof (s as Record<string, unknown>).title === 'string' &&
                    Array.isArray((s as Record<string, unknown>).items)
                  ) {
                    return {
                      title: String((s as Record<string, unknown>).title),
                      items: ((s as Record<string, unknown>).items as unknown[])
                        .filter((i): i is string => typeof i === 'string')
                        .filter((i) => i.trim() !== ''),
                    }
                  }
                  return null
                })
                .filter(
                  (s): s is { title: string; items: string[] } =>
                    s !== null && s.title !== '' && s.items.length > 0,
                )
            : [],
        })
      } catch {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)

  function handleLogout() {
    clearAuthToken()
    navigate('/login')
  }

  if (loading) {
    return (
      <LoadingState
        className="pr-loading"
        label="Loading profile"
        detail="Pulling together your Denoisr card."
      />
    )
  }

  if (error || !profile) {
    return (
      <div className="pr-error">
        <span className="pr-eyebrow">Error</span>
        <p>{error ?? 'Profile not found.'}</p>
        <button type="button" className="btn btn--solidDark" onClick={() => navigate('/home')}>
          Back to home
        </button>
      </div>
    )
  }

  const avatarSwatch = swatchFor(profile.headline || 'U')

  return (
    <div className="pr">
      {/* ── Hero / avatar section ── */}
      <header className="pr-hero">
        <div className="pr-hero__wash" aria-hidden="true" />
        <div className="pr-hero__inner">
          <div className="pr-avatar pr-avatar--upload" style={{ background: avatarSwatch }} aria-hidden="true">
            <span className="pr-avatar__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
            <span className="pr-avatar__label">Upload photo</span>
          </div>

          <h1 className="pr-hero__name">{profile.headline || 'Unnamed'}</h1>

          <p className="pr-hero__role">
            {profile.subheadline || 'Role not set'}
            {profile.organization ? ` · ${profile.organization}` : ''}
          </p>

          <div className="pr-hero__meta">
            <span>{profile.location || 'Location not set'}</span>
            {profile.experience > 0 && (
              <>
                <span className="dot">·</span>
                <span>{pad2(profile.experience)} yrs experience</span>
              </>
            )}
            {profile.salary > 0 && (
              <>
                <span className="dot">·</span>
                <span>${profile.salary}k target</span>
              </>
            )}
          </div>

          {/* ── Completeness score ── */}
          <div className="pr-score">
            <div className="pr-score__header">
              <span className="pr-eyebrow">Profile completeness</span>
              <span className="pr-score__value">
                {completeness}
                <span className="pr-score__total">/100</span>
              </span>
            </div>
            <div className="pr-score__bar">
              <div
                className="pr-score__fill"
                style={{
                  width: `${completeness}%`,
                  backgroundColor: scoreColor,
                }}
              />
            </div>
            <p className="pr-score__label">
              {scoreLabel}.{' '}
              {completeness < 100
                ? 'Add more details to strengthen your profile.'
                : 'Your profile is complete.'}
            </p>
          </div>
        </div>
      </header>

      {/* ── Profile sections ── */}
      <div className="pr-body">
        {/* ── Resume placeholder ── */}
        <section className="pr-section">
          <span className="pr-eyebrow">Resume</span>
          <div className="pr-resume">
            <div className="pr-resume__placeholder">
              <span className="pr-resume__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <span className="pr-resume__text">Upload your resume</span>
              <span className="pr-resume__hint">Coming soon</span>
            </div>
          </div>
        </section>

        {/* ── Intro ── */}
        {profile.intro && (
          <section className="pr-section">
            <span className="pr-eyebrow">About</span>
            <p className="pr-intro">{profile.intro}</p>
          </section>
        )}

        {/* ── Highlights ── */}
        {profile.highlights.length > 0 && (
          <section className="pr-section">
            <span className="pr-eyebrow">Highlights</span>
            <div className="pr-chips">
              {profile.highlights.map((item) => (
                <span key={item} className="pr-chip">{item}</span>
              ))}
            </div>
          </section>
        )}

        {/* ── Tags ── */}
        {profile.tags.length > 0 && (
          <section className="pr-section">
            <span className="pr-eyebrow">Tags</span>
            <div className="pr-tags">
              {profile.tags.map((item) => (
                <span key={item} className="pr-tag">{item}</span>
              ))}
            </div>
          </section>
        )}

        {/* ── Sections (Proof of work, Intent and fit) ── */}
        {profile.sections.map((section) => (
          <section key={section.title} className="pr-section">
            <span className="pr-eyebrow">{section.title}</span>
            <ul className="pr-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        {/* ── Edit button ── */}
        <div className="pr-actions">
          <button type="button" className="btn btn--solidDark" onClick={() => navigate('/dashboard')}>
            Edit profile
          </button>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="pr-bottomnav" aria-label="Mobile navigation">
        <button type="button" className="pr-bottomnav__item" onClick={() => navigate('/home')}>
          <NavIcon name="home" />
          <span>Home</span>
        </button>
        <button type="button" className="pr-bottomnav__item" onClick={() => navigate('/messages')}>
          <NavIcon name="connections" />
          <span>Connections</span>
        </button>
        <button type="button" className="pr-bottomnav__item" onClick={() => navigate('/messages')}>
          <NavIcon name="messages" />
          <span>Messages</span>
        </button>
        <div className="pr-bottomnav__profileWrap">
          <button
            type="button"
            className={`pr-bottomnav__item pr-bottomnav__item--active`}
            aria-expanded={mobileProfileOpen}
            onClick={() => setMobileProfileOpen((v) => !v)}
          >
            <NavIcon name="profile" />
            <span>Profile</span>
          </button>

          {mobileProfileOpen ? (
            <div className="pr-bottomnav__menu">
              <button type="button" className="pr-bottomnav__action" onClick={() => navigate('/profile')}>View profile</button>
              <button type="button" className="pr-bottomnav__action">Job applications</button>
              <button type="button" className="pr-bottomnav__action" onClick={() => navigate('/messages')}>
                Connections
              </button>
              <button
                type="button"
                className="pr-bottomnav__action pr-bottomnav__action--danger"
                onClick={handleLogout}
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
