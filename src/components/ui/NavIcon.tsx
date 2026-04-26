type NavIconName = 'home' | 'connections' | 'messages' | 'profile' | 'logout'

type Props = {
  name: NavIconName
  className?: string
}

export default function NavIcon({ name, className = '' }: Props) {
  const classes = `nav__appIcon ${className}`.trim()

  if (name === 'connections') {
    return (
      <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="7" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="15" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.3 9.7L13.9 13.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'home') {
    return (
      <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.5 10.5L12 4.5L19.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 9.8V18.5H17.5V9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 18.5V13.5H14V18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'messages') {
    return (
      <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6.5 9.5L12 12.7L17.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'profile') {
    return (
      <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.5 18.5C6.8 15.8 9 14.5 12 14.5C15 14.5 17.2 15.8 18.5 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 6H6.8C6.1 6 5.5 6.6 5.5 7.3V16.7C5.5 17.4 6.1 18 6.8 18H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 12H18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 9L18.5 12L15.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
