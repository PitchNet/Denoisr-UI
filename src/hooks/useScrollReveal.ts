import { useEffect, useRef, useState } from 'react'

// Lightweight scroll-driven animation hooks for the landing page.
// No dependencies — IntersectionObserver + a rAF count-up. Every hook honours
// prefers-reduced-motion by short-circuiting straight to the end state.

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Toggles `.is-visible` on the returned ref once it scrolls into view.
 * Reveals once, then disconnects — a narrative beat, not looping ambient motion.
 */
export function useScrollReveal<T extends HTMLElement>(options?: {
  threshold?: number
  rootMargin?: string
}) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReducedMotion()) {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px', ...options },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return ref
}

/**
 * Staggers `.is-visible` across the direct children of the returned ref as the
 * container enters view — one beat per item. Use for vs-rows, paper cards, FAQ items.
 */
export function useStaggeredReveal<T extends HTMLElement>(stepMs = 90) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]

    if (prefersReducedMotion()) {
      children.forEach((c) => c.classList.add('is-visible'))
      return
    }

    const timers: number[] = []
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        children.forEach((child, i) => {
          timers.push(window.setTimeout(() => child.classList.add('is-visible'), i * stepMs))
        })
        observer.disconnect()
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [stepMs])

  return ref
}

/**
 * Counts a numeric value up from 0 once the element scrolls into view.
 * Returns [ref, displayValue]. Under reduced motion it jumps straight to `target`.
 */
export function useCountUp<T extends HTMLElement>(target: number, durationMs = 1100) {
  const ref = useRef<T | null>(null)
  // Lazily seed to the final value for reduced-motion users so we never setState
  // synchronously inside the effect.
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min((now - start) / durationMs, 1)
      // ease-out cubic — quick then settle, matching the brand's calm decel
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) raf = window.requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          raf = window.requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [target, durationMs])

  return [ref, value] as const
}
