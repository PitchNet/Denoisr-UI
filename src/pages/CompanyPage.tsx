import { useEffect, useState } from 'react'
import MobileBottomNav from '../components/MobileBottomNav'
import '../styles/company.css'

const COMPANY_STORAGE_KEY = 'denoisr_company'

type CompanyData = {
  name: string
  photo: string
  website: string
  size: string
  address: string
  description: string
}

const SIZE_OPTIONS = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–500 employees',
  '501–1,000 employees',
  '1,001–5,000 employees',
  '5,000+ employees',
]

function loadCompany(): CompanyData | null {
  try {
    const raw = localStorage.getItem(COMPANY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CompanyData>
    if (typeof parsed.name === 'string' && parsed.name.trim()) {
      return parsed as CompanyData
    }
    return null
  } catch {
    return null
  }
}

function saveCompany(data: CompanyData) {
  localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(data))
}

export default function CompanyPage() {
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState('')
  const [website, setWebsite] = useState('')
  const [size, setSize] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const existing = loadCompany()
    setCompany(existing)
    if (!existing) {
      setMode('edit')
    }
  }, [])

  function startEdit() {
    if (!company) return
    setName(company.name)
    setPhoto(company.photo)
    setWebsite(company.website)
    setSize(company.size)
    setAddress(company.address)
    setDescription(company.description)
    setMode('edit')
  }

  function handleSave() {
    const data: CompanyData = {
      name: name.trim(),
      photo: photo.trim(),
      website: website.trim(),
      size,
      address: address.trim(),
      description: description.trim(),
    }
    saveCompany(data)
    setCompany(data)
    setMode('view')
  }

  function handleCancel() {
    if (company) {
      setMode('view')
    }
  }

  const isEditing = mode === 'edit'

  return (
    <div className="cp">
      <div className="cp-body">
        {isEditing ? (
          <div className="cp-card">
            <span className="cp-eyebrow">{company ? 'Edit company' : 'Create company'}</span>
            <h1 className="cp-title">
              {company ? 'Edit your company' : 'Set up your company'}
            </h1>

            <form className="cp-form" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
              <label className="cp-field">
                <span className="cp-label">Company name</span>
                <input className="cp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" required />
              </label>

              <label className="cp-field">
                <span className="cp-label">Photo URL</span>
                <input className="cp-input" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://..." />
              </label>

              <label className="cp-field">
                <span className="cp-label">Website</span>
                <input className="cp-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" />
              </label>

              <label className="cp-field">
                <span className="cp-label">Size</span>
                <select className="cp-input cp-select" value={size} onChange={(e) => setSize(e.target.value)} required>
                  <option value="">Select size</option>
                  {SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="cp-field">
                <span className="cp-label">Address</span>
                <input className="cp-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="San Francisco, CA" />
              </label>

              <label className="cp-field">
                <span className="cp-label">Description</span>
                <textarea className="cp-input cp-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about your company..." rows={4} />
              </label>

              <div className="cp-actions">
                <button type="submit" className="btn btn--solidDark">Save</button>
                {company ? (
                  <button type="button" className="btn" onClick={handleCancel}>Cancel</button>
                ) : null}
              </div>
            </form>
          </div>
        ) : (
          <div className="cp-card">
            {company?.photo ? (
              <div className="cp-cover" style={{ backgroundImage: `url(${company.photo})` }} />
            ) : null}

            <div className="cp-card__header">
              {company?.photo ? (
                <div className="cp-avatar" style={{ backgroundImage: `url(${company.photo})` }} />
              ) : (
                <div className="cp-avatar cp-avatar--fallback">
                  {company?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
              )}
              <div className="cp-card__meta">
                <h1 className="cp-card__title">{company?.name ?? 'Your Company'}</h1>
                {company?.size ? <span className="cp-chip">{company.size}</span> : null}
              </div>
            </div>

            {company?.website ? (
              <a className="cp-link" href={`https://${company.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            ) : null}

            {company?.address ? (
              <p className="cp-detail">{company.address}</p>
            ) : null}

            {company?.description ? (
              <p className="cp-desc">{company.description}</p>
            ) : null}

            <div className="cp-actions">
              <button type="button" className="btn btn--solidDark" onClick={startEdit}>Edit company</button>
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav activePage="company" />
    </div>
  )
}
