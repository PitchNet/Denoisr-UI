import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/landing.css'

type Step = { num: string; title: string; body: string }

type DeckCard = {
  initials: string
  swatch: string
  eyebrow: string
  title: string
  meta: string
  chips: string[]
  body: string
}

type Paper = {
  index: string
  source: string
  authors: string
  year: string
  title: string
  body: string
  href: string
}

type Versus = { topic: string; feed: string; denoisr: string }
type Faq = { q: string; a: string }

const jobsDeck: DeckCard[] = [
  {
    initials: 'LN',
    swatch: 'oklch(0.78 0.10 220)',
    eyebrow: 'Linear · Series C',
    title: 'Founding design engineer.',
    meta: 'Remote · Europe · €120–160k',
    chips: ['React', 'Design systems', 'Type-first', 'Prototype-obsessed'],
    body: 'You would own the primitives — colour, type, motion — and the prototypes that turn them into product. Small team, long horizons, ship-on-Tuesdays culture.',
  },
  {
    initials: 'ST',
    swatch: 'oklch(0.80 0.11 65)',
    eyebrow: 'Stripe · Atlas team',
    title: 'Senior backend, payments.',
    meta: 'Remote · Americas · $210–260k',
    chips: ['Go', 'Distributed systems', 'Postgres', 'Latency-obsessed'],
    body: 'You would push the p99 down on the busiest path at Stripe and earn the right to design what runs next. Brutal scrutiny, generous credit.',
  },
  {
    initials: 'FG',
    swatch: 'oklch(0.78 0.10 320)',
    eyebrow: 'Figma · Multiplayer',
    title: 'Product designer, canvas.',
    meta: 'Hybrid · NYC / SF · $190–230k',
    chips: ['Canvas', 'Realtime', 'Motion', 'Hand-rolled prototypes'],
    body: 'The team designs the surface the whole product sits on. Every pixel survives a thousand iterations. Bring strong opinions, hold them loosely.',
  },
  {
    initials: 'SB',
    swatch: 'oklch(0.82 0.08 150)',
    eyebrow: 'Supabase · Realtime',
    title: 'Staff engineer, infra.',
    meta: 'Remote · Global · $230–280k',
    chips: ['Elixir', 'Postgres', 'Open source', 'Operator mindset'],
    body: 'Own the realtime layer the entire ecosystem is built on. Open source by default; reputation compounds in public.',
  },
  {
    initials: 'VC',
    swatch: 'oklch(0.80 0.09 200)',
    eyebrow: 'Vercel · DX',
    title: 'Engineering manager, edge.',
    meta: 'Remote · Europe · $200–240k',
    chips: ['Edge runtime', 'Team of 6', 'Player-coach', 'DX'],
    body: 'Build the team that builds the runtime millions of sites depend on. Quiet leadership, written communication, decisions in public.',
  },
]

