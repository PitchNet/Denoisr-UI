import { Link, useLocation } from 'react-router-dom'

const FOOTER_LINKS: Array<{
  title: string
  links: Array<{ label: string; href: string }>
}> = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'For Recruiters', href: '/for-recruiters' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Security', href: '/security' },
      { label: 'Status', href: '/status' },
      { label: 'Help Center', href: '/help-center' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
    ],
  },
]

export default function Footer() {
  const { pathname } = useLocation()
  const year = new Date().getFullYear()

  if (pathname === '/home') {
    return null
  }

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__logo" aria-label="Denoisr footer logo">
          Denoisr.
        </div>

        <div className="footer__grid" aria-label="Footer links">
          {FOOTER_LINKS.map((section) => (
            <div key={section.title} className="footer__col">
              <div className="footer__colTitle">{section.title}</div>
              <ul className="footer__list">
                {section.links.map((l) => (
                  <li key={l.label} className="footer__item">
                    <Link className="footer__link" to={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <span className="footer__copyright">
            © {year} Denoisr. All rights reserved.
          </span>
          <div className="footer__bottomLinks">
            <Link className="footer__bottomLink" to="/privacy-policy">
              Privacy
            </Link>
            <Link className="footer__bottomLink" to="/terms-of-service">
              Terms
            </Link>
            <Link className="footer__bottomLink" to="/cookie-policy">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
