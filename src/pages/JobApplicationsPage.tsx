import { useEffect, useMemo, useState } from 'react'
import { swatchFor, initialsOf } from '../utils/avatar'
import { pad2 } from '../utils/format'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import LoadingState from '../components/ui/LoadingState'
import { useToast } from '../components/ui/Toast'
import '../styles/profile.css'
import '../styles/job-applications.css'

type JobApplication = {
  id: string
  kind: string
  status: ApplicationStatus
  headline: string
  subheadline: string
  companyId?: string
  organization: string
  location: string
  experience: number
  salary: number
  intro: string
  highlights: string[]
  tags: string[]
  sections: Array<{ title: string; items: string[] }>
}

type ApplicationStatus = 'new' | 'submitted' | 'reviewing' | 'shortlisted' | 'messaged' | 'hired' | 'passed' | 'withdrawn'

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
  withdrawn: 'Withdrawn',
}

const WITHDRAWABLE_STATUSES = new Set<ApplicationStatus>(['new', 'submitted', 'reviewing', 'shortlisted'])

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
  if (status === 'withdrawn') {
    steps.push({ event: 'You withdrew your application' })
  }
  return steps
}

const FILTER_ORDER: ApplicationStatus[] = ['new', 'submitted', 'reviewing', 'shortlisted', 'messaged', 'hired', 'passed', 'withdrawn']

type Stats = {
  total: number
  active: number
  interviews: number
  hired: number
}

function StatsRow({ stats }: { stats: Stats }) {
  return (
    <div className="ja-stats">
      <div className="ja-stats__tile">
        <span className="ja-stats__value">{stats.total}</span>
        <span className="ja-stats__label">Total</span>
      </div>
      <div className="ja-stats__tile">
        <span className="ja-stats__value">{stats.active}</span>
        <span className="ja-stats__label">Active</span>
      </div>
      <div className="ja-stats__tile">
        <span className="ja-stats__value">{stats.interviews}</span>
        <span className="ja-stats__label">Interviews</span>
      </div>
      <div className="ja-stats__tile">
        <span className="ja-stats__value">{stats.hired}</span>
        <span className="ja-stats__label">Hired</span>
      </div>
    </div>
  )
}