const peopleDeck: DeckCard[] = [
  {
    initials: 'PS',
    swatch: 'oklch(0.78 0.10 220)',
    eyebrow: 'Open to talk · Hiring',
    title: 'Priya Sharma · VP Eng.',
    meta: 'Berlin · TechCorp · Series D',
    chips: ['Hiring 4 ICs', 'Infra-heavy', 'Async-first', 'No leetcode'],
    body: 'Looking for founding-style ICs to anchor a payments rewrite. Will trade equity for thesis. Prefers conversations that start with prior work.',
  },
  {
    initials: 'RV',
    swatch: 'oklch(0.80 0.11 65)',
    eyebrow: 'Open to roles · Senior',
    title: 'Rahul Verma · Backend.',
    meta: 'Berlin / remote · 9 yrs · Go, Rust',
    chips: ['Distributed systems', 'OSS maintainer', 'Wants smaller team', 'Eu hours'],
    body: 'Shipped the order-routing engine at a public fintech. Looking for early-stage with technical founders. Long horizons over big titles.',
  },
  {
    initials: 'AP',
    swatch: 'oklch(0.78 0.10 320)',
    eyebrow: 'Independent · Available May',
    title: 'Ananya Patel · Designer.',
    meta: 'Lisbon · Product · 7 yrs',
    chips: ['Design systems', 'Prototyping', 'Type', 'Health, fintech'],
    body: 'Three engagements, four-month max, design-system-shaped problems. Two slots open in May. Examples on request, not in public.',
  },
  {
    initials: 'KM',
    swatch: 'oklch(0.82 0.08 150)',
    eyebrow: 'Open to talk · Co-founder',
    title: 'Kenji Mori · Founder.',
    meta: 'Tokyo · ex-Stripe · Looking for CTO',
    chips: ['Pre-seed', 'Climate', 'Hardware-adjacent', 'Will relocate'],
    body: 'Spinning up something in industrial decarbonisation. Looking for a CTO with infra depth and operator instincts. First conversations later in March.',
  },
  {
    initials: 'LJ',
    swatch: 'oklch(0.78 0.10 250)',
    eyebrow: 'Open to roles · Staff',
    title: 'Lara Janssen · Staff EM.',
    meta: 'Amsterdam · 12 yrs · Platform',
    chips: ['Org design', 'Player-coach', 'Wants IC depth back', 'EU only'],
    body: 'Built three platform teams from scratch. Considering a step back into senior IC at a company that still ships. References on contact.',
  },
]

const steps: Step[] = [
  {
    num: '01',
    title: 'State your intent.',
    body: 'Hiring, exploring, open to collaborations. Time-bound, never permanent. The platform reads intent, not vanity metrics.',
  },
  {
    num: '02',
    title: 'Swipe a curated deck.',
    body: 'Ten to twenty matches a day — not a feed. Each one carries context: what the work is, who the people are, why it surfaced.',
  },
  {
    num: '03',
    title: 'Talk only when it fits.',
    body: 'Conversations open on mutual interest. No cold inbox, no recruiter spray. Replies happen because both sides chose to.',
  },
]

const versus: Versus[] = [
  {
    topic: 'Discovery',
    feed: 'Infinite scroll. The algorithm decides; you keep tapping.',
    denoisr: '10–20 curated cards a day. The deck ends. You leave.',
  },
  {
    topic: 'Profile',
    feed: 'Public résumé. Self-summarised. Optimised for the search box.',
    denoisr: 'Private by default. Work-attested. Read only by people you opened to.',
  },
  {
    topic: 'Outreach',
    feed: 'Cold InMail. Anyone with a seat can reach anyone.',
    denoisr: 'Mutual consent only. The thread opens because both sides chose.',
  },
  {
    topic: 'Cadence',
    feed: 'Post or vanish. Visibility decays with silence.',
    denoisr: 'Visit only when there is something to do. Silence costs nothing.',
  },
  {
    topic: 'Time horizon',
    feed: 'Permanent presence. The profile lives forever.',
    denoisr: 'Intent expires in 14 / 30 / 90 days. You re-state, or you go quiet.',
  },
]

const papers: Paper[] = [
  {
    index: 'Paper 01',
    source: 'ACM RecSys',
    authors: 'Pizzato, Rej, Chung, Koprinska, Kay',
    year: '2010',
    title: 'RECON — a reciprocal recommender for online dating.',
    body:
      'Recommending only when interest is mutual outperformed one-sided recommenders on both successful-contact rate and precision. The argument transfers: mutual-consent messaging is a stronger primitive than ranked outreach.',
    href: 'https://dl.acm.org/doi/10.1145/1864708.1864747',
  },
  {
    index: 'Paper 02',
    source: 'American Economic Review · 100(1)',
    authors: 'Hitsch, Hortaçsu, Ariely',
    year: '2010',
    title: 'Matching and sorting in online matching markets.',
    body:
      'Two-sided online markets sort hard along stated preference and observable traits, and outcomes track Gale–Shapley deferred-acceptance predictions. Strong evidence that explicit intent + curated deck beats open feed for matching efficiency.',
    href: 'https://www.aeaweb.org/articles?id=10.1257/aer.100.1.130',
  },
  {
    index: 'Paper 03',
    source: 'American Economic Review · 110(3)',
    authors: 'Allcott, Braghieri, Eichmeyer, Gentzkow',
    year: '2020',
    title: 'The welfare effects of social media.',
    body:
      'Deactivating Facebook for four weeks raised subjective well-being and reduced political polarisation, even when participants knew the trial would end. A measured case against feed-shaped attention as the default for professional life.',
    href: 'https://www.aeaweb.org/articles?id=10.1257/aer.20190658',
  },
]

