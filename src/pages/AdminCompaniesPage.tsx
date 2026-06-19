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

export default function AdminCompaniesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
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

  useEffect(() => {
    loadPending()
  }, [])

  async function review(companyId: string, decision: 'verified' | 'rejected') {
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

  if (loading) {
    return <LoadingState className="adm-loading" label="Loading review queue" detail="Pulling pending companies." />
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
        <span className="pr-eyebrow">Admin · Company review</span>
        <h1 className="adm-hero__title">
          {companies.length > 0
            ? `${companies.length} compan${companies.length === 1 ? 'y' : 'ies'} awaiting review`
            : 'Nothing pending review'}
        </h1>
        <p className="adm-hero__sub">Approve or reject company profiles before they're marked verified to candidates.</p>
      </header>

      {companies.length > 0 ? (
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
                  onClick={() => review(company.id, 'rejected')}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn--solidDark"
                  disabled={actingId === company.id}
                  onClick={() => review(company.id, 'verified')}
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
      )}
    </div>
  )
}
