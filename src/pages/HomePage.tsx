import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api'
import { clearAuthToken, getStoredFilters, setStoredFilters, clearStoredFilters } from '../auth'
import NavIcon from '../components/ui/NavIcon'
import LoadingState from '../components/ui/LoadingState'
import '../styles/home.css'

type DiscoveryMode = 'jobs' | 'people'
type SwipeDirection = 'accept' | 'reject'

type MatchState = {
  open: boolean
  name: string
  photo: string
}

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
  photo: string
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

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0')
}

function DiscoveryPreview({ card }: { card: DiscoveryCard }) {
  return (
    <>
      <header className="hp-preview__head">
        <span className="hp-eyebrow">
          {card.kind === 'jobs' ? 'Role · Preview' : 'Person · Preview'}
        </span>
        <h2 className="hp-preview__title">{card.headline}</h2>
        <div className="hp-preview__meta hp-meta">
          <span>{card.subheadline}</span>
          <span className="dot">·</span>
          <span>{card.location}</span>
        </div>
      </header>

      <p className="hp-preview__intro">{card.intro}</p>

      <div className="hp-preview__stats">
        <div className="hp-preview__stat">
          <span className="hp-preview__statValue">{pad2(card.experience)} yrs</span>
          <span className="hp-preview__statLabel">Experience</span>
        </div>
        <div className="hp-preview__stat">
          <span className="hp-preview__statValue">${card.salary}k</span>
          <span className="hp-preview__statLabel">
            {card.kind === 'jobs' ? 'Comp band' : 'Target comp'}
          </span>
        </div>
      </div>

      {card.sections.map((section) => (
        <section key={section.title} className="hp-preview__section">
          <div className="hp-eyebrow">{section.title}</div>
          <div className="hp-preview__list">
            {section.items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [jobCards, setJobCards] = useState<DiscoveryCard[]>([])
  const [peopleCards, setPeopleCards] = useState<DiscoveryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const roleOptions = useMemo(
    () => Array.from(new Set([...jobCards, ...peopleCards].map((c) => c.subheadline))),
    [jobCards, peopleCards],
  )
  const [searchParams] = useSearchParams()
  const mode: DiscoveryMode = searchParams.get('mode') === 'people' ? 'people' : 'jobs'

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [matchState, setMatchState] = useState<MatchState>({ open: false, name: '', photo: '' })
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
      setLoading(true)
      setError(null)

      try {
        const endpoint =
          mode === 'jobs' ? '/FeedController/fetchJobs' : '/FeedController/fetchPeople'
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

        if (!res.ok) {
          setError(`Failed to load ${mode}`)
          return
        }

        const data = await res.json()
        const formatted: DiscoveryCard[] = data.map((item: any) => ({
          ...item,
          kind: mode,
        }))

        if (mode === 'jobs') setJobCards(formatted)
        else setPeopleCards(formatted)
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

  useEffect(() => {
    const stored = getStoredFilters(mode)
    if (stored) {
      setDraftRoleFilter(stored.role)
      setDraftCountryFilter(stored.country)
      setDraftCityFilter(stored.city)
      setDraftMaxExperience(stored.experience)
      setDraftMaxSalary(stored.salary)
      setRoleFilter(stored.role)
      setCountryFilter(stored.country)
      setCityFilter(stored.city)
      setMaxExperience(stored.experience)
      setMaxSalary(stored.salary)
    } else {
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
    }
  }, [mode])

  function applyFilters() {
    setRoleFilter(draftRoleFilter)
    setCountryFilter(draftCountryFilter)
    setCityFilter(draftCityFilter)
    setMaxExperience(draftMaxExperience)
    setMaxSalary(draftMaxSalary)
    setStoredFilters(mode, {
      role: draftRoleFilter,
      country: draftCountryFilter,
      city: draftCityFilter,
      experience: draftMaxExperience,
      salary: draftMaxSalary,
    })
  }

  function resetFiltersAll() {
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
    clearStoredFilters(mode)
  }

  function resetDrag() {
    setDragX(0)
    setDragStartX(null)
    setIsDragging(false)
    swipeLockedRef.current = false
  }

  function advanceCard() {
    setCurrentIndex((index) => index + 1)
    setExitDirection(null)
    resetDrag()
  }

  function handleMobileLogout() {
    clearAuthToken()
    setMobileProfileOpen(false)
    navigate('/login')
  }

  async function handleDecision(direction: SwipeDirection) {
    if (!currentCard || exitDirection || swipeLockedRef.current) return
    swipeLockedRef.current = true
    setError(null)

    if (direction === 'accept' && mode === 'jobs') {
      try {
        const response = await apiRequest('/FeedController/jobAction', {
          method: 'POST',
          body: { jobId: currentCard.id },
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

    if (direction === 'accept' && mode === 'people') {
      try {
        const response = await apiRequest('/FeedController/peopleAction', {
          method: 'POST',
          body: { peopleId: currentCard.id },
        })
        if (!response.ok) {
          setError('Failed to connect with person')
          swipeLockedRef.current = false
          return
        }

        const result = (await response.json()) as { matched?: boolean }
        if (result.matched) {
          setMatchState({ open: true, name: currentCard.headline, photo: currentCard.photo })
          setExitDirection(direction)
          return
        }
      } catch {
        setError('Failed to connect with person')
        swipeLockedRef.current = false
        return
      }
    }

    setExitDirection(direction)
    window.setTimeout(() => advanceCard(), 260)
  }

  function handleKeepSwiping() {
    setMatchState({ open: false, name: '', photo: '' })
    advanceCard()
  }

  function handleStartChat() {
    setMatchState({ open: false, name: '', photo: '' })
    advanceCard()
    navigate('/messages')
  }

  function handlePointerDown(clientX: number) {
    if (!currentCard || exitDirection) return
    swipeLockedRef.current = false
    setDragStartX(clientX)
    setIsDragging(true)
  }

  function handlePointerMove(clientX: number) {
    if (!isDragging || dragStartX === null || exitDirection) return
    setDragX(clientX - dragStartX)
  }

  function handlePointerEnd() {
    if (!isDragging) return
    const threshold = 110
    if (dragX >= threshold) return handleDecision('accept')
    if (dragX <= -threshold) return handleDecision('reject')
    resetDrag()
  }

  if (loading) {
    return (
      <LoadingState
        className="hp-loading"
        label={mode === 'jobs' ? 'Curating roles' : 'Curating people'}
        detail={
          mode === 'jobs'
            ? 'A short, deliberate set is on its way.'
            : 'Pulling people whose intent overlaps with yours.'
        }
      />
    )
  }

  const acceptLabel = mode === 'jobs' ? 'Apply' : 'Send opener'
  const swipeIndicatorOpacity = Math.min(Math.abs(dragX) / 110, 1)

  return (
    <div className="hp">
      {matchState.open ? (
        <div className="hp-match" role="dialog" aria-label="It's a fit">
          <div className="hp-match__wash" aria-hidden="true" />
          <div className="hp-match__cards" aria-hidden="true">
            <div className="hp-match__card hp-match__card--left">
              <div className="hp-match__avatar" style={{ background: SWATCHES[0] }}>You</div>
            </div>
            <div className="hp-match__card hp-match__card--right">
              <div
                className={`hp-match__avatar${matchState.photo ? ' hp-match__avatar--photo' : ''}`}
                style={matchState.photo ? { backgroundImage: `url(${matchState.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: swatchFor(matchState.name) }}
              >
                {matchState.photo ? null : initialsOf(matchState.name)}
              </div>
            </div>
          </div>

          <div className="hp-match__panel">
            <span className="hp-eyebrow">Mutual interest · Just now</span>
            <h2 className="hp-match__title">It's a fit.</h2>
            <p className="hp-match__sub">
              {matchState.name.split(' ')[0]} also liked your card. The thread is
              open whenever you are.
            </p>
            <div className="hp-match__actions">
              <button type="button" className="btn btn--solidDark" onClick={handleStartChat}>
                Send opener
              </button>
              <button type="button" className="btn btn--outlinedLight" onClick={handleKeepSwiping}>
                Keep swiping
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="hp-shell">
        {/* ─── Filters (left column) ─── */}
        <section className="hp-panel hp-filters">
          <header className="hp-panel__head">
            <span className="hp-eyebrow">Filters · Tune the deck</span>
            <h1 className="hp-panel__title">Tune for relevance.</h1>
            <p className="hp-panel__sub">
              Narrow by role, place, experience, and compensation. Fewer cards,
              denser signal.
            </p>
          </header>

          <div className="hp-fieldset">
            <label className="hp-field">
              <span className="hp-field__label">Role</span>
              <input
                className="hp-input"
                list="hp-role-options"
                placeholder="Search role"
                value={draftRoleFilter}
                onChange={(e) => setDraftRoleFilter(e.target.value)}
              />
              <datalist id="hp-role-options">
                {roleOptions.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </label>

            <label className="hp-field">
              <span className="hp-field__label">Experience</span>
              <div className="hp-rangeValue">Up to {pad2(draftMaxExperience)} yrs</div>
              <input
                className="hp-range"
                type="range"
                min="1"
                max="10"
                value={draftMaxExperience}
                onChange={(e) => setDraftMaxExperience(Number(e.target.value))}
              />
            </label>

            <label className="hp-field">
              <span className="hp-field__label">Country</span>
              <input
                className="hp-input"
                list="hp-location-options"
                placeholder="Country"
                value={draftCountryFilter}
                onChange={(e) => setDraftCountryFilter(e.target.value)}
              />
              <datalist id="hp-location-options">
                {locationOptions.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </label>

            <label className="hp-field">
              <span className="hp-field__label">City</span>
              <input
                className="hp-input"
                list="hp-city-options"
                placeholder="City"
                value={draftCityFilter}
                onChange={(e) => setDraftCityFilter(e.target.value)}
              />
              <datalist id="hp-city-options">
                {locationOptions
                  .filter((l) => l.includes(','))
                  .map((l) => l.split(',')[0].trim())
                  .map((city) => (
                    <option key={city} value={city} />
                  ))}
              </datalist>
            </label>

            <label className="hp-field">
              <span className="hp-field__label">Salary</span>
              <div className="hp-rangeValue">Up to ${draftMaxSalary}k</div>
              <input
                className="hp-range"
                type="range"
                min="40"
                max="200"
                step="5"
                value={draftMaxSalary}
                onChange={(e) => setDraftMaxSalary(Number(e.target.value))}
              />
            </label>

            <div className="hp-filterActions">
              <button type="button" className="btn btn--outlinedLight" onClick={resetFiltersAll}>
                Clear filters
              </button>
              <button type="button" className="btn btn--solidDark" onClick={applyFilters}>
                Apply filter
              </button>
            </div>
          </div>
        </section>

        {/* ─── Deck (center column) ─── */}
        <section className="hp-panel hp-deck">
          <div className="hp-deck__topbar">
            <div className="hp-deck__count el-meta">
              <span>{pad2(currentIndex + 1)}</span>
              <span style={{ color: 'var(--ink-5)' }}>/ {pad2(filteredCards.length)}</span>
              <span style={{ color: 'var(--ink-5)', margin: '0 6px' }}>·</span>
              <span>{filteredCards.length - currentIndex} left</span>
            </div>
            <button
              type="button"
              className="hp-mobileFilterBtn"
              aria-label="Open filters"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 4.5h14M4.5 9h9M7 13.5h4" />
                <circle cx="4.5" cy="4.5" r="1.5" fill="none" />
                <circle cx="13.5" cy="9" r="1.5" fill="none" />
                <circle cx="9" cy="13.5" r="1.5" fill="none" />
              </svg>
            </button>
          </div>

          <header className="hp-deck__head">
            <span className="hp-eyebrow">
              {mode === 'jobs' ? 'Jobs · Curated for you' : 'People · Intent-led'}
            </span>
            <h2 className="hp-deck__title">
              {mode === 'jobs' ? 'Curated roles.' : 'Aligned people.'}
            </h2>
          </header>

          <div className="hp-mobileFilters" aria-label="Active filter summary">
            <span className="hp-chip">{roleFilter || 'Any role'}</span>
            <span className="hp-chip">≤ {pad2(maxExperience)}y</span>
            <span className="hp-chip">{countryFilter || 'Any country'}</span>
            <span className="hp-chip">{cityFilter || 'Any city'}</span>
            <span className="hp-chip">≤ ${maxSalary}k</span>
          </div>

          {error ? (
            <div className="hp-banner" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="hp-banner__dismiss"
                onClick={() => setError(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ) : null}

          {currentCard ? (
            <>
              <div className="hp-stage">
                {stackedCards
                  .slice(1)
                  .reverse()
                  .map((card, offset) => (
                    <div
                      key={card.id}
                      className="hp-card hp-card--stack"
                      style={{
                        transform: `translateY(${(offset + 1) * 10}px) scale(${1 - (offset + 1) * 0.03})`,
                      }}
                      aria-hidden="true"
                    />
                  ))}

                <article
                  className={`hp-card hp-card--top ${
                    exitDirection === 'accept'
                      ? 'hp-card--exitRight'
                      : exitDirection === 'reject'
                        ? 'hp-card--exitLeft'
                        : ''
                  } ${isDragging ? 'hp-card--dragging' : ''}`}
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
                  onPointerLeave={() => isDragging && handlePointerEnd()}
                >
                  <div
                    className="hp-card__stamp hp-card__stamp--skip"
                    style={{ opacity: dragX < 0 ? swipeIndicatorOpacity : 0 }}
                    aria-hidden="true"
                  >
                    SKIP
                  </div>
                  <div
                    className="hp-card__stamp hp-card__stamp--fit"
                    style={{ opacity: dragX > 0 ? swipeIndicatorOpacity : 0 }}
                    aria-hidden="true"
                  >
                    {mode === 'jobs' ? 'APPLY' : 'FIT'}
                  </div>

                  <div className="hp-card__head">
                    <div
                      className={`hp-card__avatar${mode === 'people' && currentCard.photo ? ' hp-card__avatar--photo' : ''}`}
                      style={mode === 'people' && currentCard.photo ? { backgroundImage: `url(${currentCard.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: swatchFor(currentCard.id) }}
                      aria-hidden="true"
                    >
                      {mode === 'people' && currentCard.photo ? null : initialsOf(currentCard.organization || currentCard.headline)}
                    </div>
                    <div className="hp-card__meta el-meta">
                      <span>{currentCard.subheadline}</span>
                      <span className="dot">·</span>
                      <span>{currentCard.organization}</span>
                    </div>
                  </div>

                  <h3 className="hp-card__title">{currentCard.headline}</h3>

                  <div className="hp-card__row">
                    <span>{currentCard.location}</span>
                    <span className="dot">·</span>
                    <span>{pad2(currentCard.experience)} yrs</span>
                    <span className="dot">·</span>
                    <span>${currentCard.salary}k</span>
                  </div>

                  <p className="hp-card__intro">{currentCard.intro}</p>

                  {currentCard.highlights.length ? (
                    <div className="hp-card__chips">
                      {currentCard.highlights.map((item) => (
                        <span key={item} className="hp-chip">{item}</span>
                      ))}
                    </div>
                  ) : null}

                  {currentCard.tags.length ? (
                    <div className="hp-card__tags el-meta">
                      {currentCard.tags.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  ) : null}

                  {currentCard.sections.length ? (
                    <div className="hp-card__sections">
                      {currentCard.sections.map((section) => (
                        <section key={section.title} className="hp-card__section">
                          <span className="hp-eyebrow">{section.title}</span>
                          <div className="hp-card__sectionList">
                            {section.items.map((item) => (
                              <p key={item}>{item}</p>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : null}
                </article>
              </div>

              <div className="hp-actions">
                <button
                  type="button"
                  className="hp-actionbtn hp-actionbtn--pass"
                  aria-label="Skip"
                  onClick={() => handleDecision('reject')}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M5 5l12 12M17 5L5 17" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="hp-actionbtn hp-actionbtn--like"
                  aria-label={acceptLabel}
                  onClick={() => handleDecision('accept')}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
                    <path d="M11 19s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0118 9c0 5.5-7 10-7 10z" />
                  </svg>
                </button>
              </div>

              <div className="hp-actionLabels el-meta">
                <span>Skip</span>
                <span>{acceptLabel}</span>
              </div>
            </>
          ) : (
            <div className="hp-empty">
              <span className="hp-eyebrow">End of the deck</span>
              <h3 className="hp-deck__title">You reached the bottom.</h3>
              <p className="hp-panel__sub">
                Loosen the filters or switch mode to bring in a fresh set.
              </p>
              <button type="button" className="btn btn--solidDark" onClick={resetFiltersAll}>
                Reset filters
              </button>
            </div>
          )}
        </section>

        {/* ─── Preview (right column) ─── */}
        <aside className="hp-panel hp-preview">
          {currentCard ? (
            <DiscoveryPreview card={currentCard} />
          ) : (
            <>
              <span className="hp-eyebrow">Preview · Empty</span>
              <h2 className="hp-preview__title">No active card.</h2>
              <p className="hp-panel__sub">
                Adjust filters or switch mode to bring a card into focus.
              </p>
            </>
          )}
        </aside>
      </div>

      {/* ─── Mobile filter sheet ─── */}
      {mobileFiltersOpen ? (
        <div className="hp-filterOverlay" onClick={() => setMobileFiltersOpen(false)}>
          <div className="hp-filterSheet" onClick={(e) => e.stopPropagation()}>
            <header className="hp-filterSheet__head">
              <span className="hp-eyebrow">Filters · Tune the deck</span>
              <h2 className="hp-panel__title">Tune for relevance.</h2>
              <button
                type="button"
                className="hp-filterSheet__close"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </header>

            <div className="hp-fieldset">
              <label className="hp-field">
                <span className="hp-field__label">Role</span>
                <input
                  className="hp-input"
                  list="hp-role-options"
                  placeholder="Search role"
                  value={draftRoleFilter}
                  onChange={(e) => setDraftRoleFilter(e.target.value)}
                />
              </label>

              <label className="hp-field">
                <span className="hp-field__label">Experience</span>
                <div className="hp-rangeValue">Up to {pad2(draftMaxExperience)} yrs</div>
                <input
                  className="hp-range"
                  type="range"
                  min="1"
                  max="10"
                  value={draftMaxExperience}
                  onChange={(e) => setDraftMaxExperience(Number(e.target.value))}
                />
              </label>

              <label className="hp-field">
                <span className="hp-field__label">Country</span>
                <input
                  className="hp-input"
                  list="hp-location-options"
                  placeholder="Country"
                  value={draftCountryFilter}
                  onChange={(e) => setDraftCountryFilter(e.target.value)}
                />
              </label>

              <label className="hp-field">
                <span className="hp-field__label">City</span>
                <input
                  className="hp-input"
                  list="hp-city-options"
                  placeholder="City"
                  value={draftCityFilter}
                  onChange={(e) => setDraftCityFilter(e.target.value)}
                />
              </label>

              <label className="hp-field">
                <span className="hp-field__label">Salary</span>
                <div className="hp-rangeValue">Up to ${draftMaxSalary}k</div>
                <input
                  className="hp-range"
                  type="range"
                  min="40"
                  max="200"
                  step="5"
                  value={draftMaxSalary}
                  onChange={(e) => setDraftMaxSalary(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="hp-filterSheet__actions">
              <button
                type="button"
                className="btn btn--outlinedLight"
                onClick={() => { resetFiltersAll(); setMobileFiltersOpen(false) }}
              >
                Remove filters
              </button>
              <button
                type="button"
                className="btn btn--solidDark"
                onClick={() => { applyFilters(); setMobileFiltersOpen(false) }}
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── Mobile bottom nav ─── */}
      <nav className="hp-bottomnav" aria-label="Mobile navigation">
        <button type="button" className="hp-bottomnav__item hp-bottomnav__item--active">
          <NavIcon name="home" />
          <span>Home</span>
        </button>
        <button type="button" className="hp-bottomnav__item" onClick={() => navigate('/messages')}>
          <NavIcon name="connections" />
          <span>Connections</span>
        </button>
        <button type="button" className="hp-bottomnav__item" onClick={() => navigate('/messages')}>
          <NavIcon name="messages" />
          <span>Messages</span>
        </button>
        <div className="hp-bottomnav__profileWrap">
          <button
            type="button"
            className={`hp-bottomnav__item ${mobileProfileOpen ? 'hp-bottomnav__item--active' : ''}`}
            aria-expanded={mobileProfileOpen}
            onClick={() => setMobileProfileOpen((v) => !v)}
          >
            <NavIcon name="profile" />
            <span>Profile</span>
          </button>

          {mobileProfileOpen ? (
            <div className="hp-bottomnav__menu">
              <button type="button" className="hp-bottomnav__action" onClick={() => navigate('/profile')}>View profile</button>
              <button type="button" className="hp-bottomnav__action">Job applications</button>
              <button type="button" className="hp-bottomnav__action" onClick={() => navigate('/messages')}>
                Connections
              </button>
              <button
                type="button"
                className="hp-bottomnav__action hp-bottomnav__action--danger"
                onClick={handleMobileLogout}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
