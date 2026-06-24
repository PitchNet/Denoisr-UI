import { useEffect, useRef, useState } from 'react'
import type { DeckCard } from '../../data/landing'

// Shared landing chrome + the interactive swipe deck demo.
// Uses the `el-` class vocabulary, which both landing.css (.editorial-landing) and
// landing-v2.css (.editorial-landing-v2) define under their own root scope.

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span className="el-wordmark" style={{ fontSize: size }}>
      Denoisr<span className="dot">.</span>
    </span>
  )
}

export type ExitKind = null | 'pass' | 'like' | 'bookmark'

export function CardFace({ card, isTop, exit }: { card: DeckCard; isTop: boolean; exit: ExitKind }) {
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

export function InteractiveDeck({ deck }: { deck: DeckCard[] }) {
  const [topIndex, setTopIndex] = useState(0)
  const [exit, setExit] = useState<ExitKind>(null)
  const [counts, setCounts] = useState({ pass: 0, like: 0, bookmark: 0 })
  const lockedRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  // State is reset by remounting via `key={mode}` at the call site (mode toggle),
  // so no deck-change effect is needed here.
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