function FilterPills({
  options,
  active,
  onChange,
}: {
  options: Array<{ value: 'all' | ApplicationStatus; label: string; count: number }>
  active: 'all' | ApplicationStatus
  onChange: (value: 'all' | ApplicationStatus) => void
}) {
  return (
    <div className="ja-filters">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`ja-filters__btn ${active === opt.value ? 'ja-filters__btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label} <span className="ja-filters__count">{opt.count}</span>
        </button>
      ))}
    </div>
  )
}

function EmptyState({ variant, onBrowse }: { variant: 'none' | 'filter'; onBrowse: () => void }) {
  if (variant === 'filter') {
    return (
      <div className="ja-empty">
        <span className="pr-eyebrow">No matches</span>
        <h2 className="ja-hero__title">No applications match this filter.</h2>
        <p className="ja-hero__sub">Try a different status, or view all your applications.</p>
      </div>
    )
  }
  return (
    <div className="ja-empty">
      <span className="pr-eyebrow">Empty state</span>
      <h2 className="ja-hero__title">No applications yet.</h2>
      <p className="ja-hero__sub">Browse jobs on the home page and apply to see them here.</p>
      <button type="button" className="btn btn--solidDark" onClick={onBrowse}>
        Browse jobs
      </button>
    </div>
  )
}

function ApplicationDetailBody({
  job,
  meta,
  onViewMessages,
  onWithdraw,
  withdrawing,
  noTopBorder = false,
}: {
  job: JobApplication
  meta: ApplicationMeta | undefined
  onViewMessages: () => void
  onWithdraw: () => void
  withdrawing: boolean
  noTopBorder?: boolean
}) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false)
  const canWithdraw = meta ? WITHDRAWABLE_STATUSES.has(meta.status) : false

  function handleShare() {
    navigator.clipboard
      .writeText(`${window.location.origin}/job/${job.id}`)
      .then(() => showToast('Job link copied', 'success', 1500, true))
      .catch(() => showToast('Could not copy link', 'error', 2000, true))
  }

  return (
    <div className={`ja-card__body${noTopBorder ? ' ja-card__body--noBorder' : ''}`}>
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

      <div className="ja-card__actions">
        <button type="button" className="btn btn--outlinedLight" onClick={handleShare}>
          Share
        </button>
        {job.companyId ? (
          <button type="button" className="btn btn--outlinedLight ja-card__companyBtn" onClick={() => navigate(`/company/${job.companyId}`)}>
            View company
          </button>
        ) : null}
        {meta?.status === 'messaged' ? (
          <button type="button" className="btn btn--solidDark" onClick={onViewMessages}>
            View messages
          </button>
        ) : null}
        {canWithdraw ? (
          <button
            type="button"
            className="btn btn--outlinedLight ja-card__withdrawBtn"
            disabled={withdrawing}
            onClick={() => {
              if (!confirmingWithdraw) {
                setConfirmingWithdraw(true)
                return
              }
              setConfirmingWithdraw(false)
              onWithdraw()
            }}
          >
            {withdrawing ? 'Withdrawing…' : confirmingWithdraw ? 'Confirm withdrawal?' : 'Withdraw application'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ApplicationCard({
  job,
  meta,
  isOpen,
  onToggle,
  onViewMessages,
  onWithdraw,
  withdrawing,
}: {
  job: JobApplication
  meta: ApplicationMeta | undefined
  isOpen: boolean
  onToggle: () => void
  onViewMessages: () => void
  onWithdraw: () => void
  withdrawing: boolean
}) {
  const navigate = useNavigate()
  const swatch = swatchFor(job.id)

  return (
    <article className="ja-card">
      <div className="ja-card__head" onClick={onToggle}>
        <div className="ja-card__avatar" style={{ background: swatch }}>
          {initialsOf(job.organization || job.headline)}
        </div>
        <div className="ja-card__meta">
          <h2 className="ja-card__title">{job.headline}</h2>
          {job.companyId ? (
            <button
              type="button"
              className="ja-card__org ja-card__orgLink"
              onClick={(e) => { e.stopPropagation(); navigate(`/company/${job.companyId}`) }}
            >
              {meta?.companyName ?? job.subheadline}
            </button>
          ) : (
            <p className="ja-card__org">{meta?.companyName ?? job.subheadline}</p>
          )}
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
        <ApplicationDetailBody
          job={job}
          meta={meta}
          onViewMessages={onViewMessages}
          onWithdraw={onWithdraw}
          withdrawing={withdrawing}
        />
      ) : null}
    </article>
  )
}

function ApplicationRow({
  job,
  meta,
  isActive,
  onSelect,
}: {
  job: JobApplication
  meta: ApplicationMeta | undefined
  isActive: boolean
  onSelect: () => void
}) {
  const swatch = swatchFor(job.id)
  return (
    <button type="button" className={`ja-row${isActive ? ' ja-row--active' : ''}`} onClick={onSelect}>
      <div className="ja-row__avatar" style={{ background: swatch }}>
        {initialsOf(job.organization || job.headline)}
      </div>
      <div className="ja-row__meta">
        <h3 className="ja-row__title">{job.headline}</h3>
        <p className="ja-row__org">{meta?.companyName ?? job.subheadline}</p>
      </div>
      {meta ? (
        <span className={`ja-badge ja-badge--${meta.status}`}>{STATUS_LABELS[meta.status]}</span>
      ) : null}
    </button>
  )
}

function ApplicationDetailPanel({
  job,
  meta,
  onViewMessages,
  onWithdraw,
  withdrawing,
}: {
  job: JobApplication | null
  meta: ApplicationMeta | undefined
  onViewMessages: () => void
  onWithdraw: () => void
  withdrawing: boolean
}) {
  if (!job) {
    return (
      <div className="ja-detail ja-detail--empty">
        <span className="pr-eyebrow">No selection</span>
        <p className="ja-hero__sub">Select an application from the list to see its details.</p>
      </div>
    )
  }
  const swatch = swatchFor(job.id)
  return (
    <div className="ja-detail">
      <div className="ja-detail__head">
        <div className="ja-card__avatar" style={{ background: swatch }}>
          {initialsOf(job.organization || job.headline)}
        </div>
        <div className="ja-card__meta">
          <h2 className="ja-card__title">{job.headline}</h2>
          <p className="ja-card__org">{meta?.companyName ?? job.subheadline}</p>
        </div>
        {meta ? (
          <span className={`ja-badge ja-badge--${meta.status}`}>{STATUS_LABELS[meta.status]}</span>
        ) : null}
      </div>
      <ApplicationDetailBody
        job={job}
        meta={meta}
        onViewMessages={onViewMessages}
        onWithdraw={onWithdraw}
        withdrawing={withdrawing}
        noTopBorder
      />
    </div>
  )
}

export default function JobApplicationsPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [metaMap, setMetaMap] = useState<Record<string, ApplicationMeta>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | ApplicationStatus>('all')
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [desktopSelectedId, setDesktopSelectedId] = useState<string | null>(null)

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

  const stats = useMemo<Stats>(() => {
    const active = applications.filter((a) =>
      ['new', 'submitted', 'reviewing', 'shortlisted'].includes(a.status)
    ).length
    const interviews = applications.filter((a) => a.status === 'messaged').length
    const hired = applications.filter((a) => a.status === 'hired').length
    return { total: applications.length, active, interviews, hired }
  }, [applications])

  const filterOptions = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = applications.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
      },
      {} as Record<ApplicationStatus, number>
    )
    const options: Array<{ value: 'all' | ApplicationStatus; label: string; count: number }> = [
      { value: 'all', label: 'All', count: applications.length },
    ]
    for (const status of FILTER_ORDER) {
      if (counts[status]) {
        options.push({ value: status, label: STATUS_LABELS[status], count: counts[status] })
      }
    }
    return options
  }, [applications])

  const filteredApplications = useMemo(() => {
    if (activeFilter === 'all') return applications
    return applications.filter((a) => a.status === activeFilter)
  }, [applications, activeFilter])

  const desktopApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return filteredApplications
    return filteredApplications.filter((job) =>
      job.headline.toLowerCase().includes(q) ||
      job.organization.toLowerCase().includes(q) ||
      job.subheadline.toLowerCase().includes(q) ||
      (metaMap[job.id]?.companyName ?? '').toLowerCase().includes(q)
    )
  }, [filteredApplications, searchQuery, metaMap])

  useEffect(() => {
    if (desktopApplications.length === 0) {
      setDesktopSelectedId(null)
      return
    }
    if (!desktopApplications.some((job) => job.id === desktopSelectedId)) {
      setDesktopSelectedId(desktopApplications[0].id)
    }
  }, [desktopApplications, desktopSelectedId])

  async function handleWithdraw(jobId: string) {
    setWithdrawError(null)
    setWithdrawingId(jobId)
    try {
      const response = await apiRequest('/FeedController/withdrawJobApplication', {
        method: 'POST',
        body: { jobId },
      })
      if (!response.ok) {
        setWithdrawError('Could not withdraw this application. Please try again.')
        return
      }
      setApplications((prev) => prev.map((a) => (a.id === jobId ? { ...a, status: 'withdrawn' } : a)))
      setMetaMap((prev) => ({
        ...prev,
        [jobId]: {
          status: 'withdrawn',
          timeline: timelineFor('withdrawn'),
          companyName: prev[jobId]?.companyName ?? '',
        },
      }))
    } catch {
      setWithdrawError('Could not withdraw this application. Please try again.')
    } finally {
      setWithdrawingId(null)
    }
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
        <>
          <div className="ja-list ja-list--mobile">
            <StatsRow stats={stats} />
            <FilterPills options={filterOptions} active={activeFilter} onChange={setActiveFilter} />

            {withdrawError ? <p className="ja-withdrawError">{withdrawError}</p> : null}

            {filteredApplications.length > 0 ? (
              filteredApplications.map((job) => (
                <ApplicationCard
                  key={job.id}
                  job={job}
                  meta={metaMap[job.id]}
                  isOpen={selectedAppId === job.id}
                  onToggle={() => setSelectedAppId(selectedAppId === job.id ? null : job.id)}
                  onViewMessages={() => navigate('/messages')}
                  onWithdraw={() => handleWithdraw(job.id)}
                  withdrawing={withdrawingId === job.id}
                />
              ))
            ) : (
              <EmptyState variant="filter" onBrowse={() => navigate('/home')} />
            )}
          </div>

          <div className="ja-split">
            <div className="ja-split__left">
              <StatsRow stats={stats} />
              <input
                type="search"
                className="ja-searchInput"
                placeholder="Search by role or company"
                aria-label="Search applications"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FilterPills options={filterOptions} active={activeFilter} onChange={setActiveFilter} />

              {withdrawError ? <p className="ja-withdrawError">{withdrawError}</p> : null}

              <div className="ja-rowList">
                {desktopApplications.length > 0 ? (
                  desktopApplications.map((job) => (
                    <ApplicationRow
                      key={job.id}
                      job={job}
                      meta={metaMap[job.id]}
                      isActive={desktopSelectedId === job.id}
                      onSelect={() => setDesktopSelectedId(job.id)}
                    />
                  ))
                ) : (
                  <EmptyState variant="filter" onBrowse={() => navigate('/home')} />
                )}
              </div>
            </div>

            <ApplicationDetailPanel
              job={desktopApplications.find((job) => job.id === desktopSelectedId) ?? null}
              meta={desktopSelectedId ? metaMap[desktopSelectedId] : undefined}
              onViewMessages={() => navigate('/messages')}
              onWithdraw={() => desktopSelectedId && handleWithdraw(desktopSelectedId)}
              withdrawing={withdrawingId === desktopSelectedId}
            />
          </div>
        </>
      ) : (
        <EmptyState variant="none" onBrowse={() => navigate('/home')} />
      )}
    </div>
  )
}
