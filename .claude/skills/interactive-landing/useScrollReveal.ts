import { useEffect, useRef } from 'react'

/**
 * Attaches an IntersectionObserver to the returned ref and toggles `.is-visible`
 * once the element crosses the threshold. Pair with classes in `scroll-reveal.css`.
 * Reveals once and disconnects — these are narrative beats, not looping ambient motion.
 */
export function useScrollReveal<T extends HTMLElement>(options?: {
  threshold?: number
  rootMargin?: string
}) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px', ...options }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return ref
}

/**
 * Same idea, but for a list of children inside one container — staggers each
 * child's reveal by `stepMs` as the container enters view. Use for `#vs` rows,
 * `#research` cards, FAQ items: one beat per item, not all-at-once.
 */
export function useStaggeredReveal<T extends HTMLElement>(stepMs = 90) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      children.forEach((c) => c.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        children.forEach((child, i) => {
          window.setTimeout(() => child.classList.add('is-visible'), i * stepMs)
        })
        observer.disconnect()
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [stepMs])

  return ref
}
