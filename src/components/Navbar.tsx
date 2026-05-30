import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { clearAuthToken, isAuthenticated, getStoredProfile } from '../auth'
import NavIcon from './ui/NavIcon'

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isLoggedIn = isAuthenticated()
  const isHome = pathname === '/home'
  const isMessages = pathname === '/messages'
  const isProfile = pathname === '/profile' || pathname === '/profile/edit'
  const isApplications = pathname === '/applications'
  const isCompany = pathname === '/company'
  const isAppPage = isHome || isMessages || isProfile || isApplications || isCompany
  const mode = searchParams.get('mode') === 'people' ? 'people' : 'jobs'
  const cachedProfile = getStoredProfile()

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
          Denoisr<span style={{ color: 'var(--ink-4)' }}>.</span>
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
              <button type="button" className={`nav__appLink ${isHome ? 'nav__appLink--active' : ''}`} onClick={() => navigate('/home?mode=jobs')}>
                <NavIcon name="connections" />
                <span className="nav__appLabel">Home</span>
              </button>
              <button type="button" className={`nav__appLink ${isMessages ? 'nav__appLink--active' : ''}`} onClick={() => navigate('/messages')}>
                <NavIcon name="messages" />
                <span className="nav__appLabel">Messages</span>
              </button>
              <div className="nav__profileMenuWrap">
                <button
                  type="button"
                  className={`nav__appLink ${profileOpen || isProfile ? 'nav__appLink--active' : ''}`}
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((value) => !value)}
                >
                  <NavIcon name="profile" />
                  <span className="nav__appLabel">Profile</span>
                </button>

                {profileOpen ? (
                  <div className="nav__profileDropdown">
                    {cachedProfile ? (
                      <div className="nav__dropdownProfile">
                        <div
                          className="nav__dropdownAvatar"
                          style={{
                            background: cachedProfile.photo
                              ? `url(${cachedProfile.photo}) center/cover`
                              : 'var(--ink-2)',
                          }}
                        >
                          {!cachedProfile.photo ? (
                            <span>{cachedProfile.headline.charAt(0).toUpperCase()}</span>
                          ) : null}
                        </div>
                        <div className="nav__dropdownProfileMeta">
                          <div className="nav__dropdownProfileName">{cachedProfile.headline}</div>
                          <div className="nav__dropdownProfileRole">{cachedProfile.subheadline}</div>
                        </div>
                      </div>
                    ) : null}
                    <span className="nav__dropdownLabel">Account</span>
                    <button type="button" className="nav__profileDropdownBtn" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                      Profile
                    </button>
                    <button type="button" className="nav__profileDropdownBtn" onClick={() => { setProfileOpen(false); navigate('/applications'); }}>
                      Job Applications
                    </button>
                    <div className="nav__dropdownDivider" />
                    <span className="nav__dropdownLabel">Manage</span>
                    <button type="button" className="nav__profileDropdownBtn" onClick={() => { setProfileOpen(false); navigate('/company'); }}>
                      Company
                    </button>
                    <div className="nav__dropdownDivider" />
                    <button type="button" className="nav__profileDropdownBtn nav__profileDropdownBtn--danger" onClick={handleLogout}>
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <nav className="nav__marketingLinks" aria-label="Marketing navigation">
            <Link to="/features" className="nav__marketingLink">Features</Link>
            <Link to="/how-it-works" className="nav__marketingLink">How it works</Link>
            {isLoggedIn ? (
              <Link to="/home" className="btn btn--solidDark" style={{ height: 36, padding: '0 16px', fontSize: 13.5 }}>
                Open app
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav__marketingLink">Sign in</Link>
                <Link to="/signup" className="btn btn--solidDark" style={{ height: 36, padding: '0 16px', fontSize: 13.5 }}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
