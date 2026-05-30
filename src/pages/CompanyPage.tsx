import { useEffect, useState } from 'react'
import { apiRequest, getAuthTokenFromCookies } from '../api'
import { getStoredProfile, setStoredProfile } from '../auth'
import MobileBottomNav from '../components/MobileBottomNav'
import PhotoEditor from '../components/ui/PhotoEditor'
import '../styles/company.css'

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

type JobSection = {
  title: string
  items: string[]
}

type Job = {
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
  sections: JobSection[]
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

export default function CompanyPage() {
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [loading, setLoading] = useState(true)
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
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '82f78baf-f1ff-4145-ac01-2f66f1bc0dcf',
      kind: 'jobs',
      headline: 'Senior Frontend Engineer',
      subheadline: 'Atlas Health',
      organization: 'Hiring for a trust-first patient experience team',
      location: 'Berlin, Germany',
      experience: 5,
      salary: 140,
      intro: 'Build a clarity-first product that helps patients and clinicians act on high-signal information instead of fragmented dashboards.',
      highlights: ['React + TypeScript', 'Design systems', 'Accessibility'],
      tags: ['Remote-friendly', 'Series C', 'Product-led'],
      sections: [
        {
          title: 'What you will solve',
          items: [
            'Turn noisy medical workflow data into focused decision interfaces.',
            'Ship production-ready UI systems that work on tablet and desktop.',
            'Partner with product and research to reduce cognitive overload.',
          ],
        },
        {
          title: 'Why it is high-signal',
          items: [
            'Clear ownership over a core decision-making surface.',
            'Measured outcomes tied to speed and confidence of clinical action.',
          ],
        },
      ],
    },
  ])
  const [editingJobIndex, setEditingJobIndex] = useState<number | null>(null)
  const [editJob, setEditJob] = useState<Job | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const response = await apiRequest('/CompanyController/getCompany', { method: 'GET' })
        if (response.ok) {
          const result = (await response.json()) as { company: CompanyData | null }
          if (result.company) {
            setCompany(result.company)
            setMode('view')
            setLoading(false)
            return
          }
        }
      } catch {
        // fall through to edit mode
      }
      setCompany(null)
      setMode('edit')
      setLoading(false)
    })()
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

  async function handleSave() {
    const profile = getStoredProfile()
    const data: CompanyData & { companyId?: string } = {
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
      ...(profile?.companyId ? { companyId: profile.companyId as string } : {}),
    }
    try {
      const response = await apiRequest('/CompanyController/companyDetails', {
        method: 'POST',
        body: JSON.parse(JSON.stringify(data)),
      })
      if (!response.ok) return
      const result = (await response.json()) as { companyId?: string }
      if (result.companyId) {
        const profile = getStoredProfile()
        if (profile) {
          profile.companyId = result.companyId
          setStoredProfile(profile)
        }
      }
    } catch {
      return
    }
    setCompany(data)
    setMode('view')
  }

  function handleCancel() {
    if (company) {
      setMode('view')
    }
  }

  function startJobEdit(index: number) {
    setEditingJobIndex(index)
    setEditJob(JSON.parse(JSON.stringify(jobs[index])))
  }

  function startJobCreate() {
    const blank: Job = {
      id: crypto.randomUUID(),
      kind: 'jobs',
      headline: '',
      subheadline: '',
      organization: '',
      location: '',
      experience: 0,
      salary: 0,
      intro: '',
      highlights: [],
      tags: [],
      sections: [],
    }
    setJobs([...jobs, blank])
    setEditingJobIndex(jobs.length)
    setEditJob(blank)
  }

  function handleJobField(field: keyof Job, value: string | number | string[] | JobSection[]) {
    if (!editJob) return
    setEditJob({ ...editJob, [field]: value })
  }

  function handleJobSectionTitle(sectionIndex: number, value: string) {
    if (!editJob) return
    const sections = [...editJob.sections]
    sections[sectionIndex] = { ...sections[sectionIndex], title: value }
    setEditJob({ ...editJob, sections })
  }

  function handleJobSectionItem(sectionIndex: number, itemIndex: number, value: string) {
    if (!editJob) return
    const sections = [...editJob.sections]
    const items = [...sections[sectionIndex].items]
    items[itemIndex] = value
    sections[sectionIndex] = { ...sections[sectionIndex], items }
    setEditJob({ ...editJob, sections })
  }

  function addJobSectionItem(sectionIndex: number) {
    if (!editJob) return
    const sections = [...editJob.sections]
    sections[sectionIndex] = { ...sections[sectionIndex], items: [...sections[sectionIndex].items, ''] }
    setEditJob({ ...editJob, sections })
  }

  function removeJobSectionItem(sectionIndex: number, itemIndex: number) {
    if (!editJob) return
    const sections = [...editJob.sections]
    sections[sectionIndex] = { ...sections[sectionIndex], items: sections[sectionIndex].items.filter((_, i) => i !== itemIndex) }
    setEditJob({ ...editJob, sections })
  }

  function addJobSection() {
    if (!editJob) return
    setEditJob({ ...editJob, sections: [...editJob.sections, { title: '', items: [''] }] })
  }

  function removeJobSection(index: number) {
    if (!editJob) return
    setEditJob({ ...editJob, sections: editJob.sections.filter((_, i) => i !== index) })
  }

  function addJobArrayItem(field: 'highlights' | 'tags') {
    if (!editJob) return
    handleJobField(field, [...editJob[field], ''])
  }

  function removeJobArrayItem(field: 'highlights' | 'tags', index: number) {
    if (!editJob) return
    handleJobField(field, editJob[field].filter((_, i) => i !== index))
  }

  function saveJobEdit() {
    if (editingJobIndex === null || !editJob) return
    const updated = [...jobs]
    updated[editingJobIndex] = editJob
    setJobs(updated)
    setEditingJobIndex(null)
    setEditJob(null)
  }

  const isEditing = mode === 'edit'

  return (
    <div className="cp">
      <div className="cp-body">
        {loading ? null : isEditing ? (
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
        {!loading && mode === 'view' && (
          <div className="cp-card cp-jobs">
            <div className="cp-jobsHeader">
              <span className="cp-eyebrow">Open positions</span>
              <button type="button" className="btn btn--solidDark" onClick={startJobCreate} style={{ height: 32, padding: '0 12px', fontSize: 11 }}>Create job</button>
            </div>
            {jobs.length === 0 ? (
              <p className="cp-detail" style={{ fontStyle: 'italic' }}>No jobs posted yet.</p>
            ) : (
              <div className="cp-jobList">
                {jobs.map((job, idx) => (
                  <div key={job.id} className="cp-jobRow">
                    {editingJobIndex === idx && editJob ? (
                      <div className="cp-jobEdit">
                        <label className="cp-field">
                          <span className="cp-label">Headline</span>
                          <input className="cp-input" value={editJob.headline} onChange={(e) => handleJobField('headline', e.target.value)} />
                        </label>
                        <label className="cp-field">
                          <span className="cp-label">Subheadline</span>
                          <input className="cp-input" value={editJob.subheadline} onChange={(e) => handleJobField('subheadline', e.target.value)} />
                        </label>
                        <label className="cp-field">
                          <span className="cp-label">Organization</span>
                          <input className="cp-input" value={editJob.organization} onChange={(e) => handleJobField('organization', e.target.value)} />
                        </label>
                        <label className="cp-field">
                          <span className="cp-label">Location</span>
                          <input className="cp-input" value={editJob.location} onChange={(e) => handleJobField('location', e.target.value)} />
                        </label>
                        <label className="cp-field">
                          <span className="cp-label">Experience (years)</span>
                          <input className="cp-input" type="number" value={editJob.experience} onChange={(e) => handleJobField('experience', Number(e.target.value))} />
                        </label>
                        <label className="cp-field">
                          <span className="cp-label">Salary (k)</span>
                          <input className="cp-input" type="number" value={editJob.salary} onChange={(e) => handleJobField('salary', Number(e.target.value))} />
                        </label>
                        <label className="cp-field">
                          <span className="cp-label">Intro</span>
                          <textarea className="cp-input cp-textarea" value={editJob.intro} onChange={(e) => handleJobField('intro', e.target.value)} rows={3} />
                        </label>

                        <label className="cp-field">
                          <span className="cp-label">Highlights</span>
                          {editJob.highlights.map((h, i) => (
                            <div key={i} className="cp-chipAdder">
                              <input className="cp-input" value={h} onChange={(e) => { const hh = [...editJob.highlights]; hh[i] = e.target.value; handleJobField('highlights', hh) }} />
                              <button type="button" className="btn" onClick={() => removeJobArrayItem('highlights', i)} style={{ height: 36, padding: '0 10px', fontSize: 11, flexShrink: 0 }}>Remove</button>
                            </div>
                          ))}
                          <button type="button" className="btn btn--solidDark" onClick={() => addJobArrayItem('highlights')} style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', fontSize: 11 }}>Add highlight</button>
                        </label>

                        <label className="cp-field">
                          <span className="cp-label">Tags</span>
                          {editJob.tags.map((t, i) => (
                            <div key={i} className="cp-chipAdder">
                              <input className="cp-input" value={t} onChange={(e) => { const tt = [...editJob.tags]; tt[i] = e.target.value; handleJobField('tags', tt) }} />
                              <button type="button" className="btn" onClick={() => removeJobArrayItem('tags', i)} style={{ height: 36, padding: '0 10px', fontSize: 11, flexShrink: 0 }}>Remove</button>
                            </div>
                          ))}
                          <button type="button" className="btn btn--solidDark" onClick={() => addJobArrayItem('tags')} style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', fontSize: 11 }}>Add tag</button>
                        </label>

                        <label className="cp-field">
                          <span className="cp-label">Sections</span>
                          {editJob.sections.map((sec, si) => (
                            <div key={si} className="cp-jobSectionEdit" style={{ border: '1px solid var(--ink-6)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 8 }}>
                              <label className="cp-field" style={{ marginBottom: 6 }}>
                                <span className="cp-label">Section title</span>
                                <input className="cp-input" value={sec.title} onChange={(e) => handleJobSectionTitle(si, e.target.value)} />
                              </label>
                              {sec.items.map((item, ii) => (
                                <div key={ii} className="cp-chipAdder" style={{ marginBottom: 4 }}>
                                  <input className="cp-input" value={item} onChange={(e) => handleJobSectionItem(si, ii, e.target.value)} />
                                  <button type="button" className="btn" onClick={() => removeJobSectionItem(si, ii)} style={{ height: 36, padding: '0 10px', fontSize: 11, flexShrink: 0 }}>Remove</button>
                                </div>
                              ))}
                              <button type="button" className="btn btn--solidDark" onClick={() => addJobSectionItem(si)} style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', fontSize: 11, marginTop: 2 }}>Add item</button>
                            </div>
                          ))}
                          <button type="button" className="btn btn--solidDark" onClick={addJobSection} style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', fontSize: 11 }}>Add section</button>
                          {editJob.sections.length > 0 ? (
                            <button type="button" className="btn" onClick={() => removeJobSection(editJob.sections.length - 1)} style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', fontSize: 11 }}>Remove last section</button>
                          ) : null}
                        </label>

                        <div className="cp-actions">
                          <button type="button" className="btn btn--solidDark" onClick={saveJobEdit}>Save</button>
                          <button type="button" className="btn" onClick={() => { setEditingJobIndex(null); setEditJob(null) }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="cp-jobInfo">
                          <span className="cp-jobHeadline">{job.headline}</span>
                          <span className="cp-jobMeta">{job.location} &middot; {job.experience}yrs &middot; ${job.salary}k</span>
                        </div>
                        <button type="button" className="cp-jobPencil" onClick={() => startJobEdit(idx)} aria-label="Edit job">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <MobileBottomNav activePage="company" />
    </div>
  )
}
