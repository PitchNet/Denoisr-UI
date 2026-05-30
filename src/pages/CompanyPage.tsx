import { useEffect, useState } from 'react'
import { getAuthTokenFromCookies } from '../api'
import MobileBottomNav from '../components/MobileBottomNav'
import PhotoEditor from '../components/ui/PhotoEditor'
import '../styles/company.css'

const COMPANY_STORAGE_KEY = 'denoisr_company'

type CompanyData = {
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
  const [showPhotoEditor, setShowPhotoEditor] = useState(false)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [size, setSize] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [yearFounded, setYearFounded] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [commitments, setCommitments] = useState('')

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
    const storedPhoto = company.photo || ''
    setPhotoUrl(storedPhoto)
    if (storedPhoto) setPhotoPreviewUrl(storedPhoto)
    setWebsite(company.website)
    setSize(company.size)
    setAddress(company.address)
    setDescription(company.description)
    setPhone(company.phone ?? '')
    setYearFounded(company.yearFounded ?? '')
    setTags(company.tags ?? [])
    setCommitments(company.commitments ?? '')
    setMode('edit')
  }

  function handlePhotoSave(file: File) {
    const url = URL.createObjectURL(file)
    setPhotoPreviewUrl(url)

    const formData = new FormData()
    formData.append('file', file)

    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
    const token = getAuthTokenFromCookies()

    fetch(`${baseUrl}/ProfileController/uploadImage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
      .then((res) => res.json())
      .then((data: { url?: string }) => {
        if (data.url) {
          setPhotoUrl(data.url)
        }
      })
      .catch(() => {})
      .finally(() => {
        setShowPhotoEditor(false)
      })
  }

  function handlePhotoCancel() {
    setShowPhotoEditor(false)
  }

  function addTag() {
    const val = tagInput.trim()
    if (val && !tags.includes(val)) {
      setTags([...tags, val])
    }
    setTagInput('')
  }

  function removeTag(i: number) {
    setTags(tags.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    const data: CompanyData = {
      name: name.trim(),
      photo: photoUrl,
      website: website.trim(),
      size,
      address: address.trim(),
      description: description.trim(),
      phone: phone.trim(),
      yearFounded: yearFounded.trim(),
      tags,
      commitments: commitments.trim(),
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

              <label className="cp-field cp-photoField">
                <span className="cp-label">Photo</span>
                <div className="cp-photoUpload">
                  <div
                    className={`cp-photoPreview ${photoPreviewUrl ? 'cp-photoPreview--set' : 'cp-photoPreview--empty'}`}
                    style={photoPreviewUrl ? { backgroundImage: `url(${photoPreviewUrl})` } : undefined}
                    onClick={() => setShowPhotoEditor(true)}
                  >
                    {photoPreviewUrl ? (
                      <button type="button" className="cp-photoRemove" onClick={(e) => { e.stopPropagation(); setPhotoPreviewUrl(null); setPhotoUrl(''); }} aria-label="Remove photo">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 3l8 8M11 3l-8 8" />
                        </svg>
                      </button>
                    ) : (
                      <div className="cp-photoPlaceholder">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>Upload photo</span>
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {showPhotoEditor ? (
                <PhotoEditor onSave={handlePhotoSave} onCancel={handlePhotoCancel} />
              ) : null}

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

              <label className="cp-field">
                <span className="cp-label">Phone</span>
                <input className="cp-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
              </label>

              <label className="cp-field">
                <span className="cp-label">Year founded</span>
                <input className="cp-input" value={yearFounded} onChange={(e) => setYearFounded(e.target.value)} placeholder="2020" />
              </label>

              <label className="cp-field">
                <span className="cp-label">Tags</span>
                <div className="cp-chipAdder">
                  <input className="cp-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add a tag" />
                  <button type="button" className="btn btn--solidDark" onClick={addTag} style={{ height: 36, padding: '0 14px', fontSize: 12.5, flexShrink: 0 }}>Add</button>
                </div>
                {tags.length > 0 ? (
                  <div className="cp-chipList">
                    {tags.map((t, i) => (
                      <span key={t} className="cp-chipItem">{t} <button type="button" className="cp-chipRemove" onClick={() => removeTag(i)} aria-label={`Remove ${t}`}>&times;</button></span>
                    ))}
                  </div>
                ) : null}
              </label>

              <label className="cp-field">
                <span className="cp-label">Commitments</span>
                <textarea className="cp-input cp-textarea" value={commitments} onChange={(e) => setCommitments(e.target.value)} placeholder="Describe your company's commitments—equality, sustainability, community, etc." rows={3} />
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

            {company?.phone || company?.yearFounded ? (
              <div className="cp-detailRow">
                {company.phone ? <span>{company.phone}</span> : null}
                {company.phone && company.yearFounded ? <span className="cp-detailDot">&middot;</span> : null}
                {company.yearFounded ? <span>Founded {company.yearFounded}</span> : null}
              </div>
            ) : null}

            {company?.tags && company.tags.length > 0 ? (
              <div className="cp-chipList">
                {company.tags.map((t) => (
                  <span key={t} className="cp-chipItem">{t}</span>
                ))}
              </div>
            ) : null}

            {company?.commitments ? (
              <div className="cp-detailRow">
                <span className="cp-eyebrow">Commitments</span>
                <p className="cp-detail">{company.commitments}</p>
              </div>
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
