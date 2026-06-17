import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api'
import { getStoredFilters, setStoredFilters, clearStoredFilters, getStoredProfile } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import OnboardingModal from '../components/ui/OnboardingModal'
import { useToast } from '../components/ui/Toast'
import '../styles/home.css'

type DiscoveryMode = 'jobs' | 'people'
type SwipeDirection = 'accept' | 'reject'

type MatchState = {
  open: boolean
  id: string
  name: string
  photo: string
  subheadline: string
}

const OPENER_TEMPLATES = [
  (n: string) => `Hey ${n}, seems like we see eye to eye. Worth a conversation?`,
  (n: string) => `Hi ${n} — mutual interest is a good start. Open to a chat?`,
  (n: string) => `${n}, looked like a natural fit. Up for connecting?`,
  (n: string) => `Hey ${n}, your profile stood out. Let's talk.`,
]

type Particle = { id: number; style: React.CSSProperties }
const PARTICLES: Particle[] = [
  { id: 1, style: { left: '22%', top: '38%', width: 7, height: 7, background: 'rgba(255,210,180,0.65)', animationDuration: '1.4s', animationDelay: '120ms' } },
  { id: 2, style: { left: '74%', top: '42%', width: 5, height: 5, background: 'rgba(210,200,245,0.60)', animationDuration: '1.2s', animationDelay: '220ms' } },
  { id: 3, style: { left: '48%', top: '34%', width: 4, height: 4, background: 'rgba(26,23,21,0.18)',    animationDuration: '1.6s', animationDelay: '80ms'  } },
  { id: 4, style: { left: '35%', top: '55%', width: 6, height: 6, background: 'rgba(255,210,180,0.50)', animationDuration: '1.3s', animationDelay: '300ms' } },
  { id: 5, style: { left: '62%', top: '50%', width: 5, height: 5, background: 'rgba(26,23,21,0.14)',    animationDuration: '1.5s', animationDelay: '160ms' } },
  { id: 6, style: { left: '28%', top: '46%', width: 8, height: 8, background: 'rgba(210,200,245,0.45)', animationDuration: '1.8s', animationDelay: '50ms'  } },
  { id: 7, style: { left: '68%', top: '58%', width: 4, height: 4, background: 'rgba(255,210,180,0.55)', animationDuration: '1.1s', animationDelay: '260ms' } },
  { id: 8, style: { left: '54%', top: '44%', width: 6, height: 6, background: 'rgba(26,23,21,0.12)',    animationDuration: '1.4s', animationDelay: '190ms' } },
]

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
  companyPhoto: string
  sections: Array<{
    title: string
    items: string[]
  }>
  bookmarked: boolean
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
  const { showToast } = useToast()
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('denoisr_just_signed_up') === '1',
  )
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

  const initialFilters = getStoredFilters(mode)

  const [draftRoleFilter, setDraftRoleFilter] = useState(initialFilters?.role ?? '')
  const [draftSearchFilter, setDraftSearchFilter] = useState(initialFilters?.search ?? '')
  const [draftCountryFilter, setDraftCountryFilter] = useState(initialFilters?.country ?? '')
  const [draftCityFilter, setDraftCityFilter] = useState(initialFilters?.city ?? '')
  const [draftMaxExperience, setDraftMaxExperience] = useState(initialFilters?.experience ?? 10)
  const [draftMaxSalary, setDraftMaxSalary] = useState(initialFilters?.salary ?? 200)
  const [roleFilter, setRoleFilter] = useState(initialFilters?.role ?? '')
  const [searchFilter, setSearchFilter] = useState(initialFilters?.search ?? '')
  const [countryFilter, setCountryFilter] = useState(initialFilters?.country ?? '')
  const [cityFilter, setCityFilter] = useState(initialFilters?.city ?? '')
  const [maxExperience, setMaxExperience] = useState(initialFilters?.experience ?? 10)
  const [maxSalary, setMaxSalary] = useState(initialFilters?.salary ?? 200)
  const [draftBookmarkedOnly, setDraftBookmarkedOnly] = useState(initialFilters?.bookmarked ?? false)
  const [bookmarkedOnly, setBookmarkedOnly] = useState(initialFilters?.bookmarked ?? false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null)
  const [entering, setEntering] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [matchState, setMatchState] = useState<MatchState>({ open: false, id: '', name: '', photo: '', subheadline: '' })
  const [openerText, setOpenerText] = useState('')
  const [openerSending, setOpenerSending] = useState(false)
  const [companyJobsCount, setCompanyJobsCount] = useState<number | null>(null)
  const [companyCtaDismissed, setCompanyCtaDismissed] = useState(false)
  const [profileCtaDismissed, setProfileCtaDismissed] = useState(
    () => localStorage.getItem('denoisr_profile_cta_dismissed') === '1',
  )
  const cachedProfile = getStoredProfile()
  const showProfileCta = !profileCtaDismissed && (
    !cachedProfile?.photo || !cachedProfile?.subheadline || !(cachedProfile?.intro as string | undefined)
  )
  const [cardOverflows, setCardOverflows] = useState(false)
  const [previewOverflows, setPreviewOverflows] = useState(false)
  const [cardAtBottom, setCardAtBottom] = useState(false)
  const [previewAtBottom, setPreviewAtBottom] = useState(false)
  const [jobCursor, setJobCursor] = useState<string | null>(null)
  const [peopleCursor, setPeopleCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const deckRef = useRef<HTMLElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const swipeLockedRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const initialMount = useRef(true)

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
    setEntering(true)
    const t = setTimeout(() => setEntering(false), 350)
    return () => clearTimeout(t)
  }, [currentIndex])

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
            search: searchFilter || '',
            experience: maxExperience || null,
            country: countryFilter || '',
            city: cityFilter || '',
            salary: maxSalary || null,
            bookmarked: bookmarkedOnly || null,
            batch_size: Number(import.meta.env.VITE_FETCH_BATCH_SIZE) || 10,
          },
        })

        if (!res.ok) {
          setError(`Failed to load ${mode}`)
          return
        }

        const data = await res.json()
        const formatted: DiscoveryCard[] = (data.items ?? data).map((item: any) => ({
          ...item,
          kind: mode,
          bookmarked: item.bookmarked ?? false,
        }))

        if (mode === 'jobs') {
          setJobCards(formatted)
          setJobCursor(data.next_cursor ?? null)
        } else {
          setPeopleCards(formatted)
          setPeopleCursor(data.next_cursor ?? null)
        }
        setHasMore(data.has_more ?? false)
        setTotalCount(data.total_count ?? formatted.length)
      } catch (err) {
        console.error(err)
        setError(`Failed to load ${mode}`)
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
  }, [mode, roleFilter, searchFilter, countryFilter, cityFilter, maxExperience, maxSalary, bookmarkedOnly])

  useEffect(() => {
    if (mode !== 'jobs') return
    const profile = getStoredProfile()
    if (!profile?.companyId) { setCompanyJobsCount(-1); return }
    apiRequest('/CompanyController/companyJobs', { method: 'GET' })
      .then((res) => res.ok ? res.json() : [])
      .then((jobs) => setCompanyJobsCount(Array.isArray(jobs) ? jobs.length : -1))
      .catch(() => setCompanyJobsCount(-1))
  }, [mode])

  useLayoutEffect(() => {
    if (!cardRef.current) return
    const el = cardRef.current
    setCardOverflows(el.scrollHeight > el.clientHeight)
    setCardAtBottom(false)
    el.scrollTop = 0
  }, [currentCard])

  useLayoutEffect(() => {
    if (!previewRef.current) return
    const el = previewRef.current
    setPreviewOverflows(el.scrollHeight > el.clientHeight)
    setPreviewAtBottom(false)
    el.scrollTop = 0
  }, [currentCard])

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const handler = () => {
      setCardAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [currentCard])

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const handler = () => {
      setPreviewAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [currentCard])

  useEffect(() => {
    setCurrentIndex(0)
    setDragX(0)
    setExitDirection(null)
  }, [cityFilter, countryFilter, maxExperience, maxSalary, mode, roleFilter, searchFilter])

  async function loadMore() {
    if (loadingMoreRef.current || !hasMore) return
    const cursor = mode === 'jobs' ? jobCursor : peopleCursor
    if (!cursor) return
    loadingMoreRef.current = true
    setLoadingMore(true)

    try {
      const endpoint =
        mode === 'jobs' ? '/FeedController/fetchJobs' : '/FeedController/fetchPeople'
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: {
          role: roleFilter || '',
          search: searchFilter || '',
          experience: maxExperience || null,
          country: countryFilter || '',
          city: cityFilter || '',
          salary: maxSalary || null,
          bookmarked: bookmarkedOnly || null,
          cursor,
          batch_size: Number(import.meta.env.VITE_FETCH_BATCH_SIZE) || 10,
        },
      })

      if (!res.ok) return

      const data = await res.json()
      const formatted: DiscoveryCard[] = (data.items ?? []).map((item: any) => ({
        ...item,
        kind: mode,
        bookmarked: item.bookmarked ?? false,
      }))

      if (mode === 'jobs') {
        setJobCards((prev) => [...prev, ...formatted])
        setJobCursor(data.next_cursor ?? null)
      } else {
        setPeopleCards((prev) => [...prev, ...formatted])
        setPeopleCursor(data.next_cursor ?? null)
      }
      setHasMore(data.has_more ?? false)
    } catch {
      // silently fail — user can keep swiping existing cards
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (loading || !hasMore) return
    const cards = mode === 'jobs' ? jobCards : peopleCards
    if (cards.length > 0 && currentIndex >= cards.length - 3) {
      loadMore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, mode, loading, hasMore])

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }
    const stored = getStoredFilters(mode)
    if (stored) {
      setDraftRoleFilter(stored.role)
      setDraftSearchFilter(stored.search)
      setDraftCountryFilter(stored.country)
      setDraftCityFilter(stored.city)
      setDraftMaxExperience(stored.experience)
      setDraftMaxSalary(stored.salary)
      setDraftBookmarkedOnly(stored.bookmarked)
      setRoleFilter(stored.role)
      setSearchFilter(stored.search)
      setCountryFilter(stored.country)
      setCityFilter(stored.city)
      setMaxExperience(stored.experience)
      setMaxSalary(stored.salary)
      setBookmarkedOnly(stored.bookmarked)
    } else {
      setDraftRoleFilter('')
      setDraftSearchFilter('')
      setDraftCountryFilter('')
      setDraftCityFilter('')
      setDraftMaxExperience(10)
      setDraftMaxSalary(200)
      setDraftBookmarkedOnly(false)
      setRoleFilter('')
      setSearchFilter('')
      setCountryFilter('')
      setCityFilter('')
      setMaxExperience(10)
      setMaxSalary(200)
      setBookmarkedOnly(false)
    }
  }, [mode])

  function applyFilters() {
    setRoleFilter(draftRoleFilter)
    setSearchFilter(draftSearchFilter)
    setCountryFilter(draftCountryFilter)
    setCityFilter(draftCityFilter)
    setMaxExperience(draftMaxExperience)
    setMaxSalary(draftMaxSalary)
    setBookmarkedOnly(draftBookmarkedOnly)
    setStoredFilters(mode, {
      role: draftRoleFilter,
      search: draftSearchFilter,
      country: draftCountryFilter,
      city: draftCityFilter,
      experience: draftMaxExperience,
      salary: draftMaxSalary,
      bookmarked: draftBookmarkedOnly,
    })
  }

  function resetFiltersAll() {
    setDraftRoleFilter('')
    setDraftSearchFilter('')
    setDraftCountryFilter('')
    setDraftCityFilter('')
    setDraftMaxExperience(10)
    setDraftMaxSalary(200)
    setDraftBookmarkedOnly(false)
    setRoleFilter('')
    setSearchFilter('')
    setCountryFilter('')
    setCityFilter('')
    setMaxExperience(10)
    setMaxSalary(200)
    setBookmarkedOnly(false)
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

  async function handleDecision(direction: SwipeDirection) {
    if (!currentCard || exitDirection || swipeLockedRef.current) return
    swipeLockedRef.current = true
    setError(null)
    setIsDragging(false)

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
          const firstName = currentCard.headline.split(' ')[0]
          const idx = Date.now() % OPENER_TEMPLATES.length
          setOpenerText(OPENER_TEMPLATES[idx](firstName))
          setMatchState({ open: true, id: currentCard.id, name: currentCard.headline, photo: currentCard.photo, subheadline: currentCard.subheadline })
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
if (direction === 'accept') {
  showToast(
    mode === 'jobs' ? 'Applied' : 'Like sent',
    'success',
    1200,
    true,
  )
}
window.setTimeout(() => advanceCard(), 260)
  }

  async function handleBookmark() {
    if (!currentCard || swipeLockedRef.current) return
    swipeLockedRef.current = true
    setError(null)

    try {
      const endpoint = mode === 'jobs' ? '/FeedController/jobAction' : '/FeedController/peopleAction'
      const idField = mode === 'jobs' ? 'jobId' : 'peopleId'
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: { [idField]: currentCard.id, action: 'bookmark' },
      })
      if (!response.ok) {
        setError(`Failed to bookmark ${mode === 'jobs' ? 'job' : 'person'}`)
        swipeLockedRef.current = false
        return
      }

      const setCards = mode === 'jobs' ? setJobCards : setPeopleCards
      setCards((prev) => prev.map((card) => card.id === currentCard.id ? { ...card, bookmarked: !card.bookmarked } : card))
    } catch {
      setError(`Failed to bookmark ${mode === 'jobs' ? 'job' : 'person'}`)
      swipeLockedRef.current = false
      return
    }

    swipeLockedRef.current = false
  }

  function handleKeepSwiping() {
    setMatchState({ open: false, id: '', name: '', photo: '', subheadline: '' })
    advanceCard()
  }

  async function handleSendOpener() {
    if (!openerText.trim() || openerSending) return
    setOpenerSending(true)
    try {
      const res = await apiRequest('/FeedController/sendMessage', {
        body: { recipientId: matchState.id, content: openerText.trim() },
      })
      if (!res.ok) showToast('Opener not sent — you can try from the thread.', 'info')
    } catch {
      showToast('Opener not sent — you can try from the thread.', 'info')
    } finally {
      setOpenerSending(false)
    }
    setMatchState({ open: false, id: '', name: '', photo: '', subheadline: '' })
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

  function dismissProfileCta() {
    localStorage.setItem('denoisr_profile_cta_dismissed', '1')
    setProfileCtaDismissed(true)
  }

  function handleOnboardingDismiss() {
    localStorage.removeItem('denoisr_just_signed_up')
    setShowOnboarding(false)
  }

  return (
    <div className="hp">
      {showOnboarding ? (
        <OnboardingModal onDismiss={handleOnboardingDismiss} />
      ) : null}
      {matchState.open ? (
        <div className="hp-match" role="dialog" aria-modal="true" aria-label="It's a fit">
          <div className="hp-match__wash" aria-hidden="true" />

          <div className="hp-match__particles" aria-hidden="true">
            {PARTICLES.map((p) => (
              <div key={p.id} className="hp-match__particle" style={p.style} />
            ))}
          </div>

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
            <span className="hp-match__eyebrow">Mutual interest · Just now</span>
            <h2 className="hp-match__title">It's a fit.</h2>
            <p className="hp-match__sub">
              {matchState.name.split(' ')[0]} also liked your card.
            </p>

            <div className="hp-match__opener">
              <span className="hp-match__openerLabel">Say something</span>
              <textarea
                className="hp-match__openerInput"
                value={openerText}
                onChange={(e) => setOpenerText(e.target.value)}
                rows={2}
                maxLength={280}
                placeholder="Write your opener…"
              />
            </div>

            <div className="hp-match__actions">
              <button
                type="button"
                className="btn btn--solidDark"
                onClick={handleSendOpener}
                disabled={openerSending || !openerText.trim()}
              >
                {openerSending ? 'Sending…' : 'Send opener'}
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

          {mode === 'jobs' && companyJobsCount !== null && companyJobsCount <= 0 && !companyCtaDismissed ? (
            <div className="hp-companyCta">
              <div className="hp-companyCta__body">
                {companyJobsCount === 0 ? (
                  <p className="hp-companyCta__text">
                    Your company has <strong>0 open positions</strong> &mdash; create one to attract candidates.
                  </p>
                ) : (
                  <p className="hp-companyCta__text">
                    You haven&rsquo;t set up a company yet &mdash; <strong>create one</strong> to start posting jobs.
                  </p>
                )}
              </div>
              <div className="hp-companyCta__actions">
                <button type="button" className="btn btn--solidDark" onClick={() => navigate('/company')}>
                  {companyJobsCount === 0 ? 'Post a job' : 'Set up company'}
                </button>
                <button type="button" className="hp-companyCta__dismiss" onClick={() => setCompanyCtaDismissed(true)} aria-label="Dismiss">
                  Later
                </button>
              </div>
            </div>
          ) : null}

          {showProfileCta ? (
            <div className="hp-companyCta">
              <div className="hp-companyCta__body">
                <span className="hp-eyebrow">Your profile</span>
                <p className="hp-companyCta__text">
                  <strong>Profile incomplete.</strong> Add a photo, role, and intro to appear in the deck.
                </p>
              </div>
              <div className="hp-companyCta__actions">
                <button type="button" className="btn btn--solidDark" onClick={() => navigate('/profile/edit')}>
                  Complete profile
                </button>
                <button type="button" className="hp-companyCta__dismiss" onClick={dismissProfileCta}>
                  Later
                </button>
              </div>
            </div>
          ) : null}

          <div className="hp-fieldset">
            <label className="hp-field">
              <span className="hp-field__label">Search</span>
              <input
                className="hp-input"
                placeholder="Company, skill, or title"
                value={draftSearchFilter}
                onChange={(e) => setDraftSearchFilter(e.target.value)}
              />
            </label>

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

            <div className="hp-fieldset__toggle">
              <button
                type="button"
                className={`hp-chipToggle${draftBookmarkedOnly ? ' hp-chipToggle--active' : ''}`}
                onClick={() => setDraftBookmarkedOnly((v) => !v)}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 2h10a1 1 0 011 1v15l-6-3.5L4 18V3a1 1 0 011-1z" />
                </svg>
                Bookmarked
              </button>
            </div>

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
        <section className="hp-panel hp-deck" ref={deckRef}>
          <div className="hp-deck__topbar">
            {currentCard ? (
              <div className="hp-deck__count el-meta">
                <span>{pad2(currentIndex + 1)}</span>
                <span style={{ color: 'var(--ink-5)' }}>/ {pad2(totalCount)}</span>
                <span style={{ color: 'var(--ink-5)', margin: '0 6px' }}>·</span>
                <span style={{ color: 'var(--ink-5)' }}>{totalCount - (currentIndex + 1)} left</span>
              </div>
            ) : null}
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
            {bookmarkedOnly ? <span className="hp-chip hp-chip--bookmarked">Bookmarked</span> : null}
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

          {mode === 'jobs' && companyJobsCount !== null && companyJobsCount <= 0 && !companyCtaDismissed ? (
            <div className="hp-companyCta hp-companyCta--deck">
              <div className="hp-companyCta__body">
                <span className="hp-eyebrow">Your company</span>
                {companyJobsCount === 0 ? (
                  <p className="hp-companyCta__text">
                    Your company has <strong>0 open positions</strong> &mdash; create one to attract candidates.
                  </p>
                ) : (
                  <p className="hp-companyCta__text">
                    You haven&rsquo;t set up a company yet &mdash; <strong>create one</strong> to start posting jobs.
                  </p>
                )}
              </div>
              <div className="hp-companyCta__actions">
                <button type="button" className="btn btn--solidDark" onClick={() => navigate('/company')}>
                  {companyJobsCount === 0 ? 'Post a job' : 'Set up company'}
                </button>
                <button type="button" className="hp-companyCta__dismiss" onClick={() => setCompanyCtaDismissed(true)} aria-label="Dismiss">
                  Later
                </button>
              </div>
            </div>
          ) : null}

          {showProfileCta ? (
            <div className="hp-companyCta hp-companyCta--deck">
              <div className="hp-companyCta__body">
                <span className="hp-eyebrow">Your profile</span>
                <p className="hp-companyCta__text">
                  <strong>Profile incomplete.</strong> Add a photo, role, and intro to appear in the deck.
                </p>
              </div>
              <div className="hp-companyCta__actions">
                <button type="button" className="btn btn--solidDark" onClick={() => navigate('/profile/edit')}>
                  Complete profile
                </button>
                <button type="button" className="hp-companyCta__dismiss" onClick={dismissProfileCta}>
                  Later
                </button>
              </div>
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
                        transform: `translateY(${(exitDirection ? offset : offset + 1) * 10}px) scale(${1 - (exitDirection ? offset : offset + 1) * 0.03})`,
                      }}
                      aria-hidden="true"
                    />
                  ))}

                <article
                  ref={cardRef}
                  className={`hp-card hp-card--top ${
                    exitDirection === 'accept'
                      ? 'hp-card--exitRight'
                      : exitDirection === 'reject'
                        ? 'hp-card--exitLeft'
                        : ''
                  } ${entering ? 'hp-card--enter' : ''} ${isDragging ? 'hp-card--dragging' : ''} ${cardOverflows ? 'hp-card--overflow' : ''}`}
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
                    style={{ opacity: exitDirection === 'reject' ? 1 : dragX < 0 ? swipeIndicatorOpacity : 0 }}
                    aria-hidden="true"
                  >
                    SKIP
                  </div>
                  <div
                    className="hp-card__stamp hp-card__stamp--fit"
                    style={{ opacity: exitDirection === 'accept' ? 1 : dragX > 0 ? swipeIndicatorOpacity : 0 }}
                    aria-hidden="true"
                  >
                    {mode === 'jobs' ? 'APPLY' : 'FIT'}
                  </div>

                  <div className="hp-card__head">
                    <div
                      className={`hp-card__avatar${((mode === 'people' && currentCard.photo) || (mode === 'jobs' && currentCard.companyPhoto)) ? ' hp-card__avatar--photo' : ''}`}
                      style={(mode === 'people' && currentCard.photo) || (mode === 'jobs' && currentCard.companyPhoto)
                        ? { backgroundImage: `url(${mode === 'people' ? currentCard.photo : currentCard.companyPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: swatchFor(currentCard.id) }}
                      aria-hidden="true"
                    >
                      {(mode === 'people' && currentCard.photo) || (mode === 'jobs' && currentCard.companyPhoto) ? null : initialsOf(currentCard.organization || currentCard.headline)}
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

                  {cardOverflows && !cardAtBottom ? <div className="hp-scrollArrow" aria-hidden="true" /> : null}
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
                  className={`hp-actionbtn hp-actionbtn--bookmark${currentCard.bookmarked ? ' hp-actionbtn--bookmarked' : ''}`}
                  aria-label="Bookmark"
                  onClick={handleBookmark}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill={currentCard.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 2h10a1 1 0 011 1v15l-6-3.5L4 18V3a1 1 0 011-1z" />
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
                <span>Bookmark</span>
                <span>{acceptLabel}</span>
              </div>
            </>
          ) : loadingMore ? (
            <div className="hp-empty hp-empty--loading">
              <span className="hp-eyebrow">Denoisr · Loading more</span>
              <div className="loader__pulse" aria-hidden="true">
                <span /><span /><span />
              </div>
            </div>
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
        <aside className="hp-panel hp-preview" ref={previewRef}>
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
          {previewOverflows && !previewAtBottom ? <div className="hp-scrollArrow hp-scrollArrow--sticky" aria-hidden="true" /> : null}
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
                <span className="hp-field__label">Search</span>
                <input
                  className="hp-input"
                  placeholder="Company, skill, or title"
                  value={draftSearchFilter}
                  onChange={(e) => setDraftSearchFilter(e.target.value)}
                />
              </label>

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

                <div className="hp-fieldset__toggle">
                  <button
                    type="button"
                    className={`hp-chipToggle${draftBookmarkedOnly ? ' hp-chipToggle--active' : ''}`}
                    onClick={() => setDraftBookmarkedOnly((v) => !v)}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 2h10a1 1 0 011 1v15l-6-3.5L4 18V3a1 1 0 011-1z" />
                    </svg>
                    Bookmarked
                  </button>
                </div>
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

    </div>
  )
}
