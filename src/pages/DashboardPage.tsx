import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { storeAuthTokenFromResponse } from '../auth'
import Button from '../components/ui/Button'

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
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const lastHighlight = highlightEntries[highlightEntries.length - 1]
  const canAddHighlight = lastHighlight.selectedValue.trim() !== ''
  const lastTag = tagEntries[tagEntries.length - 1]
  const canAddTag = lastTag.trim() !== ''
  const matchingHighlightsByIndex = useMemo(
    () =>
      highlightEntries.map(({ query }) => {
        const normalizedQuery = query.trim().toLowerCase()

        if (!normalizedQuery) {
          return []
        }

        return highlightSuggestions
          .filter((item) => item.toLowerCase().includes(normalizedQuery))
          .slice(0, 6)
      }),
    [highlightEntries],
  )

  function updateHighlightEntry(index: number, updater: (entry: HighlightEntry) => HighlightEntry) {
    setHighlightEntries((currentEntries) =>
      currentEntries.map((entry, entryIndex) =>
        entryIndex === index ? updater(entry) : entry,
      ),
    )
  }

  function handleHighlightChange(index: number, value: string) {
    updateHighlightEntry(index, (entry) => {
      const exactMatch = highlightSuggestions.find(
        (item) => item.toLowerCase() === value.trim().toLowerCase(),
      )

      return {
        ...entry,
        query: value,
        selectedValue: exactMatch ?? '',
        menuOpen: true,
      }
    })
  }

  function handleHighlightFocus(index: number) {
    updateHighlightEntry(index, (entry) => ({
      ...entry,
      menuOpen: true,
    }))
  }

  function handleHighlightBlur(index: number) {
    window.setTimeout(() => {
      updateHighlightEntry(index, (entry) => ({
        ...entry,
        menuOpen: false,
      }))
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
    if (!canAddHighlight) {
      return
    }

    setHighlightEntries((currentEntries) => [
      ...currentEntries,
      { query: '', selectedValue: '', menuOpen: false },
    ])
  }

  function removeHighlightRow(index: number) {
    setHighlightEntries((currentEntries) =>
      currentEntries.length === 1
        ? [{ query: '', selectedValue: '', menuOpen: false }]
        : currentEntries.filter((_, entryIndex) => entryIndex !== index),
    )
  }

  function updateTag(index: number, value: string) {
    setTagEntries((currentEntries) =>
      currentEntries.map((entry, entryIndex) => (entryIndex === index ? value : entry)),
    )
  }

  function addTag() {
    if (!canAddTag) {
      return
    }

    setTagEntries((currentEntries) => [...currentEntries, ''])
  }

  function removeTag(index: number) {
    setTagEntries((currentEntries) =>
      currentEntries.length === 1 ? [''] : currentEntries.filter((_, entryIndex) => entryIndex !== index),
    )
  }

  function updateSectionItem(sectionIndex: number, itemIndex: number, value: string) {
    setSections((currentSections) =>
      currentSections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              items: section.items.map((item, currentItemIndex) =>
                currentItemIndex === itemIndex ? value : item,
              ),
            }
          : section,
      ),
    )
  }

  function addSectionItem(sectionIndex: number) {
    setSections((currentSections) =>
      currentSections.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) {
          return section
        }

        const lastItem = section.items[section.items.length - 1]
        if (lastItem.trim() === '') {
          return section
        }

        return {
          ...section,
          items: [...section.items, ''],
        }
      }),
    )
  }

  function removeSectionItem(sectionIndex: number, itemIndex: number) {
    setSections((currentSections) =>
      currentSections.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) {
          return section
        }

        return {
          ...section,
          items:
            section.items.length === 1
              ? ['']
              : section.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex),
        }
      }),
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
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const response = await apiRequest('/LoginController/signup', {
        method: 'POST',
        body: payload,
      })

      if (!response.ok) {
        setSaveError('Saving profile failed')
        return
      }

      await storeAuthTokenFromResponse(response)
      sessionStorage.removeItem(SIGNUP_CREDENTIALS_KEY)
      navigate('/home')
    } catch {
      setSaveError('Saving profile failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dashboardPage denoisr">
      <section className="dashboardIntro">
        <div className="dashboardGlow dashboardGlow--pink" aria-hidden="true" />
        <div className="dashboardGlow dashboardGlow--lavender" aria-hidden="true" />

        <div className="container dashboardIntro__inner">
          <div className="dashboardIntro__copy">
            <div className="sectionLabel sectionLabel--mono">PEOPLE PROFILE</div>
            <h1 className="dashboardTitle">Compose a profile that reads like signal, not a resume dump.</h1>
            <p className="dashboardSub">
              Denoisr works when your story is compact, credible, and easy to evaluate.
              Structure your profile like a sharp card someone would want to keep swiping on.
            </p>
          </div>

          <div className="dashboardStats" aria-label="Profile setup highlights">
            <div className="miniStat">
              <div className="miniStat__value">3</div>
              <div className="miniStat__label">Signal blocks: profile, tags, sections</div>
            </div>
            <div className="miniStat">
              <div className="miniStat__value">2</div>
              <div className="miniStat__label">Proof-first sections for fit and work</div>
            </div>
            <div className="miniStat">
              <div className="miniStat__value">0</div>
              <div className="miniStat__label">Generic buzzwords without evidence</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--light dashboardSection">
        <div className="container dashboardLayout">
          <div className="card dashboardFormCard">
            <div className="dashboardCardTop">
              <div>
                <div className="sectionLabel sectionLabel--mono">PROFILE COMPOSER</div>
                <h2 className="sectionTitle">Build the card recruiters should actually open.</h2>
                <p className="sectionSub dashboardSectionSub">
                  Every field below maps directly into the people profile payload. Keep it specific,
                  concise, and proof-oriented.
                </p>
              </div>
              <div className="dashboardBadge">People mode payload</div>
            </div>

            <form className="dashboardForm" onSubmit={handleSubmit}>
              <div className="dashboardGrid">
                <label className="field">
                  <span className="field__label">Name (*)</span>
                  <input className="field__input" type="text" name="name" required minLength={2} maxLength={80} placeholder="Mateo Ruiz" />
                </label>

                <label className="field">
                  <span className="field__label">Phone Number (*)</span>
                  <input className="field__input" type="tel" name="phoneNumber" required pattern="^\+?[0-9()\-\s]{6,20}$" placeholder="798787" />
                </label>

                <label className="field">
                  <span className="field__label">Current Role (*)</span>
                  <input className="field__input" type="text" name="currentRole" required minLength={2} maxLength={80} placeholder="Product Designer" />
                </label>

                <label className="field">
                  <span className="field__label">Organization (*)</span>
                  <input className="field__input" type="text" name="organization" required minLength={2} maxLength={80} placeholder="zinfi" />
                </label>

                <label className="field field--full">
                  <span className="field__label">Location (*)</span>
                  <input className="field__input" type="text" name="location" required minLength={2} maxLength={80} placeholder="Madrid, Spain" />
                </label>

                <label className="field">
                  <span className="field__label">Experience (*)</span>
                  <input className="field__input" type="number" name="experience" required min={0} max={40} step={1} placeholder="6" />
                </label>

                <label className="field">
                  <span className="field__label">Salary (*)</span>
                  <input className="field__input" type="number" name="salary" required min={0} max={1000} step={1} placeholder="92" />
                </label>

                <label className="field field--full">
                  <span className="field__label">Intro (*)</span>
                  <textarea className="field__input dashboardTextarea" name="intro" required minLength={40} maxLength={280} placeholder="Designs interfaces that remove clutter and help users evaluate choices with confidence instead of guesswork." />
                </label>
              </div>

              <div className="dashboardBlock">
                <div className="dashboardBlock__head">
                  <div>
                    <div className="field__label">Highlights (*)</div>
                    <p className="dashboardSkillsHint">
                      Search and pick crisp capability labels.
                    </p>
                  </div>
                </div>

                {highlightEntries.map((entry, index) => {
                  const matchingHighlights = matchingHighlightsByIndex[index]
                  const rowId = `highlight-suggestions-${index}`
                  const isLastRow = index === highlightEntries.length - 1

                  return (
                    <div className="dashboardSkillRow dashboardSkillRow--compact" key={`highlight-row-${index}`}>
                      <div className="dashboardSkillField">
                        <label className="field dashboardSkillSearch">
                          <span className="field__label">Highlight {index + 1} (*)</span>
                          <input
                            className="field__input"
                            type="search"
                            value={entry.query}
                            onChange={(e) => handleHighlightChange(index, e.target.value)}
                            onFocus={() => handleHighlightFocus(index)}
                            onBlur={() => handleHighlightBlur(index)}
                            placeholder="Search a highlight"
                            autoComplete="off"
                            aria-expanded={entry.menuOpen && matchingHighlights.length > 0}
                            aria-controls={rowId}
                            required
                          />
                          <input className="dashboardHiddenInput" type="text" value={entry.selectedValue} readOnly tabIndex={-1} aria-hidden="true" />
                          {entry.menuOpen && matchingHighlights.length > 0 ? (
                            <div className="dashboardSkillDropdown" id={rowId}>
                              {matchingHighlights.map((item) => (
                                <button key={`${item}-${index}`} type="button" className="dashboardSkillOption" onClick={() => selectHighlight(index, item)}>
                                  {item}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </label>
                      </div>

                      <div className="dashboardInlineActions">
                        <button type="button" className="dashboardIconBtn" onClick={() => removeHighlightRow(index)} aria-label={`Remove highlight ${index + 1}`}>
                          -
                        </button>
                        {isLastRow ? (
                          <button type="button" className="dashboardIconBtn dashboardIconBtn--dark" onClick={addHighlightRow} disabled={!canAddHighlight} aria-label="Add highlight">
                            +
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="dashboardBlock">
                <div className="dashboardBlock__head">
                  <div>
                    <div className="field__label">Tags (*)</div>
                    <p className="dashboardSkillsHint">
                      Short contextual chips like work mode, openness, or preference.
                    </p>
                  </div>
                </div>

                {tagEntries.map((entry, index) => {
                  const isLastRow = index === tagEntries.length - 1

                  return (
                    <div className="dashboardSkillRow dashboardSkillRow--compact" key={`tag-row-${index}`}>
                      <label className="field">
                        <span className="field__label">Tag {index + 1} (*)</span>
                        <input className="field__input" type="text" value={entry} onChange={(e) => updateTag(index, e.target.value)} required maxLength={40} placeholder="Hybrid" />
                      </label>

                      <div className="dashboardInlineActions">
                        <button type="button" className="dashboardIconBtn" onClick={() => removeTag(index)} aria-label={`Remove tag ${index + 1}`}>
                          -
                        </button>
                        {isLastRow ? (
                          <button type="button" className="dashboardIconBtn dashboardIconBtn--dark" onClick={addTag} disabled={!canAddTag} aria-label="Add tag">
                            +
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="dashboardBlock">
                <div className="dashboardBlock__head">
                  <div>
                    <div className="field__label">Sections (*)</div>
                    <p className="dashboardSkillsHint">
                      Build narrative blocks like proof of work and intent. Each block contains a title and bullet points.
                    </p>
                  </div>
                </div>

                {sections.map((section, sectionIndex) => {
                  const canAddPoint = section.items[section.items.length - 1].trim() !== ''

                  return (
                    <div className="dashboardSectionCard" key={`section-${sectionIndex}`}>
                      <div className="dashboardSectionCard__head">
                        <div className="dashboardSectionHeading">
                          <div className="field__label">Section {sectionIndex + 1}</div>
                          <h3 className="dashboardSectionTitle">{fixedSections[sectionIndex]}</h3>
                        </div>
                      </div>

                      <div className="dashboardSectionItems">
                        {section.items.map((item, itemIndex) => (
                          <div className="dashboardSkillRow dashboardSkillRow--compact" key={`section-${sectionIndex}-item-${itemIndex}`}>
                            <label className="field field--full">
                              <span className="field__label">Point {itemIndex + 1} (*)</span>
                              <textarea className="field__input dashboardTextarea dashboardTextarea--sm" value={item} onChange={(e) => updateSectionItem(sectionIndex, itemIndex, e.target.value)} required minLength={8} maxLength={220} placeholder="Defined information architecture for a multi-panel procurement tool." />
                            </label>

                            <div className="dashboardInlineActions">
                              <button type="button" className="dashboardIconBtn" onClick={() => removeSectionItem(sectionIndex, itemIndex)} aria-label={`Remove point ${itemIndex + 1}`}>
                                -
                              </button>
                              {itemIndex === section.items.length - 1 ? (
                                <button type="button" className="dashboardIconBtn dashboardIconBtn--dark" onClick={() => addSectionItem(sectionIndex)} disabled={!canAddPoint} aria-label="Add point">
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

              <div className="dashboardActions">
                <button type="submit" className="btn btn--solidDark">
                  {isSaving ? 'Saving profile...' : 'Save profile signal'}
                </button>
                <Button to="/" variant="outlinedLight">
                  Back to home
                </Button>
              </div>

              {saveError ? (
                <div className="dashboardError" role="alert">
                  {saveError}
                </div>
              ) : null}
            </form>
          </div>

          <aside className="dashboardRail section--dark">
            <div className="sectionLabel sectionLabel--light">WHY THIS MATTERS</div>
            <h2 className="sectionTitle sectionTitle--light dashboardRailTitle">
              Structured profiles make swiping feel like evaluation, not guessing.
            </h2>
            <p className="sectionSub dashboardRailSub">
              This screen mirrors the people-card model directly: headline, context, highlights,
              and proof blocks that travel cleanly into matching and preview surfaces.
            </p>

            <div className="dashboardRailCards">
              <div className="darkCard">
                <div className="darkCard__title">Readable at a glance</div>
                <p className="darkCard__description">
                  Role, organization, location, and intro create a sharp first impression without overloading the card.
                </p>
              </div>
              <div className="darkCard">
                <div className="darkCard__title">Context in layers</div>
                <p className="darkCard__description">
                  Highlights and tags act as quick scan chips, while sections carry the proof underneath.
                </p>
              </div>
              <div className="darkCard">
                <div className="darkCard__title">Signal travels cleanly</div>
                <p className="darkCard__description">
                  Because the form maps one-to-one with the payload, the resulting profile stays structured across the app.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
