type Props = {
  label?: string
  detail?: string
  className?: string
}

export default function LoadingState({
  label = 'Loading',
  detail = 'Pulling in the next set.',
  className = '',
}: Props) {
  return (
    <div className={`loader ${className}`.trim()} role="status" aria-live="polite">
      <div className="loader__wash" aria-hidden="true" />
      <div className="loader__panel">
        <span className="loader__brow">Denoisr · Working</span>
        <h2 className="loader__label">{label}</h2>
        <p className="loader__detail">{detail}</p>
        <div className="loader__pulse" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}
