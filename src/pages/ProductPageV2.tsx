import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/landing-v2.css'
import { InteractiveDeck, Wordmark } from '../components/landing/InteractiveDeck'
import { faqs, jobsDeck, papers, peopleDeck, steps, versus } from '../data/landing'
import { useCountUp, useScrollReveal, useStaggeredReveal } from '../hooks/useScrollReveal'

// ── The noise: a full-screen field of feed fragments that clears as you scroll ──
type Fragment = { text: string; top: string; left: string; rot: number; kind: 'label' | 'glyph' | 'card' }

const introFragments: Fragment[] = [
  { text: 'cold InMail', top: '8%', left: '6%', rot: -8, kind: 'label' },
  { text: 'recruiter spray', top: '12%', left: '70%', rot: 6, kind: 'label' },
  { text: 'viewed by 4 recruiters', top: '4%', left: '38%', rot: 3, kind: 'label' },
  { text: 'open to work', top: '22%', left: '3%', rot: -5, kind: 'label' },
  { text: 'infinite scroll', top: '74%', left: '8%', rot: 7, kind: 'label' },
  { text: '#hustle', top: '84%', left: '64%', rot: -6, kind: 'label' },
  { text: 'connect?', top: '36%', left: '86%', rot: 9, kind: 'label' },
  { text: 'endorsed you for React', top: '90%', left: '30%', rot: -4, kind: 'label' },
  { text: 'sponsored', top: '52%', left: '80%', rot: 5, kind: 'label' },
  { text: 'people you may know', top: '64%', left: '72%', rot: -7, kind: 'label' },
  { text: 'we are hiring!!', top: '16%', left: '20%', rot: 4, kind: 'label' },
  { text: 'apply now', top: '44%', left: '4%', rot: -3, kind: 'label' },
  { text: 'are you open to opportunities?', top: '6%', left: '54%', rot: -2, kind: 'label' },
  { text: '500+ connections', top: '30%', left: '24%', rot: 5, kind: 'label' },
  { text: 'top voice', top: '58%', left: '14%', rot: -8, kind: 'label' },
  { text: 'trending in your network', top: '80%', left: '40%', rot: 3, kind: 'label' },
  { text: 'like · comment · repost', top: '70%', left: '56%', rot: -5, kind: 'label' },
  { text: 'someone viewed your profile', top: '26%', left: '58%', rot: 7, kind: 'label' },
  { text: 'congrats on the work anniversary', top: '48%', left: '40%', rot: -4, kind: 'label' },
  { text: '░▒▓ ▒░▓ ▒▒░ ▓▒░', top: '38%', left: '18%', rot: -3, kind: 'glyph' },
  { text: '▓░▒ ░▒▓ ▒░ ▓▒', top: '54%', left: '60%', rot: 4, kind: 'glyph' },
  { text: '▒▓░ ▓▒░ ░▓▒ ▒░▓', top: '88%', left: '74%', rot: -5, kind: 'glyph' },
  { text: '░▓▒ ▒░▓ ▓░▒', top: '18%', left: '88%', rot: 6, kind: 'glyph' },
  { text: '▒░▓ ░▓▒ ▒▓░', top: '62%', left: '34%', rot: -6, kind: 'glyph' },
  { text: '5 unread · 12 likes · 3 reposts', top: '34%', left: '8%', rot: -6, kind: 'card' },
  { text: '"Quick question about a role…"', top: '60%', left: '46%', rot: 5, kind: 'card' },
  { text: '"I came across your profile…"', top: '14%', left: '40%', rot: -4, kind: 'card' },
  { text: 'Inbox (47)', top: '82%', left: '14%', rot: 6, kind: 'card' },
]

// ── Notification-spam widgets: bell/message icons whose count badge ticks up ──
type NotifWidget = {
  icon: 'bell' | 'message'
  top: string
  left: string
  rot: number
  base: number   // starting count
  rate: number   // how fast it climbs per tick
  label?: string // optional toast-style label
}

const notifWidgets: NotifWidget[] = [
  { icon: 'bell', top: '10%', left: '30%', rot: -5, base: 12, rate: 3 },
  { icon: 'message', top: '46%', left: '12%', rot: 4, base: 47, rate: 5, label: 'Messages' },
  { icon: 'bell', top: '72%', left: '64%', rot: 6, base: 8, rate: 2, label: 'Notifications' },
  { icon: 'message', top: '28%', left: '78%', rot: -6, base: 91, rate: 7 },
]