const faqs: Faq[] = [
  {
    q: 'Who sees my profile?',
    a: 'Only people you actively open to — by liking their card, accepting an invite, or replying to a thread. There is no public profile, no search index, no recruiter dashboard browsing strangers. If you go quiet, you disappear.',
  },
  {
    q: 'What does the deck draw from?',
    a: 'Your stated intent (hiring · open · exploring), the work attached to your profile, and the people who attested to that work. We do not buy data, scrape LinkedIn, or infer intent from clicks. The deck is small because the inputs are explicit.',
  },
  {
    q: 'What if I am not actively looking or hiring?',
    a: 'Set intent to "open to talk" and we surface you to a much smaller set — typically peers and old collaborators rather than recruiters. Or set no intent at all and the platform stays dormant for you. Read-only is the default.',
  },
  {
    q: 'Is it free?',
    a: 'Free for individuals during the beta. Companies pay per active hiring intent, billed monthly — not per seat, not per posting. Pricing goes public when the beta does.',
  },
  {
    q: 'Why is everything off-white instead of pure white?',
    a: 'Paper, not screen. The whole interface is built to be looked at briefly and put down. Off-white reads as something you would consult — not something you would scroll.',
  },
]

function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span className="el-wordmark" style={{ fontSize: size }}>
      Denoisr<span className="dot">.</span>
    </span>
  )
}

function CardFace({ card, isTop, exit }: { card: DeckCard; isTop: boolean; exit: ExitKind }) {
  return (
    <article
      className={`el-herocard ${isTop ? 'el-herocard--top' : 'el-herocard--behind'} ${
        exit ? `el-herocard--exit el-herocard--exit-${exit}` : ''
      }`}
      aria-hidden={!isTop}
    >
      <div className="el-herocard__top">
        <div className="el-herocard__avatar" style={{ background: card.swatch }} aria-hidden="true">
          {card.initials}
        </div>
        <span className="el-herocard__company">{card.eyebrow}</span>
      </div>

      <div className="el-herocard__title">{card.title}</div>
      <div className="el-herocard__meta">{card.meta}</div>

      <div className="el-herocard__chips">
        {card.chips.map((c) => (
          <span key={c} className="el-herocard__chip">{c}</span>
        ))}
      </div>

      <p className="el-herocard__body">{card.body}</p>
    </article>
  )
}

type ExitKind = null | 'pass' | 'like' | 'bookmark'

