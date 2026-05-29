import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, getAuthTokenFromCookies } from '../api'
import LoadingState from '../components/ui/LoadingState'
import PhotoEditor from '../components/ui/PhotoEditor'
import '../styles/profile.css'
import '../styles/profile-edit.css'

const SWATCHES = [
  'oklch(0.78 0.10 220)',
  'oklch(0.80 0.11 65)',
  'oklch(0.82 0.08 150)',
  'oklch(0.80 0.08 30)',
  'oklch(0.78 0.10 320)',
  'oklch(0.80 0.09 200)',
  'oklch(0.80 0.08 90)',
  'oklch(0.78 0.10 250)',
]

function swatchFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return SWATCHES[h % SWATCHES.length]
}

type ProfileData = {
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
  sections: Array<{
    title: string
    items: string[]
  }>
  workExperience: Array<{
    company: string
    role: string
    duration: string
    description: string
  }>
  projects: Array<{
    name: string
    url: string
    description: string
  }>
  photo: string
  resume: string
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

type HighlightEntry = {
  query: string
  selectedValue: string
  menuOpen: boolean
}

type SectionEntry = {
  title: string
  items: string[]
}

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

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [organization, setOrganization] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState(0)
  const [salary, setSalary] = useState(0)
  const [intro, setIntro] = useState('')

  const [showPhotoEditor, setShowPhotoEditor] = useState(false)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')

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

  const lastHighlight = highlightEntries[highlightEntries.length - 1]
  const canAddHighlight = lastHighlight.selectedValue.trim() !== ''
  const lastTag = tagEntries[tagEntries.length - 1]
  const canAddTag = lastTag.trim() !== ''
  const lastWork = workEntries[workEntries.length - 1]
  const canAddWork = lastWork.company.trim() !== ''
  const lastProject = projectEntries[projectEntries.length - 1]
  const canAddProject = lastProject.name.trim() !== ''

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

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const response = await apiRequest('/ProfileController/getProfile', { method: 'GET' })

        if (!response.ok) {
          setError('Failed to load profile')
          return
        }

        const data = (await response.json()) as Record<string, unknown>

        const profile: ProfileData = {
          id: String(data.id ?? ''),
          kind: String(data.kind ?? 'people'),
          headline: String(data.headline ?? ''),
          subheadline: String(data.subheadline ?? ''),
          organization: String(data.organization ?? ''),
          location: String(data.location ?? ''),
          experience: Number(data.experience ?? 0),
          salary: Number(data.salary ?? 0),
          intro: String(data.intro ?? ''),
          highlights: Array.isArray(data.highlights)
            ? data.highlights.filter((h): h is string => typeof h === 'string')
            : [],
          tags: Array.isArray(data.tags)
            ? data.tags.filter((t): t is string => typeof t === 'string')
            : [],
          sections: Array.isArray(data.sections)
            ? data.sections
                .map((s) => {
                  if (
                    typeof s === 'object' &&
                    s !== null &&
                    'title' in s &&
                    'items' in s &&
                    typeof (s as Record<string, unknown>).title === 'string' &&
                    Array.isArray((s as Record<string, unknown>).items)
                  ) {
                    return {
                      title: String((s as Record<string, unknown>).title),
                      items: ((s as Record<string, unknown>).items as unknown[])
                        .filter((i): i is string => typeof i === 'string')
                        .filter((i) => i.trim() !== ''),
                    }
                  }
                  return null
                })
                .filter(
                  (s): s is { title: string; items: string[] } =>
                    s !== null && s.title !== '' && s.items.length > 0,
                )
            : [],
          workExperience: Array.isArray(data.workExperience)
            ? data.workExperience
                .map((w) => {
                  if (typeof w === 'object' && w !== null) {
                    const work = w as Record<string, unknown>
                    return {
                      company: String(work.company ?? ''),
                      role: String(work.role ?? ''),
                      duration: String(work.duration ?? ''),
                      description: String(work.description ?? ''),
                    }
                  }
                  return null
                })
                .filter(
                  (w): w is { company: string; role: string; duration: string; description: string } =>
                    w !== null && w.company !== '',
                )
            : [],
          projects: Array.isArray(data.projects)
            ? data.projects
                .map((p) => {
                  if (typeof p === 'object' && p !== null) {
                    const project = p as Record<string, unknown>
                    return {
                      name: String(project.name ?? ''),
                      url: String(project.url ?? ''),
                      description: String(project.description ?? ''),
                    }
                  }
                  return null
                })
                .filter(
                  (p): p is { name: string; url: string; description: string } =>
                    p !== null && p.name !== '',
                )
            : [],
          photo: String(data.photo ?? ''),
          resume: String(data.resume ?? ''),
        }

        setHeadline(profile.headline)
        setSubheadline(profile.subheadline)
        setOrganization(profile.organization)
        setLocation(profile.location)
        setExperience(profile.experience)
        setSalary(profile.salary)
        setIntro(profile.intro)
        const storedPhoto = profile.photo || sessionStorage.getItem('denoisr-profile-photo') || ''
        setPhotoUrl(storedPhoto)
        if (storedPhoto) setPhotoPreviewUrl(storedPhoto)

        setHighlightEntries(
          profile.highlights.length > 0
            ? profile.highlights.map((h) => ({ query: h, selectedValue: h, menuOpen: false }))
            : [{ query: '', selectedValue: '', menuOpen: false }],
        )

        setTagEntries(profile.tags.length > 0 ? [...profile.tags] : [''])

        if (profile.sections.length > 0) {
          const merged = fixedSections.map((title) => {
            const existing = profile.sections.find((s) => s.title === title)
            return {
              title,
              items: existing && existing.items.length > 0 ? [...existing.items] : [''],
            }
          })
          setSections(merged)
        }

        setWorkEntries(
          profile.workExperience.length > 0
            ? profile.workExperience.map((w) => ({ ...w }))
            : [{ company: '', role: '', duration: '', description: '' }],
        )

        setProjectEntries(
          profile.projects.length > 0
            ? profile.projects.map((p) => ({ ...p }))
            : [{ name: '', url: '', description: '' }],
        )
      } catch {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

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
          sessionStorage.setItem('denoisr-profile-photo', data.url)
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')

    const payload = {
      headline: headline.trim(),
      subheadline: subheadline.trim(),
      organization: organization.trim(),
      location: location.trim(),
      experience,
      salary,
      intro: intro.trim(),
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
      photo: photoUrl,
    }

    try {
      const response = await apiRequest('/ProfileController/updateProfile', {
        method: 'POST',
        body: payload,
      })

      if (!response.ok) {
        setSaveError('Failed to save profile.')
        return
      }

      navigate('/profile')
    } catch {
      setSaveError('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <LoadingState
        className="pe-loading"
        label="Loading profile"
        detail="Preparing your profile editor."
      />
    )
  }

  if (error) {
    return (
      <div className="pe-error">
        <span className="pr-eyebrow">Error</span>
        <p>{error}</p>
        <button type="button" className="btn btn--solidDark" onClick={() => navigate('/profile')}>
          Back to profile
        </button>
      </div>
    )
  }

  const avatarSwatch = swatchFor(headline || 'U')
  const avatarBg = photoPreviewUrl ? `url(${photoPreviewUrl}) center/cover` : avatarSwatch

  return (
    <div className="pe">
      {/* ── Mobile hero ── */}
      <header className="pr-hero pr-hero--mobile">
        <div className="pr-hero__wash" aria-hidden="true" />
        <div className="pr-hero__inner">
          <div className="pr-avatarWrap">
            <div
              className={`pr-avatar ${photoPreviewUrl ? 'pr-avatar--photo' : 'pr-avatar--upload'}`}
              style={{ background: avatarBg, cursor: 'pointer' }}
              onClick={() => setShowPhotoEditor(true)}
            >
              {photoPreviewUrl ? null : (
                <>
                  <span className="pr-avatar__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </span>
                  <span className="pr-avatar__label">Upload photo</span>
                </>
              )}
            </div>
          </div>

          <div className="pe-field">
            <label className="pe-label">Name</label>
            <input className="pe-input" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={80} placeholder="Your name" />
          </div>

          <div className="pe-field">
            <label className="pe-label">Current role</label>
            <input className="pe-input" type="text" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} maxLength={80} placeholder="Product Designer" />
          </div>

          <div className="pe-field">
            <label className="pe-label">Organization</label>
            <input className="pe-input" type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={80} placeholder="Zinfi" />
          </div>

          <div className="pe-field">
            <label className="pe-label">Location</label>
            <input className="pe-input" type="text" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} placeholder="Madrid, Spain" />
          </div>

          <div className="pe-row2">
            <div className="pe-field">
              <label className="pe-label">Experience (yrs)</label>
              <input className="pe-input" type="number" value={experience} onChange={(e) => setExperience(Number(e.target.value))} min={0} max={40} placeholder="6" />
            </div>
            <div className="pe-field">
              <label className="pe-label">Target comp ($k)</label>
              <input className="pe-input" type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} min={0} max={1000} placeholder="92" />
            </div>
          </div>

          <div className="pe-field">
            <label className="pe-label">Intro</label>
            <textarea className="pe-input pe-textarea" value={intro} onChange={(e) => setIntro(e.target.value)} maxLength={280} rows={3} placeholder="Tell people what you do…" />
          </div>
        </div>
      </header>

      {/* ── 3-column desktop shell ── */}
      <div className="pr-shell">
        {/* ── Left column ── */}
        <aside className="pr-col pr-col--left">
          <div className="pr-col__card pr-col__card--identity">
            <div className="pr-avatarWrap">
            <div
              className={`pr-avatar pr-avatar--desktop ${photoPreviewUrl ? 'pr-avatar--photo' : 'pr-avatar--upload'}`}
              style={{ background: avatarBg, cursor: 'pointer' }}
              onClick={() => setShowPhotoEditor(true)}
            >
              {photoPreviewUrl ? null : (
                <>
                  <span className="pr-avatar__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </span>
                  <span className="pr-avatar__label">Upload photo</span>
                </>
              )}
            </div>
            </div>

            <div className="pe-field">
              <label className="pe-label">Name</label>
              <input className="pe-input" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={80} placeholder="Your name" />
            </div>

            <div className="pe-field">
              <label className="pe-label">Current role</label>
              <input className="pe-input" type="text" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} maxLength={80} placeholder="Product Designer" />
            </div>

            <div className="pe-field">
              <label className="pe-label">Organization</label>
              <input className="pe-input" type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={80} placeholder="Zinfi" />
            </div>

            <div className="pe-field">
              <label className="pe-label">Location</label>
              <input className="pe-input" type="text" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} placeholder="Madrid, Spain" />
            </div>

            <div className="pe-row2">
              <div className="pe-field">
                <label className="pe-label">Experience (yrs)</label>
                <input className="pe-input" type="number" value={experience} onChange={(e) => setExperience(Number(e.target.value))} min={0} max={40} placeholder="6" />
              </div>
              <div className="pe-field">
                <label className="pe-label">Target comp ($k)</label>
                <input className="pe-input" type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} min={0} max={1000} placeholder="92" />
              </div>
            </div>
          </div>

          <div className="pr-col__card">
            <span className="pr-eyebrow">Resume</span>
            <div className="pr-resume">
              <div className="pr-resume__placeholder">
                <span className="pr-resume__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <span className="pr-resume__text">Upload your resume</span>
                <span className="pr-resume__hint">Coming soon</span>
              </div>
            </div>
          </div>

          {/* ── Highlights (desktop) ── */}
          <div className="pr-col__card">
            <span className="pr-eyebrow">Highlights</span>
            <p className="pe-hint">Crisp capability labels. Pick from the suggestions or type your own.</p>

            {highlightEntries.map((entry, index) => {
              const matching = matchingHighlightsByIndex[index]
              const rowId = `pe-hl-${index}`
              const isLast = index === highlightEntries.length - 1
              return (
                <div className="pe-row" key={`hl-${index}`}>
                  <div className="pe-field pe-field--grow">
                    <span className="pe-label">Highlight {String(index + 1).padStart(2, '0')}</span>
                    <input
                      className="pe-input"
                      type="search"
                      value={entry.query}
                      onChange={(e) => handleHighlightChange(index, e.target.value)}
                      onFocus={() => handleHighlightFocus(index)}
                      onBlur={() => handleHighlightBlur(index)}
                      placeholder="Search a highlight"
                      autoComplete="off"
                      aria-expanded={entry.menuOpen && matching.length > 0}
                      aria-controls={rowId}
                    />
                    <input
                      className="pe-hidden"
                      type="text"
                      value={entry.selectedValue}
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    {entry.menuOpen && matching.length > 0 ? (
                      <div className="pe-suggest" id={rowId}>
                        {matching.map((item) => (
                          <button
                            key={`${item}-${index}`}
                            type="button"
                            className="pe-suggest__opt"
                            onClick={() => selectHighlight(index, item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="pe-rowActions">
                    <button type="button" className="pe-iconBtn" onClick={() => removeHighlightRow(index)} aria-label={`Remove highlight ${index + 1}`}>
                      −
                    </button>
                    {isLast ? (
                      <button type="button" className="pe-iconBtn pe-iconBtn--ink" onClick={addHighlightRow} disabled={!canAddHighlight} aria-label="Add highlight">
                        +
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Tags (desktop) ── */}
          <div className="pr-col__card">
            <span className="pr-eyebrow">Tags</span>
            <p className="pe-hint">Short contextual chips — work mode, openness, preferences.</p>

            {tagEntries.map((entry, index) => {
              const isLast = index === tagEntries.length - 1
              return (
                <div className="pe-row" key={`tag-${index}`}>
                  <div className="pe-field pe-field--grow">
                    <span className="pe-label">Tag {String(index + 1).padStart(2, '0')}</span>
                    <input
                      className="pe-input"
                      type="text"
                      value={entry}
                      onChange={(e) => updateTag(index, e.target.value)}
                      maxLength={40}
                      placeholder="Hybrid"
                    />
                  </div>

                  <div className="pe-rowActions">
                    <button type="button" className="pe-iconBtn" onClick={() => removeTag(index)} aria-label={`Remove tag ${index + 1}`}>
                      −
                    </button>
                    {isLast ? (
                      <button type="button" className="pe-iconBtn pe-iconBtn--ink" onClick={addTag} disabled={!canAddTag} aria-label="Add tag">
                        +
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── Center column ── */}
        <section className="pr-col pr-col--center">
          <form className="pe-form" onSubmit={handleSubmit}>
            <div className="pr-col__card">
              <span className="pr-eyebrow">About</span>
              <textarea
                className="pe-input pe-textarea"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                maxLength={280}
                rows={4}
                placeholder="Designs interfaces that remove clutter and help users evaluate choices with confidence instead of guesswork."
              />
            </div>

            {/* ── Work Experience with + / − ── */}
            <div className="pr-col__card">
              <span className="pr-eyebrow">Work experience</span>

              {workEntries.map((entry, index) => {
                const isLast = index === workEntries.length - 1
                return (
                  <div className="pe-subblock" key={`work-${index}`}>
                    <div className="pe-subblock__head">
                      <span className="pe-label">Experience {String(index + 1).padStart(2, '0')}</span>
                    </div>

                    <div className="pe-field">
                      <span className="pe-label">Company</span>
                      <input className="pe-input" type="text" value={entry.company} onChange={(e) => updateWorkEntry(index, 'company', e.target.value)} maxLength={80} placeholder="Company name" />
                    </div>

                    <div className="pe-row2">
                      <div className="pe-field">
                        <span className="pe-label">Role</span>
                        <input className="pe-input" type="text" value={entry.role} onChange={(e) => updateWorkEntry(index, 'role', e.target.value)} maxLength={80} placeholder="Product Designer" />
                      </div>
                      <div className="pe-field">
                        <span className="pe-label">Duration</span>
                        <input className="pe-input" type="text" value={entry.duration} onChange={(e) => updateWorkEntry(index, 'duration', e.target.value)} maxLength={40} placeholder="Jan 2022 — Present" />
                      </div>
                    </div>

                    <div className="pe-field">
                      <span className="pe-label">Description</span>
                      <textarea className="pe-input pe-textarea pe-textarea--sm" value={entry.description} onChange={(e) => updateWorkEntry(index, 'description', e.target.value)} maxLength={500} rows={2} placeholder="Describe your responsibilities and achievements." />
                    </div>

                    <div className="pe-subblock__actions">
                      <button type="button" className="pe-iconBtn pe-iconBtn--sm" onClick={() => removeWorkEntry(index)} aria-label={`Remove work experience ${index + 1}`}>
                        − Remove
                      </button>
                      {isLast ? (
                        <button type="button" className="pe-iconBtn pe-iconBtn--ink pe-iconBtn--sm" onClick={addWorkEntry} disabled={!canAddWork} aria-label="Add work experience">
                          + Add
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Projects with + / − ── */}
            <div className="pr-col__card">
              <span className="pr-eyebrow">Projects</span>

              {projectEntries.map((entry, index) => {
                const isLast = index === projectEntries.length - 1
                return (
                  <div className="pe-subblock" key={`proj-${index}`}>
                    <div className="pe-subblock__head">
                      <span className="pe-label">Project {String(index + 1).padStart(2, '0')}</span>
                    </div>

                    <div className="pe-field">
                      <span className="pe-label">Name</span>
                      <input className="pe-input" type="text" value={entry.name} onChange={(e) => updateProjectEntry(index, 'name', e.target.value)} maxLength={80} placeholder="Project name" />
                    </div>

                    <div className="pe-field">
                      <span className="pe-label">URL</span>
                      <input className="pe-input" type="url" value={entry.url} onChange={(e) => updateProjectEntry(index, 'url', e.target.value)} maxLength={200} placeholder="https://github.com/username/project" />
                    </div>

                    <div className="pe-field">
                      <span className="pe-label">Description</span>
                      <textarea className="pe-input pe-textarea pe-textarea--sm" value={entry.description} onChange={(e) => updateProjectEntry(index, 'description', e.target.value)} maxLength={500} rows={2} placeholder="Describe your project." />
                    </div>

                    <div className="pe-subblock__actions">
                      <button type="button" className="pe-iconBtn pe-iconBtn--sm" onClick={() => removeProjectEntry(index)} aria-label={`Remove project ${index + 1}`}>
                        − Remove
                      </button>
                      {isLast ? (
                        <button type="button" className="pe-iconBtn pe-iconBtn--ink pe-iconBtn--sm" onClick={addProjectEntry} disabled={!canAddProject} aria-label="Add project">
                          + Add
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Save (desktop) ── */}
            <div className="pe-actions pe-actions--desktop">
              <button type="submit" className="btn btn--solidDark" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn btn--outlinedLight" onClick={() => navigate('/profile')}>
                Cancel
              </button>
            </div>

            {saveError ? (
              <div className="pe-saveError" role="alert">{saveError}</div>
            ) : null}
          </form>
        </section>

        {/* ── Right column ── */}
        <aside className="pr-col pr-col--right">
          {/* ── Sections with + / − ── */}
          {sections.map((section, sectionIndex) => {
            const canAddPoint = section.items[section.items.length - 1].trim() !== ''
            return (
              <div className="pr-col__card" key={`sec-${sectionIndex}`}>
                <span className="pr-eyebrow">{section.title}</span>

                <div className="pe-sectionItems">
                  {section.items.map((item, itemIndex) => (
                    <div className="pe-row pe-row--compact" key={`sec-${sectionIndex}-${itemIndex}`}>
                      <div className="pe-field pe-field--grow">
                        <span className="pe-label">Point {String(itemIndex + 1).padStart(2, '0')}</span>
                        <textarea
                          className="pe-input pe-textarea pe-textarea--sm"
                          value={item}
                          onChange={(e) => updateSectionItem(sectionIndex, itemIndex, e.target.value)}
                          maxLength={220}
                          rows={2}
                          placeholder="Defined information architecture for a multi-panel procurement tool."
                        />
                      </div>

                      <div className="pe-rowActions pe-rowActions--compact">
                        <button type="button" className="pe-iconBtn pe-iconBtn--xs" onClick={() => removeSectionItem(sectionIndex, itemIndex)} aria-label={`Remove point ${itemIndex + 1}`}>
                          −
                        </button>
                        {itemIndex === section.items.length - 1 ? (
                          <button type="button" className="pe-iconBtn pe-iconBtn--ink pe-iconBtn--xs" onClick={() => addSectionItem(sectionIndex)} disabled={!canAddPoint} aria-label="Add point">
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
        </aside>
      </div>

      {showPhotoEditor ? (
        <PhotoEditor onSave={handlePhotoSave} onCancel={handlePhotoCancel} />
      ) : null}
    </div>
  )
}
