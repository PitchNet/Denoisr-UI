import { useMemo, useState } from 'react'
import Button from '../components/ui/Button'

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
  const [skillQuery, setSkillQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [skillMenuOpen, setSkillMenuOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const matchingSkills = useMemo(() => {
    const query = skillQuery.trim().toLowerCase()

    if (!query) {
      return []
    }

    return skills
      .filter((skill) => skill.toLowerCase().includes(query))
      .slice(0, 6)
  }, [skillQuery])

  function handleSkillChange(value: string) {
    setSkillQuery(value)
    setSkillMenuOpen(true)

    const exactMatch = skills.find(
      (skill) => skill.toLowerCase() === value.trim().toLowerCase(),
    )

    setSelectedSkill(exactMatch ?? '')
  }

  function selectSkill(skill: string) {
    setSkillQuery(skill)
    setSelectedSkill(skill)
    setSkillMenuOpen(false)
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
              onSubmit={(e) => {
                e.preventDefault()
                setSubmitted(true)
              }}
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

              <div className="dashboardSplitField">
                <div className="dashboardSkillField">
                  <label className="field dashboardSkillSearch">
                    <span className="field__label">Primary Skill (*)</span>
                    <input
                      className="field__input"
                      type="search"
                      name="skillSearch"
                      value={skillQuery}
                      onChange={(e) => handleSkillChange(e.target.value)}
                      onFocus={() => setSkillMenuOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setSkillMenuOpen(false), 120)
                      }}
                      placeholder="Search a skill"
                      autoComplete="off"
                      aria-expanded={skillMenuOpen && matchingSkills.length > 0}
                      aria-controls="skill-suggestions"
                    />
                    <input
                      className="dashboardHiddenInput"
                      type="text"
                      name="primarySkill"
                      value={selectedSkill}
                      readOnly
                      required
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    {skillMenuOpen && matchingSkills.length > 0 ? (
                      <div className="dashboardSkillDropdown" id="skill-suggestions">
                        {matchingSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            className="dashboardSkillOption"
                            onClick={() => selectSkill(skill)}
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
                    name="skillProficiency"
                    required
                    min={1}
                    max={5}
                    step={1}
                    placeholder="4"
                  />
                </label>
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
                  Save profile signal
                </button>
                <Button to="/" variant="outlinedLight">
                  Back to home
                </Button>
              </div>

              {submitted ? (
                <div className="dashboardConfirmation" role="status">
                  Profile details captured. This page is ready to be connected to a save API next.
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
