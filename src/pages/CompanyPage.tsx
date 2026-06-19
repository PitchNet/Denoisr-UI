import { useEffect, useState } from 'react'
import { apiRequest } from '../api'
import { getStoredProfile, setStoredProfile } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import PhotoEditor from '../components/ui/PhotoEditor'
import { useToast } from '../components/ui/Toast'
import '../styles/company.css'

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  shortlisted: 'Shortlisted',
  messaged: 'Messaged',
  hired: 'Hired',
  passed: 'Rejected',
}

const VERIFICATION_LABELS: Record<string, string> = {
  unverified: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
}

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
  verificationStatus?: string
  verificationNotes?: string
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
  jobDescriptionUrl: string
  jobDescriptionFilename: string
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
  resume: string
  resumeFilename: string
  appliedDate: string
  status: 'new' | 'shortlisted' | 'messaged' | 'hired' | 'passed'
  notes: string
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
  const { showToast } = useToast()
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
  // The JD file URL as last persisted to the DB for the job being edited (or ''
  // for a new job). Used to tell "a freshly uploaded, unsaved file" apart from
  // "the file this job already had" when deciding what's safe to delete.
  const [originalJobDescriptionUrl, setOriginalJobDescriptionUrl] = useState('')
  const [jobHighlightInput, setJobHighlightInput] = useState('')
  const [jobTagInput, setJobTagInput] = useState('')
  const [isUploadingJobDescription, setIsUploadingJobDescription] = useState(false)
  const [pipelineJobId, setPipelineJobId] = useState<string | null>(null)
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null)
  const [pipelineTab, setPipelineTab] = useState<'all' | 'new' | 'shortlisted' | 'messaged' | 'hired' | 'passed'>('all')
  const [messageText, setMessageText] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [applicantsLoading, setApplicantsLoading] = useState(false)
  const [jobApplicantCounts, setJobApplicantCounts] = useState<Record<string, number>>({})

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
              try {
                const countsRes = await apiRequest('/CompanyController/jobApplicantCounts', { method: 'GET' })
                if (countsRes.ok) {
                  const countsData = (await countsRes.json()) as Array<{ jobId: string; count: number }>
                  if (Array.isArray(countsData)) {
                    const countsMap: Record<string, number> = {}
                    for (const item of countsData) {
                      countsMap[item.jobId] = item.count
                    }
                    setJobApplicantCounts(countsMap)
                  }
                }
              } catch {
                // counts non-critical
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

    fetch(`${baseUrl}/ProfileController/uploadImage`, {
      method: 'POST',
      credentials: 'include',
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
      if (!response.ok) {
        showToast("Couldn't save your company. Try again.", 'error')
        return
      }
      const result = (await response.json()) as { companyId?: string }
      if (result.companyId) {
        const profile = getStoredProfile()
        if (profile) {
          profile.companyId = result.companyId
          setStoredProfile(profile)
        }
      }
    } catch {
      showToast("Couldn't save your company. Try again.", 'error')
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
    setOriginalJobDescriptionUrl(jobs[index].jobDescriptionUrl || '')
    setJobHighlightInput('')
    setJobTagInput('')
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
      jobDescriptionUrl: '',
      jobDescriptionFilename: '',
    }
    setJobs([...jobs, blank])
    setEditingJobIndex(jobs.length)
    setEditJob(blank)
    setOriginalJobDescriptionUrl('')
    setJobHighlightInput('')
    setJobTagInput('')
  }

  function handleJobField(field: keyof Job, value: string | number | string[] | JobSection[]) {
    if (!editJob) return
    setEditJob({ ...editJob, [field]: value })
  }

  // Best-effort delete of a JD file that was uploaded to Storage this session
  // but never made it into a saved job row (replaced, removed, or the whole
  // edit was cancelled) — jobDetails only cleans up the *previously saved*
  // file on a real save, so anything still dangling has to be swept up here.
  function deleteUnsavedJobDescription(url: string) {
    if (!url || url === originalJobDescriptionUrl) return
    apiRequest('/CompanyController/deleteJobDescription', {
      method: 'POST',
      body: { url },
    }).catch(() => {})
  }

  async function handleJobDescriptionFile(file: File) {
    if (!editJob) return
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (ext !== '.pdf' && ext !== '.docx') {
      showToast('Only PDF or DOCX files are allowed', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File must be under 10MB', 'error')
      return
    }

    setIsUploadingJobDescription(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
      const res = await fetch(`${baseUrl}/CompanyController/uploadJobDescription`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) throw new Error('failed')
      const data = (await res.json()) as { url: string; filename: string }
      // Replacing a file that was itself uploaded-but-unsaved this session —
      // clean up the one being replaced so it doesn't linger orphaned.
      const previousUrl = editJob.jobDescriptionUrl
      setEditJob((current) =>
        current ? { ...current, jobDescriptionUrl: data.url, jobDescriptionFilename: data.filename } : current,
      )
      deleteUnsavedJobDescription(previousUrl)
    } catch {
      showToast("Couldn't upload that file. Try again.", 'error')
    } finally {
      setIsUploadingJobDescription(false)
    }
  }

  function removeJobDescriptionFile() {
    if (!editJob) return
    deleteUnsavedJobDescription(editJob.jobDescriptionUrl)
    setEditJob({ ...editJob, jobDescriptionUrl: '', jobDescriptionFilename: '' })
  }

  function addJobHighlight() {
    if (!editJob) return
    const val = jobHighlightInput.trim()
    if (val) {
      handleJobField('highlights', [...editJob.highlights, val])
    }
    setJobHighlightInput('')
  }

  function addJobTag() {
    if (!editJob) return
    const val = jobTagInput.trim()
    if (val) {
      handleJobField('tags', [...editJob.tags, val])
    }
    setJobTagInput('')
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
      if (!response.ok) {
        showToast("Couldn't save this job. Try again.", 'error')
        return
      }
      const result = (await response.json()) as { job?: Job }
      const savedJob = result.job ?? editJob
      const updated = [...jobs]
      updated[editingJobIndex] = savedJob
      setJobs(updated)
    } catch {
      showToast("Couldn't save this job. Try again.", 'error')
      return
    }
    setEditingJobIndex(null)
    setEditJob(null)
    setOriginalJobDescriptionUrl('')
  }

  function cancelJobEdit() {
    // startJobCreate optimistically pushes a blank row into `jobs` so the edit
    // form has something to point at — if it was never saved, drop that row
    // instead of leaving an empty entry behind.
    if (editingJobIndex !== null && editJob) {
      if (!editJob.id) {
        setJobs((prev) => prev.filter((_, i) => i !== editingJobIndex))
      }
      deleteUnsavedJobDescription(editJob.jobDescriptionUrl)
    }
    setEditingJobIndex(null)
    setEditJob(null)
    setOriginalJobDescriptionUrl('')
  }

  const isEditing = mode === 'edit'

  function openPipeline(jobId: string) {
    setPipelineJobId(jobId)
    setSelectedApplicantId(null)
    setPipelineTab('all')
    setApplicants([])
    setApplicantsLoading(true)
    ;(async () => {
      try {
        const response = await apiRequest('/CompanyController/jobApplicants', {
          method: 'POST',
          body: { jobId },
        })
        if (response.ok) {
          const data = (await response.json()) as Applicant[] | { applicants?: Applicant[] }
          const list = Array.isArray(data) ? data : (data.applicants ?? [])
          setApplicants(list)
          if (list.length > 0) setSelectedApplicantId(list[0].id)
        }
      } catch {
        // silently fail
      } finally {
        setApplicantsLoading(false)
      }
    })()
  }

  function closePipeline() {
    setPipelineJobId(null)
    setSelectedApplicantId(null)
    setPipelineTab('all')
    setApplicants([])
    setMessageText('')
  }

  const pipelineJob = jobs.find((j) => j.id === pipelineJobId) ?? null

  async function handleSendMessage() {
    if (!selectedApplicant || !pipelineJob || !messageText.trim()) return
    setIsSendingMessage(true)
    try {
      const fullContent = `Regarding ${pipelineJob.headline} at ${pipelineJob.organization}\n\n${messageText.trim()}`
      const response = await apiRequest('/FeedController/sendMessage', {
        method: 'POST',
        body: { recipientId: selectedApplicant.id, content: fullContent },
      })
      if (response.ok) {
        setMessageText('')
        setApplicants((prev) => prev.map((a) => a.id === selectedApplicant.id ? { ...a, status: 'messaged' } : a))
        apiRequest('/CompanyController/jobApplicantStatus', {
          method: 'POST',
          body: { jobId: pipelineJob.id, personId: selectedApplicant.id, status: 'messaged', notes: '' },
        }).catch(() => {})
      }
    } catch {
      // silently fail
    } finally {
      setIsSendingMessage(false)
    }
  }

  const filteredApplicants = applicants.filter(
    (a) => pipelineTab === 'all' || a.status === pipelineTab,
  )
  const selectedApplicant = applicants.find((a) => a.id === selectedApplicantId) ?? null

  if (loading) {
    return <LoadingState className="loader--page" label="Loading company" detail="Fetching your company profile." />
  }

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
                {company?.verificationStatus ? (
                  <span className={`cp-verifyBadge cp-verifyBadge--${company.verificationStatus}`}>
                    {VERIFICATION_LABELS[company.verificationStatus] ?? company.verificationStatus}
                  </span>
                ) : null}
              </div>
            </div>

            {company?.verificationStatus === 'rejected' && company?.verificationNotes ? (
              <p className="cp-detail cp-verifyNotes">Reviewer notes: {company.verificationNotes}</p>
            ) : null}

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
                  <div key={job.id || `new-${idx}`} className={`cp-jobRow${editingJobIndex === idx ? ' cp-jobRow--editing' : ''}`}>
                    {editingJobIndex === idx && editJob ? (
                      <div className="cp-jobEdit">
                        <div className="cp-jobEditGrid">
                          <label className="cp-field">
                            <span className="cp-label">Role</span>
                            <input className="cp-input" value={editJob.headline} onChange={(e) => handleJobField('headline', e.target.value)} />
                          </label>
                          <label className="cp-field">
                            <span className="cp-label">Role overview</span>
                            <input className="cp-input" value={editJob.organization} onChange={(e) => handleJobField('organization', e.target.value)} />
                          </label>
                        </div>
                        <div className="cp-jobEditGrid cp-jobEditGrid--three">
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
                        </div>
                        <label className="cp-field">
                          <span className="cp-label">Role description</span>
                          <textarea className="cp-input cp-textarea" value={editJob.intro} onChange={(e) => handleJobField('intro', e.target.value)} rows={3} />
                        </label>
                        <div className="cp-field">
                          <span className="cp-label">Job description document (PDF or DOCX)</span>
                          {editJob.jobDescriptionUrl ? (
                            <div className="cp-jdFile">
                              <a
                                className="cp-jdFile__link"
                                href={editJob.jobDescriptionUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {editJob.jobDescriptionFilename || 'View file'}
                              </a>
                              <button
                                type="button"
                                className="cp-jdFile__remove"
                                onClick={removeJobDescriptionFile}
                                aria-label="Remove job description file"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="cp-jdFile__upload">
                              <input
                                type="file"
                                accept=".pdf,.docx"
                                disabled={isUploadingJobDescription}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleJobDescriptionFile(file)
                                  e.target.value = ''
                                }}
                              />
                              <svg className="cp-jdFile__uploadIcon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <path d="M12 18v-6" />
                                <path d="M9.5 14.5 12 12l2.5 2.5" />
                              </svg>
                              <span className="cp-jdFile__uploadLabel">
                                {isUploadingJobDescription ? 'Uploading…' : 'Click to upload job description'}
                              </span>
                              <span className="cp-jdFile__uploadHint">PDF or DOCX · up to 10MB</span>
                            </label>
                          )}
                        </div>
                        <div className="cp-jobEditGrid">
                          <label className="cp-field">
                            <span className="cp-label">Skills</span>
                            <div className="cp-chipAdder">
                              <input
                                className="cp-input"
                                value={jobHighlightInput}
                                onChange={(e) => setJobHighlightInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addJobHighlight() } }}
                                placeholder="Add a skill"
                              />
                              <button type="button" className="btn btn--solidDark" onClick={addJobHighlight} style={{ height: 36, padding: '0 14px', fontSize: 12.5, flexShrink: 0 }}>Add</button>
                            </div>
                            {editJob.highlights.length > 0 ? (
                              <div className="cp-chipList">
                                {editJob.highlights.map((h, i) => (
                                  <span key={i} className="cp-chipItem">{h} <button type="button" className="cp-chipRemove" onClick={() => removeJobArrayItem('highlights', i)} aria-label={`Remove ${h}`}>&times;</button></span>
                                ))}
                              </div>
                            ) : null}
                          </label>
                          <label className="cp-field">
                            <span className="cp-label">Tags</span>
                            <div className="cp-chipAdder">
                              <input
                                className="cp-input"
                                value={jobTagInput}
                                onChange={(e) => setJobTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addJobTag() } }}
                                placeholder="Add a tag"
                              />
                              <button type="button" className="btn btn--solidDark" onClick={addJobTag} style={{ height: 36, padding: '0 14px', fontSize: 12.5, flexShrink: 0 }}>Add</button>
                            </div>
                            {editJob.tags.length > 0 ? (
                              <div className="cp-chipList">
                                {editJob.tags.map((t, i) => (
                                  <span key={i} className="cp-chipItem">{t} <button type="button" className="cp-chipRemove" onClick={() => removeJobArrayItem('tags', i)} aria-label={`Remove ${t}`}>&times;</button></span>
                                ))}
                              </div>
                            ) : null}
                          </label>
                        </div>
                        <label className="cp-field">
                          <span className="cp-label">Sections</span>
                          {editJob.sections.map((sec, si) => (
                            <div key={si} className="cp-jobSectionEdit">
                              <label className="cp-field cp-jobSectionEdit__title">
                                <span className="cp-label">Section title</span>
                                <input className="cp-input" value={sec.title} onChange={(e) => handleJobSectionTitle(si, e.target.value)} />
                              </label>
                              {sec.items.map((item, ii) => (
                                <div key={ii} className="cp-chipAdder cp-jobSectionEdit__item">
                                  <input className="cp-input" value={item} onChange={(e) => handleJobSectionItem(si, ii, e.target.value)} />
                                  <button type="button" className="btn" onClick={() => removeJobSectionItem(si, ii)} style={{ height: 36, padding: '0 10px', fontSize: 11, flexShrink: 0 }}>Remove</button>
                                </div>
                              ))}
                              <button type="button" className="btn btn--solidDark" onClick={() => addJobSectionItem(si)} style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', fontSize: 11, marginTop: 2 }}>Add item</button>
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" className="btn btn--solidDark" onClick={addJobSection} style={{ height: 32, padding: '0 12px', fontSize: 11 }}>Add section</button>
                            {editJob.sections.length > 0 ? (
                              <button type="button" className="btn" onClick={() => removeJobSection(editJob.sections.length - 1)} style={{ height: 32, padding: '0 12px', fontSize: 11 }}>Remove last section</button>
                            ) : null}
                          </div>
                        </label>
                        <div className="cp-actions">
                          <button type="button" className="btn btn--solidDark" onClick={saveJobEdit}>Save</button>
                          <button type="button" className="btn" onClick={cancelJobEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="cp-jobInfo cp-jobInfo--clickable" onClick={() => openPipeline(job.id)}>
                          <span className="cp-jobHeadline">{job.headline}</span>
                          <span className="cp-jobMeta">{job.location} &middot; {job.experience}yrs &middot; ${job.salary}k</span>
                          {job.jobDescriptionUrl ? (
                            <a
                              className="cp-jdFile__badge"
                              href={job.jobDescriptionUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {job.jobDescriptionFilename || 'JD file'}
                            </a>
                          ) : null}
                        </div>
                        <span className="cp-jobBadge" onClick={() => openPipeline(job.id)}>{jobApplicantCounts[job.id] ?? 0} applicant{(jobApplicantCounts[job.id] ?? 0) !== 1 ? 's' : ''}</span>
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
                const count = tab === 'all' ? applicants.length : applicants.filter((a) => a.status === tab).length
                return (
                  <button
                    key={tab}
                    type="button"
                    className={`cp-pipeline__tab${pipelineTab === tab ? ' cp-pipeline__tab--active' : ''}`}
                    onClick={() => setPipelineTab(tab)}
                  >
                    {STATUS_LABELS[tab] ?? tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                  </button>
                )
              })}
            </div>
            <div className={`cp-pipeline__grid${selectedApplicantId ? ' cp-pipeline__grid--detail' : ''}`}>
              <div className="cp-pipeline__list">
                {applicantsLoading ? (
                  <p className="cp-detail" style={{ padding: 16, fontStyle: 'italic' }}>Loading applicants…</p>
                ) : filteredApplicants.length === 0 ? (
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
                <button type="button" className="cp-pipeline__backToList" onClick={() => setSelectedApplicantId(null)}>
                  ← Back to applicants
                </button>
                {selectedApplicant ? (
                  <div className="cp-pipeline__profileCard">
                    <div className="cp-pipeline__profileHead">
                      <div className="cp-pipeline__profileAvatar" style={selectedApplicant.photo ? { backgroundImage: `url(${selectedApplicant.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                        {selectedApplicant.photo ? null : selectedApplicant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="cp-pipeline__profileIdentity">
                        <h2 className="cp-pipeline__profileName">{selectedApplicant.name}</h2>
                        <p className="cp-pipeline__profileRole">{selectedApplicant.role} · {selectedApplicant.org}</p>
                        <p className="cp-pipeline__profileMeta">{selectedApplicant.location} · {selectedApplicant.experience}yrs · ${selectedApplicant.salary}k</p>
                      </div>
                      {selectedApplicant.resume ? (
                        <a
                          className="cp-pipeline__resumeBtn"
                          href={selectedApplicant.resume}
                          target="_blank"
                          rel="noreferrer"
                          title={selectedApplicant.resumeFilename || 'View resume'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          Resume
                        </a>
                      ) : null}
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
                <span className="cp-eyebrow">Message {selectedApplicant?.name ?? 'applicant'}</span>
                <textarea
                  className="cp-input cp-textarea"
                  placeholder="Type your message to the applicant…"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={5}
                />
                <div className="cp-pipeline__msgPreview">
                  <span className="cp-eyebrow">Will be sent as</span>
                  <div className="cp-pipeline__msgPreviewBox">
                    <p className="cp-pipeline__msgPreviewLine">Regarding {pipelineJob?.headline ?? '…'} at {pipelineJob?.organization ?? '…'}</p>
                    <p className="cp-pipeline__msgPreviewLine cp-pipeline__msgPreviewLine--body">{messageText || 'Your message…'}</p>
                  </div>
                </div>
                <button type="button" className="btn btn--solidDark" onClick={handleSendMessage} disabled={isSendingMessage || !messageText.trim()}>
                  {isSendingMessage ? 'Sending…' : 'Send message'}
                </button>
                <div className="cp-pipeline__actions">
                  <span className="cp-eyebrow">Status</span>
                  <div className="cp-pipeline__statusRow">
                    {(['new', 'shortlisted', 'hired', 'passed'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`cp-pipeline__statusBtn${selectedApplicant?.status === s ? ' cp-pipeline__statusBtn--active' : ''}`}
                        onClick={async () => {
                          if (!selectedApplicant || !pipelineJobId) return
                          setApplicants((prev) => prev.map((a) => a.id === selectedApplicant.id ? { ...a, status: s } : a))
                          try {
                            await apiRequest('/CompanyController/jobApplicantStatus', {
                              method: 'POST',
                              body: { jobId: pipelineJobId, personId: selectedApplicant.id, status: s, notes: '' },
                            })
                          } catch {
                            // silently fail
                          }
                        }}
                      >
                        {STATUS_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
