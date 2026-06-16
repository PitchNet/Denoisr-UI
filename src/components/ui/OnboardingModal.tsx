import '../../styles/onboarding.css'

type Props = {
  onDismiss: () => void
}

const FEATURES = [
  {
    label: 'The deck',
    body: 'Swipe right on people and roles that genuinely fit. Left if they don\'t. No noise until there\'s a reason.',
  },
  {
    label: 'Filters',
    body: 'Narrow by role, location, salary, or experience before you swipe. Start with signal, not volume.',
  },
  {
    label: 'A fit.',
    body: 'When two people both say yes, a thread opens. Until then, the inbox stays quiet — which is the point.',
  },
]

export default function OnboardingModal({ onDismiss }: Props) {
  return (
    <div className="ob" role="dialog" aria-modal="true" aria-label="Welcome to Denoisr">
      <div className="ob__wash" aria-hidden="true" />

      <div className="ob__card">
        <span className="ob__eyebrow">Denoisr · Welcome</span>
        <h1 className="ob__title">You're in the deck.</h1>
        <p className="ob__sub">Here's how it works.</p>

        <ul className="ob__features" role="list">
          {FEATURES.map((f) => (
            <li key={f.label} className="ob__feature">
              <span className="ob__featureLabel">{f.label}</span>
              <p className="ob__featureBody">{f.body}</p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="btn btn--solidDark ob__cta"
          onClick={onDismiss}
          autoFocus
        >
          Start swiping
        </button>
      </div>
    </div>
  )
}
