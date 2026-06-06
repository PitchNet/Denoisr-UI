import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import LoadingState from '../components/ui/LoadingState'
import MobileBottomNav from '../components/MobileBottomNav'
import '../styles/profile.css'
import '../styles/job-applications.css'

type JobApplication = {
  id: string
  kind: string
  status: ApplicationStatus
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

type ApplicationStatus = 'new' | 'submitted' | 'reviewing' | 'shortlisted' | 'messaged' | 'hired' | 'passed'

type ApplicationMeta = {
  status: ApplicationStatus
  timeline: Array<{ event: string }>
  companyName: string
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'Submitted',
  submitted: 'Submitted',
  reviewing: 'Under review',
  shortlisted: 'Shortlisted',
  messaged: 'Company reached out',
  hired: 'Hired',
  passed: 'Not moving forward',
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

function timelineFor(status: ApplicationStatus): Array<{ event: string }> {
  const steps: Array<{ event: string }> = [{ event: 'You applied' }]
  if (status === 'reviewing' || status === 'shortlisted' || status === 'messaged' || status === 'hired') {
    steps.push({ event: 'Company is reviewing your application' })
  }
  if (status === 'shortlisted' || status === 'messaged' || status === 'hired') {
    steps.push({ event: 'You were shortlisted' })
  }
  if (status === 'messaged' || status === 'hired') {
    steps.push({ event: 'Company reached out' })
  }
  if (status === 'hired') {
    steps.push({ event: 'You were hired' })
  }
  if (status === 'passed') {
    steps.push({ event: 'Application not moving forward' })
  }
  return steps
}

export default function JobApplicationsPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [metaMap, setMetaMap] = useState<Record<string, ApplicationMeta>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

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
        const list = Array.isArray(data) ? data : []
        setApplications(list)

        const meta: Record<string, ApplicationMeta> = {}
        for (const app of list) {
          meta[app.id] = {
            status: app.status,
            timeline: timelineFor(app.status),
            companyName: app.subheadline || app.organization,
          }
        }
        setMetaMap(meta)
      } catch {
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

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
              ? `${applications.length} application${applications.length !== 1 ? 's' : ''} submitted`
              : 'No applications yet'}
          </h1>
          <p className="ja-hero__sub">
            {applications.length > 0
              ? 'Track every role you have applied for across the Denoisr network.'
              : 'Every role you apply for will appear here so you can track your outreach.'}
          </p>
        </div>
      </header>

      {applications.length > 0 ? (
        <div className="ja-list">
          {applications.map((job) => {
            const meta = metaMap[job.id]
            const swatch = swatchFor(job.id)
            const isOpen = selectedAppId === job.id

            return (
              <article key={job.id} className="ja-card">
                <div className="ja-card__head" onClick={() => setSelectedAppId(isOpen ? null : job.id)}>
                  <div className="ja-card__avatar" style={{ background: swatch }}>
                    {initialsOf(job.organization || job.headline)}
                  </div>
                  <div className="ja-card__meta">
                    <h2 className="ja-card__title">{job.headline}</h2>
                    <p className="ja-card__org">{meta?.companyName ?? job.subheadline}</p>
                  </div>
                  <div className="ja-card__topRight">
                    {meta ? (
                      <span className={`ja-badge ja-badge--${meta.status}`}>
                        {STATUS_LABELS[meta.status]}
                      </span>
                    ) : null}
                    <button type="button" className="ja-card__chevron" aria-label={isOpen ? 'Collapse' : 'Expand'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="ja-card__body">
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

                    {meta && meta.timeline.length > 0 ? (
                      <div className="ja-card__timeline">
                        <span className="pr-eyebrow">Timeline</span>
                        <div className="ja-timeline">
                          {meta.timeline.map((entry, i) => (
                            <div key={i} className="ja-timeline__entry">
                              <div className="ja-timeline__dot" />
                              <div className="ja-timeline__content">
                                <span className="ja-timeline__event">{entry.event}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {meta?.status === 'messaged' ? (
                      <div className="ja-card__actions">
                        <button type="button" className="btn btn--solidDark" onClick={() => navigate('/messages')}>
                          View messages
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
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

      <MobileBottomNav activePage="applications" />
    </div>
  )
}
