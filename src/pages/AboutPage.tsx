import InfoPage from './InfoPage'

export default function AboutPage() {
  return (
    <InfoPage
      label="ABOUT"
      title="Denoisr is signal-first professional infrastructure"
      paragraphs={[
        'Denoisr removes noise from networking and hiring by replacing activity with explicit intent.',
        'It is not a social feed and not a traditional job board. It is a high-signal layer for professional interaction.',
      ]}
    />
  )
}

