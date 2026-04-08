import Button from '../components/ui/Button'

type Feature = {
  label: string
  title: string
  description: string
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="card featureCard">
      <div className="featureCard__label">{feature.label}</div>
      <h3 className="featureCard__title">{feature.title}</h3>
      <p className="featureCard__description">{feature.description}</p>
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
        'Low-quality outreach is filtered out. Conversations typically happen only when context and mutual relevance are present.',
    },
  ]

  return (
    <div className="product denoisr">
      <section className="heroSection">
        <div className="heroBg" aria-hidden="true">
          <div className="heroBg__blob heroBg__blob--pink" />
          <div className="heroBg__blob heroBg__blob--lavender" />
          <div className="heroBg__blob heroBg__blob--blue" />
        </div>

        <div className="container heroInner">
          <div className="heroKicker">NOISE FREE NETWORKING</div>
          <h1 className="heroTitle">
            Remove noise from professional networking.
          </h1>
          <p className="heroSubhead">
            Denoisr is a high-signal platform for networking and hiring. It
            replaces activity with intent, and profiles with proof—so the
            right opportunities and people find each other.
          </p>

          <div className="heroCtas">
            <Button to="/login" variant="outlinedLight">
              Login
            </Button>
            <Button to="/signup" variant="solidDark">
              Signup
            </Button>
          </div>

          <div className="heroMiniStats" aria-label="Highlights">
            <div className="miniStat">
              <div className="miniStat__value">2x</div>
              <div className="miniStat__label">Faster screening</div>
            </div>
            <div className="miniStat">
              <div className="miniStat__value">60%</div>
              <div className="miniStat__label">Fewer wasted apps</div>
            </div>
            <div className="miniStat">
              <div className="miniStat__value">90%</div>
              <div className="miniStat__label">Higher intent alignment</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--light">
        <div className="container">
          <div className="sectionLabel">MAIN FEATURES</div>
          <h2 className="sectionTitle">Built for focus and clarity</h2>
          <p className="sectionSub">
            No feeds. No engagement loops. Just structured discovery and
            clarity-first communication across networking and hiring.
          </p>

          <div className="featureGrid">
            {features.map((feature) => (
              <FeatureCard key={feature.label} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="statsSection">
        <div className="container statsInner">
          <div className="sectionLabel sectionLabel--mono">
            ENTERPRISE SIGNAL METRICS
          </div>
          <div className="statsBar" aria-label="Performance metrics">
            <div className="statCard">
              <div className="statCard__value">2x</div>
              <div className="statCard__label">Faster screening</div>
            </div>
            <div className="statCard">
              <div className="statCard__value">60%</div>
              <div className="statCard__label">Fewer wasted applications</div>
            </div>
            <div className="statCard">
              <div className="statCard__value">90%</div>
              <div className="statCard__label">Higher intent alignment</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <div className="sectionLabel sectionLabel--light">
            RESEARCH ZONE
          </div>
          <h2 className="sectionTitle sectionTitle--light">
            Structured matching, controlled communication
          </h2>
          <div className="darkCards">
            <div className="darkCard">
              <div className="darkCard__title">Clarity-first UX</div>
              <p className="darkCard__description">
                Opportunities are presented with context—nature of work,
                challenges, expectations—so alignment happens before the first
                message.
              </p>
            </div>
            <div className="darkCard">
              <div className="darkCard__title">Intent layer</div>
              <p className="darkCard__description">
                Every interaction is grounded in explicit intent—time-bound
                and purposefully matched.
              </p>
            </div>
            <div className="darkCard">
              <div className="darkCard__title">Noise reduction</div>
              <p className="darkCard__description">
                Low-quality outreach is filtered out so conversations carry
                weight and reduce cognitive overload.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ctaSection">
        <div className="container ctaInner">
          <div className="ctaText">
            <div className="sectionLabel">READY TO FILTER NOISE?</div>
            <h2 className="sectionTitle">Join Denoisr and build signal.</h2>
            <p className="sectionSub">
              Start with Login or Signup—your intent-driven experience is
              waiting.
            </p>
          </div>
          <div className="ctaButtons">
            <Button to="/login" variant="outlinedLight">
              Login
            </Button>
            <Button to="/signup" variant="solidDark">
              Signup
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

