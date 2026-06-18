import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { markAuthenticatedFromResponse } from '../auth'
import '../styles/dashboard.css'

const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'
const LINKEDIN_DATA_KEY = 'denoisr-linkedin-data'
const DRAFT_KEY = 'denoisr-dashboard-draft'

type HighlightEntry = {
  query: string
  selectedValue: string
  menuOpen: boolean
}

type SectionEntry = {
  title: string
  items: string[]
}

type WorkEntry = {
  company: string
  role: string
  duration: string
  description: string
}

type ProjectEntry = {
  name: string
  url: string
  description: string
}

type DashboardDraft = {
  name: string
  phoneNumber: string
  currentRole: string
  organization: string
  location: string
  experience: string
  salary: string
  intro: string
  photo: string
  highlightEntries: HighlightEntry[]
  tagEntries: string[]
  sections: SectionEntry[]
  workEntries: WorkEntry[]
  projectEntries: ProjectEntry[]
}

const FUNDAMENTAL_FIELDS: Array<keyof DashboardDraft> = [
  'name', 'phoneNumber', 'currentRole', 'organization',
  'location', 'experience', 'salary', 'intro',
]

const fixedSections = ['Proof of work', 'Intent and fit']

const highlightSuggestions = [
  'Backend Engineering',
  'Data Analysis',
  'Data Engineering',
  'Design Systems',
  'DevOps',
  'Enterprise UX',
  'Figma',
  'Frontend Engineering',
  'Hiring Ops',
  'Machine Learning',
  'Mobile Development',
  'Product Design',
  'Product Management',
  'Python',
  'React',
  'Talent Systems',
  'TypeScript',
  'UX Research',
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const routerLocation = useLocation()
  // Carried in memory from SignupPage's navigate() call — never persisted to
  // sessionStorage, so it can't leak via XSS or a shared-machine inspection.
  // Lost on a hard refresh; the fallback field below recovers it.
  const passwordFromHandoff = (routerLocation.state as { password?: string } | null)?.password ?? ''
  const [confirmPassword, setConfirmPassword] = useState('')
  const password = passwordFromHandoff || confirmPassword
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [organization, setOrganization] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('')
  const [salary, setSalary] = useState('')
  const [intro, setIntro] = useState('')
  const [photo, setPhoto] = useState('')
  const [highlightEntries, setHighlightEntries] = useState<HighlightEntry[]>([
    { query: '', selectedValue: '', menuOpen: false },
  ])
  const [tagEntries, setTagEntries] = useState([''])
  const [sections, setSections] = useState<SectionEntry[]>([
    { title: 'Proof of work', items: [''] },
    { title: 'Intent and fit', items: [''] },
  ])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([
    { company: '', role: '', duration: '', description: '' },
  ])
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>([
    { name: '', url: '', description: '' },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{ section: string; count: number; id: string }[]>([])
  const [wantHiring, setWantHiring] = useState(false)
  const [collapsedWork, setCollapsedWork] = useState(true)
  const [collapsedProjects, setCollapsedProjects] = useState(true)
  const linkedinLoaded = useRef(false)

  const lastHighlight = highlightEntries[highlightEntries.length - 1]
  const canAddHighlight = lastHighlight.selectedValue.trim() !== ''
  const lastTag = tagEntries[tagEntries.length - 1]
  const canAddTag = lastTag.trim() !== ''
  const lastWork = workEntries[workEntries.length - 1]
  const canAddWork = lastWork.company.trim() !== ''
  const lastProject = projectEntries[projectEntries.length - 1]
  const canAddProject = lastProject.name.trim() !== ''

  useEffect(() => {
    const raw = sessionStorage.getItem(LINKEDIN_DATA_KEY)
    if (!raw) return
    sessionStorage.removeItem(LINKEDIN_DATA_KEY)
    try {
      const data = JSON.parse(raw) as LinkedInResponse
      if (data.headline) setName(data.headline)
      if (data.subheadline) setCurrentRole(data.subheadline)
      if (data.organization) setOrganization(data.organization)
      if (data.location) setLocation(data.location)
      if (typeof data.experience === 'number') setExperience(String(data.experience))
      if (typeof data.salary === 'number') setSalary(String(data.salary))
      if (data.intro) setIntro(data.intro)
      if (data.photo) setPhoto(data.photo)
      if (data.highlights && data.highlights.length > 0) {
        setHighlightEntries(data.highlights.map((h) => ({ query: h, selectedValue: h, menuOpen: false })))
      }
      if (data.tags && data.tags.length > 0) setTagEntries(data.tags)
      if (data.sections && data.sections.length > 0) {
        setSections(data.sections.map((s) => ({ title: s.title, items: s.items.length > 0 ? s.items : [''] })))
      }
      if (data.workExperience && data.workExperience.length > 0) {
        setWorkEntries(data.workExperience.map((w) => ({ ...w, duration: w.duration ?? '' })))
      }
      if (data.projects && data.projects.length > 0) {
        setProjectEntries(data.projects.map((p) => ({ name: p.name, url: (p.link ?? p.url ?? ''), description: p.description ?? '' })))
      }
      linkedinLoaded.current = true
    } catch {
      // ignore invalid data
    }
  }, [])

  useEffect(() => {
    if (linkedinLoaded.current) return
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as DashboardDraft
      setName(draft.name ?? '')
      setPhoneNumber(draft.phoneNumber ?? '')
      setCurrentRole(draft.currentRole ?? '')
      setOrganization(draft.organization ?? '')
      setLocation(draft.location ?? '')
      setExperience(draft.experience ?? '')
      setSalary(draft.salary ?? '')
      setIntro(draft.intro ?? '')
      setPhoto(draft.photo ?? '')
      if (draft.highlightEntries) setHighlightEntries(draft.highlightEntries)
      if (draft.tagEntries) setTagEntries(draft.tagEntries)
      if (draft.sections) setSections(draft.sections)
      if (draft.workEntries) setWorkEntries(draft.workEntries)
      if (draft.projectEntries) setProjectEntries(draft.projectEntries)
    } catch {
      // ignore corrupt draft
    }
  }, [])

  const fundamentalsFilled = useMemo(() => {
    const vals = [name, phoneNumber, currentRole, organization, location, experience, salary, intro]
    return vals.filter((v) => v.trim() !== '').length
  }, [name, phoneNumber, currentRole, organization, location, experience, salary, intro])

  const fundamentalsTotal = FUNDAMENTAL_FIELDS.length
  const completionPct = Math.round((fundamentalsFilled / fundamentalsTotal) * 100)

  const sectionStatuses = useMemo(() => {
    const getFieldValue = (field: string): string => {
      const map: Record<string, string> = { name, phoneNumber, currentRole, organization, location, experience, salary, intro }
      return map[field] ?? ''
    }
    const fundamentalsMissing = FUNDAMENTAL_FIELDS.filter(f => getFieldValue(f).trim() === '')
    const skillsCount = highlightEntries.filter(e => e.selectedValue.trim() !== '').length
    const tagsCount = tagEntries.filter(t => t.trim() !== '').length
    const workCount = workEntries.filter(w => w.company.trim() !== '').length
    const projectCount = projectEntries.filter(p => p.name.trim() !== '').length
    const proofCount = sections.reduce((acc, s) => acc + s.items.filter(i => i.trim() !== '').length, 0)
    return [
      { id: 'fundamentals', label: 'Fundamentals', complete: fundamentalsMissing.length === 0, detail: `${fundamentalsFilled}/${fundamentalsTotal}` },
      { id: 'skills', label: 'Skills', complete: skillsCount > 0, detail: skillsCount > 0 ? `${skillsCount} added` : 'None yet' },
      { id: 'tags', label: 'Tags', complete: tagsCount > 0, detail: tagsCount > 0 ? `${tagsCount} added` : 'None yet' },
      { id: 'work', label: 'Work experience', complete: workCount > 0, detail: workCount > 0 ? `${workCount} added` : 'None yet' },
      { id: 'projects', label: 'Projects', complete: projectCount > 0, detail: projectCount > 0 ? `${projectCount} added` : 'None yet' },
      { id: 'proof-and-intent', label: 'Proof & intent', complete: proofCount > 0, detail: proofCount > 0 ? `${proofCount} added` : 'None yet' },
    ]
  }, [name, phoneNumber, currentRole, organization, location, experience, salary, intro, fundamentalsFilled, highlightEntries, tagEntries, workEntries, projectEntries, sections])

  const railMessage = useMemo(() => {
    const [fundamentals] = sectionStatuses
    if (sectionStatuses.every(s => s.complete)) return 'Everything looks good — you\'re ready to save your profile.'
    if (fundamentals.complete) return 'Fundamentals look good! Now add skills and proof points to strengthen your card.'
    if (fundamentalsFilled >= 4) return 'Halfway there — keep filling in the rest of your fundamentals.'
    return 'Fill in your name, role, and intro to get started.'
  }, [sectionStatuses, fundamentalsFilled])

  // Auto-save draft on every state change
  useEffect(() => {
    const draft: DashboardDraft = {
      name, phoneNumber, currentRole, organization, location,
      experience, salary, intro, photo,
      highlightEntries, tagEntries, sections, workEntries, projectEntries,
    }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [name, phoneNumber, currentRole, organization, location, experience, salary, intro, photo, highlightEntries, tagEntries, sections, workEntries, projectEntries])

  // Clear validation banner when the user fixes fields
  useEffect(() => {
    if (validationErrors.length > 0) setValidationErrors([])
  }, [name, phoneNumber, currentRole, organization, location, experience, salary, intro, highlightEntries, tagEntries, workEntries, projectEntries, sections])

  const matchingHighlightsByIndex = useMemo(
    () =>
      highlightEntries.map(({ query }) => {
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return []
        return highlightSuggestions
          .filter((item) => item.toLowerCase().includes(normalizedQuery))
          .slice(0, 6)
      }),
    [highlightEntries],
  )

  function updateHighlightEntry(index: number, updater: (entry: HighlightEntry) => HighlightEntry) {
    setHighlightEntries((current) =>
      current.map((entry, i) => (i === index ? updater(entry) : entry)),
    )
  }

  function handleHighlightChange(index: number, value: string) {
    updateHighlightEntry(index, (entry) => {
      const exactMatch = highlightSuggestions.find(
        (item) => item.toLowerCase() === value.trim().toLowerCase(),
      )
      return { ...entry, query: value, selectedValue: exactMatch ?? '', menuOpen: true }
    })
  }

  function handleHighlightFocus(index: number) {
    updateHighlightEntry(index, (entry) => ({ ...entry, menuOpen: true }))
  }

  function handleHighlightBlur(index: number) {
    window.setTimeout(() => {
      updateHighlightEntry(index, (entry) => ({ ...entry, menuOpen: false }))
    }, 120)
  }

  function selectHighlight(index: number, value: string) {
    updateHighlightEntry(index, (entry) => ({
      ...entry,
      query: value,
      selectedValue: value,
      menuOpen: false,
    }))
  }

  function addHighlightRow() {
    if (!canAddHighlight) return
    setHighlightEntries((current) => [...current, { query: '', selectedValue: '', menuOpen: false }])
  }

  function removeHighlightRow(index: number) {
    setHighlightEntries((current) =>
      current.length === 1
        ? [{ query: '', selectedValue: '', menuOpen: false }]
        : current.filter((_, i) => i !== index),
    )
  }

  function updateTag(index: number, value: string) {
    setTagEntries((current) => current.map((entry, i) => (i === index ? value : entry)))
  }

  function addTag() {
    if (!canAddTag) return
    setTagEntries((current) => [...current, ''])
  }

  function removeTag(index: number) {
    setTagEntries((current) =>
      current.length === 1 ? [''] : current.filter((_, i) => i !== index),
    )
  }

  function updateSectionItem(sectionIndex: number, itemIndex: number, value: string) {
    setSections((current) =>
      current.map((section, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...section,
              items: section.items.map((item, iIdx) => (iIdx === itemIndex ? value : item)),
            }
          : section,
      ),
    )
  }

  function addSectionItem(sectionIndex: number) {
    setSections((current) =>
      current.map((section, sIdx) => {
        if (sIdx !== sectionIndex) return section
        const lastItem = section.items[section.items.length - 1]
        if (lastItem.trim() === '') return section
        return { ...section, items: [...section.items, ''] }
      }),
    )
  }

  function removeSectionItem(sectionIndex: number, itemIndex: number) {
    setSections((current) =>
      current.map((section, sIdx) => {
        if (sIdx !== sectionIndex) return section
        return {
          ...section,
          items: section.items.length === 1 ? [''] : section.items.filter((_, i) => i !== itemIndex),
        }
      }),
    )
  }

  function updateWorkEntry(index: number, field: keyof WorkEntry, value: string) {
    setWorkEntries((current) =>
      current.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    )
  }

  function addWorkEntry() {
    if (!canAddWork) return
    setWorkEntries((current) => [
      ...current,
      { company: '', role: '', duration: '', description: '' },
    ])
  }

  function removeWorkEntry(index: number) {
    setWorkEntries((current) =>
      current.length === 1
        ? [{ company: '', role: '', duration: '', description: '' }]
        : current.filter((_, i) => i !== index),
    )
  }

  function updateProjectEntry(index: number, field: keyof ProjectEntry, value: string) {
    setProjectEntries((current) =>
      current.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    )
  }

  function addProjectEntry() {
    if (!canAddProject) return
    setProjectEntries((current) => [
      ...current,
      { name: '', url: '', description: '' },
    ])
  }

  function removeProjectEntry(index: number) {
    setProjectEntries((current) =>
      current.length === 1
        ? [{ name: '', url: '', description: '' }]
        : current.filter((_, i) => i !== index),
    )
  }

  type LinkedInResponse = {
    headline?: string
    subheadline?: string
    organization?: string
    location?: string
    experience?: number
    salary?: number | null
    intro?: string
    highlights?: string[]
    tags?: string[]
    sections?: Array<{ title: string; items: string[] }>
    workExperience?: Array<{ company: string; role: string; duration: string; description: string }>
    projects?: Array<{ name: string; link?: string; url?: string; description?: string }>
    photo?: string
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const getFieldValue = (field: string): string => {
      const map: Record<string, string> = { name, phoneNumber, currentRole, organization, location, experience, salary, intro }
      return map[field] ?? ''
    }

    const errors: { section: string; count: number; id: string }[] = []

    const fundamentalsMissing = FUNDAMENTAL_FIELDS.filter(f => getFieldValue(f).trim() === '')
    if (fundamentalsMissing.length > 0) {
      errors.push({ section: 'Fundamentals', count: fundamentalsMissing.length, id: 'fundamentals' })
    }
    if (!highlightEntries.some(e => e.selectedValue.trim() !== '')) {
      errors.push({ section: 'Skills', count: 1, id: 'skills' })
    }
    if (!tagEntries.some(t => t.trim() !== '')) {
      errors.push({ section: 'Tags', count: 1, id: 'tags' })
    }
    if (!workEntries.some(w => w.company.trim() !== '')) {
      errors.push({ section: 'Work experience', count: 1, id: 'work' })
    }
    if (!projectEntries.some(p => p.name.trim() !== '')) {
      errors.push({ section: 'Projects', count: 1, id: 'projects' })
    }
    const proofCount = sections.reduce((acc, s) => acc + s.items.filter(i => i.trim() !== '').length, 0)
    if (proofCount < 1) {
      errors.push({ section: 'Proof & intent', count: 1, id: 'proof-and-intent' })
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      const firstEl = document.getElementById(`dp-section-${errors[0].id}`)
      if (firstEl) {
        const y = firstEl.getBoundingClientRect().top + window.scrollY - 100
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
      return
    }

    if (!password.trim()) {
      setSaveError('Re-enter the password you chose to finish creating your account.')
      return
    }

    setValidationErrors([])

    const storedCredentials = sessionStorage.getItem(SIGNUP_CREDENTIALS_KEY)
    const parsedCredentials = storedCredentials
      ? (JSON.parse(storedCredentials) as { email?: string })
      : {}

    const payload = {
      email: parsedCredentials.email?.trim() ?? '',
      password,
      phoneNumber: phoneNumber.trim(),
      kind: 'people',
      name: name.trim(),
      currentRole: currentRole.trim(),
      organization: organization.trim(),
      location: location.trim(),
      experience: Number(experience || 0),
      salary: Number(salary || 0),
      intro: intro.trim(),
      photo: photo || '',
      highlights: highlightEntries.map((entry) => entry.selectedValue).filter(Boolean),
      tags: tagEntries.map((entry) => entry.trim()).filter(Boolean),
      sections: sections
        .map((section) => ({
          title: section.title.trim(),
          items: section.items.map((item) => item.trim()).filter(Boolean),
        }))
        .filter((section) => section.title !== '' && section.items.length > 0),
      workExperience: workEntries
        .map((entry) => ({
          company: entry.company.trim(),
          role: entry.role.trim(),
          duration: entry.duration.trim(),
          description: entry.description.trim(),
        }))
        .filter((entry) => entry.company !== ''),
      projects: projectEntries
        .map((entry) => ({
          name: entry.name.trim(),
          url: entry.url.trim(),
          description: entry.description.trim(),
        }))
        .filter((entry) => entry.name !== ''),
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const response = await apiRequest('/LoginController/signup', {
        method: 'POST',
        body: payload,
      })

      if (!response.ok) {
        setSaveError('Saving profile failed.')
        return
      }

      await markAuthenticatedFromResponse(response)
      sessionStorage.removeItem(SIGNUP_CREDENTIALS_KEY)
      sessionStorage.removeItem(DRAFT_KEY)
      localStorage.setItem('denoisr_just_signed_up', '1')
      navigate(wantHiring ? '/company' : '/home')
    } catch {
      setSaveError('Saving profile failed.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dp">
      {/* ── Intro ── */}
      <section className="dp-hero">
        <div className="dp-hero__wash" aria-hidden="true" />
        <div className="dp-hero__inner">
          <span className="dp-eyebrow">Profile · People mode</span>
          <h1 className="dp-hero__title">
            Compose a card that reads <em>like signal</em>, not a résumé dump.
          </h1>
          <p className="dp-hero__sub">
            Denoisr cards are short, deliberate, and proof-led. Fill the fields the way you would
            describe yourself to someone whose attention is already half-gone.
          </p>

          <ol className="dp-stepline">
            {[
              { num: '01', label: 'Fundamentals', count: `${fundamentalsFilled}/${fundamentalsTotal}` },
              { num: '02', label: 'Highlights & tags' },
              { num: '03', label: 'Work experience' },
              { num: '04', label: 'Projects' },
              { num: '05', label: 'Proof & intent' },
            ].map((step) => (
              <li key={step.num} className="dp-stepline__item">
                <span className="dp-stepline__num">{step.num}</span>
                <span className="dp-stepline__label">{step.label}</span>
                {step.count ? <span className="dp-stepline__count">{step.count}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Composer ── */}
      <section className="dp-section">
        <div className="dp-grid">
          <article className="dp-card">
            <header className="dp-card__head">
              <span className="dp-eyebrow">Composer · People payload</span>
              <h2 className="dp-card__title">Build the card someone would actually open.</h2>
              <p className="dp-card__sub">
                Every field maps directly to the people-card model. Keep it specific, concise,
                proof-oriented.
              </p>
            </header>

            <div className="dp-formProgress">
              <span className="dp-formProgress__label">Fundamentals &middot; {fundamentalsFilled}/{fundamentalsTotal}</span>
              <div className="dp-formProgress__bar"><div className="dp-formProgress__fill" style={{ width: `${completionPct}%` }} /></div>
            </div>

            <form className="dp-form" onSubmit={handleSubmit} noValidate>
              {validationErrors.length > 0 ? (
                <div className="dp-errorBanner" role="alert">
                  {validationErrors.map((err) => (
                    <span key={err.id} className="dp-errorBanner__item">
                      {err.count} required field{err.count > 1 ? 's' : ''} missing in {err.section}.
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Fundamentals */}
              <div className="dp-block" id="dp-section-fundamentals">
                <span className="dp-blockBrow">— 01 Fundamentals</span>

                <div className="dp-grid2">
                  <label className="dp-field">
                    <span className="dp-label">Name <span className="dp-required">*</span></span>
                    <input className="dp-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} placeholder="Mateo Ruiz" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Phone <span className="dp-required">*</span></span>
                    <input className="dp-input" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required pattern="^\+?[0-9()\-\s]{6,20}$" placeholder="+34 600 000 000" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Current role <span className="dp-required">*</span></span>
                    <input className="dp-input" type="text" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} required minLength={2} maxLength={80} placeholder="Product Designer" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Organization <span className="dp-required">*</span></span>
                    <input className="dp-input" type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} required minLength={2} maxLength={80} placeholder="Zinfi" />
                  </label>

                  <label className="dp-field dp-field--full">
                    <span className="dp-label">Location <span className="dp-required">*</span></span>
                    <input className="dp-input" type="text" value={location} onChange={(e) => setLocation(e.target.value)} required minLength={2} maxLength={80} placeholder="Madrid, Spain" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Experience (years) <span className="dp-required">*</span></span>
                    <input className="dp-input" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} required min={0} max={40} step={1} placeholder="6" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Target comp ($k) <span className="dp-required">*</span></span>
                    <input className="dp-input" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} required min={0} max={1000} step={1} placeholder="92" />
                  </label>

                  <label className="dp-field dp-field--full">
                    <span className="dp-label">Intro <span className="dp-required">*</span></span>
                    <textarea
                      className="dp-input dp-textarea"
                      value={intro}
                      onChange={(e) => setIntro(e.target.value)}
                      required
                      minLength={40}
                      maxLength={280}
                      placeholder="Designs interfaces that remove clutter and help users evaluate choices with confidence instead of guesswork."
                    />
                  </label>
                </div>
              </div>

              {/* Skills */}
              <div className="dp-block" id="dp-section-skills">
                <span className="dp-blockBrow">— 02 Skills</span>
                <p className="dp-blockHint">Pick from the list — these are used to match you with relevant roles and connections.</p>

                {highlightEntries.map((entry, index) => {
                  const matching = matchingHighlightsByIndex[index]
                  const rowId = `dp-hl-${index}`
                  const isLast = index === highlightEntries.length - 1
                  return (
                    <div className="dp-row" key={`hl-${index}`}>
                      <label className="dp-field dp-field--grow">
                        <span className="dp-label">Skill {String(index + 1).padStart(2, '0')}</span>
                        <input
                          className="dp-input"
                          type="search"
                          value={entry.query}
                          onChange={(e) => handleHighlightChange(index, e.target.value)}
                          onFocus={() => handleHighlightFocus(index)}
                          onBlur={() => handleHighlightBlur(index)}
                          placeholder="e.g. Frontend Engineering, Product Design, Python"
                          autoComplete="off"
                          aria-expanded={entry.menuOpen && matching.length > 0}
                          aria-controls={rowId}
                          required
                        />
                        <input
                          className="dp-hidden"
                          type="text"
                          value={entry.selectedValue}
                          readOnly
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                        {entry.menuOpen && matching.length > 0 ? (
                          <div className="dp-suggest" id={rowId}>
                            {matching.map((item) => (
                              <button
                                key={`${item}-${index}`}
                                type="button"
                                className="dp-suggest__opt"
                                onClick={() => selectHighlight(index, item)}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </label>

                      <div className="dp-rowActions">
                        <button
                          type="button"
                          className="dp-iconBtn"
                          onClick={() => removeHighlightRow(index)}
                          aria-label={`Remove skill ${index + 1}`}
                        >
                          −
                        </button>
                        {isLast ? (
                          <button
                            type="button"
                            className="dp-iconBtn dp-iconBtn--ink"
                            onClick={addHighlightRow}
                            disabled={!canAddHighlight}
                            aria-label="Add skill"
                          >
                            +
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Tags */}
              <div className="dp-block" id="dp-section-tags">
                <span className="dp-blockBrow">— 03 Tags</span>
                <p className="dp-blockHint">Free-form tags — add anything that describes your preferences, work style, or interests.</p>

                {tagEntries.map((entry, index) => {
                  const isLast = index === tagEntries.length - 1
                  return (
                    <div className="dp-row" key={`tag-${index}`}>
                      <label className="dp-field dp-field--grow">
                        <span className="dp-label">Tag {String(index + 1).padStart(2, '0')}</span>
                        <input
                          className="dp-input"
                          type="text"
                          value={entry}
                          onChange={(e) => updateTag(index, e.target.value)}
                          required
                          maxLength={40}
                          placeholder="e.g. Hybrid, Remote-first, Open to relocating"
                        />
                      </label>

                      <div className="dp-rowActions">
                        <button
                          type="button"
                          className="dp-iconBtn"
                          onClick={() => removeTag(index)}
                          aria-label={`Remove tag ${index + 1}`}
                        >
                          −
                        </button>
                        {isLast ? (
                          <button
                            type="button"
                            className="dp-iconBtn dp-iconBtn--ink"
                            onClick={addTag}
                            disabled={!canAddTag}
                            aria-label="Add tag"
                          >
                            +
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Work experience */}
              <div className="dp-block" id="dp-section-work">
                <button type="button" className="dp-blockToggle" onClick={() => setCollapsedWork((v) => !v)} aria-expanded={!collapsedWork}>
                  <span className="dp-blockBrow">— 04 Work experience</span>
                  <span className="dp-blockToggle__icon">{collapsedWork ? '+' : '−'}</span>
                </button>
                {collapsedWork ? (
                  <p className="dp-blockHint">
                    {workEntries.some((w) => w.company.trim()) ? `${workEntries.filter((w) => w.company.trim()).length} entries added` : 'Optional. Add where you have done the work.'}
                  </p>
                ) : (
                  <><p className="dp-blockHint">Where you have done the work. Add at least one entry.</p>
                {workEntries.map((entry, index) => {
                  const isLast = index === workEntries.length - 1
                  return (
                    <div className="dp-subblock" key={`work-${index}`}>
                      <header className="dp-subblock__head">
                        <span className="dp-eyebrow">Experience {String(index + 1).padStart(2, '0')}</span>
                      </header>

                      <label className="dp-field">
                        <span className="dp-label">Company</span>
                        <input className="dp-input" type="text" value={entry.company}
                          onChange={(e) => updateWorkEntry(index, 'company', e.target.value)}
                          maxLength={80} placeholder="Company name" />
                      </label>

                      <div className="dp-grid2">
                        <label className="dp-field">
                          <span className="dp-label">Role</span>
                          <input className="dp-input" type="text" value={entry.role}
                            onChange={(e) => updateWorkEntry(index, 'role', e.target.value)}
                            maxLength={80} placeholder="Product Designer" />
                        </label>
                        <label className="dp-field">
                          <span className="dp-label">Duration</span>
                          <input className="dp-input" type="text" value={entry.duration}
                            onChange={(e) => updateWorkEntry(index, 'duration', e.target.value)}
                            maxLength={40} placeholder="Jan 2022 — Present" />
                        </label>
                      </div>

                      <label className="dp-field">
                        <span className="dp-label">Description</span>
                        <textarea className="dp-input dp-textarea dp-textarea--sm"
                          value={entry.description}
                          onChange={(e) => updateWorkEntry(index, 'description', e.target.value)}
                          maxLength={500} rows={2}
                          placeholder="Describe your responsibilities and achievements." />
                      </label>

                      <div className="dp-subblock__actions">
                        <button type="button" className="dp-iconBtn dp-iconBtn--sm"
                          onClick={() => removeWorkEntry(index)}
                          aria-label={`Remove work experience ${index + 1}`}>
                          − Remove
                        </button>
                        {isLast ? (
                          <button type="button" className="dp-iconBtn dp-iconBtn--ink dp-iconBtn--sm"
                            onClick={addWorkEntry} disabled={!canAddWork}
                            aria-label="Add work experience">
                            + Add
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
                </>)}
              </div>

              {/* Projects */}
              <div className="dp-block" id="dp-section-projects">
                <button type="button" className="dp-blockToggle" onClick={() => setCollapsedProjects((v) => !v)} aria-expanded={!collapsedProjects}>
                  <span className="dp-blockBrow">— 05 Projects</span>
                  <span className="dp-blockToggle__icon">{collapsedProjects ? '+' : '−'}</span>
                </button>
                {collapsedProjects ? (
                  <p className="dp-blockHint">
                    {projectEntries.some((p) => p.name.trim()) ? `${projectEntries.filter((p) => p.name.trim()).length} entries added` : 'Optional. Side work, open-source, or standout deliverables.'}
                  </p>
                ) : (
                  <><p className="dp-blockHint">Side work, open-source, or standout deliverables.</p>
                {projectEntries.map((entry, index) => {
                  const isLast = index === projectEntries.length - 1
                  return (
                    <div className="dp-subblock" key={`proj-${index}`}>
                      <header className="dp-subblock__head">
                        <span className="dp-eyebrow">Project {String(index + 1).padStart(2, '0')}</span>
                      </header>

                      <label className="dp-field">
                        <span className="dp-label">Name</span>
                        <input className="dp-input" type="text" value={entry.name}
                          onChange={(e) => updateProjectEntry(index, 'name', e.target.value)}
                          maxLength={80} placeholder="Project name" />
                      </label>

                      <label className="dp-field">
                        <span className="dp-label">URL</span>
                        <input className="dp-input" type="url" value={entry.url}
                          onChange={(e) => updateProjectEntry(index, 'url', e.target.value)}
                          maxLength={200} placeholder="https://github.com/username/project" />
                      </label>

                      <label className="dp-field">
                        <span className="dp-label">Description</span>
                        <textarea className="dp-input dp-textarea dp-textarea--sm"
                          value={entry.description}
                          onChange={(e) => updateProjectEntry(index, 'description', e.target.value)}
                          maxLength={500} rows={2} placeholder="Describe your project." />
                      </label>

                      <div className="dp-subblock__actions">
                        <button type="button" className="dp-iconBtn dp-iconBtn--sm"
                          onClick={() => removeProjectEntry(index)}
                          aria-label={`Remove project ${index + 1}`}>
                          − Remove
                        </button>
                        {isLast ? (
                          <button type="button" className="dp-iconBtn dp-iconBtn--ink dp-iconBtn--sm"
                            onClick={addProjectEntry} disabled={!canAddProject}
                            aria-label="Add project">
                            + Add
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
                </>)}
              </div>

              {/* Sections */}
              <div className="dp-block" id="dp-section-proof-and-intent">
                <span className="dp-blockBrow">— 06 Proof and intent</span>
                <p className="dp-blockHint">
                  Narrative blocks. Each title is fixed; the points underneath are yours to write.
                </p>

                {sections.map((section, sectionIndex) => {
                  const canAddPoint = section.items[section.items.length - 1].trim() !== ''
                  return (
                    <div className="dp-subblock" key={`sec-${sectionIndex}`}>
                      <header className="dp-subblock__head">
                        <span className="dp-eyebrow">Section {String(sectionIndex + 1).padStart(2, '0')}</span>
                        <h3 className="dp-subblock__title">{fixedSections[sectionIndex]}</h3>
                      </header>

                      <div className="dp-subblock__items">
                        {section.items.map((item, itemIndex) => (
                          <div className="dp-row" key={`sec-${sectionIndex}-${itemIndex}`}>
                            <label className="dp-field dp-field--grow">
                              <span className="dp-label">Point {String(itemIndex + 1).padStart(2, '0')}</span>
                              <textarea
                                className="dp-input dp-textarea dp-textarea--sm"
                                value={item}
                                onChange={(e) => updateSectionItem(sectionIndex, itemIndex, e.target.value)}
                                required
                                minLength={8}
                                maxLength={220}
                                placeholder="Defined information architecture for a multi-panel procurement tool."
                              />
                            </label>

                            <div className="dp-rowActions">
                              <button
                                type="button"
                                className="dp-iconBtn"
                                onClick={() => removeSectionItem(sectionIndex, itemIndex)}
                                aria-label={`Remove point ${itemIndex + 1}`}
                              >
                                −
                              </button>
                              {itemIndex === section.items.length - 1 ? (
                                <button
                                  type="button"
                                  className="dp-iconBtn dp-iconBtn--ink"
                                  onClick={() => addSectionItem(sectionIndex)}
                                  disabled={!canAddPoint}
                                  aria-label="Add point"
                                >
                                  +
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {!passwordFromHandoff ? (
                <div className="dp-block" id="dp-section-account">
                  <span className="dp-blockBrow">— Confirm your password</span>
                  <label className="dp-field dp-field--full">
                    <span className="dp-label">Password <span className="dp-required">*</span></span>
                    <input
                      className="dp-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Re-enter the password you chose"
                    />
                  </label>
                </div>
              ) : null}

              <label className="dp-hiringToggle">
                <input type="checkbox" checked={wantHiring} onChange={(e) => setWantHiring(e.target.checked)} />
                <span className="dp-hiringToggle__indicator" aria-hidden="true" />
                <span className="dp-hiringToggle__label">I&rsquo;m also hiring &mdash; set up a company page and post jobs</span>
              </label>

              <div className="dp-actions">
                <button type="submit" className="btn btn--solidDark" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save profile'}
                </button>
                <Link to="/" className="btn btn--outlinedLight">Back to home</Link>
              </div>

              {saveError ? (
                <div className="dp-error" role="alert">{saveError}</div>
              ) : null}
            </form>
          </article>

          {/* ── Why this matters rail ── */}
          <aside className="dp-rail">
            <div className="dp-railProgress">
              <span className="dp-eyebrow">Progress · Fundamentals</span>
              <div className="dp-railProgress__bar" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
                <div className="dp-railProgress__fill" style={{ width: `${completionPct}%` }} />
              </div>
              <span className="dp-railProgress__count">{fundamentalsFilled} of {fundamentalsTotal} fields complete</span>
            </div>

            <span className="dp-eyebrow">Checklist</span>
            <p className="dp-rail__message">{railMessage}</p>
            <div className="dp-checklist">
              {sectionStatuses.map((section) => (
                <div key={section.id} className={`dp-checklist__item${section.complete ? ' dp-checklist__item--done' : ''}`}>
                  <span className="dp-checklist__icon">{section.complete ? '✓' : '·'}</span>
                  <span className="dp-checklist__label">{section.label}</span>
                  <span className="dp-checklist__detail">{section.detail}</span>
                </div>
              ))}
            </div>

            <span className="dp-eyebrow">Why this matters · Read first</span>
            <h2 className="dp-rail__title">
              Structured cards make swiping feel like <em>evaluation</em>, not guessing.
            </h2>
            <p className="dp-rail__sub">
              The composer mirrors the people-card model directly — every field travels into the
              deck, the preview pane, and the matched-thread context.
            </p>

            <div className="dp-rail__notes">
              <div className="dp-note">
                <span className="dp-eyebrow">— Note 01</span>
                <h3 className="dp-note__title">Readable at a glance.</h3>
                <p>Role, organization, location, intro — a sharp first impression without overload.</p>
              </div>
              <div className="dp-note">
                <span className="dp-eyebrow">— Note 02</span>
                <h3 className="dp-note__title">Context in layers.</h3>
                <p>Highlights and tags are scan-chips. Sections carry the proof beneath them.</p>
              </div>
              <div className="dp-note">
                <span className="dp-eyebrow">— Note 03</span>
                <h3 className="dp-note__title">Signal travels cleanly.</h3>
                <p>One-to-one mapping with the payload keeps your card structured everywhere it shows up.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
