import { useState } from 'react'
import '../../styles/onboarding.css'

type Props = {
  name: string
  submitting: boolean
  onCancel: () => void
  onSubmit: (reason: string, details: string) => void
}

const REASONS = ['Spam', 'Harassment', 'Fake profile', 'Inappropriate content', 'Other']

export default function ReportUserModal({ name, submitting, onCancel, onSubmit }: Props) {
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')

  return (
    <div className="ob" role="dialog" aria-modal="true" aria-label={`Report ${name}`}>
      <div className="ob__wash" aria-hidden="true" />

      <div className="ob__card">
        <span className="ob__eyebrow">Denoisr · Report</span>
        <h1 className="ob__title">Report {name}</h1>
        <p className="ob__sub">Tell us what's wrong. This goes straight to the trust &amp; safety queue.</p>

        <div className="ob__formGroup" role="radiogroup" aria-label="Reason">
          {REASONS.map((r) => (
            <label key={r} className="ob__radio">
              <input
                type="radio"
                name="reportReason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
              />
              {r}
            </label>
          ))}
        </div>

        <textarea
          className="ob__textarea"
          placeholder="Add details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
        />

        <div className="ob__btnRow">
          <button type="button" className="btn ob__cancel" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--solidDark ob__cta"
            onClick={() => onSubmit(reason, details.trim())}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}
