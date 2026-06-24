// Shared content for the marketing landing pages (ProductPage + ProductPageV2).
// Pure data — no JSX — so both the original and the animated landing can consume it.

export type Step = { num: string; title: string; body: string }

export type DeckCard = {
  initials: string
  swatch: string
  eyebrow: string
  title: string
  meta: string
  chips: string[]
  body: string
}

export type Paper = {
  index: string
  source: string
  authors: string
  year: string
  title: string
  body: string
  href: string
}

export type Versus = { topic: string; feed: string; denoisr: string }
export type Faq = { q: string; a: string }

export const jobsDeck: DeckCard[] = [
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

export const peopleDeck: DeckCard[] = [
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

export const steps: Step[] = [
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

export const versus: Versus[] = [
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

export const papers: Paper[] = [
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

export const faqs: Faq[] = [
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