function InteractiveDeck({ deck }: { deck: DeckCard[] }) {
  const [topIndex, setTopIndex] = useState(0)
  const [exit, setExit] = useState<ExitKind>(null)
  const [counts, setCounts] = useState({ pass: 0, like: 0, bookmark: 0 })
  const lockedRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setTopIndex(0)
    setExit(null)
    setCounts({ pass: 0, like: 0, bookmark: 0 })
    lockedRef.current = false
  }, [deck])

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  function decide(kind: Exclude<ExitKind, null>) {
    if (lockedRef.current) return
    lockedRef.current = true
    setExit(kind)
    setCounts((c) => ({ ...c, [kind]: c[kind] + 1 }))
    timerRef.current = window.setTimeout(() => {
      setTopIndex((i) => (i + 1) % deck.length)
      setExit(null)
      lockedRef.current = false
    }, 260)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); decide('pass') }
    if (e.key === 'ArrowRight') { e.preventDefault(); decide('like') }
    if (e.key === 'ArrowUp') { e.preventDefault(); decide('bookmark') }
  }

  const topCard = deck[topIndex]
  const behindCard = deck[(topIndex + 1) % deck.length]
  const position = String(topIndex + 1).padStart(2, '0')
  const total = String(deck.length).padStart(2, '0')

  return (
    <div
      className="el-deck"
      onKeyDown={onKeyDown}
      tabIndex={0}
      aria-label="Sample deck. Arrow keys: left skip, right like, up bookmark."
    >
      <div className="el-deck__progress el-meta" aria-hidden="true">
        <span>{position} <span style={{ color: 'var(--ink-5)' }}>/ {total}</span></span>
        <span>
          <span style={{ color: 'var(--decision-pass)' }}>×{counts.pass}</span>
          <span style={{ color: 'var(--ink-5)', margin: '0 8px' }}>·</span>
            <span style={{ color: 'var(--accent)' }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -1, marginRight: 2 }}>
                <path d="M4 2h12v16l-6-4-6 4V2z" />
              </svg>
              {counts.bookmark}
            </span>
          <span style={{ color: 'var(--ink-5)', margin: '0 8px' }}>·</span>
          <span style={{ color: 'var(--decision-like)' }}>♥{counts.like}</span>
        </span>
      </div>

      <div className="el-deck__stage">
        <div className="el-deck__behind">
          <CardFace card={behindCard} isTop={false} exit={null} />
        </div>
        <div className="el-deck__top" key={topIndex}>
          <CardFace card={topCard} isTop exit={exit} />
        </div>
      </div>

      <div className="el-deck__actions">
        <button type="button" className="el-actionbtn el-actionbtn--pass" aria-label="Skip" onClick={() => decide('pass')}>
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 5l12 12M17 5L5 17" />
          </svg>
        </button>
        <button type="button" className="el-actionbtn el-actionbtn--bookmark" aria-label="Bookmark" onClick={() => decide('bookmark')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2h12v16l-6-4-6 4V2z" />
          </svg>
        </button>
        <button type="button" className="el-actionbtn el-actionbtn--like" aria-label="Like" onClick={() => decide('like')}>
          <svg width="20" height="20" viewBox="0 0 22 22" fill="currentColor">
            <path d="M11 19s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0118 9c0 5.5-7 10-7 10z" />
          </svg>
        </button>
      </div>

      <div className="el-deck__hint el-meta">
        <span>← skip</span>
        <span>·</span>
        <span>
          <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -1, marginRight: 2 }}>
            <path d="M4 2h12v16l-6-4-6 4V2z" />
          </svg>
          {' '}save
        </span>
        <span>·</span>
        <span>→ like</span>
      </div>
    </div>
  )
}

