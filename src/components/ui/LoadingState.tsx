type Props = {
  label?: string
  detail?: string
  className?: string
}

export default function LoadingState({
  label = 'Loading signal',
  detail = 'Pulling the next high-signal set into view.',
  className = '',
}: Props) {
  return (
    <div className={`loadingState ${className}`.trim()} role="status" aria-live="polite">
      <div className="loadingState__glow loadingState__glow--pink" aria-hidden="true" />
      <div className="loadingState__glow loadingState__glow--lavender" aria-hidden="true" />

      <div className="loadingState__panel card">
        <div className="sectionLabel sectionLabel--mono">DENOISR</div>
        <h2 className="loadingState__label">{label}</h2>
        <p className="loadingState__detail">{detail}</p>

        <div className="loadingState__pulseRow" aria-hidden="true">
          <span className="loadingState__pulse loadingState__pulse--1" />
          <span className="loadingState__pulse loadingState__pulse--2" />
          <span className="loadingState__pulse loadingState__pulse--3" />
        </div>

        <div className="loadingState__skeleton" aria-hidden="true">
          <div className="loadingState__line loadingState__line--wide" />
          <div className="loadingState__line loadingState__line--mid" />
          <div className="loadingState__chips">
            <span className="loadingState__chip" />
            <span className="loadingState__chip" />
            <span className="loadingState__chip" />
          </div>
        </div>
      </div>
    </div>
  )
}
