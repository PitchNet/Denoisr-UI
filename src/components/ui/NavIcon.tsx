type NavIconName = 'home' | 'connections' | 'messages' | 'profile' | 'logout' | 'notifications'

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
        <path d="M12 3L21.5 10.7V19.1a1.5 1.5 0 0 1-1.5 1.5H14.5V16.1a1.5 1.5 0 0 0-1.5-1.5H11a1.5 1.5 0 0 0-1.5 1.5V20.6H4a1.5 1.5 0 0 1-1.5-1.5V10.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'messages') {
    return (
      <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8.6 20.6A9.4 9.4 0 1 0 4.3 16.3L2 22.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="11.4" r="1.05" fill="currentColor" />
        <circle cx="13.3" cy="11.4" r="1.05" fill="currentColor" />
        <circle cx="17.6" cy="11.4" r="1.05" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'profile') {
    return (
      <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="9.3" r="3.3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.3 18.7a7.4 7.4 0 0 1 13.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'notifications') {
    return (
      <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9.6 6.2C9.6 4.6 10.6 3.2 12 3.2C13.4 3.2 14.4 4.6 14.4 6.2C17.4 7 19.3 10.2 19.5 14C19.6 15.6 20.2 16.2 21 16.8L3 16.8C3.8 16.2 4.4 15.6 4.5 14C4.7 10.2 6.6 7 9.6 6.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.6 17.8a2.4 2.4 0 0 0 4.8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  // logout (fallback)
  return (
    <svg className={classes} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 6H6.8C6.1 6 5.5 6.6 5.5 7.3V16.7C5.5 17.4 6.1 18 6.8 18H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 12H18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 9L18.5 12L15.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
