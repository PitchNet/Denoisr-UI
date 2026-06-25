import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api'
import { setStoredFilters } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import { LOADERS } from '../data/routeLoaders'
import { useToast } from '../components/ui/Toast'
import '../styles/company.css'
import '../styles/company-detail.css'

type CompanyDetail = {
  id: string
  name: string
  photo: string
  website: string
  size: string
  address: string
  description: string
  phone: string
  yearFounded: string
  tags: string[]
  commitments: string
  verificationStatus?: string
}

type CompanyJob = {
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

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [jobs, setJobs] = useState<CompanyJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    apiRequest(`/CompanyController/getCompanyById/${id}`, { method: 'GET' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.company) {
          setCompany(data.company)
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
    if (!id) return
    let cancelled = false
    setJobsLoading(true)

    apiRequest(`/CompanyController/getCompanyJobsById/${id}`, { method: 'GET' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setJobs(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setJobs([])
      })
      .finally(() => {
        if (!cancelled) setJobsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const website = company?.website?.replace(/^https?:\/\//, '')
  const isVerified = company?.verificationStatus === 'verified'

  const details: Array<{ label: string; value: string }> = company
    ? [
        company.size ? { label: 'Company size', value: company.size } : null,
        company.yearFounded ? { label: 'Founded', value: company.yearFounded } : null,
        company.address ? { label: 'Headquarters', value: company.address } : null,
        company.phone ? { label: 'Phone', value: company.phone } : null,
      ].filter((d): d is { label: string; value: string } => d !== null)
    : []

  function handleCopyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast('Link copied', 'success', 1500, true))
      .catch(() => showToast('Could not copy link', 'error', 2000, true))
  }

  function handleBrowseRoles() {
    if (!company) return
    setStoredFilters('jobs', {
      role: '',
      search: '',
      country: '',
      city: '',
      experience: 0,
      salary: 0,
      bookmarked: false,
      companyId: company.id,
    })
    navigate(`/home?mode=jobs&company=${encodeURIComponent(company.name ?? '')}`)
  }

  return (
    <div className="cpd">
      <div className="cpd-body">
        <button type="button" className="cpd-back" onClick={() => navigate(-1)}>
          &larr; Back
        </button>

        {loading ? (
          <LoadingState className="loader--page" {...LOADERS.companyDetail} />
        ) : notFound || !company ? (
          <div className="cp-card cpd-state">
            <span className="cp-eyebrow">Company</span>
            <h1 className="cp-card__title">Company not found</h1>
            <p className="cp-detail">This company may have been removed or the link is no longer valid.</p>
          </div>
        ) : (
          <div className="cpd-shell">
            <div className="cpd-col cpd-col--main">
              <div className="cp-card cpd-hero">
                {company.photo ? (
                  <div className="cp-cover" style={{ backgroundImage: `url(${company.photo})` }} />
                ) : (
                  <div className="cp-cover cpd-cover--fallback" />
                )}

                <div className="cp-card__header">
                  {company.photo ? (
                    <div className="cp-avatar" style={{ backgroundImage: `url(${company.photo})` }} />
                  ) : (
                    <div className="cp-avatar cp-avatar--fallback">
                      {company.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="cp-card__meta">
                    <h1 className="cp-card__title">{company.name ?? 'Company'}</h1>
                    <div className="cpd-badgeRow">
                      {company.size ? <span className="cp-chip">{company.size}</span> : null}
                      <span className={`cp-verifyBadge cp-verifyBadge--${isVerified ? 'verified' : 'unverified'}`}>
                        {isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

                {website ? (
                  <a className="cp-link" href={`https://${website}`} target="_blank" rel="noopener noreferrer">
                    {website}
                  </a>
                ) : null}
              </div>

              {company.description ? (
                <div className="cp-card cpd-section">
                  <span className="cp-eyebrow">About</span>
                  <p className="cp-desc">{company.description}</p>
                </div>
              ) : null}

              <div className="cp-card cpd-section">
                <div className="cpd-jobsHeader">
                  <span className="cp-eyebrow">Open positions</span>
                  {jobs.length > 0 ? <span className="cpd-jobsCount">{jobs.length}</span> : null}
                </div>

                {jobsLoading ? (
                  <p className="cp-detail">Checking for open roles&hellip;</p>
                ) : jobs.length === 0 ? (
                  <p className="cp-detail">No open positions right now. Check back later.</p>
                ) : (
                  <div className="cpd-jobGrid">
                    {jobs.map((job) => {
                      const isExpanded = expandedJobId === job.id
                      const metaParts = [
                        job.location || null,
                        job.experience ? `${job.experience}+ yrs` : null,
                        job.salary ? formatSalary(job.salary) : null,
                      ].filter((p): p is string => Boolean(p))

                      return (
                        <button
                          type="button"
                          key={job.id}
                          className="cpd-jobCard"
                          onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                          aria-expanded={isExpanded}
                        >
                          <div className="cpd-jobCard__top">
                            <h3 className="cpd-jobCard__title">{job.headline}</h3>
                            {job.postedAgo ? <span className="cpd-jobCard__posted">{job.postedAgo}</span> : null}
                          </div>
                          {metaParts.length > 0 ? (
                            <div className="cpd-jobCard__meta">{metaParts.join(' · ')}</div>
                          ) : null}
                          {job.intro ? (
                            <p className={`cpd-jobCard__intro ${isExpanded ? 'cpd-jobCard__intro--expanded' : ''}`}>
                              {job.intro}
                            </p>
                          ) : null}
                          {job.tags.length > 0 ? (
                            <div className="cp-chipList">
                              {job.tags.map((t) => (
                                <span key={t} className="cp-chipItem">{t}</span>
                              ))}
                            </div>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="cpd-col cpd-col--side cpd-sidebar">
              {details.length > 0 ? (
                <div className="cp-card cpd-section">
                  <span className="cp-eyebrow">Details</span>
                  <dl className="cpd-detailGrid">
                    {details.map((d) => (
                      <div className="cpd-detailGrid__item" key={d.label}>
                        <dt>{d.label}</dt>
                        <dd>{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              {company.tags && company.tags.length > 0 ? (
                <div className="cp-card cpd-section">
                  <span className="cp-eyebrow">Focus areas</span>
                  <div className="cp-chipList">
                    {company.tags.map((t) => (
                      <span key={t} className="cp-chipItem">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {company.commitments ? (
                <div className="cp-card cpd-section">
                  <span className="cp-eyebrow">Commitments</span>
                  <p className="cp-detail">{company.commitments}</p>
                </div>
              ) : null}

              <div className="cp-card cpd-section">
                <span className="cp-eyebrow">Actions</span>
                <button type="button" className="cpd-actionBtn" onClick={handleCopyLink}>
                  Copy profile link
                </button>
                <button type="button" className="cpd-actionBtn" onClick={handleBrowseRoles}>
                  Browse other roles at {company.name}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
