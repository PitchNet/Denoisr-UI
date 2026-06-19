import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { useToast } from '../components/ui/Toast'
import LoadingState from '../components/ui/LoadingState'
import '../styles/profile.css'
import '../styles/admin-companies.css'

type VerificationStatus = 'unverified' | 'verified' | 'rejected'

type Company = {
  id: string
  name: string
  website?: string
  address?: string
  description?: string
  verification_status: VerificationStatus
}

type ReportedPerson = {
  id: string
  headline?: string
  emailaddress?: string
}

type UserReport = {
  id: string
  reporter_id: string
  reported_id: string
  reason: string
  details?: string
  created_at: string
  status: 'open' | 'resolved' | 'dismissed'
  reporter: ReportedPerson | null
  reported: ReportedPerson | null
}

type AdminTab = 'companies' | 'reports'

function personLabel(person: ReportedPerson | null) {
  if (!person) return 'Unknown user'
  return person.headline || person.emailaddress || person.id
}

export default function AdminCompaniesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [tab, setTab] = useState<AdminTab>('companies')
  const [companies, setCompanies] = useState<Company[]>([])
  const [reports, setReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [notesById, setNotesById] = useState<Record<string, string>>({})
  const [actingId, setActingId] = useState<string | null>(null)

  async function loadPending() {
    setLoading(true)
    try {
      const response = await apiRequest('/AdminController/pendingCompanies', { method: 'GET' })
      if (response.status === 403) {
        setForbidden(true)
        return
      }
      if (!response.ok) return
      const data = (await response.json()) as { companies: Company[] }
      setCompanies(data.companies ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function loadReports() {
    setLoading(true)
    try {
      const response = await apiRequest('/AdminController/userReports', { method: 'GET' })
      if (response.status === 403) {
        setForbidden(true)
        return
      }
      if (!response.ok) return
      const data = (await response.json()) as { reports: UserReport[] }
      setReports(data.reports ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'companies') {
      loadPending()
    } else {
      loadReports()
    }
  }, [tab])

  async function reviewCompany(companyId: string, decision: 'verified' | 'rejected') {
    setActingId(companyId)
    try {
      const notes = notesById[companyId]?.trim()
      const response = await apiRequest('/AdminController/reviewCompany', {
        method: 'POST',
        body: notes ? { companyId, decision, notes } : { companyId, decision },
      })
      if (!response.ok) {
        showToast('Could not save this review. Try again.', 'error')
        return
      }
      showToast(decision === 'verified' ? 'Company verified.' : 'Company rejected.', 'success')
      setCompanies((prev) => prev.filter((c) => c.id !== companyId))
    } catch {
      showToast('Could not save this review. Try again.', 'error')
    } finally {
      setActingId(null)
    }
  }

  async function resolveReport(reportId: string, decision: 'resolved' | 'dismissed') {
    setActingId(reportId)
    try {
      const notes = notesById[reportId]?.trim()
      const response = await apiRequest('/AdminController/resolveReport', {
        method: 'POST',
        body: notes ? { reportId, decision, notes } : { reportId, decision },
      })
      if (!response.ok) {
        showToast('Could not save this review. Try again.', 'error')
        return
      }
      showToast(decision === 'resolved' ? 'Report marked resolved.' : 'Report dismissed.', 'success')
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch {
      showToast('Could not save this review. Try again.', 'error')
    } finally {
      setActingId(null)
    }
  }

  if (loading) {
    return (
      <LoadingState
        className="adm-loading"
        label={tab === 'companies' ? 'Loading review queue' : 'Loading reports'}
        detail={tab === 'companies' ? 'Pulling pending companies.' : 'Pulling open reports.'}
      />
    )
  }

  if (forbidden) {
    return (
      <div className="adm">
        <div className="adm-forbidden">
          <span className="pr-eyebrow">Admin only</span>
          <h1 className="adm-hero__title">You don't have access to this page.</h1>
          <button type="button" className="btn btn--solidDark" onClick={() => navigate('/home')}>
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="adm">
      <header className="adm-hero">
        <span className="pr-eyebrow">Admin · Review queue</span>
        <h1 className="adm-hero__title">
          {tab === 'companies'
            ? (companies.length > 0
              ? `${companies.length} compan${companies.length === 1 ? 'y' : 'ies'} awaiting review`
              : 'Nothing pending review')
            : (reports.length > 0
              ? `${reports.length} report${reports.length === 1 ? '' : 's'} awaiting review`
              : 'No open reports')}
        </h1>
        <p className="adm-hero__sub">
          {tab === 'companies'
            ? "Approve or reject company profiles before they're marked verified to candidates."
            : 'Review profile reports submitted by users and mark them resolved or dismissed.'}
        </p>
        <div className="adm-tabs">
          <button type="button" className={`adm-tab ${tab === 'companies' ? 'adm-tab--active' : ''}`} onClick={() => setTab('companies')}>
            Companies
          </button>
          <button type="button" className={`adm-tab ${tab === 'reports' ? 'adm-tab--active' : ''}`} onClick={() => setTab('reports')}>
            Reports
          </button>
        </div>
      </header>

      {tab === 'companies' ? (
        companies.length > 0 ? (
          <div className="adm-list">
            {companies.map((company) => (
              <article key={company.id} className="adm-card">
                <div className="adm-card__head">
                  <h2 className="adm-card__title">{company.name}</h2>
                  {company.website ? (
                    <a className="adm-card__link" href={company.website} target="_blank" rel="noreferrer">
                      {company.website}
                    </a>
                  ) : null}
                </div>
                {company.address ? <p className="adm-card__meta">{company.address}</p> : null}
                {company.description ? <p className="adm-card__desc">{company.description}</p> : null}

                <textarea
                  className="adm-card__notes"
                  placeholder="Notes (optional, shared with the company if rejected)"
                  value={notesById[company.id] ?? ''}
                  onChange={(e) => setNotesById((prev) => ({ ...prev, [company.id]: e.target.value }))}
                />

                <div className="adm-card__actions">
                  <button
                    type="button"
                    className="btn btn--outlinedLight"
                    disabled={actingId === company.id}
                    onClick={() => reviewCompany(company.id, 'rejected')}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn--solidDark"
                    disabled={actingId === company.id}
                    onClick={() => reviewCompany(company.id, 'verified')}
                  >
                    Verify
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="adm-empty">
            <p>All caught up — no companies waiting on review.</p>
          </div>
        )
      ) : reports.length > 0 ? (
        <div className="adm-list">
          {reports.map((report) => (
            <article key={report.id} className="adm-card">
              <div className="adm-card__head">
                <h2 className="adm-card__title">{personLabel(report.reported)}</h2>
                <span className="adm-card__link">{new Date(report.created_at).toLocaleString()}</span>
              </div>
              <p className="adm-card__meta">Reported by {personLabel(report.reporter)}</p>
              <p className="adm-card__meta"><strong>Reason:</strong> {report.reason}</p>
              {report.details ? <p className="adm-card__desc">{report.details}</p> : null}

              <textarea
                className="adm-card__notes"
                placeholder="Resolution notes (optional, internal only)"
                value={notesById[report.id] ?? ''}
                onChange={(e) => setNotesById((prev) => ({ ...prev, [report.id]: e.target.value }))}
              />

              <div className="adm-card__actions">
                <button
                  type="button"
                  className="btn btn--outlinedLight"
                  disabled={actingId === report.id}
                  onClick={() => resolveReport(report.id, 'dismissed')}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="btn btn--solidDark"
                  disabled={actingId === report.id}
                  onClick={() => resolveReport(report.id, 'resolved')}
                >
                  Mark resolved
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="adm-empty">
          <p>All caught up — no reports waiting on review.</p>
        </div>
      )}
    </div>
  )
}
