import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api'
import { clearAuthToken } from '../auth'

type DiscoveryMode = 'jobs' | 'people'
type SwipeDirection = 'accept' | 'reject'

type DiscoveryCard = {
  id: string
  kind: DiscoveryMode
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
}


const locationOptions = [
  'Berlin, Germany',
  'Toronto, Canada',
  'London, United Kingdom',
  'Bengaluru, India',
  'Madrid, Spain',
  'New York, United States',
  'India',
  'Germany',
  'Canada',
  'United States',
  'United Kingdom',
  'Spain',
]

function DiscoveryPreview({ card }: { card: DiscoveryCard }) {
  return (
    <>
      <div className="homePreview__top">
        <div>
          <div className="sectionLabel sectionLabel--mono">
            {card.kind === 'jobs' ? 'ROLE PREVIEW' : 'PERSON PREVIEW'}
          </div>
          <h2 className="homePreview__title">{card.headline}</h2>
          <p className="homePreview__meta">{card.subheadline}</p>
        </div>
        <div className="homePreview__location">{card.location}</div>
      </div>

      <p className="homePreview__intro">{card.intro}</p>

      <div className="homePreview__stats">
        <div className="homePreview__stat">
          <span className="homePreview__statValue">{card.experience} years</span>
          <span className="homePreview__statLabel">Experience</span>
        </div>
        <div className="homePreview__stat">
          <span className="homePreview__statValue">${card.salary}k</span>
          <span className="homePreview__statLabel">
            {card.kind === 'jobs' ? 'Comp band' : 'Target comp'}
          </span>
        </div>
      </div>

      {card.sections.map((section) => (
        <div key={section.title} className="homePreview__section">
          <div className="homePreview__sectionTitle">{section.title}</div>
          <div className="homePreview__list">
            {section.items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  let [jobCards, setJobCards] = useState<DiscoveryCard[]>([])
  let [peopleCards, setPeopleCards] = useState<DiscoveryCard[]>([])
  let [loading, setLoading] = useState(true)
  let [error, setError] = useState<string | null>(null)
  let roleOptions = useMemo(() => {
    return Array.from(
      new Set([...jobCards, ...peopleCards].map((card) => card.subheadline)),
    )
  }, [jobCards])
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('mode') === 'people' ? 'people' : 'jobs'
  const [draftRoleFilter, setDraftRoleFilter] = useState('')
  const [draftCountryFilter, setDraftCountryFilter] = useState('')
  const [draftCityFilter, setDraftCityFilter] = useState('')
  const [draftMaxExperience, setDraftMaxExperience] = useState(10)
  const [draftMaxSalary, setDraftMaxSalary] = useState(200)
  const [roleFilter, setRoleFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [maxExperience, setMaxExperience] = useState(10)
  const [maxSalary, setMaxSalary] = useState(200)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null)
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)
  const swipeLockedRef = useRef(false)

  const activeCards = mode === 'jobs' ? jobCards : peopleCards

  const filteredCards = useMemo(() => {
    const normalizedRole = roleFilter.trim().toLowerCase()
    const normalizedCountry = countryFilter.trim().toLowerCase()
    const normalizedCity = cityFilter.trim().toLowerCase()

    return activeCards.filter((card) => {
      const matchesRole =
        normalizedRole === '' ||
        card.subheadline.toLowerCase().includes(normalizedRole) ||
        card.headline.toLowerCase().includes(normalizedRole)

      const [cardCity = '', cardCountry = ''] = card.location
        .toLowerCase()
        .split(',')
        .map((part) => part.trim())

      const matchesCountry =
        normalizedCountry === '' || cardCountry.includes(normalizedCountry)

      const matchesCity = normalizedCity === '' || cardCity.includes(normalizedCity)

      return (
        matchesRole &&
        matchesCountry &&
        matchesCity &&
        card.experience <= maxExperience &&
        card.salary <= maxSalary
      )
    })
  }, [activeCards, cityFilter, countryFilter, maxExperience, maxSalary, roleFilter])

  const currentCard = filteredCards[currentIndex] ?? null
  const stackedCards = filteredCards.slice(currentIndex, currentIndex + 3)

  useEffect(() => {
    async function fetchFeed() {
      try {
        setLoading(true)

        const endpoint = mode === 'jobs' ? '/FeedController/fetchJobs' : '/FeedController/fetchPeople'
        const res = await apiRequest(endpoint, {
          method: 'POST',
          body: {
            role: roleFilter || '',
            experience: maxExperience || null,
            country: countryFilter || '',
            city: cityFilter || '',
            salary: maxSalary || null,
          },
        })
        const data = await res.json()

        const formatted: DiscoveryCard[] = data.map((item: any) => ({
          ...item,
          kind: mode,
        }))

        if (mode === 'jobs') {
          setJobCards(formatted)
        } else {
          setPeopleCards(formatted)
        }
      } catch (err) {
        console.error(err)
        setError(`Failed to load ${mode}`)
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
  }, [mode, roleFilter, countryFilter, cityFilter, maxExperience, maxSalary])

  useEffect(() => {
    setCurrentIndex(0)
    setDragX(0)
    setExitDirection(null)
  }, [cityFilter, countryFilter, maxExperience, maxSalary, mode, roleFilter])

  function applyFilters() {
    setRoleFilter(draftRoleFilter)
    setCountryFilter(draftCountryFilter)
    setCityFilter(draftCityFilter)
    setMaxExperience(draftMaxExperience)
    setMaxSalary(draftMaxSalary)
  }

  function resetDrag() {
    setDragX(0)
    setDragStartX(null)
    setIsDragging(false)
    swipeLockedRef.current = false
  }

  function handleMobileLogout() {
    clearAuthToken()
    setMobileProfileOpen(false)
    navigate('/login')
  }

  function updateMode(nextMode: 'jobs' | 'people') {
    setSearchParams({ mode: nextMode })
  }

  async function handleDecision(direction: SwipeDirection) {
    if (!currentCard || exitDirection || swipeLockedRef.current) {
      return
    }

    swipeLockedRef.current = true

    if (direction === 'accept' && mode === 'jobs') {
      try {
        const response = await apiRequest('/FeedController/jobAction', {
          method: 'POST',
          body: {
            jobId: currentCard.id,
          },
        })

        if (!response.ok) {
          setError('Failed to apply for job')
          swipeLockedRef.current = false
          return
        }
      } catch {
        setError('Failed to apply for job')
        swipeLockedRef.current = false
        return
      }
    }

    setExitDirection(direction)

    window.setTimeout(() => {
      setCurrentIndex((index) => index + 1)
      setExitDirection(null)
      resetDrag()
    }, 220)
  }

  function handlePointerDown(clientX: number) {
    if (!currentCard || exitDirection) {
      return
    }

    swipeLockedRef.current = false
    setDragStartX(clientX)
    setIsDragging(true)
  }

  function handlePointerMove(clientX: number) {
    if (!isDragging || dragStartX === null || exitDirection) {
      return
    }

    setDragX(clientX - dragStartX)
  }

  function handlePointerEnd() {
    if (!isDragging) {
      return
    }

    const threshold = 110

    if (dragX >= threshold) {
      handleDecision('accept')
      return
    }

    if (dragX <= -threshold) {
      handleDecision('reject')
      return
    }

    resetDrag()
  }
  // ⬇️ ADD HERE (just before return)
  if (loading) {
    return <div className="homePage">Loading jobs...</div>
  }

  if (error) {
    return <div className="homePage">{error}</div>
  }
  return (
    <div className="homePage denoisr">
      <div className="container homeShell">
        <section className="homeFilters card">
          <div className="sectionLabel sectionLabel--mono">DISCOVERY FILTERS</div>
          <h1 className="homePanelTitle">Tune for relevance.</h1>
          <p className="homePanelSub">
            Denoisr keeps discovery high-signal. Narrow the stream by role, location,
            experience, and compensation.
          </p>

          <div className="homeFilterList">
            <label className="field">
              <span className="field__label">Role</span>
              <input
                className="field__input"
                list="home-role-options"
                placeholder="Search role"
                value={draftRoleFilter}
                onChange={(e) => setDraftRoleFilter(e.target.value)}
              />
              <datalist id="home-role-options">
                {roleOptions.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span className="field__label">Experience Required</span>
              <div className="homeRangeValue">Up to {draftMaxExperience} years</div>
              <input
                className="homeRange"
                type="range"
                min="1"
                max="10"
                value={draftMaxExperience}
                onChange={(e) => setDraftMaxExperience(Number(e.target.value))}
              />
            </label>

            <label className="field">
              <span className="field__label">Country</span>
              <input
                className="field__input"
                list="home-location-options"
                placeholder="Country"
                value={draftCountryFilter}
                onChange={(e) => setDraftCountryFilter(e.target.value)}
              />
              <datalist id="home-location-options">
                {locationOptions.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span className="field__label">City</span>
              <input
                className="field__input"
                list="home-city-options"
                placeholder="City"
                value={draftCityFilter}
                onChange={(e) => setDraftCityFilter(e.target.value)}
              />
              <datalist id="home-city-options">
                {locationOptions
                  .filter((location) => location.includes(','))
                  .map((location) => location.split(',')[0].trim())
                  .map((city) => (
                    <option key={city} value={city} />
                  ))}
              </datalist>
            </label>

            <label className="field">
              <span className="field__label">Salary Range</span>
              <div className="homeRangeValue">Up to ${draftMaxSalary}k</div>
              <input
                className="homeRange"
                type="range"
                min="40"
                max="200"
                step="5"
                value={draftMaxSalary}
                onChange={(e) => setDraftMaxSalary(Number(e.target.value))}
              />
            </label>

            <button type="button" className="btn btn--solidDark" onClick={applyFilters}>
              Apply filter
            </button>
          </div>
        </section>

        <section className="homeDeck card">
          <div className="homeMobileModeSwitch nav__modeSwitch" aria-label="Discovery mode switch">
            <div
              className={`nav__modeBubble ${mode === 'people' ? 'nav__modeBubble--people' : ''}`}
              aria-hidden="true"
            />
            <button
              type="button"
              className={`nav__modeButton ${mode === 'jobs' ? 'nav__modeButton--active' : ''}`}
              onClick={() => updateMode('jobs')}
            >
              Jobs
            </button>
            <button
              type="button"
              className={`nav__modeButton ${mode === 'people' ? 'nav__modeButton--active' : ''}`}
              onClick={() => updateMode('people')}
            >
              People
            </button>
          </div>

          <div className="homeDeck__header">
            <div>
              <div className="sectionLabel sectionLabel--mono">
                {mode === 'jobs' ? 'JOB SEARCH MODE' : 'PEOPLE VIEW MODE'}
              </div>
              <h2 className="homePanelTitle">{mode === 'jobs' ? 'Curated roles' : 'Intent-led people'}</h2>
            </div>
            <div className="homeDeck__count">{filteredCards.length - currentIndex} left</div>
          </div>

          <div className="homeMobileFilterRail" aria-label="Mobile filter summaries">
            <div className="homeMiniFilter">{roleFilter || 'Any role'}</div>
            <div className="homeMiniFilter">Up to {maxExperience}y</div>
            <div className="homeMiniFilter">{countryFilter || 'Any country'}</div>
            <div className="homeMiniFilter">{cityFilter || 'Any city'}</div>
            <div className="homeMiniFilter">Up to ${maxSalary}k</div>
          </div>

          {currentCard ? (
            <>
              <div className="homeCardStage">
                {stackedCards
                  .slice(1)
                  .reverse()
                  .map((card, offset) => (
                    <div
                      key={card.id}
                      className="homeCard homeCard--stack"
                      style={{
                        transform: `translateY(${(offset + 1) * 10}px) scale(${1 - (offset + 1) * 0.03})`,
                      }}
                    />
                  ))}

                <article
                  className={`homeCard ${
                    exitDirection === 'accept'
                      ? 'homeCard--exitRight'
                      : exitDirection === 'reject'
                        ? 'homeCard--exitLeft'
                        : ''
                  } ${isDragging ? 'homeCard--dragging' : ''} homeCard--active`}
                  style={{
                    transform:
                      exitDirection === null
                        ? `translateX(${dragX}px) rotate(${dragX / 18}deg)`
                        : undefined,
                  }}
                  onPointerDown={(e) => handlePointerDown(e.clientX)}
                  onPointerMove={(e) => handlePointerMove(e.clientX)}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onPointerLeave={() => {
                    if (isDragging) {
                      handlePointerEnd()
                    }
                  }}
                >
                  <div className="homeCard__decision homeCard__decision--reject">Skip</div>
                  <div className="homeCard__decision homeCard__decision--accept">Apply</div>

                  <div className="homeCard__meta">{currentCard.subheadline}</div>
                  <h3 className="homeCard__title">{currentCard.headline}</h3>
                  <p className="homeCard__subtitle">{currentCard.organization}</p>

                  <div className="homeCard__row">
                    <span>{currentCard.location}</span>
                    <span>{currentCard.experience} years</span>
                    <span>${currentCard.salary}k</span>
                  </div>

                  <p className="homeCard__intro">{currentCard.intro}</p>

                  <div className="homeTagRow">
                    {currentCard.highlights.map((item) => (
                      <span key={item} className="homeTag">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="homeTagRow homeTagRow--muted">
                    {currentCard.tags.map((item) => (
                      <span key={item} className="homeTag homeTag--muted">
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              </div>

              <div className="homeActions">
                <button
                  type="button"
                  className="btn btn--outlinedLight homeActionBtn"
                  onClick={() => handleDecision('reject')}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="btn btn--solidDark homeActionBtn"
                  onClick={() => handleDecision('accept')}
                >
                  Apply
                </button>
              </div>
            </>
          ) : (
            <div className="homeEmpty card">
              <div className="sectionLabel sectionLabel--mono">NO MORE MATCHES</div>
              <h3 className="homePanelTitle">You reached the end of the filtered stack.</h3>
              <p className="homePanelSub">
                Reset the filters or switch mode to continue discovering high-signal opportunities.
              </p>
              <button
                type="button"
                className="btn btn--solidDark"
                onClick={() => {
                  setDraftRoleFilter('')
                  setDraftCountryFilter('')
                  setDraftCityFilter('')
                  setDraftMaxExperience(10)
                  setDraftMaxSalary(200)
                  setRoleFilter('')
                  setCountryFilter('')
                  setCityFilter('')
                  setMaxExperience(10)
                  setMaxSalary(200)
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </section>

        <aside className="homePreview card">
          {currentCard ? (
            <DiscoveryPreview card={currentCard} />
          ) : (
            <>
              <div className="sectionLabel sectionLabel--mono">PREVIEW</div>
              <h2 className="homePanelTitle">No active card selected.</h2>
              <p className="homePanelSub">
                Adjust your filters or switch discovery mode to load a fresh stack.
              </p>
            </>
          )}
        </aside>
      </div>

      <nav className="homeBottomNav" aria-label="Mobile navigation">
        <button type="button" className="homeBottomNav__item homeBottomNav__item--active">
          <span className="nav__appIcon nav__appIcon--connections" aria-hidden="true" />
          <span>Home</span>
        </button>
        <button type="button" className="homeBottomNav__item">
          <span className="nav__appIcon nav__appIcon--connections" aria-hidden="true" />
          <span>Connections</span>
        </button>
        <button type="button" className="homeBottomNav__item">
          <span className="nav__appIcon nav__appIcon--messages" aria-hidden="true" />
          <span>Messages</span>
        </button>
        <div className="homeBottomNav__profileWrap">
          <button
            type="button"
            className={`homeBottomNav__item ${mobileProfileOpen ? 'homeBottomNav__item--active' : ''}`}
            aria-expanded={mobileProfileOpen}
            onClick={() => setMobileProfileOpen((value) => !value)}
          >
            <span className="nav__appIcon nav__appIcon--profile" aria-hidden="true" />
            <span>Profile</span>
          </button>

          {mobileProfileOpen ? (
            <div className="homeBottomNav__profileMenu">
              <button type="button" className="homeBottomNav__profileAction">
                View Profile
              </button>
              <button type="button" className="homeBottomNav__profileAction">
                View Job Applications
              </button>
              <button
                type="button"
                className="homeBottomNav__profileAction homeBottomNav__profileAction--danger"
                onClick={handleMobileLogout}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
