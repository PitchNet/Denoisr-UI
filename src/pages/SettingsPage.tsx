import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { clearSession } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import '../styles/profile-edit.css'
import '../styles/settings.css'

type Tab = 'security' | 'notifications' | 'privacy' | 'data'
type SectionStatus = 'idle' | 'saving' | 'saved' | 'error'

type Settings = {
  notify_connections: boolean
  notify_messages: boolean
  notify_job_updates: boolean
  profile_visible: boolean
  allow_messages_from: 'all' | 'connections' | 'none'
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="st-toggleRow">
      <div className="st-toggleRow__text">
        <span className="st-toggleRow__label">{label}</span>
        <span className="st-toggleRow__desc">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`st-toggle${checked ? ' st-toggle--on' : ''}`}
        onClick={(e) => { e.preventDefault(); onChange(!checked) }}
      />
    </label>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('security')
  const [settings, setSettings] = useState<Settings | null>(null)

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwStatus, setPwStatus] = useState<SectionStatus>('idle')
  const [pwError, setPwError] = useState('')

  const [notifStatus, setNotifStatus] = useState<SectionStatus>('idle')
  const [privacyStatus, setPrivacyStatus] = useState<SectionStatus>('idle')

  const [exportStatus, setExportStatus] = useState<SectionStatus>('idle')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteStatus, setDeleteStatus] = useState<SectionStatus>('idle')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest('/SettingsController/getSettings', { method: 'GET' })
        if (!res.ok) { setLoadError('Failed to load settings'); return }
        const data = await res.json()
        setSettings(data)
      } catch {
        setLoadError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function updateSettings<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match'); return }
    if (pwNew.length < 8) { setPwError('New password must be at least 8 characters'); return }
    setPwStatus('saving')
    try {
      const res = await apiRequest('/SettingsController/changePassword', {
        body: { current_password: pwCurrent, new_password: pwNew },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setPwError((data as { detail?: string }).detail || 'Failed to update password')
        setPwStatus('error')
        return
      }
      setPwStatus('saved')
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
      setTimeout(() => setPwStatus('idle'), 3000)
    } catch {
      setPwError('Failed to update password')
      setPwStatus('error')
    }
  }

  async function handleNotifSave() {
    if (!settings) return
    setNotifStatus('saving')
    try {
      const res = await apiRequest('/SettingsController/updateNotificationPreferences', {
        body: {
          notify_connections: settings.notify_connections,
          notify_messages: settings.notify_messages,
          notify_job_updates: settings.notify_job_updates,
        },
      })
      setNotifStatus(res.ok ? 'saved' : 'error')
      if (res.ok) setTimeout(() => setNotifStatus('idle'), 3000)
    } catch {
      setNotifStatus('error')
    }
  }

  async function handlePrivacySave() {
    if (!settings) return
    setPrivacyStatus('saving')
    try {
      const res = await apiRequest('/SettingsController/updatePrivacySettings', {
        body: {
          profile_visible: settings.profile_visible,
          allow_messages_from: settings.allow_messages_from,
        },
      })
      setPrivacyStatus(res.ok ? 'saved' : 'error')
      if (res.ok) setTimeout(() => setPrivacyStatus('idle'), 3000)
    } catch {
      setPrivacyStatus('error')
    }
  }

  async function handleExport() {
    setExportStatus('saving')
    try {
      const res = await apiRequest('/SettingsController/exportData', { method: 'GET' })
      if (!res.ok) { setExportStatus('error'); return }
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `denoisr-data-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus('saved')
      setTimeout(() => setExportStatus('idle'), 3000)
    } catch {
      setExportStatus('error')
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    setDeleteError('')
    setDeleteStatus('saving')
    try {
      const res = await apiRequest('/SettingsController/deleteAccount', {
        body: { password: deletePassword },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDeleteError((data as { detail?: string }).detail || 'Failed to delete account')
        setDeleteStatus('error')
        return
      }
      clearSession()
      navigate('/')
    } catch {
      setDeleteError('Failed to delete account')
      setDeleteStatus('error')
    }
  }

  if (loading) {
    return <LoadingState label="Loading settings" detail="Fetching your account preferences." />
  }

  if (loadError || !settings) {
    return (
      <div className="st">
        <p className="st-fieldError">{loadError || 'Failed to load settings'}</p>
      </div>
    )
  }

  return (
    <div className="st">
      <header className="st-header">
        <span className="st-eyebrow">ACCOUNT</span>
        <h1 className="st-title">Settings</h1>
      </header>

      <nav className="st-tabs" aria-label="Settings sections">
        {(['security', 'notifications', 'privacy', 'data'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`st-tab${activeTab === tab ? ' st-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <div className="st-tabContent">

        {activeTab === 'security' && (
          <section className="st-section">
            <div className="st-section__head">
              <span className="st-eyebrow">SECURITY</span>
              <h2 className="st-section__title">Change password</h2>
              <p className="st-section__desc">Choose a strong password. It must be at least 8 characters.</p>
            </div>
            <form className="st-form" onSubmit={handlePasswordSubmit} noValidate>
              <div className="pe-field">
                <label className="pe-label">Current password</label>
                <input
                  className="pe-input"
                  type="password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="pe-field">
                <label className="pe-label">New password</label>
                <input
                  className="pe-input"
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="pe-field">
                <label className="pe-label">Confirm new password</label>
                <input
                  className="pe-input"
                  type="password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {pwError ? <p className="st-fieldError" role="alert">{pwError}</p> : null}
              {pwStatus === 'saved' ? <p className="st-success">Password updated.</p> : null}
              <button
                type="submit"
                className="btn btn--solidDark"
                disabled={pwStatus === 'saving'}
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              >
                {pwStatus === 'saving' ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="st-section">
            <div className="st-section__head">
              <span className="st-eyebrow">NOTIFICATIONS</span>
              <h2 className="st-section__title">Notification preferences</h2>
              <p className="st-section__desc">Choose which push and in-app alerts you receive.</p>
            </div>
            <div className="st-toggleGroup">
              <ToggleRow
                label="New connections"
                description="When someone connects with you"
                checked={settings.notify_connections}
                onChange={(v) => updateSettings('notify_connections', v)}
              />
              <ToggleRow
                label="Messages"
                description="When you receive a new message"
                checked={settings.notify_messages}
                onChange={(v) => updateSettings('notify_messages', v)}
              />
              <ToggleRow
                label="Job updates"
                description="When your application status changes"
                checked={settings.notify_job_updates}
                onChange={(v) => updateSettings('notify_job_updates', v)}
              />
            </div>
            {notifStatus === 'saved' ? <p className="st-success">Preferences saved.</p> : null}
            {notifStatus === 'error' ? <p className="st-fieldError">Failed to save. Try again.</p> : null}
            <button
              type="button"
              className="btn btn--solidDark"
              onClick={handleNotifSave}
              disabled={notifStatus === 'saving'}
              style={{ alignSelf: 'flex-start', marginTop: notifStatus === 'idle' ? 0 : 8 }}
            >
              {notifStatus === 'saving' ? 'Saving…' : 'Save preferences'}
            </button>
          </section>
        )}

        {activeTab === 'privacy' && (
          <section className="st-section">
            <div className="st-section__head">
              <span className="st-eyebrow">PRIVACY</span>
              <h2 className="st-section__title">Privacy controls</h2>
              <p className="st-section__desc">Control who can discover your profile and send you messages.</p>
            </div>
            <div className="st-toggleGroup">
              <ToggleRow
                label="Show profile in swipe feed"
                description="Other users can discover and connect with you"
                checked={settings.profile_visible}
                onChange={(v) => updateSettings('profile_visible', v)}
              />
            </div>
            <div className="pe-field" style={{ marginBottom: 24 }}>
              <label className="pe-label">Who can message you</label>
              <select
                className="st-select"
                value={settings.allow_messages_from}
                onChange={(e) => updateSettings('allow_messages_from', e.target.value as Settings['allow_messages_from'])}
              >
                <option value="all">Anyone</option>
                <option value="connections">Connections only</option>
                <option value="none">No one</option>
              </select>
            </div>
            {privacyStatus === 'saved' ? <p className="st-success">Settings saved.</p> : null}
            {privacyStatus === 'error' ? <p className="st-fieldError">Failed to save. Try again.</p> : null}
            <button
              type="button"
              className="btn btn--solidDark"
              onClick={handlePrivacySave}
              disabled={privacyStatus === 'saving'}
              style={{ alignSelf: 'flex-start', marginTop: privacyStatus === 'idle' ? 0 : 8 }}
            >
              {privacyStatus === 'saving' ? 'Saving…' : 'Save settings'}
            </button>
          </section>
        )}

        {activeTab === 'data' && (
          <>
            <section className="st-section">
              <div className="st-section__head">
                <span className="st-eyebrow">YOUR DATA</span>
                <h2 className="st-section__title">Export your data</h2>
                <p className="st-section__desc">
                  Download everything Denoisr holds about your account — profile, highlights, work history,
                  connections, messages you&rsquo;ve sent, and notifications — as a single JSON file.
                </p>
              </div>
              {exportStatus === 'error' ? <p className="st-fieldError">Failed to export. Try again.</p> : null}
              <button
                type="button"
                className="btn btn--solidDark"
                onClick={handleExport}
                disabled={exportStatus === 'saving'}
                style={{ alignSelf: 'flex-start' }}
              >
                {exportStatus === 'saving' ? 'Preparing…' : 'Download my data'}
              </button>
            </section>

            <section className="st-section st-dangerZone">
              <div className="st-section__head">
                <span className="st-eyebrow">DANGER ZONE</span>
                <h2 className="st-section__title">Delete your account</h2>
                <p className="st-section__desc">
                  Permanently deletes your profile, highlights, tags, work history, projects, connections,
                  sent messages, and notifications. This can&rsquo;t be undone. Jobs or a company page you&rsquo;ve
                  posted are left in place since they may involve other people&rsquo;s data (applicants, teammates).
                </p>
              </div>

              {!deleteConfirmOpen ? (
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => setDeleteConfirmOpen(true)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Delete my account
                </button>
              ) : (
                <form className="st-form" onSubmit={handleDeleteAccount} noValidate>
                  <div className="pe-field">
                    <label className="pe-label">Confirm your password</label>
                    <input
                      className="pe-input"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                      autoComplete="current-password"
                      autoFocus
                      required
                    />
                  </div>
                  {deleteError ? <p className="st-fieldError" role="alert">{deleteError}</p> : null}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="submit"
                      className="btn btn--danger"
                      disabled={deleteStatus === 'saving' || !deletePassword}
                    >
                      {deleteStatus === 'saving' ? 'Deleting…' : 'Permanently delete my account'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--outlinedLight"
                      onClick={() => { setDeleteConfirmOpen(false); setDeletePassword(''); setDeleteError('') }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  )
}