function NotifIcon({ kind }: { kind: NotifWidget['icon'] }) {
  return kind === 'bell' ? (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 3a4 4 0 014 4c0 4 1.5 5 1.5 5h-11S6 11 6 7a4 4 0 014-4z" />
      <path d="M8.5 16a1.5 1.5 0 003 0" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5.5A1.5 1.5 0 014.5 4h11A1.5 1.5 0 0117 5.5v7A1.5 1.5 0 0115.5 14H7l-4 3z" />
    </svg>
  )
}

function notifCount(base: number, rate: number, tick: number) {
  const n = base + rate * tick
  return n > 99 ? '99+' : String(n)
}

// ── Recruiter-spray message threads: cold-InMail bubbles that cascade in on a loop ──
type MsgThread = { top: string; left: string; rot: number; sender: string; msgs: string[] }

const messageThreads: MsgThread[] = [
  {
    top: '66%', left: '23%', rot: -4,
    sender: 'Recruiter · TalentCo',
    msgs: ['Hi! I came across your profile…', 'Are you open to new opportunities?', 'Quick 15-min call this week?'],
  },
  {
    top: '20%', left: '72%', rot: 5,
    sender: 'Sourcer · BigCo',
    msgs: ['Impressive background!', 'We have a role that fits you', 'Can I grab 10 minutes?'],
  },
]

// ── Pain points that flash one-by-one over the noise ──
const painPoints = [
  'Cold InMail from someone who never read your profile.',
  'You post, or you vanish.',
  '300 applicants. One keyword filter.',
  'Your feed rewards noise, not work.',
  'Recruiters spray. Nobody listens.',
  'You’re shouting into an infinite scroll.',
]

