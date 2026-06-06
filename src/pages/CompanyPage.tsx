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

type Applicant = {
  id: string
  name: string
  role: string
  org: string
  location: string
  experience: number
  salary: number
  intro: string
  photo: string
  highlights: string[]
  tags: string[]
  sections: JobSection[]
  workExperience: Array<{ company: string; role: string; duration: string; description: string }>
  projects: Array<{ name: string; url: string; description: string }>
  appliedDate: string
  status: 'new' | 'shortlisted' | 'messaged' | 'hired' | 'passed'
  notes: string
}

const SAMPLE_APPLICANTS: Applicant[] = [
  {
    id: 'a1',
    name: 'Priya Sharma',
    role: 'VP Engineering',
    org: 'TechCorp',
    location: 'Berlin, Germany',
    experience: 12,
    salary: 180,
    intro: 'Engineering leader focused on platform reliability and team growth. Built infra teams from scratch at three Series B+ companies.',
    photo: '',
    highlights: ['Engineering Management', 'Platform Engineering', 'Distributed Systems', 'Team Building'],
    tags: ['Hiring 4 ICs', 'Infra-heavy', 'Async-first', 'No leetcode'],
    sections: [
      { title: 'Proof of work', items: ['Scaled platform team from 3 to 18 at TechCorp', 'Reduced P90 latency by 60% through architecture overhaul', 'Hired and onboarded 12 engineers in 18 months'] },
      { title: 'Intent and fit', items: ['Looking for Series C+ stage where platform investment is the next bottleneck', 'Strong preference for async, written-first cultures'] },
    ],
    workExperience: [
      { company: 'TechCorp', role: 'VP Engineering', duration: 'Jan 2022 — Present', description: 'Lead platform org. Oversee infrastructure, developer experience, and SRE.' },
      { company: 'ScaleUp Inc', role: 'Engineering Director', duration: 'Mar 2019 — Dec 2021', description: 'Built the platform team. Standardised deployment tooling across 8 squads.' },
    ],
    projects: [
      { name: 'Internal Developer Portal', url: '', description: 'Designed and led the build of an internal developer portal serving 200+ engineers.' },
    ],
    appliedDate: '2 days ago',
    status: 'new',
    notes: '',
  },
  {
    id: 'a2',
    name: 'Rahul Verma',
    role: 'Senior Backend Engineer',
    org: 'FinServe',
    location: 'Berlin, Germany',
    experience: 9,
    salary: 130,
    intro: 'Backend engineer with deep experience in Go and distributed systems. OSS maintainer and async communication advocate.',
    photo: '',
    highlights: ['Go', 'Distributed Systems', 'Postgres', 'Kubernetes', 'gRPC'],
    tags: ['OSS maintainer', 'Wants smaller team', 'EU hours', 'Remote-friendly'],
    sections: [
      { title: 'Proof of work', items: ['Core contributor to popular Go OSS project (2.8k stars)', 'Designed event-sourcing system processing 50k events/s', 'Migrated monolith to microservices across 12 services'] },
      { title: 'Intent and fit', items: ['Looking for a high-autonomy role where IC contribution outweighs process overhead', 'Prefers 40-60 person engineering orgs over 500+'] },
    ],
    workExperience: [
      { company: 'FinServe', role: 'Senior Backend Engineer', duration: 'Jun 2021 — Present', description: 'Architected core payment processing pipeline. Mentoring 3 juniors.' },
      { company: 'DataFlow', role: 'Backend Engineer', duration: 'Jan 2019 — May 2021', description: 'Built real-time data pipeline infrastructure using Kafka and Go.' },
    ],
    projects: [
      { name: 'go-eventbus', url: 'https://github.com/example/go-eventbus', description: 'Lightweight event bus library for Go microservices.' },
    ],
    appliedDate: '1 day ago',
    status: 'new',
    notes: '',
  },
  {
    id: 'a3',
    name: 'Ananya Patel',
    role: 'Product Designer',
    org: 'DesignStudio',
    location: 'Lisbon, Portugal',
    experience: 7,
    salary: 110,
    intro: 'Product designer specialising in design systems and prototyping. Experience across health tech, fintech, and developer tools.',
    photo: '',
    highlights: ['Design Systems', 'Prototyping', 'Figma', 'UX Research', 'Motion Design'],
    tags: ['Health', 'Fintech', 'Remote', 'Senior IC'],
    sections: [
      { title: 'Proof of work', items: ['Built and maintained design system adopted by 4 product teams (200+ components)', 'Led UX research for a clinical decision support tool used by 500+ physicians', 'Reduced onboarding time by 40% through UX overhaul'] },
      { title: 'Intent and fit', items: ['Looking for a product-led company where design has a seat at the strategy table', 'Open to both IC and staff-plus tracks'] },
    ],
    workExperience: [
      { company: 'DesignStudio', role: 'Senior Product Designer', duration: 'Apr 2022 — Present', description: 'Lead designer for the platform team. Own design system and developer tools experience.' },
      { company: 'HealthTech Inc', role: 'Product Designer', duration: 'Aug 2019 — Mar 2022', description: 'Designed patient-facing and clinician-facing interfaces for a digital health platform.' },
    ],
    projects: [
      { name: 'Component Library', url: '', description: 'Comprehensive React component library with Storybook documentation and accessibility-first design.' },
    ],
    appliedDate: '4 days ago',
    status: 'shortlisted',
    notes: 'Strong design portfolio. Would be great for the platform team.',
  },
]

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
  const [jobs, setJobs] = useState<Job[]>([])
  const [editingJobIndex, setEditingJobIndex] = useState<number | null>(null)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [pipelineJobId, setPipelineJobId] = useState<string | null>(null)
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null)
  const [pipelineTab, setPipelineTab] = useState<'all' | 'new' | 'shortlisted' | 'messaged' | 'hired' | 'passed'>('all')
  const [applicantNotes, setApplicantNotes] = useState<Record<string, string>>({})

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
            try {
              const jobsRes = await apiRequest('/CompanyController/companyJobs', { method: 'GET' })
              if (jobsRes.ok) {
                const jobsResult = (await jobsRes.json()) as Job[]
                if (Array.isArray(jobsResult)) {
                  setJobs(jobsResult)
                }
              }
            } catch {
              // jobs non-critical
            }
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
      id: '',
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

  async function saveJobEdit() {
    if (editingJobIndex === null || !editJob) return
    try {
      const { id, ...rest } = editJob
      const response = await apiRequest('/CompanyController/jobDetails', {
        method: 'POST',
        body: JSON.parse(JSON.stringify(id ? editJob : rest)),
      })
      if (!response.ok) return
      const result = (await response.json()) as { job?: Job }
      const savedJob = result.job ?? editJob
      const updated = [...jobs]
      updated[editingJobIndex] = savedJob
      setJobs(updated)
    } catch {
      return
    }
    setEditingJobIndex(null)
    setEditJob(null)
  }

  const isEditing = mode === 'edit'

  function openPipeline(jobId: string) {
    setPipelineJobId(jobId)
    setSelectedApplicantId(SAMPLE_APPLICANTS[0]?.id ?? null)
  }

  function closePipeline() {
    setPipelineJobId(null)
    setSelectedApplicantId(null)
    setPipelineTab('all')
  }

  const filteredApplicants = SAMPLE_APPLICANTS.filter(
    (a) => pipelineTab === 'all' || a.status === pipelineTab,
  )
  const selectedApplicant = SAMPLE_APPLICANTS.find((a) => a.id === selectedApplicantId) ?? null

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
        {!loading && mode === 'view' && !pipelineJobId && (
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
                  <div key={job.id || `new-${idx}`} className="cp-jobRow">
                    {editingJobIndex === idx && editJob ? (
                      <div className="cp-jobEdit">
                        <label className="cp-field">
                          <span className="cp-label">Role</span>
                          <input className="cp-input" value={editJob.headline} onChange={(e) => handleJobField('headline', e.target.value)} />
                        </label>
                        <label className="cp-field">
                          <span className="cp-label">Role overview</span>
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
                          <span className="cp-label">Role description</span>
                          <textarea className="cp-input cp-textarea" value={editJob.intro} onChange={(e) => handleJobField('intro', e.target.value)} rows={3} />
                        </label>
                        <label className="cp-field">
                          <span className="cp-label">Skills</span>
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
                        <div className="cp-jobInfo cp-jobInfo--clickable" onClick={() => openPipeline(job.id)}>
                          <span className="cp-jobHeadline">{job.headline}</span>
                          <span className="cp-jobMeta">{job.location} &middot; {job.experience}yrs &middot; ${job.salary}k</span>
                        </div>
                        <span className="cp-jobBadge" onClick={() => openPipeline(job.id)}>{SAMPLE_APPLICANTS.length} applicant{SAMPLE_APPLICANTS.length !== 1 ? 's' : ''}</span>
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

        {!loading && mode === 'view' && pipelineJobId && (
          <div className="cp-pipeline">
            <div className="cp-pipeline__back">
              <button type="button" className="btn" onClick={closePipeline} style={{ height: 32, padding: '0 10px', fontSize: 12 }}>
                ← Back to jobs
              </button>
            </div>
            <div className="cp-pipeline__tabs">
              {(['all', 'new', 'shortlisted', 'messaged', 'hired', 'passed'] as const).map((tab) => {
                const count = tab === 'all' ? SAMPLE_APPLICANTS.length : SAMPLE_APPLICANTS.filter((a) => a.status === tab).length
                return (
                  <button
                    key={tab}
                    type="button"
                    className={`cp-pipeline__tab${pipelineTab === tab ? ' cp-pipeline__tab--active' : ''}`}
                    onClick={() => setPipelineTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                  </button>
                )
              })}
            </div>
            <div className="cp-pipeline__grid">
              <div className="cp-pipeline__list">
                {filteredApplicants.length === 0 ? (
                  <p className="cp-detail" style={{ padding: 16, fontStyle: 'italic' }}>No applicants in this stage.</p>
                ) : (
                  filteredApplicants.map((a) => (
                    <div
                      key={a.id}
                      className={`cp-pipeline__applicant${selectedApplicantId === a.id ? ' cp-pipeline__applicant--active' : ''}`}
                      onClick={() => setSelectedApplicantId(a.id)}
                    >
                      <div className="cp-pipeline__applicantAvatar" style={{ background: a.photo ? `url(${a.photo}) center/cover` : undefined }}>
                        {a.photo ? null : a.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="cp-pipeline__applicantInfo">
                        <span className="cp-pipeline__applicantName">{a.name}</span>
                        <span className="cp-pipeline__applicantRole">{a.role}</span>
                        <span className="cp-pipeline__applicantMeta">{a.location} · Applied {a.appliedDate}</span>
                      </div>
                      {a.status === 'new' ? <span className="cp-pipeline__dot" /> : null}
                    </div>
                  ))
                )}
              </div>
              <div className="cp-pipeline__profile">
                {selectedApplicant ? (
                  <div className="cp-pipeline__profileCard">
                    <div className="cp-pipeline__profileHead">
                      <div className="cp-pipeline__profileAvatar" style={selectedApplicant.photo ? { backgroundImage: `url(${selectedApplicant.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                        {selectedApplicant.photo ? null : selectedApplicant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="cp-pipeline__profileName">{selectedApplicant.name}</h2>
                        <p className="cp-pipeline__profileRole">{selectedApplicant.role} · {selectedApplicant.org}</p>
                        <p className="cp-pipeline__profileMeta">{selectedApplicant.location} · {selectedApplicant.experience}yrs · ${selectedApplicant.salary}k</p>
                      </div>
                    </div>
                    <p className="cp-pipeline__profileIntro">{selectedApplicant.intro}</p>
                    {selectedApplicant.highlights.length > 0 ? (
                      <div className="cp-chipList">
                        {selectedApplicant.highlights.map((h) => <span key={h} className="cp-chipItem">{h}</span>)}
                      </div>
                    ) : null}
                    {selectedApplicant.tags.length > 0 ? (
                      <div className="cp-chipList">
                        {selectedApplicant.tags.map((t) => <span key={t} className="cp-chipItem">{t}</span>)}
                      </div>
                    ) : null}
                    {selectedApplicant.sections.map((sec, si) => (
                      <div key={si} className="cp-pipeline__section">
                        <span className="cp-eyebrow">{sec.title}</span>
                        <ul className="cp-pipeline__sectionList">
                          {sec.items.map((item, ii) => <li key={ii}>{item}</li>)}
                        </ul>
                      </div>
                    ))}
                    {selectedApplicant.workExperience.length > 0 ? (
                      <div className="cp-pipeline__section">
                        <span className="cp-eyebrow">Work experience</span>
                        {selectedApplicant.workExperience.map((w, i) => (
                          <div key={i} className="cp-pipeline__workItem">
                            <span className="cp-pipeline__workRole">{w.role}</span>
                            <span className="cp-pipeline__workOrg">{w.company} · {w.duration}</span>
                            <p className="cp-pipeline__workDesc">{w.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {selectedApplicant.projects.length > 0 ? (
                      <div className="cp-pipeline__section">
                        <span className="cp-eyebrow">Projects</span>
                        {selectedApplicant.projects.map((p, i) => (
                          <div key={i} className="cp-pipeline__workItem">
                            <span className="cp-pipeline__workRole">{p.name}</span>
                            {p.url ? <a className="cp-link" href={p.url} target="_blank" rel="noopener noreferrer">{p.url}</a> : null}
                            {p.description ? <p className="cp-pipeline__workDesc">{p.description}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="cp-detail" style={{ padding: 16, fontStyle: 'italic' }}>Select an applicant to view their profile.</p>
                )}
              </div>
              <div className="cp-pipeline__notes">
                <span className="cp-eyebrow">Notes</span>
                <textarea
                  className="cp-input cp-textarea"
                  placeholder="Internal notes about this applicant…"
                  value={(selectedApplicant && applicantNotes[selectedApplicant.id]) ?? selectedApplicant?.notes ?? ''}
                  onChange={(e) => {
                    if (!selectedApplicant) return
                    setApplicantNotes((prev) => ({ ...prev, [selectedApplicant.id]: e.target.value }))
                  }}
                  rows={8}
                />
                <div className="cp-pipeline__actions">
                  <span className="cp-eyebrow">Status</span>
                  <div className="cp-pipeline__statusRow">
                    {(['new', 'shortlisted', 'messaged', 'hired', 'passed'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`cp-pipeline__statusBtn${selectedApplicant?.status === s ? ' cp-pipeline__statusBtn--active' : ''}`}
                        onClick={() => {
                          if (!selectedApplicant) return
                          const updated = SAMPLE_APPLICANTS.map((a) => a.id === selectedApplicant.id ? { ...a, status: s } : a)
                          Object.assign(SAMPLE_APPLICANTS, updated)
                          setSelectedApplicantId(null)
                          setTimeout(() => setSelectedApplicantId(selectedApplicant.id), 0)
                        }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <MobileBottomNav activePage="company" />
    </div>
  )
}
