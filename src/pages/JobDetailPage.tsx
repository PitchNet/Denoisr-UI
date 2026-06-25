import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api'
import { isAuthenticated, setPendingRedirect } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import { LOADERS } from '../data/routeLoaders'
import { useToast } from '../components/ui/Toast'
import '../styles/company.css'
import '../styles/company-detail.css'
import '../styles/job-detail.css'

type JobDetail = {
  id: string
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
  jobDescriptionUrl?: string
  jobDescriptionFilename?: string
  postedAgo: string
  companyId: string
  companyName: string
  companyPhoto: string
  companyVerified: boolean
  bookmarked: boolean
  applied: boolean
}

type RelatedJob = {
  id: string
  headline: string
  location: string
  experience: number
  salary: number
  intro: string
  tags: string[]
  postedAgo: string
}

function formatSalary(salary: number) {
  if (!salary) return ''
  return `$${salary.toLocaleString()}`
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [applying, setApplying] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)
  const [relatedJobs, setRelatedJobs] = useState<RelatedJob[]>([])
  const [relatedLoading, setRelatedLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    apiRequest(`/FeedController/getJobById/${id}`, { method: 'GET' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.job) {
          setJob(data.job)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!job?.companyId) return
    let cancelled = false
    setRelatedLoading(true)

    apiRequest(`/CompanyController/getCompanyJobsById/${job.companyId}`, { method: 'GET' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data.filter((j: RelatedJob) => j.id !== job.id) : []
        setRelatedJobs(list)
      })
      .catch(() => {
        if (!cancelled) setRelatedJobs([])
      })
      .finally(() => {
        if (!cancelled) setRelatedLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [job?.companyId, job?.id])

  function handleCopyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast('Link copied', 'success', 1500, true))
      .catch(() => showToast('Could not copy link', 'error', 2000, true))
  }

  function handleApply() {
    if (!job || job.applied || applying) return
    if (!isAuthenticated()) {
      setPendingRedirect(window.location.pathname)
      navigate('/login')
      return
    }
    setApplying(true)
    apiRequest('/FeedController/jobAction', {
      method: 'POST',
      body: { jobId: job.id, action: 'accepted' },
    })
      .then((res) => {
        if (res.ok) {
          setJob((j) => (j ? { ...j, applied: true } : j))
          showToast('Application submitted', 'success', 1500, true)
        } else {
          showToast('Could not apply', 'error', 2000, true)
        }
      })
      .catch(() => showToast('Could not apply', 'error', 2000, true))
      .finally(() => setApplying(false))
  }

  function handleBookmark() {
    if (!job || bookmarking) return
    if (!isAuthenticated()) {
      setPendingRedirect(window.location.pathname)
      navigate('/login')
      return
    }
    setBookmarking(true)
    apiRequest('/FeedController/jobAction', {
      method: 'POST',
      body: { jobId: job.id, action: 'bookmark' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setJob((j) => (j ? { ...j, bookmarked: Boolean(data.bookmarked) } : j))
          showToast(data.bookmarked ? 'Bookmarked' : 'Bookmark removed', 'success', 1500, true)
        } else {
          showToast('Could not update bookmark', 'error', 2000, true)
        }
      })
      .catch(() => showToast('Could not update bookmark', 'error', 2000, true))
      .finally(() => setBookmarking(false))
  }

  const metaParts = job
    ? [
        job.location || null,
        job.experience ? `${job.experience}+ yrs` : null,
        job.salary ? formatSalary(job.salary) : null,
      ].filter((p): p is string => Boolean(p))
    : []

  return (
    <div className="cpd">
      <div className="cpd-body">
        <button type="button" className="cpd-back" onClick={() => navigate(-1)}>
          &larr; Back
        </button>

        {loading ? (
          <LoadingState className="loader--page" {...LOADERS.jobDetail} />
        ) : notFound || !job ? (
          <div className="cp-card cpd-state">
            <span className="cp-eyebrow">Job</span>
            <h1 className="cp-card__title">Job not found</h1>
            <p className="cp-detail">This job may have been removed or the link is no longer valid.</p>
          </div>
        ) : (
          <div className="cpd-shell">
            <div className="cpd-col cpd-col--main">
              <div className="cp-card cpd-hero">
                <div className="cp-card__header">
                  {job.companyPhoto ? (
                    <Link to={`/company/${job.companyId}`} className="cp-avatar" style={{ backgroundImage: `url(${job.companyPhoto})` }} />
                  ) : (
                    <Link to={`/company/${job.companyId}`} className="cp-avatar cp-avatar--fallback">
                      {job.companyName?.charAt(0).toUpperCase() ?? '?'}
                    </Link>
                  )}
                  <div className="cp-card__meta">
                    <h1 className="cp-card__title">{job.headline}</h1>
                    <div className="cpd-badgeRow">
                      <Link to={`/company/${job.companyId}`} className="cp-chip">
                        {job.companyName || job.organization}
                      </Link>
                      <span className={`cp-verifyBadge cp-verifyBadge--${job.companyVerified ? 'verified' : 'unverified'}`}>
                        {job.companyVerified ? 'Verified' : 'Unverified'}
                      </span>
                      {job.postedAgo ? <span className="jd-postedAgo">{job.postedAgo}</span> : null}
                    </div>
                  </div>
                </div>

                {metaParts.length > 0 ? <div className="jd-metaRow">{metaParts.join(' · ')}</div> : null}
              </div>

              {job.intro ? (
                <div className="cp-card cpd-section">
                  <span className="cp-eyebrow">About the role</span>
                  <p className="cp-desc">{job.intro}</p>
                </div>
              ) : null}

              {job.highlights.length > 0 ? (
                <div className="cp-card cpd-section">
                  <span className="cp-eyebrow">Highlights</span>
                  <div className="cp-chipList">
                    {job.highlights.map((h) => (
                      <span key={h} className="cp-chipItem">{h}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {job.sections.map((section) => (
                <div className="cp-card cpd-section" key={section.title}>
                  <span className="cp-eyebrow">{section.title}</span>
                  <ul className="jd-sectionList">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {job.jobDescriptionUrl ? (
                <a
                  className="cpd-actionBtn jd-downloadLink"
                  href={job.jobDescriptionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download job description{job.jobDescriptionFilename ? ` — ${job.jobDescriptionFilename}` : ''}
                </a>
              ) : null}

              <div className="cp-card cpd-section">
                <div className="cpd-jobsHeader">
                  <span className="cp-eyebrow">More roles at {job.companyName || 'this company'}</span>
                  {relatedJobs.length > 0 ? <span className="cpd-jobsCount">{relatedJobs.length}</span> : null}
                </div>

                {relatedLoading ? (
                  <p className="cp-detail">Checking for other open roles&hellip;</p>
                ) : relatedJobs.length === 0 ? (
                  <p className="cp-detail">No other open positions right now.</p>
                ) : (
                  <div className="cpd-jobGrid">
                    {relatedJobs.map((rj) => {
                      const rjMeta = [
                        rj.location || null,
                        rj.experience ? `${rj.experience}+ yrs` : null,
                        rj.salary ? formatSalary(rj.salary) : null,
                      ].filter((p): p is string => Boolean(p))

                      return (
                        <button
                          type="button"
                          key={rj.id}
                          className="cpd-jobCard"
                          onClick={() => navigate(`/job/${rj.id}`)}
                        >
                          <div className="cpd-jobCard__top">
                            <h3 className="cpd-jobCard__title">{rj.headline}</h3>
                            {rj.postedAgo ? <span className="cpd-jobCard__posted">{rj.postedAgo}</span> : null}
                          </div>
                          {rjMeta.length > 0 ? <div className="cpd-jobCard__meta">{rjMeta.join(' · ')}</div> : null}
                          {rj.intro ? <p className="cpd-jobCard__intro">{rj.intro}</p> : null}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="cpd-col cpd-col--side cpd-sidebar">
              {job.tags.length > 0 ? (
                <div className="cp-card cpd-section">
                  <span className="cp-eyebrow">Tags</span>
                  <div className="cp-chipList">
                    {job.tags.map((t) => (
                      <span key={t} className="cp-chipItem">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="cp-card cpd-section">
                <span className="cp-eyebrow">Actions</span>
                {job.applied ? (
                  <button type="button" className="cpd-actionBtn jd-appliedBtn" disabled>
                    Applied
                  </button>
                ) : (
                  <button type="button" className="cpd-actionBtn" onClick={handleApply} disabled={applying}>
                    {applying ? 'Applying…' : 'Apply for this role'}
                  </button>
                )}
                <button type="button" className="cpd-actionBtn" onClick={handleBookmark} disabled={bookmarking}>
                  {job.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                </button>
                <button type="button" className="cpd-actionBtn" onClick={handleCopyLink}>
                  Copy job link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
