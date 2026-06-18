import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getStoredProfile, getGlassMode, setGlassMode } from '../auth'
import NavIcon from './ui/NavIcon'
import NotificationBell from './ui/NotificationBell'
import { unsubscribeFromPush } from '../notifications'

type ActivePage = 'home' | 'messages' | 'profile' | 'applications' | 'company'

type Props = {
  activePage: ActivePage
}

export default function MobileBottomNav({ activePage }: Props) {
  const navigate = useNavigate()
  const cachedProfile = getStoredProfile()
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)
  const [glass, setGlass] = useState(() => {
    const enabled = getGlassMode()
    document.documentElement.classList.toggle('liquid-glass', enabled)
    return enabled
  })

  function toggleGlass() {
    const next = !glass
    document.documentElement.classList.toggle('liquid-glass', next)
    setGlassMode(next)
    setGlass(next)
  }

  function handleMobileLogout() {
    unsubscribeFromPush()
    clearSession()
    document.documentElement.classList.remove('liquid-glass')
    navigate('/login')
  }

  function handleProfileClick() {
    setMobileProfileOpen((v) => !v)
  }

  return (
    <nav className="mbn" aria-label="Mobile navigation">
      <button
        type="button"
        className={`mbn__item ${activePage === 'home' ? 'mbn__item--active' : ''}`}
        onClick={() => navigate('/home?mode=jobs')}
      >
        <NavIcon name="home" />
        <span>Home</span>
      </button>
      <button
        type="button"
        className={`mbn__item ${activePage === 'messages' ? 'mbn__item--active' : ''}`}
        onClick={() => navigate('/messages')}
      >
        <NavIcon name="messages" />
        <span>Messages</span>
      </button>
      <NotificationBell variant="mobile" />
      <div className="mbn__profileWrap">
        <button
          type="button"
          className={`mbn__item ${activePage === 'profile' || mobileProfileOpen ? 'mbn__item--active' : ''}`}
          aria-expanded={mobileProfileOpen}
          onClick={handleProfileClick}
        >
          <NavIcon name="profile" />
          <span>Profile</span>
        </button>

        {mobileProfileOpen ? (
          <div className="mbn__menu">
            {cachedProfile ? (
              <div className="mbn__dropdownProfile">
                <div
                  className="mbn__dropdownAvatar"
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
            <span className="mbn__groupLabel">Account</span>
            <button type="button" className="mbn__action" onClick={() => { setMobileProfileOpen(false); navigate('/profile'); }}>View profile</button>
            <button type="button" className="mbn__action" onClick={() => { setMobileProfileOpen(false); navigate('/applications'); }}>Job applications</button>
            <button type="button" className="mbn__action" onClick={() => { setMobileProfileOpen(false); navigate('/settings'); }}>Settings</button>
            <button type="button" className={`mbn__action ${glass ? 'mbn__action--active' : ''}`} onClick={toggleGlass}>
              {glass ? 'Light mode' : 'Dark mode'}
            </button>
            <div className="mbn__divider" />
            <span className="mbn__groupLabel">Manage</span>
            <button type="button" className="mbn__action" onClick={() => { setMobileProfileOpen(false); navigate('/company'); }}>Company</button>
            <div className="mbn__divider" />
            <button
              type="button"
              className="mbn__action mbn__action--danger"
              onClick={handleMobileLogout}
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
