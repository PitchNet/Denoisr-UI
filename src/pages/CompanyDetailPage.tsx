import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api'
import LoadingState from '../components/ui/LoadingState'
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

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  const website = company?.website?.replace(/^https?:\/\//, '')
  const isVerified = company?.verificationStatus === 'verified'

  return (
    <div className="cpd">
      <div className="cpd-body">
        <button type="button" className="cpd-back" onClick={() => navigate(-1)}>
          &larr; Back
        </button>

        {loading ? (
          <LoadingState className="loader--page" label="Loading company" detail="Fetching company details." />
        ) : notFound || !company ? (
          <div className="cp-card cpd-state">
            <span className="cp-eyebrow">Company</span>
            <h1 className="cp-card__title">Company not found</h1>
            <p className="cp-detail">This company may have been removed or the link is no longer valid.</p>
          </div>
        ) : (
          <div className="cp-card">
            {company.photo ? (
              <div className="cp-cover" style={{ backgroundImage: `url(${company.photo})` }} />
            ) : null}

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
                {company.size ? <span className="cp-chip">{company.size}</span> : null}
                <span className={`cp-verifyBadge cp-verifyBadge--${isVerified ? 'verified' : 'unverified'}`}>
                  {isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>

            {website ? (
              <a className="cp-link" href={`https://${website}`} target="_blank" rel="noopener noreferrer">
                {website}
              </a>
            ) : null}

            {company.address ? <p className="cp-detail">{company.address}</p> : null}

            {company.description ? <p className="cp-desc">{company.description}</p> : null}

            {company.phone || company.yearFounded ? (
              <div className="cp-detailRow">
                {company.phone ? <span>{company.phone}</span> : null}
                {company.phone && company.yearFounded ? <span className="cp-detailDot">&middot;</span> : null}
                {company.yearFounded ? <span>Founded {company.yearFounded}</span> : null}
              </div>
            ) : null}

            {company.tags && company.tags.length > 0 ? (
              <div className="cp-chipList">
                {company.tags.map((t) => (
                  <span key={t} className="cp-chipItem">{t}</span>
                ))}
              </div>
            ) : null}

            {company.commitments ? (
              <div className="cp-detailRow">
                <span className="cp-eyebrow">Commitments</span>
                <p className="cp-detail">{company.commitments}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
