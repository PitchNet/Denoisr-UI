type InfoPageProps = {
  label: string
  title: string
  paragraphs: string[]
}

export default function InfoPage({
  label,
  title,
  paragraphs,
}: InfoPageProps) {
  return (
    <div className="infoPage">
      <div className="container">
        <div className="card infoCard">
          <div className="sectionLabel sectionLabel--mono">{label}</div>
          <h1 className="infoTitle sectionTitle">{title}</h1>
          <div className="infoBody">
            {paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

