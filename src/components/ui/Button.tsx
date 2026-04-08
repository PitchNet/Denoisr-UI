import { Link } from 'react-router-dom'

type ButtonVariant = 'solidDark' | 'outlinedLight' | 'glassDark'

type Props = {
  children: React.ReactNode
  className?: string
  variant?: ButtonVariant
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

export default function Button({
  children,
  className = '',
  variant = 'solidDark',
  to,
  href,
  type = 'button',
  onClick,
}: Props) {
  const classes = `btn btn--${variant} ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  )
}

