import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { clearAuthToken, getStoredProfile } from '../auth'
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
  workExperience: Array<{
    company: string
    role: string
    duration: string
    description: string
  }>
  projects: Array<{
    name: string
    url: string
    description: string
  }>
  photo: string
  resume: string
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase()
  return '?'
}

function getMissingFields(profile: ProfileData | null): string[] {
  if (!profile) return []

  const missing: string[] = []

  if (!profile.headline) missing.push('name')
  if (!profile.subheadline) missing.push('role')
  if (!profile.organization) missing.push('organization')
  if (!profile.location) missing.push('location')
  if (!profile.experience) missing.push('experience')
  if (!profile.salary) missing.push('salary')
  if (!profile.intro) missing.push('intro')
  if (profile.highlights.length < 3) missing.push('highlights (add 3+)')
  if (profile.tags.length < 2) missing.push('tags (add 2+)')
  if (profile.sections.length < 2 || profile.sections.some((s) => s.items.length < 2))
    missing.push('proof & intent sections')
  if (profile.workExperience.length === 0) missing.push('work experience')
  if (profile.projects.length === 0) missing.push('projects')
  if (!profile.photo) missing.push('photo')
  if (!profile.resume) missing.push('resume')

  return missing
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

  const baseScore = filledFields / fields.length

  const highlightsScore = Math.min(profile.highlights.length / 3, 1)
  const tagsScore = Math.min(profile.tags.length / 2, 1)

  const sectionsScore = profile.sections.reduce((acc, section) => {
    const filledItems = section.items.filter((item) => item.trim() !== '').length
    return acc + Math.min(filledItems / 2, 1)
  }, 0) / Math.max(profile.sections.length, 1)

  const workScore = profile.workExperience.length > 0 ? 1 : 0
  const projectsScore = profile.projects.length > 0 ? 1 : 0
  const photoScore = profile.photo ? 1 : 0
  const resumeScore = profile.resume ? 1 : 0

  const totalScore =
    baseScore * 0.35 +
    highlightsScore * 0.1 +
    tagsScore * 0.05 +
    sectionsScore * 0.15 +
    workScore * 0.1 +
    projectsScore * 0.1 +
    photoScore * 0.075 +
    resumeScore * 0.075

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
  const cachedProfile = getStoredProfile()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const completeness = useMemo(() => calculateCompleteness(profile), [profile])
  const scoreLabel = useMemo(() => getScoreLabel(completeness), [completeness])
  const scoreColor = useMemo(() => getScoreColor(completeness), [completeness])
  const missingFields = useMemo(() => getMissingFields(profile), [profile])

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
          workExperience: Array.isArray(data.workExperience)
            ? data.workExperience
                .map((w) => {
                  if (typeof w === 'object' && w !== null) {
                    const work = w as Record<string, unknown>
                    return {
                      company: String(work.company ?? ''),
                      role: String(work.role ?? ''),
                      duration: String(work.duration ?? ''),
                      description: String(work.description ?? ''),
                    }
                  }
                  return null
                })
                .filter(
                  (w): w is { company: string; role: string; duration: string; description: string } =>
                    w !== null && w.company !== '',
                )
            : [],
          projects: Array.isArray(data.projects)
            ? data.projects
                .map((p) => {
                  if (typeof p === 'object' && p !== null) {
                    const project = p as Record<string, unknown>
                    return {
                      name: String(project.name ?? ''),
                      url: String(project.url ?? ''),
                      description: String(project.description ?? ''),
                    }
                  }
                  return null
                })
                .filter(
                  (p): p is { name: string; url: string; description: string } =>
                    p !== null && p.name !== '',
                )
            : [],
          photo: String(data.photo ?? ''),
          resume: String(data.resume ?? ''),
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
  const [kebabOpen, setKebabOpen] = useState(false)
  const kebabRef = useRef<HTMLDivElement>(null)
  const kebabDesktopRef = useRef<HTMLDivElement>(null)

  function handleLogout() {
    clearAuthToken()
    navigate('/login')
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const isInside = kebabRef.current?.contains(target) || kebabDesktopRef.current?.contains(target)
      if (!isInside) setKebabOpen(false)
    }
    if (kebabOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [kebabOpen])

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
  const photoUrl = profile.photo || ''

  return (
    <div className="pr">
      {/* ── Mobile hero (hidden on desktop) ── */}
      <header className="pr-hero pr-hero--mobile">
        <div className="pr-hero__wash" aria-hidden="true" />
        <div className="pr-hero__inner">
            <div className="pr-avatarWrap">
              <div
                className={`pr-avatar${photoUrl ? ' pr-avatar--photo' : ''}`}
                style={{ background: photoUrl ? `url(${photoUrl}) center/cover` : avatarSwatch }}
              >
                {photoUrl ? null : <span className="pr-avatar__initials">{getInitials(profile.headline)}</span>}
              </div>

            <div className="pr-kebab" ref={kebabRef}>
              <button type="button" className="pr-kebab__toggle" onClick={() => setKebabOpen((v) => !v)} aria-label="Profile actions">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <circle cx="9" cy="3.5" r="1.5" />
                  <circle cx="9" cy="9" r="1.5" />
                  <circle cx="9" cy="14.5" r="1.5" />
                </svg>
              </button>
              {kebabOpen && (
                <div className="pr-kebab__menu">
                  <button type="button" className="pr-kebab__action" onClick={() => { setKebabOpen(false); navigate('/profile/edit'); }}>
                    Edit profile
                  </button>
                </div>
              )}
            </div>
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
        </div>
      </header>

      {/* ── Completeness (mobile) ── */}
      <div className="pr-score-mobile">
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
              ? `Missing: ${missingFields.join(', ')}.`
              : 'Your profile is complete.'}
          </p>
        </div>
      </div>

      {/* ── 3-column desktop shell ── */}
      <div className="pr-shell">
        {/* ── Left column: Photo, Resume, Highlights, Tags ── */}
        <aside className="pr-col pr-col--left">
          <div className="pr-col__card pr-col__card--identity">
            <div className="pr-avatarWrap">
              <div
                className={`pr-avatar pr-avatar--desktop${photoUrl ? ' pr-avatar--photo' : ''}`}
                style={{ background: photoUrl ? `url(${photoUrl}) center/cover` : avatarSwatch }}
              >
                {photoUrl ? null : <span className="pr-avatar__initials">{getInitials(profile.headline)}</span>}
              </div>

              <div className="pr-kebab" ref={kebabDesktopRef}>
                <button type="button" className="pr-kebab__toggle" onClick={() => setKebabOpen((v) => !v)} aria-label="Profile actions">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <circle cx="9" cy="3.5" r="1.5" />
                    <circle cx="9" cy="9" r="1.5" />
                    <circle cx="9" cy="14.5" r="1.5" />
                  </svg>
                </button>
                {kebabOpen && (
                  <div className="pr-kebab__menu">
                    <button type="button" className="pr-kebab__action" onClick={() => { setKebabOpen(false); navigate('/profile/edit'); }}>
                      Edit profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h1 className="pr-hero__name pr-hero__name--desktop">{profile.headline || 'Unnamed'}</h1>

            <p className="pr-hero__role">
              {profile.subheadline || 'Role not set'}
              {profile.organization ? ` · ${profile.organization}` : ''}
            </p>

            <div className="pr-hero__meta pr-hero__meta--desktop">
              <span>{profile.location || 'Location not set'}</span>
              {profile.experience > 0 && (
                <>
                  <span className="dot">·</span>
                  <span>{pad2(profile.experience)} yrs</span>
                </>
              )}
              {profile.salary > 0 && (
                <>
                  <span className="dot">·</span>
                  <span>${profile.salary}k</span>
                </>
              )}
            </div>
          </div>

          <div className="pr-col__card">
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
          </div>

          {profile.highlights.length > 0 && (
            <div className="pr-col__card">
              <span className="pr-eyebrow">Highlights</span>
              <div className="pr-chips">
                {profile.highlights.map((item) => (
                  <span key={item} className="pr-chip">{item}</span>
                ))}
              </div>
            </div>
          )}

          {profile.tags.length > 0 && (
            <div className="pr-col__card">
              <span className="pr-eyebrow">Tags</span>
              <div className="pr-tags">
                {profile.tags.map((item) => (
                  <span key={item} className="pr-tag">{item}</span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Center column: Intro, Work Experience, Projects ── */}
        <section className="pr-col pr-col--center">
          {profile.intro && (
            <div className="pr-col__card">
              <span className="pr-eyebrow">About</span>
              <p className="pr-intro">{profile.intro}</p>
            </div>
          )}

          <div className="pr-col__card">
            <span className="pr-eyebrow">Work experience</span>
            <div className="pr-work">
              {profile.workExperience.length > 0 ? (
                profile.workExperience.map((work, index) => (
                  <div key={`${work.company}-${index}`} className="pr-work__item">
                    <div className="pr-work__header">
                      <span className="pr-work__company">{work.company}</span>
                      <span className="pr-work__duration">{work.duration}</span>
                    </div>
                    {work.role && <span className="pr-work__role">{work.role}</span>}
                    {work.description && <p className="pr-work__desc">{work.description}</p>}
                  </div>
                ))
              ) : (
                <div className="pr-empty" />
              )}
            </div>
          </div>

          <div className="pr-col__card">
            <span className="pr-eyebrow">Projects</span>
            <div className="pr-projects">
              {profile.projects.length > 0 ? (
                profile.projects.map((project, index) => (
                  <div key={`${project.name}-${index}`} className="pr-projects__item">
                    <div className="pr-projects__header">
                      <span className="pr-projects__name">{project.name}</span>
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="pr-projects__link">
                          View →
                        </a>
                      )}
                    </div>
                    {project.description && <p className="pr-projects__desc">{project.description}</p>}
                  </div>
                ))
              ) : (
                <div className="pr-empty" />
              )}
            </div>
          </div>
        </section>

        {/* ── Right column: Score, Sections ── */}
        <aside className="pr-col pr-col--right">
          <div className="pr-col__card pr-col__card--score-desktop">
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
                  ? `Missing: ${missingFields.join(', ')}.`
                  : 'Your profile is complete.'}
              </p>
            </div>
          </div>

          {profile.sections.map((section) => (
            <div key={section.title} className="pr-col__card">
              <span className="pr-eyebrow">{section.title}</span>
              <ul className="pr-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
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
              {cachedProfile ? (
                <div className="pr-bottomnav__dropdownProfile">
                  <div
                    className="pr-bottomnav__dropdownAvatar"
                  style={{
                    background: cachedProfile.photo
                      ? `url(${cachedProfile.photo}) center/cover`
                      : 'var(--ink-2)',
                  }}
                  >
                    {!cachedProfile.photo ? (
                      <span>{cachedProfile.headline.charAt(0).toUpperCase()}</span>
                    ) : null}
                  </div>
                  <div className="nav__dropdownProfileMeta">
                    <div className="nav__dropdownProfileName">{cachedProfile.headline}</div>
                    <div className="nav__dropdownProfileRole">{cachedProfile.subheadline}</div>
                  </div>
                </div>
              ) : null}
              <span className="pr-bottomnav__groupLabel">Account</span>
              <button type="button" className="pr-bottomnav__action" onClick={() => navigate('/profile')}>View profile</button>
              <button type="button" className="pr-bottomnav__action" onClick={() => navigate('/applications')}>Job applications</button>
              <div className="pr-bottomnav__divider" />
              <span className="pr-bottomnav__groupLabel">Manage</span>
              <button type="button" className="pr-bottomnav__action" onClick={() => navigate('/company')}>Company</button>
              <button type="button" className="pr-bottomnav__action" onClick={() => navigate('/jobs')}>Jobs</button>
              <div className="pr-bottomnav__divider" />
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
