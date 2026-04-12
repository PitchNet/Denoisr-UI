import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { storeAuthTokenFromResponse } from '../auth'
import Button from '../components/ui/Button'

const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'

type SkillEntry = {
  query: string
  selectedSkill: string
  proficiency: string
  menuOpen: boolean
}

const countries = [
  'Australia',
  'Canada',
  'France',
  'Germany',
  'India',
  'Japan',
  'Netherlands',
  'Singapore',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
]

const skills = [
  'Backend Engineering',
  'Data Analysis',
  'Data Engineering',
  'Design Systems',
  'DevOps',
  'Frontend Engineering',
  'Machine Learning',
  'Mobile Development',
  'Product Design',
  'Product Management',
  'Python',
  'React',
  'Recruiting Operations',
  'Talent Sourcing',
  'TypeScript',
  'UX Research',
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [skillEntries, setSkillEntries] = useState<SkillEntry[]>([
    {
      query: '',
      selectedSkill: '',
      proficiency: '',
      menuOpen: false,
    },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const lastSkillEntry = skillEntries[skillEntries.length - 1]
  const canAddSkillRow =
    lastSkillEntry.selectedSkill.trim() !== '' && lastSkillEntry.proficiency.trim() !== ''

  const matchingSkillsByIndex = useMemo(
    () =>
      skillEntries.map(({ query }) => {
        const normalizedQuery = query.trim().toLowerCase()

        if (!normalizedQuery) {
          return []
        }

        return skills
          .filter((skill) => skill.toLowerCase().includes(normalizedQuery))
          .slice(0, 6)
      }),
    [skillEntries],
  )

  function updateSkillEntry(index: number, updater: (entry: SkillEntry) => SkillEntry) {
    setSkillEntries((currentEntries) =>
      currentEntries.map((entry, entryIndex) =>
        entryIndex === index ? updater(entry) : entry,
      ),
    )
  }

  function handleSkillChange(index: number, value: string) {
    updateSkillEntry(index, (entry) => {
      const exactMatch = skills.find(
        (skill) => skill.toLowerCase() === value.trim().toLowerCase(),
      )

      return {
        ...entry,
        query: value,
        selectedSkill: exactMatch ?? '',
        menuOpen: true,
      }
    })
  }

  function handleSkillFocus(index: number) {
    updateSkillEntry(index, (entry) => ({
      ...entry,
      menuOpen: true,
    }))
  }

  function handleSkillBlur(index: number) {
    window.setTimeout(() => {
      updateSkillEntry(index, (entry) => ({
        ...entry,
        menuOpen: false,
      }))
    }, 120)
  }

  function handleProficiencyChange(index: number, value: string) {
    updateSkillEntry(index, (entry) => ({
      ...entry,
      proficiency: value,
    }))
  }

  function selectSkill(index: number, skill: string) {
    updateSkillEntry(index, (entry) => ({
      ...entry,
      query: skill,
      selectedSkill: skill,
      menuOpen: false,
    }))
  }

  function addSkillRow() {
    if (!canAddSkillRow) {
      return
    }

    setSkillEntries((currentEntries) => [
      ...currentEntries,
      {
        query: '',
        selectedSkill: '',
        proficiency: '',
        menuOpen: false,
      },
    ])
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
    const storedCredentials = sessionStorage.getItem(SIGNUP_CREDENTIALS_KEY)
    const parsedCredentials = storedCredentials
      ? (JSON.parse(storedCredentials) as { email?: string; password?: string })
      : {}

    const payload = {
      email: parsedCredentials.email?.trim() ?? '',
      password: parsedCredentials.password ?? '',
      name: String(formData.get('name') ?? '').trim(),
      phoneNumber: String(formData.get('phone') ?? '').trim(),
      country: String(formData.get('country') ?? '').trim(),
      currentRole: String(formData.get('role') ?? '').trim(),
      yearsOfExperience: Number(formData.get('experience') ?? 0),
      availableFrom: String(formData.get('availableFrom') ?? '').trim(),
      skills: skillEntries.map((entry) => ({
        name: entry.selectedSkill,
        proficiency: Number(entry.proficiency),
      })),
      portfolioUrl: String(formData.get('portfolioUrl') ?? '').trim(),
      workPreference: String(formData.get('workPreference') ?? '').trim(),
      proofOfWork: String(formData.get('proofOfWork') ?? '').trim(),
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const response = await fetch(`${baseUrl}/LoginController/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
            <div className="sectionLabel sectionLabel--mono">PROFILE SIGNAL</div>
            <h1 className="dashboardTitle">Build a profile that shows intent, proof, and clarity.</h1>
            <p className="dashboardSub">
              Denoisr works best when your information is structured and high-signal.
              Add the details that help relevant opportunities find you faster.
            </p>
          </div>

          <div className="dashboardStats" aria-label="Profile setup highlights">
            <div className="miniStat">
              <div className="miniStat__value">1</div>
              <div className="miniStat__label">Focused profile form</div>
            </div>
            <div className="miniStat">
              <div className="miniStat__value">5</div>
              <div className="miniStat__label">Point skill proficiency scale</div>
            </div>
            <div className="miniStat">
              <div className="miniStat__value">0</div>
              <div className="miniStat__label">Feed noise or vanity metrics</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--light dashboardSection">
        <div className="container dashboardLayout">
          <div className="card dashboardFormCard">
            <div className="dashboardCardTop">
              <div>
                <div className="sectionLabel sectionLabel--mono">USER DETAILS</div>
                <h2 className="sectionTitle">Tell us the essentials.</h2>
                <p className="sectionSub dashboardSectionSub">
                  Required fields are marked with an asterisk. Keep the information precise so
                  matching stays relevant and trustworthy.
                </p>
              </div>
              <div className="dashboardBadge">High-signal onboarding</div>
            </div>

            <form
              className="dashboardForm"
              onSubmit={handleSubmit}
            >
              <div className="dashboardGrid">
                <label className="field">
                  <span className="field__label">Name (*)</span>
                  <input
                    className="field__input"
                    type="text"
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    pattern="[A-Za-z][A-Za-z '.-]{1,79}"
                    title="Enter a valid name using letters, spaces, apostrophes, periods, or hyphens."
                    placeholder="Souptik Ghosh"
                  />
                </label>

                <label className="field">
                  <span className="field__label">Phone Number (*)</span>
                  <input
                    className="field__input"
                    type="tel"
                    name="phone"
                    required
                    pattern="^\+?[0-9()\-\s]{7,20}$"
                    title="Enter a valid phone number with 7 to 20 digits and symbols."
                    placeholder="+91 98765 43210"
                  />
                </label>

                <label className="field">
                  <span className="field__label">Country (*)</span>
                  <select className="field__input dashboardSelect" name="country" defaultValue="" required>
                    <option value="" disabled>
                      Select your country
                    </option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span className="field__label">Current Role (*)</span>
                  <input
                    className="field__input"
                    type="text"
                    name="role"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Frontend Engineer"
                  />
                </label>

                <label className="field">
                  <span className="field__label">Years of Experience (*)</span>
                  <input
                    className="field__input"
                    type="number"
                    name="experience"
                    required
                    min={0}
                    max={40}
                    step={1}
                    placeholder="4"
                  />
                </label>

                <label className="field">
                  <span className="field__label">Available From (*)</span>
                  <input className="field__input" type="date" name="availableFrom" required />
                </label>
              </div>

              <div className="dashboardSkillsBlock">
                <div className="dashboardSkillsHeader">
                  <div>
                    <div className="field__label">Skills (*)</div>
                    <p className="dashboardSkillsHint">
                      Add one or more skills. Each new row unlocks only after the last row is fully filled.
                    </p>
                  </div>
                </div>

                {skillEntries.map((entry, index) => {
                  const matchingSkills = matchingSkillsByIndex[index]
                  const rowId = `skill-suggestions-${index}`
                  const isLastRow = index === skillEntries.length - 1

                  return (
                    <div className="dashboardSkillRow" key={`skill-row-${index}`}>
                      <div className="dashboardSkillField">
                        <label className="field dashboardSkillSearch">
                          <span className="field__label">Skill {index + 1} (*)</span>
                          <input
                            className="field__input"
                            type="search"
                            name={`skillSearch-${index}`}
                            value={entry.query}
                            onChange={(e) => handleSkillChange(index, e.target.value)}
                            onFocus={() => handleSkillFocus(index)}
                            onBlur={() => handleSkillBlur(index)}
                            placeholder="Search a skill"
                            autoComplete="off"
                            aria-expanded={entry.menuOpen && matchingSkills.length > 0}
                            aria-controls={rowId}
                          />
                          <input
                            className="dashboardHiddenInput"
                            type="text"
                            name={`skills[${index}].name`}
                            value={entry.selectedSkill}
                            readOnly
                            required
                            tabIndex={-1}
                            aria-hidden="true"
                          />
                          {entry.menuOpen && matchingSkills.length > 0 ? (
                            <div className="dashboardSkillDropdown" id={rowId}>
                              {matchingSkills.map((skill) => (
                                <button
                                  key={`${skill}-${index}`}
                                  type="button"
                                  className="dashboardSkillOption"
                                  onClick={() => selectSkill(index, skill)}
                                >
                                  {skill}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </label>
                      </div>

                      <label className="field">
                        <span className="field__label">Proficiency (1-5) (*)</span>
                        <input
                          className="field__input"
                          type="number"
                          name={`skills[${index}].proficiency`}
                          value={entry.proficiency}
                          onChange={(e) => handleProficiencyChange(index, e.target.value)}
                          required
                          min={1}
                          max={5}
                          step={1}
                          placeholder="4"
                        />
                      </label>

                      <div className="dashboardSkillAction">
                        {isLastRow ? (
                          <button
                            type="button"
                            className="btn btn--outlinedLight dashboardAddSkillBtn"
                            onClick={addSkillRow}
                            disabled={!canAddSkillRow}
                          >
                            Add skill
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="dashboardGrid">
                <label className="field field--full">
                  <span className="field__label">Portfolio URL</span>
                  <input
                    className="field__input"
                    type="url"
                    name="portfolioUrl"
                    placeholder="https://your-portfolio.com"
                  />
                </label>

                <fieldset className="dashboardChoiceCard field--full">
                  <legend className="field__label">Work Preference (*)</legend>
                  <div className="dashboardChoiceGrid">
                    <label className="dashboardChoice">
                      <input type="radio" name="workPreference" value="remote" required />
                      <span>Remote</span>
                    </label>
                    <label className="dashboardChoice">
                      <input type="radio" name="workPreference" value="hybrid" required />
                      <span>Hybrid</span>
                    </label>
                    <label className="dashboardChoice">
                      <input type="radio" name="workPreference" value="onsite" required />
                      <span>On-site</span>
                    </label>
                  </div>
                </fieldset>

                <label className="field field--full">
                  <span className="field__label">Proof of Work Summary (*)</span>
                  <textarea
                    className="field__input dashboardTextarea"
                    name="proofOfWork"
                    required
                    minLength={40}
                    maxLength={500}
                    placeholder="Summarise the systems you built, problems you solved, or outcomes you delivered."
                  />
                </label>
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
              Proof over profiles. Intent over noise.
            </h2>
            <p className="sectionSub dashboardRailSub">
              Structured information helps Denoisr surface meaningful matches instead of broad,
              low-context outreach.
            </p>

            <div className="dashboardRailCards">
              <div className="darkCard">
                <div className="darkCard__title">Relevant matching</div>
                <p className="darkCard__description">
                  Role, location, and skill details create clearer alignment before any message is sent.
                </p>
              </div>
              <div className="darkCard">
                <div className="darkCard__title">Verified capability</div>
                <p className="darkCard__description">
                  Your summary focuses on tangible work, not vanity metrics or feed activity.
                </p>
              </div>
              <div className="darkCard">
                <div className="darkCard__title">Faster decisions</div>
                <p className="darkCard__description">
                  High-signal inputs reduce screening friction for both professionals and recruiters.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
