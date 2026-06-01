import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { storeAuthTokenFromResponse } from '../auth'
import '../styles/dashboard.css'

const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)
    const storedCredentials = sessionStorage.getItem(SIGNUP_CREDENTIALS_KEY)
    const parsedCredentials = storedCredentials
      ? (JSON.parse(storedCredentials) as { email?: string; password?: string })
      : {}

    const payload = {
      email: parsedCredentials.email?.trim() ?? '',
      password: parsedCredentials.password ?? '',
      phoneNumber: String(formData.get('phoneNumber') ?? '').trim(),
      kind: 'people',
      name: String(formData.get('name') ?? '').trim(),
      currentRole: String(formData.get('currentRole') ?? '').trim(),
      organization: String(formData.get('organization') ?? '').trim(),
      location: String(formData.get('location') ?? '').trim(),
      experience: Number(formData.get('experience') ?? 0),
      salary: Number(formData.get('salary') ?? 0),
      intro: String(formData.get('intro') ?? '').trim(),
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

      await storeAuthTokenFromResponse(response)
      sessionStorage.removeItem(SIGNUP_CREDENTIALS_KEY)
      navigate('/home')
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
            <li><span className="dp-stepline__num">01</span> Profile fundamentals</li>
            <li><span className="dp-stepline__num">02</span> Highlights and tags</li>
            <li><span className="dp-stepline__num">03</span> Work experience</li>
            <li><span className="dp-stepline__num">04</span> Projects</li>
            <li><span className="dp-stepline__num">05</span> Proof and intent</li>
          </ol>
        </div>
      </section>

      {/* ── Composer ── */}
      <section className="dp-section">
        <div className="dp-grid">
          <article className="dp-card dp-composer">
            <header className="dp-card__head">
              <span className="dp-eyebrow">Composer · People payload</span>
              <h2 className="dp-card__title">Build the card someone would actually open.</h2>
              <p className="dp-card__sub">
                Every field maps directly to the people-card model. Keep it specific, concise,
                proof-oriented.
              </p>
            </header>

            <form className="dp-form" onSubmit={handleSubmit}>
              {/* Fundamentals */}
              <div className="dp-block">
                <span className="dp-blockBrow">— 01 Fundamentals</span>

                <div className="dp-grid2">
                  <label className="dp-field">
                    <span className="dp-label">Name</span>
                    <input className="dp-input" type="text" name="name" required minLength={2} maxLength={80} placeholder="Mateo Ruiz" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Phone</span>
                    <input className="dp-input" type="tel" name="phoneNumber" required pattern="^\+?[0-9()\-\s]{6,20}$" placeholder="+34 600 000 000" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Current role</span>
                    <input className="dp-input" type="text" name="currentRole" required minLength={2} maxLength={80} placeholder="Product Designer" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Organization</span>
                    <input className="dp-input" type="text" name="organization" required minLength={2} maxLength={80} placeholder="Zinfi" />
                  </label>

                  <label className="dp-field dp-field--full">
                    <span className="dp-label">Location</span>
                    <input className="dp-input" type="text" name="location" required minLength={2} maxLength={80} placeholder="Madrid, Spain" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Experience (years)</span>
                    <input className="dp-input" type="number" name="experience" required min={0} max={40} step={1} placeholder="6" />
                  </label>

                  <label className="dp-field">
                    <span className="dp-label">Target comp ($k)</span>
                    <input className="dp-input" type="number" name="salary" required min={0} max={1000} step={1} placeholder="92" />
                  </label>

                  <label className="dp-field dp-field--full">
                    <span className="dp-label">Intro</span>
                    <textarea
                      className="dp-input dp-textarea"
                      name="intro"
                      required
                      minLength={40}
                      maxLength={280}
                      placeholder="Designs interfaces that remove clutter and help users evaluate choices with confidence instead of guesswork."
                    />
                  </label>
                </div>
              </div>

              {/* Highlights */}
              <div className="dp-block">
                <span className="dp-blockBrow">— 02 Highlights</span>
                <p className="dp-blockHint">Crisp capability labels. Pick from the suggestions or type your own.</p>

                {highlightEntries.map((entry, index) => {
                  const matching = matchingHighlightsByIndex[index]
                  const rowId = `dp-hl-${index}`
                  const isLast = index === highlightEntries.length - 1
                  return (
                    <div className="dp-row" key={`hl-${index}`}>
                      <label className="dp-field dp-field--grow">
                        <span className="dp-label">Highlight {String(index + 1).padStart(2, '0')}</span>
                        <input
                          className="dp-input"
                          type="search"
                          value={entry.query}
                          onChange={(e) => handleHighlightChange(index, e.target.value)}
                          onFocus={() => handleHighlightFocus(index)}
                          onBlur={() => handleHighlightBlur(index)}
                          placeholder="Search a highlight"
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
                          aria-label={`Remove highlight ${index + 1}`}
                        >
                          −
                        </button>
                        {isLast ? (
                          <button
                            type="button"
                            className="dp-iconBtn dp-iconBtn--ink"
                            onClick={addHighlightRow}
                            disabled={!canAddHighlight}
                            aria-label="Add highlight"
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
              <div className="dp-block">
                <span className="dp-blockBrow">— 03 Tags</span>
                <p className="dp-blockHint">Short contextual chips — work mode, openness, preferences.</p>

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
                          placeholder="Hybrid"
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
              <div className="dp-block">
                <span className="dp-blockBrow">— 04 Work experience</span>
                <p className="dp-blockHint">Where you have done the work. Add at least one entry.</p>

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
              </div>

              {/* Projects */}
              <div className="dp-block">
                <span className="dp-blockBrow">— 05 Projects</span>
                <p className="dp-blockHint">Side work, open-source, or standout deliverables.</p>

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
              </div>

              {/* Sections */}
              <div className="dp-block">
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
