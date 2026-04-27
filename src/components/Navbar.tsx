import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { clearAuthToken, isAuthenticated } from '../auth'
import NavIcon from './ui/NavIcon'

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isLoggedIn = isAuthenticated()
  const isHome = pathname === '/home'
  const isMessages = pathname === '/messages'
  const isAppPage = isHome || isMessages
  const mode = searchParams.get('mode') === 'people' ? 'people' : 'jobs'

  function updateMode(nextMode: 'jobs' | 'people') {
    setSearchParams({ mode: nextMode })
  }

  function handleLogout() {
    clearAuthToken()
    setProfileOpen(false)
    navigate('/login')
  }

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link
          to={isLoggedIn ? '/home' : '/'}
          className="nav__brand"
          aria-label="Denoisr home"
          onClick={() => setProfileOpen(false)}
        >
          Denoisr.
        </Link>

        {isAppPage ? (
          <>
            {isHome ? (
              <div className="nav__modeSwitch" aria-label="Discovery mode switch">
                <div
                  className={`nav__modeBubble ${mode === 'people' ? 'nav__modeBubble--people' : ''}`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className={`nav__modeButton ${mode === 'jobs' ? 'nav__modeButton--active' : ''}`}
                  onClick={() => updateMode('jobs')}
                >
                  Jobs
                </button>
                <button
                  type="button"
                  className={`nav__modeButton ${mode === 'people' ? 'nav__modeButton--active' : ''}`}
                  onClick={() => updateMode('people')}
                >
                  People
                </button>
              </div>
            ) : (
              <div className="nav__appCenterLabel">
                <div className="sectionLabel sectionLabel--mono">CONTROLLED COMMUNICATION</div>
              </div>
            )}

            <div className="nav__appLinks" aria-label="Primary navigation">
              <button type="button" className={`nav__appLink ${isHome ? 'nav__appLink--active' : ''}`} onClick={() => navigate('/home')}>
                <NavIcon name="connections" />
                <span className="nav__appLabel">Connections</span>
              </button>
              <button type="button" className={`nav__appLink ${isMessages ? 'nav__appLink--active' : ''}`} onClick={() => navigate('/messages')}>
                <NavIcon name="messages" />
                <span className="nav__appLabel">Messages</span>
              </button>
              <div className="nav__profileMenuWrap">
                <button
                  type="button"
                  className={`nav__appLink ${profileOpen ? 'nav__appLink--active' : ''}`}
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((value) => !value)}
                >
                  <NavIcon name="profile" />
                  <span className="nav__appLabel">Profile</span>
                </button>

                {profileOpen ? (
                  <div className="nav__profileDropdown">
                    <button type="button" className="nav__profileDropdownBtn">
                      View Profile
                    </button>
                    <button type="button" className="nav__profileDropdownBtn">
                      View Job Applications
                    </button>
                    <button type="button" className="nav__profileDropdownBtn" onClick={() => navigate('/messages')}>
                      View Connections
                    </button>
                  </div>
                ) : null}
              </div>
              <button type="button" className="nav__appLink" onClick={handleLogout}>
                <NavIcon name="logout" />
                <span className="nav__appLabel">Logout</span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </header>
  )
}
