type InfoPageProps = {
  label: string
  title: string
  paragraphs: string[]
}

export default function InfoPage({ label, title, paragraphs }: InfoPageProps) {
  return (
    <div className="info">
      <div className="info__wash" aria-hidden="true" />
      <article className="info__article">
        <header className="info__head">
          <span className="info__eyebrow">{label}</span>
          <h1 className="info__title">{title}</h1>
        </header>

        <div className="info__body">
          {paragraphs.map((p) => (
            <p key={p} className="info__p">{p}</p>
          ))}
        </div>

        <footer className="info__foot">
          <span>Denoisr<span className="info__foot-dot">.</span></span>
          <span className="info__foot-meta">Editorial · Issue 01</span>
        </footer>
      </article>
    </div>
  )
}