export default function ProductPageV2() {
  const [mode, setMode] = useState<'jobs' | 'people'>('jobs')
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  // Scroll-driven clearing of the intro noise (0 = full noise, 1 = cleared).
  const introRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const el = introRef.current
    if (!el) return
    let raf = 0
    const compute = () => {
      const runway = el.offsetHeight - window.innerHeight
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(runway, 1))
      setProgress(runway > 0 ? scrolled / runway : 0)
    }
    const onScroll = () => {
      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(compute)
    }
    raf = window.requestAnimationFrame(compute)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Flash the pain points one at a time while the intro is on screen.
  const [painIdx, setPainIdx] = useState(0)
  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setPainIdx((i) => (i + 1) % painPoints.length), 1700)
    return () => window.clearInterval(id)
  }, [reduced])

  // Climb the notification-spam badges (frozen under reduced motion → static "99+").
  const [notifTick, setNotifTick] = useState(0)
  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setNotifTick((t) => t + 1), 550)
    return () => window.clearInterval(id)
  }, [reduced])

  // Reveal the navbar only once the noise has cleared (or immediately if reduced motion).
  const navRevealed = reduced || progress > 0.88

  function smoothJump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // The three primitives, each paired with the noise it replaces.
  const signals = [
    { ...steps[0], replaces: 'Permanent presence. A profile that lives forever.' },
    { ...steps[1], replaces: 'Infinite scroll. The algorithm decides; you keep tapping.' },
    { ...steps[2], replaces: 'Cold InMail. Anyone with a seat can reach anyone.' },
  ]

  const noiseHead = useScrollReveal<HTMLDivElement>()
  const noiseList = useStaggeredReveal<HTMLDivElement>(80)
  const signalHead = useScrollReveal<HTMLDivElement>()
  const signalGrid = useStaggeredReveal<HTMLDivElement>(120)
  const importHead = useScrollReveal<HTMLDivElement>()
  const importBody = useScrollReveal<HTMLDivElement>()
  const researchHead = useScrollReveal<HTMLDivElement>()
  const papersGrid = useStaggeredReveal<HTMLDivElement>(110)
  const statsRow = useStaggeredReveal<HTMLDivElement>(120)
  const faqHead = useScrollReveal<HTMLDivElement>()
  const faqList = useStaggeredReveal<HTMLDivElement>(70)
  const ctaReveal = useScrollReveal<HTMLDivElement>()

  const [cardsRef, cardsN] = useCountUp<HTMLSpanElement>(20)
  const [daysRef, daysN] = useCountUp<HTMLSpanElement>(90)
  const [privRef, privN] = useCountUp<HTMLSpanElement>(100)

  return (
    <div className="editorial-landing-v2">
      {/* ── Chrome (hidden during the noise, slides in once it clears) ── */}
      <header className={`el2-chrome ${navRevealed ? 'el2-chrome--in' : ''}`}>
        <div className="el-container el2-chrome__inner">
          <Link to="/" aria-label="Denoisr" className="el2-wordmark-link">
            <Wordmark />
          </Link>

          <div className="el2-mode" role="tablist" aria-label="Browse mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'jobs'}
              className={`el2-mode__btn ${mode === 'jobs' ? 'el2-mode__btn--active' : ''}`}
              onClick={() => setMode('jobs')}
            >
              Jobs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'people'}
              className={`el2-mode__btn ${mode === 'people' ? 'el2-mode__btn--active' : ''}`}
              onClick={() => setMode('people')}
            >
              People
            </button>
          </div>

          <nav className="el2-chrome__nav">
            <a href="#noise" onClick={(e) => smoothJump(e, 'noise')} className="el2-navlink el2-navlink--marketing">The noise</a>
            <a href="#signal" onClick={(e) => smoothJump(e, 'signal')} className="el2-navlink el2-navlink--marketing">The signal</a>
            <a href="#research" onClick={(e) => smoothJump(e, 'research')} className="el2-navlink el2-navlink--marketing">Research</a>
            <Link to="/login" className="el2-navlink">Sign in</Link>
            <Link to="/signup" className="el2-btn el2-btn--primary el2-btn--sm">Sign up</Link>
          </nav>
        </div>
      </header>

      {/* ── INTRO — full-screen noise that clears on scroll ── */}
      <section
        className={`el2-intro ${reduced ? 'is-static' : ''}`}
        ref={introRef}
        style={{ ['--p' as string]: progress }}
        aria-label="The noise of hiring today"
      >
        <div className="el2-intro__stage">
          <div className="el2-intro__curtain" aria-hidden="true" />
          <div className="el2-intro__noise" aria-hidden="true">
            {introFragments.map((f, i) => (
              <span
                key={i}
                className={`el2-inoise el2-inoise--${f.kind}`}
                style={{ top: f.top, left: f.left, ['--rot' as string]: `${f.rot}deg`, ['--i' as string]: i }}
              >
                {f.text}
              </span>
            ))}

            {notifWidgets.map((w, i) => (
              <span
                key={`notif-${i}`}
                className={`el2-notif ${w.label ? 'el2-notif--toast' : ''}`}
                style={{ top: w.top, left: w.left, ['--rot' as string]: `${w.rot}deg` }}
              >
                <span className="el2-notif__icon"><NotifIcon kind={w.icon} /></span>
                {w.label && <span className="el2-notif__label">{w.label}</span>}
                <span className="el2-notif__badge">
                  {reduced ? '99+' : notifCount(w.base, w.rate, notifTick)}
                </span>
              </span>
            ))}

            {messageThreads.map((t, i) => (
              <span
                key={`msg-${i}`}
                className="el2-msgs"
                style={{ top: t.top, left: t.left, ['--rot' as string]: `${t.rot}deg` }}
              >
                <span className="el2-msgs__head">
                  <span className="el2-msgs__avatar" />
                  {t.sender}
                </span>
                <span className="el2-msgs__bubbles">
                  {t.msgs.map((m, j) => (
                    <span key={j} className="el2-msg" style={{ ['--d' as string]: `${j * 1.2}s` }}>{m}</span>
                  ))}
                </span>
              </span>
            ))}
          </div>

          <div className="el2-intro__fg">
            <span className="el2-eyebrow el2-intro__brow">The noise · This is hiring today</span>
            <div className="el2-intro__pains">
              {painPoints.map((p, i) => (
                <p key={i} className={`el2-pain ${i === painIdx ? 'is-active' : ''}`}>{p}</p>
              ))}
            </div>
            <div className="el2-intro__hint" aria-hidden="true">
              <span>Scroll to clear the noise</span>
              <span className="el2-intro__hint-arrow">↓</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HERO — sits behind the intro; revealed in place as the noise clears ── */}
      <section className="el2-hero">
        <div className="el2-hero__wash" aria-hidden="true" />
        <div className="el-container el2-hero__inner">
          <div className="el2-hero__copy">
            <div className="el2-hero__brow">
              <span className="el2-hero__brow-dot" aria-hidden="true" />
              <span className="el2-eyebrow">Spring 2026 · {mode === 'jobs' ? 'Jobs' : 'People'}</span>
            </div>

            <h1 className="el2-hero__headline">
              Remove the <em>noise</em><br />
              from hiring.
            </h1>

            <p className="el2-hero__sub">
              Denoisr is the professional network without the feed. State intent,
              swipe a curated deck, talk only when both sides chose to — everything
              else is noise, and we cut it out.
            </p>

            <div className="el2-hero__cta">
              <Link to="/signup?source=linkedin" className="el2-btn el2-btn--primary">Import from LinkedIn</Link>
              <p className="el2-hero__cta-sub el2-meta">Paste your LinkedIn URL. Profile filled in seconds.</p>
            </div>

            <div className="el2-hero__foot el2-meta">
              <span>No public profiles</span>
              <span className="dot">·</span>
              <span>Read-only by default</span>
              <span className="dot">·</span>
              <Link to="/login" className="el2-hero__signin">Already a member? Sign in →</Link>
            </div>
          </div>

          <div className="el2-hero__stage">
            <div className="el2-hero__deck">
              <InteractiveDeck key={mode} deck={mode === 'jobs' ? jobsDeck : peopleDeck} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Act I — The noise ── */}
      <section id="noise" className="el2-section el2-section--paper2">
        <div className="el-container">
          <div className="el2-section__head sr-fade-up" ref={noiseHead}>
            <span className="el2-eyebrow">The noise · This is hiring today</span>
            <h2 className="el2-section__title">
              Everyone is shouting. <em>No one is listening.</em>
            </h2>
            <p className="el2-section__sub">
              The professional feed turned work into performance — a permanent broadcast
              you maintain whether or not you have anything to say.
            </p>
          </div>

          <div className="el2-noiselist" ref={noiseList}>
            {versus.map((row) => (
              <div key={row.topic} className="el2-noiserow sr-fade-up">
                <span className="el2-noiserow__topic">{row.topic}</span>
                <span className="el2-noiserow__line">{row.feed}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Act II — The signal ── */}
      <section id="signal" className="el2-section">
        <div className="el-container">
          <div className="el2-section__head sr-fade-up" ref={signalHead}>
            <span className="el2-eyebrow">The signal · Three things cut through it</span>
            <h2 className="el2-section__title">
              State intent. Swipe the deck. <em>Talk when it fits.</em>
            </h2>
            <p className="el2-section__sub">
              Three motions, and the platform stays out of your way the rest of the time.
              Each one removes a specific kind of noise.
            </p>
          </div>

          <div className="el2-signals" ref={signalGrid}>
            {signals.map((s) => (
              <article key={s.num} className="el2-signal sr-fade-up">
                <span className="el2-signal__num">— {s.num}</span>
                <h3 className="el2-signal__title">{s.title}</h3>
                <p className="el2-signal__body">{s.body}</p>
                <p className="el2-signal__replaces">
                  <span className="el2-signal__replaces-label">Replaces</span>
                  <span className="el2-signal__replaces-line">{s.replaces}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── LinkedIn import — remove the noise of manual entry ── */}
      <section id="import" className="el2-section el2-section--paper2">
        <div className="el-container">
          <div className="el2-section__head sr-fade-up" ref={importHead}>
            <span className="el2-eyebrow">Import · One paste</span>
            <h2 className="el2-section__title">
              Your profile. <em>Filled in ten seconds.</em>
            </h2>
            <p className="el2-section__sub">
              Paste your LinkedIn URL and we pull everything — experience, skills, projects.
              You just review. No manual entry, no blank slates.
            </p>
          </div>

          <div className="el2-import sr-fade-up" ref={importBody}>
            <div className="el2-import__demo">
              <span className="el2-import__demo-url">https://linkedin.com/in/your-profile</span>
              <span className="el2-import__demo-arrow">→</span>
              <span className="el2-import__demo-result">Filled profile</span>
            </div>
            <div className="el2-import__items">
              {[
                'Work experience & projects',
                'Skills & highlights',
                'Role, location, compensation preference',
                'Ready to swipe in under 60 seconds',
              ].map((item) => (
                <div key={item} className="el2-import__item">
                  <span className="el2-import__check" aria-hidden="true">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="el2-import__cta">
              <Link to="/signup?source=linkedin" className="el2-btn el2-btn--primary">
                Import your profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Research ── */}
      <section id="research" className="el2-section el2-section--paper3">
        <div className="el-container">
          <div className="el2-section__head sr-fade-up" ref={researchHead}>
            <span className="el2-eyebrow">Research · Reading room</span>
            <h2 className="el2-section__title">The thesis, with citations.</h2>
            <p className="el2-section__sub">
              Denoisr's three primitives — intent, mutual consent, no feed —
              each lean on a body of public research. Three starting points.
            </p>
          </div>

          <div className="el2-papers" ref={papersGrid}>
            {papers.map((p) => (
              <article key={p.index} className="el2-paper sr-fade-up">
                <div className="el2-paper__index">
                  <span>{p.index}</span>
                  <span>{p.year}</span>
                </div>
                <div className="el2-paper__source">{p.source}</div>
                <h3 className="el2-paper__title">{p.title}</h3>
                <p className="el2-paper__authors">{p.authors}</p>
                <p className="el2-paper__body">{p.body}</p>
                <a href={p.href} target="_blank" rel="noreferrer noopener" className="el2-paper__link">
                  Read paper →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signal-to-noise stat band ── */}
      <section className="el2-section el2-section--tight">
        <div className="el-container">
          <div className="el2-stats" ref={statsRow}>
            <div className="el2-stat sr-fade-up">
              <span className="el2-stat__num"><span ref={cardsRef}>{cardsN}</span></span>
              <span className="el2-stat__label">curated cards a day. Not a feed.</span>
            </div>
            <div className="el2-stat sr-fade-up">
              <span className="el2-stat__num"><span ref={daysRef}>{daysN}</span></span>
              <span className="el2-stat__label">days max before intent expires. 14 / 30 / 90.</span>
            </div>
            <div className="el2-stat sr-fade-up">
              <span className="el2-stat__num"><span ref={privRef}>{privN}</span><span className="el2-stat__unit">%</span></span>
              <span className="el2-stat__label">private by default. No public profile.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="el2-section el2-section--paper2">
        <div className="el-container">
          <div className="el2-section__head sr-fade-up" ref={faqHead}>
            <span className="el2-eyebrow">Questions · Plainly answered</span>
            <h2 className="el2-section__title">Before you ask.</h2>
          </div>

          <div className="el2-faq" ref={faqList}>
            {faqs.map((f, i) => (
              <details key={f.q} className="el2-faq__item sr-fade-up" open={i === 0}>
                <summary className="el2-faq__q">
                  <span>{f.q}</span>
                  <span className="el2-faq__chev" aria-hidden="true">+</span>
                </summary>
                <div className="el2-faq__a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="el2-section">
        <div className="el-container">
          <div className="el2-cta sr-fade-up" ref={ctaReveal}>
            <div className="el2-cta__inner">
              <span className="el2-eyebrow">Open to new members · Spring 2026</span>
              <h2 className="el2-cta__title">
                Skip the feed. <em>Find the fit.</em>
              </h2>
              <p className="el2-cta__sub">
                Paste your LinkedIn URL and import your profile in one go. The deck arrives the next morning.
              </p>
              <div className="el2-cta__actions">
                <Link to="/signup?source=linkedin" className="el2-btn el2-btn--primary">
                  Import from LinkedIn
                </Link>
                <Link to="/login" className="el2-btn el2-btn--ghost">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="el2-footer">
        <div className="el-container">
          <div className="el2-footer__top">
            <div className="el2-footer__brand">
              <Wordmark size={22} />
              <p className="el2-footer__tagline">High-signal · Intent-led · Read-only by default</p>
            </div>

            <div className="el2-footer__cols">
              <div className="el2-footer__col">
                <div className="el2-footer__col-title">Product</div>
                <ul>
                  <li><Link to="/features">Features</Link></li>
                  <li><Link to="/how-it-works">How it works</Link></li>
                  <li><Link to="/for-recruiters">For recruiters</Link></li>
                </ul>
              </div>
              <div className="el2-footer__col">
                <div className="el2-footer__col-title">Company</div>
                <ul>
                  <li><Link to="/about">About</Link></li>
                  <li><Link to="/careers">Careers</Link></li>
                  <li><Link to="/contact">Contact</Link></li>
                </ul>
              </div>
              <div className="el2-footer__col">
                <div className="el2-footer__col-title">Trust</div>
                <ul>
                  <li><Link to="/security">Security</Link></li>
                  <li><Link to="/privacy-policy">Privacy</Link></li>
                  <li><Link to="/terms-of-service">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="el2-footer__base">
            <span>© 2026 Denoisr</span>
            <span>v 0.06 · Spring beta</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
