import { useEffect, useRef, useState } from 'react'
import Button from '../components/ui/Button'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.unobserve(el)
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, inView] as const
}

function useParallax(speed = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const elCenter = rect.top + rect.height / 2
      const viewCenter = window.innerHeight / 2
      setOffset((elCenter - viewCenter) * speed)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return [ref, offset] as const
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`reveal-section ${inView ? 'reveal-section--visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

function AnimatedStat({ value, label, suffix = '' }: { value: string; label: string; suffix?: string }) {
  const [ref, inView] = useInView(0.5)
  const [displayed, setDisplayed] = useState('0')
  const numericVal = parseFloat(value.replace(/[^0-9.]/g, ''))
  const isPercent = value.includes('%')

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const steps = 30
    const stepDuration = duration / steps
    let current = 0

    const interval = setInterval(() => {
      current++
      const progress = current / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      const val = Math.round(eased * numericVal)
      setDisplayed(isPercent ? `${val}%` : `${val}x`)
      if (current >= steps) {
        setDisplayed(value)
        clearInterval(interval)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [inView, numericVal, isPercent, value])

  return (
    <div ref={ref} className={`stat-card ${inView ? 'stat-card--animated' : ''}`}>
      <div className="stat-card__value">{displayed}{suffix}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  )
}

type Feature = {
  label: string
  title: string
  description: string
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`feature-card ${inView ? 'feature-card--visible' : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="feature-card__label">{feature.label}</div>
      <h3 className="feature-card__title">{feature.title}</h3>
      <p className="feature-card__description">{feature.description}</p>
    </div>
  )
}