export default function ProductPage() {
  const [mode, setMode] = useState<'jobs' | 'people'>('jobs')

  function smoothJump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="editorial-landing">
      {/* ── Chrome ── */}
      <header className="el-chrome">
        <div className="el-container el-chrome__inner">
          <Link to="/" aria-label="Denoisr">
            <Wordmark />
          </Link>

          <div className="el-mode" role="tablist" aria-label="Browse mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'jobs'}
              className={`el-mode__btn ${mode === 'jobs' ? 'el-mode__btn--active' : ''}`}
              onClick={() => setMode('jobs')}
            >
              Jobs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'people'}
              className={`el-mode__btn ${mode === 'people' ? 'el-mode__btn--active' : ''}`}
              onClick={() => setMode('people')}
            >
              People
            </button>
          </div>

          <nav className="el-chrome__nav">
            <a href="#how" onClick={(e) => smoothJump(e, 'how')} className="el-navlink el-navlink--marketing">How it works</a>
            <a href="#vs" onClick={(e) => smoothJump(e, 'vs')} className="el-navlink el-navlink--marketing">vs the feed</a>
            <a href="#research" onClick={(e) => smoothJump(e, 'research')} className="el-navlink el-navlink--marketing">Research</a>
            <Link to="/login" className="el-navlink">Sign in</Link>
            <Link to="/signup" className="el-btn el-btn--primary el-btn--sm">Sign up</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="el-hero">
        <div className="el-hero__wash" aria-hidden="true" />
        <div className="el-container el-hero__inner">
          <div>
            <div className="el-hero__brow">
              <span className="el-hero__brow-dot" aria-hidden="true" />
              <span className="el-eyebrow">Spring 2026 · {mode === 'jobs' ? 'Jobs' : 'People'}</span>
            </div>

            <h1 className="el-hero__headline">
              Hire by signal.<br />
              Get hired by <em>proof</em>.
            </h1>

            <p className="el-hero__sub">
              Denoisr is the professional network without the feed. State intent,
              swipe a curated deck, talk only when both sides chose to — and skip
              the noise that everyone else mistakes for work.
            </p>

            <div className="el-hero__cta">
              <Link to="/signup?source=linkedin" className="el-btn el-btn--primary">Import from LinkedIn</Link>
              <p className="el-hero__cta-sub el-meta">Paste your LinkedIn URL. Profile filled in seconds.</p>
            </div>

            <div className="el-hero__foot el-meta">
              <span>No public profiles</span>
              <span className="dot">·</span>
              <span>Read-only by default</span>
              <span className="dot">·</span>
              <Link to="/login" className="el-hero__signin">Already a member? Sign in →</Link>
            </div>
          </div>

          <InteractiveDeck deck={mode === 'jobs' ? jobsDeck : peopleDeck} />
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="el-section">
        <div className="el-container">
          <div className="el-section__head">
            <span className="el-eyebrow">How it works · Three steps</span>
            <h2 className="el-section__title">
              State intent. Swipe the deck. <em>Talk when it fits.</em>
            </h2>
            <p className="el-section__sub">
              The whole product is three motions. The rest of the time, Denoisr
              stays out of your way.
            </p>
          </div>

          <div className="el-steps">
            {steps.map((s) => (
              <article key={s.num} className="el-step">
                <span className="el-step__num">— {s.num}</span>
                <h3 className="el-step__title">{s.title}</h3>
                <p className="el-step__body">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── LinkedIn import ── */}
      <section id="import" className="el-section el-section--paper2">
        <div className="el-container">
          <div className="el-section__head">
            <span className="el-eyebrow">Import · One paste</span>
            <h2 className="el-section__title">
              Your profile. <em>Filled in ten seconds.</em>
            </h2>
            <p className="el-section__sub">
              Paste your LinkedIn URL and we pull everything — experience, skills, projects.
              You just review. No manual entry, no blank slates.
            </p>
          </div>

          <div className="el-import">
            <div className="el-import__demo">
              <span className="el-import__demo-url">https://linkedin.com/in/your-profile</span>
              <span className="el-import__demo-arrow">→</span>
              <span className="el-import__demo-result">Filled profile</span>
            </div>
            <div className="el-import__items">
              <div className="el-import__item">
                <span className="el-import__check" aria-hidden="true">✓</span>
                <span>Work experience &amp; projects</span>
              </div>
              <div className="el-import__item">
                <span className="el-import__check" aria-hidden="true">✓</span>
                <span>Skills &amp; highlights</span>
              </div>
              <div className="el-import__item">
                <span className="el-import__check" aria-hidden="true">✓</span>
                <span>Role, location, compensation preference</span>
              </div>
              <div className="el-import__item">
                <span className="el-import__check" aria-hidden="true">✓</span>
                <span>Ready to swipe in under 60 seconds</span>
              </div>
            </div>
          </div>

          <div className="el-import__cta">
            <Link to="/signup?source=linkedin" className="el-btn el-btn--primary">
              Import your profile
            </Link>
          </div>
        </div>
      </section>

      {/* ── vs the feed ── */}
      <section id="vs" className="el-section el-section--paper2">
        <div className="el-container">
          <div className="el-section__head">
            <span className="el-eyebrow">The contrast · Plainly stated</span>
            <h2 className="el-section__title">
              What the feed does. What we do instead.
            </h2>
          </div>

          <div className="el-vs">
            <div className="el-vs__head">
              <span className="el-vs__col-label">What you have come to expect</span>
              <span className="el-vs__col-label el-vs__col-label--right">What Denoisr does</span>
            </div>
            {versus.map((row) => (
              <div key={row.topic} className="el-vs__row">
                <div className="el-vs__topic">{row.topic}</div>
                <div className="el-vs__feed">{row.feed}</div>
                <div className="el-vs__den">{row.denoisr}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Research ── */}
      <section id="research" className="el-section el-section--paper3">
        <div className="el-container">
          <div className="el-section__head">
            <span className="el-eyebrow">Research · Reading room</span>
            <h2 className="el-section__title">The thesis, with citations.</h2>
            <p className="el-section__sub">
              Denoisr's three primitives — intent, mutual consent, no feed —
              each lean on a body of public research. Three starting points.
            </p>
          </div>

          <div className="el-papers">
            {papers.map((p) => (
              <article key={p.index} className="el-paper">
                <div className="el-paper__index">
                  <span>{p.index}</span>
                  <span>{p.year}</span>
                </div>
                <div className="el-paper__source">{p.source}</div>
                <h3 className="el-paper__title">{p.title}</h3>
                <p className="el-paper__authors">{p.authors}</p>
                <p className="el-paper__body">{p.body}</p>
                <a href={p.href} target="_blank" rel="noreferrer noopener" className="el-paper__link">
                  Read paper →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="el-section">
        <div className="el-container">
          <div className="el-section__head">
            <span className="el-eyebrow">Questions · Plainly answered</span>
            <h2 className="el-section__title">Before you ask.</h2>
          </div>

          <div className="el-faq">
            {faqs.map((f, i) => (
              <details key={f.q} className="el-faq__item" open={i === 0}>
                <summary className="el-faq__q">
                  <span>{f.q}</span>
                  <span className="el-faq__chev" aria-hidden="true">+</span>
                </summary>
                <div className="el-faq__a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="el-section">
        <div className="el-container">
          <div className="el-cta">
            <div className="el-cta__inner">
              <span className="el-eyebrow">Open to new members · Spring 2026</span>
              <h2 className="el-cta__title">
                Skip the feed. <em>Find the fit.</em>
              </h2>
              <p className="el-cta__sub">
                Paste your LinkedIn URL and import your profile in one go. The deck arrives the next morning.
              </p>
              <div className="el-cta__actions">
                <Link to="/signup?source=linkedin" className="el-btn el-btn--primary">
                  Import from LinkedIn
                </Link>
                <Link to="/login" className="el-btn el-btn--ghost">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="el-footer">
        <div className="el-container">
          <div className="el-footer__top">
            <div className="el-footer__brand">
              <Wordmark size={22} />
              <p className="el-footer__tagline">High-signal · Intent-led · Read-only by default</p>
            </div>

            <div className="el-footer__cols">
              <div className="el-footer__col">
                <div className="el-footer__col-title">Product</div>
                <ul>
                  <li><Link to="/features">Features</Link></li>
                  <li><Link to="/how-it-works">How it works</Link></li>
                  <li><Link to="/for-recruiters">For recruiters</Link></li>
                </ul>
              </div>
              <div className="el-footer__col">
                <div className="el-footer__col-title">Company</div>
                <ul>
                  <li><Link to="/about">About</Link></li>
                  <li><Link to="/careers">Careers</Link></li>
                  <li><Link to="/contact">Contact</Link></li>
                </ul>
              </div>
              <div className="el-footer__col">
                <div className="el-footer__col-title">Trust</div>
                <ul>
                  <li><Link to="/security">Security</Link></li>
                  <li><Link to="/privacy-policy">Privacy</Link></li>
                  <li><Link to="/terms-of-service">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="el-footer__base">
            <span>© 2026 Denoisr</span>
            <span>v 0.05 · Spring beta</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
