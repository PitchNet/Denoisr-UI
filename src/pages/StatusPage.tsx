import InfoPage from './InfoPage'

export default function StatusPage() {
  return (
    <InfoPage
      label="STATUS"
      title="System status"
      paragraphs={[
        'This page will reflect uptime and incident information from your monitoring system.',
        'For now, it is a placeholder so footer navigation works end-to-end.',
      ]}
    />
  )
}