function TestimonialCard({
  quote,
  name,
  role,
  index,
}: {
  quote: string
  name: string
  role: string
  index: number
}) {
  const [ref, inView] = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`testimonial-card ${inView ? 'testimonial-card--visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <p className="testimonial-card__quote">"{quote}"</p>
      <div className="testimonial-card__author">
        <div className="testimonial-card__name">{name}</div>
        <div className="testimonial-card__role">{role}</div>
      </div>
    </div>
  )
}

export default function ProductPage() {
  const features: Feature[] = [
    {
      label: 'NOISE-FREE NETWORKING',
      title: 'Signal-first connections',
      description:
        'Connect through clearly defined intent—no feeds, no scrolling loops. You see only meaningful matches based on relevance, not volume.',
    },
    {
      label: 'PERSONALISED JOB SEARCH',
      title: 'Roles that fit your intent',
      description:
        'Denoisr surfaces a limited set of carefully matched opportunities. Focus on quality and clarity instead of keyword-heavy applications.',
    },
    {
      label: 'PROOF OVER PROFILES',
      title: 'Verified contributions',
      description:
        'Profiles are centered around tangible outcomes—projects, systems built, and problems solved—supported by validation from collaborators.',
    },
    {
      label: 'INTENT-DRIVEN MATCHING',
      title: 'Time-bound relevance',
      description:
        'Your intent is explicit and time-scoped, enabling precise matches between candidates and opportunities.',
    },
    {
      label: 'CONTROLLED COMMUNICATION',
      title: 'Reduced noise messaging',
      description:
        'Low-quality outreach is filtered out. Conversations happen only when context and mutual relevance are present.',
    },
  ]

  const testimonials = [
    {
      quote:
        'Denoisr cut our screening time by half. The candidates we receive are pre-qualified and genuinely interested. It has fundamentally changed how we hire.',
      name: 'Priya Sharma',
      role: 'VP of Engineering, TechCorp',
    },
    {
      quote:
        'I found my current role through Denoisr. No spam, no noise — just a clear match with a company that actually needed my skills.',
      name: 'Rahul Verma',
      role: 'Senior Backend Engineer',
    },
    {
      quote:
        'As a freelancer, Denoisr gives me access to high-quality projects without the bidding wars. The intent layer ensures everyone is serious.',
      name: 'Ananya Patel',
      role: 'Independent Product Designer',
    },
  ]

  const companies = ['Stripe', 'Figma', 'Linear', 'Vercel', 'Supabase', 'Railway']

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [heroRef, heroParallax] = useParallax(0.08)

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      })
    }
    window.addEventListener('mousemove', onMouse, { passive: true })
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  return (
    <div className="denoisr product-page">
      {/* ─── HERO ─── */}
      <section ref={heroRef} className="hero-section" id="product-overview">
        <div className="hero-section__bg" aria-hidden="true">
          <div
            className="hero-section__blob hero-section__blob--pink"
            style={{
              transform: `translate(${mousePos.x * -18}px, ${mousePos.y * -18 - heroParallax}px)`,
            }}
          />
          <div
            className="hero-section__blob hero-section__blob--lavender"
            style={{
              transform: `translate(${mousePos.x * 14}px, ${mousePos.y * -14 + heroParallax}px)`,
            }}
          />
          <div
            className="hero-section__blob hero-section__blob--blue"
            style={{
              transform: `translate(${mousePos.x * -8}px, ${mousePos.y * 10 + heroParallax * 0.5}px)`,
            }}
          />
        </div>

        <div className="container hero-section__inner">
          <div className="hero-section__label">HIGH-SIGNAL NETWORKING</div>
          <h1 className="hero-section__title">
            Remove the noise from
            <br />
            professional networking.
          </h1>
          <p className="hero-section__sub">
            Denoisr is a high-signal infrastructure layer for professional
            interaction — replacing activity with intent, profiles with proof,
            and noise with clarity.
          </p>

          <div className="hero-section__ctas">
            <Button variant="solidDark" to="/signup">
              Get Started
            </Button>
            <Button variant="outlinedLight" to="/login">
              Sign In
            </Button>
          </div>

          <div className="hero-section__stats-row">
            <div className="hero-section__stat-item">
              <span className="hero-section__stat-value">2x</span>
              <span className="hero-section__stat-label">Faster screening</span>
            </div>
            <div className="hero-section__stat-divider" />
            <div className="hero-section__stat-item">
              <span className="hero-section__stat-value">60%</span>
              <span className="hero-section__stat-label">Fewer wasted apps</span>
            </div>
            <div className="hero-section__stat-divider" />
            <div className="hero-section__stat-item">
              <span className="hero-section__stat-value">90%</span>
              <span className="hero-section__stat-label">Higher intent alignment</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ENTERPRISE STATS ─── */}
      <RevealSection>
        <section className="stats-section" id="numbers">
          <div className="container">
            <div className="section-label">ENTERPRISE SIGNAL METRICS</div>
            <h2 className="section-heading">Proven outcomes at scale</h2>
            <p className="section-subheading">
              Real results from teams that have adopted signal-first hiring and
              networking practices.
            </p>

            <div className="stats-grid">
              <AnimatedStat value="2x" label="Faster candidate screening" />
              <AnimatedStat value="60%" label="Reduction in wasted applications" />
              <AnimatedStat value="90%" label="Intent alignment accuracy" />
              <AnimatedStat value="4.8x" label="Response rate improvement" />
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── FEATURES ─── */}
      <RevealSection>
        <section className="features-section" id="features-differentiators">
          <div className="container">
            <div className="section-label">SIGNAL-FIRST DISCOVERY</div>
            <h2 className="section-heading">Built for focus and clarity</h2>
            <p className="section-subheading">
              No feeds. No engagement loops. Just structured discovery and
              clarity-first communication.
            </p>

            <div className="features-grid">
              {features.map((feature, i) => (
                <FeatureCard key={feature.label} feature={feature} index={i} />
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── CUSTOMER PERSONA ─── */}
      <RevealSection>
        <section className="persona-section" id="customer-persona">
          <div className="container">
            <div className="section-label">WHO IT'S FOR</div>
            <h2 className="section-heading">For professionals, recruiters, and builders</h2>
            <p className="section-subheading">
              Denoisr serves everyone in the professional ecosystem — from
              individual contributors to enterprise hiring teams.
            </p>

            <div className="persona-grid">
              <div className="persona-card">
                <div className="persona-card__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <h3 className="persona-card__title">Professionals</h3>
                <p className="persona-card__description">
                  Access relevant opportunities without the need for constant
                  self-promotion. Your work speaks for itself.
                </p>
              </div>

              <div className="persona-card">
                <div className="persona-card__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h3 className="persona-card__title">Recruiters</h3>
                <p className="persona-card__description">
                  Receive pre-qualified candidates that match your requirements.
                  Reduce screening time and improve hiring efficiency.
                </p>
              </div>

              <div className="persona-card">
                <div className="persona-card__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </div>
                <h3 className="persona-card__title">Independent Builders</h3>
                <p className="persona-card__description">
                  Showcase your work and connect with high-quality projects
                  through trusted, context-driven discovery.
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── FEATURED COMPANIES ─── */}
      <RevealSection>
        <section className="companies-section" id="featured-companies">
          <div className="container">
            <div className="section-label">TRUSTED BY INNOVATIVE TEAMS</div>
            <h2 className="section-heading">Companies that build with signal</h2>
            <p className="section-subheading">
              Forward-thinking organizations use Denoisr to find talent that
              matches their standards.
            </p>

            <div className="companies-grid">
              {companies.map((company) => (
                <div key={company} className="company-card">
                  <span className="company-card__name">{company}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── SUCCESS STORIES ─── */}
      <RevealSection>
        <section className="testimonials-section" id="success-stories">
          <div className="container">
            <div className="section-label">SUCCESS STORIES</div>
            <h2 className="section-heading">Trusted by professionals</h2>

            <div className="testimonials-grid">
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.name} {...t} index={i} />
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── RESEARCH ZONE (DARK WORLD) ─── */}
      <section className="research-section" id="research">
        <div className="container">
          <RevealSection>
            <div className="section-label section-label--light">RESEARCH ZONE</div>
            <h2 className="section-heading section-heading--light">
              The science of signal
            </h2>
            <p className="section-subheading section-subheading--light">
              Our approach is grounded in research on professional networking,
              hiring efficiency, and intent-based matching systems.
            </p>
          </RevealSection>

          <div className="research-grid">
            <RevealSection>
              <div className="research-card">
                <div className="research-card__badge">PAPER 001</div>
                <h3 className="research-card__title">
                  Intent-based matching reduces hiring friction by 60%
                </h3>
                <p className="research-card__description">
                  A study across 200+ hiring pipelines found that explicit intent
                  signaling reduced time-to-interview by 60% compared to
                  traditional application-based approaches.
                </p>
              </div>
            </RevealSection>

            <RevealSection>
              <div className="research-card">
                <div className="research-card__badge">PAPER 002</div>
                <h3 className="research-card__title">
                  Proof-based profiles outperform traditional resumes
                </h3>
                <p className="research-card__description">
                  Candidates with verified contributions were 4.8x more likely to
                  receive interview invitations than those with conventional
                  resume-only profiles.
                </p>
              </div>
            </RevealSection>

            <RevealSection>
              <div className="research-card">
                <div className="research-card__badge">PAPER 003</div>
                <h3 className="research-card__title">
                  Controlled communication reduces recruiter noise by 74%
                </h3>
                <p className="research-card__description">
                  Structured messaging workflows decreased irrelevant outreach by
                  74%, allowing recruiters to focus on high-quality candidates.
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── GET STARTED CTA ─── */}
      <RevealSection>
        <section className="cta-section" id="get-started">
          <div className="container">
            <div className="cta-card">
              <div className="section-label">READY TO FILTER NOISE?</div>
              <h2 className="section-heading">Build signal with Denoisr.</h2>
              <p className="section-subheading">
                Join thousands of professionals and companies who have chosen
                intent over noise. Start your signal-first experience today.
              </p>

              <div className="cta-card__actions">
                <Button variant="solidDark" to="/signup">
                  Get Started
                </Button>
                <Button variant="outlinedLight" to="/login">
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── BRAND FOOTER STATEMENT ─── */}
      <div className="product-page__footer-brand">
        <span className="product-page__footer-wordmark">together</span>
      </div>
    </div>
  )
}
