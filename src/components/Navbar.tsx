import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './ui/Button'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link
          to="/"
          className="nav__brand"
          aria-label="Denoisr home"
          onClick={() => setOpen(false)}
        >
          Denoisr.
        </Link>

        <div className="nav__right">
          <div className="nav__links" aria-label="Primary actions">
            <Button to="/login" variant="outlinedLight">
              Login
            </Button>
            <Button to="/signup" variant="solidDark">
              Signup
            </Button>
          </div>

          <button
            type="button"
            className="nav__burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="nav__mobile" role="dialog" aria-label="Mobile menu">
          <div className="container nav__mobileInner">
            <Button
              to="/login"
              variant="outlinedLight"
              className="nav__mobileBtn"
            >
              Login
            </Button>
            <Button
              to="/signup"
              variant="solidDark"
              className="nav__mobileBtn"
            >
              Signup
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}

