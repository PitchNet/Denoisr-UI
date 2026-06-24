import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/landing.css'
import { InteractiveDeck, Wordmark } from '../components/landing/InteractiveDeck'
import { faqs, jobsDeck, papers, peopleDeck, steps, versus } from '../data/landing'

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
          <Link to="/" aria-label="Denoisr" className="el-wordmark-link">
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

          <InteractiveDeck key={mode} deck={mode === 'jobs' ? jobsDeck : peopleDeck} />
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
