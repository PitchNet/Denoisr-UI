import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../api'
import { getAuthenticatedUserId } from '../../auth'
import { supabase } from '../../supabase'
import NavIcon from './NavIcon'

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function notificationUrl(n: NotificationItem) {
  const t = n.type
  if (t === 'message') return '/messages'
  if (t === 'connection') return '/messages'
  if (t === 'job_status') return '/applications'
  return null
}

type Props = {
  variant?: 'desktop' | 'mobile'
}

export default function NotificationBell({ variant = 'desktop' }: Props) {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const userId = getAuthenticatedUserId()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!userId) return

    apiRequest('/NotificationController/unreadCount', { method: 'GET' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setUnreadCount(data.count) })
      .catch(() => {})

    const channelName = 'notifications:' + userId + ':' + Date.now()
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => setUnreadCount((c) => c + 1),
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [userId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function toggleOpen() {
    if (!open) {
      setLoading(true)
      apiRequest('/NotificationController/getNotifications', {
        method: 'GET',
      })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setNotifications(data.items ?? [])
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    setOpen((v) => !v)
  }

  function markRead(ids?: string[]) {
    apiRequest('/NotificationController/markRead', {
      method: 'POST',
      body: ids ? { ids } : {},
    }).catch(() => {})
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    markRead()
  }

  function handleItemClick(n: NotificationItem) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
      setUnreadCount((c) => Math.max(0, c - 1))
      markRead([n.id])
    }
    const url = notificationUrl(n)
    if (url) navigate(url)
    setOpen(false)
  }

  return (
    <div className={`nb ${variant === 'mobile' ? 'nb--mobile' : ''}`} ref={dropRef}>
      <button
        type="button"
        className={variant === 'desktop'
          ? `nav__appLink ${open ? 'nav__appLink--active' : ''}`
          : `mbn__item ${open ? 'mbn__item--active' : ''}`
        }
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        onClick={toggleOpen}
      >
        <span className="nb__iconWrap">
          <NavIcon name="notifications" />
          {unreadCount > 0 ? <span className="nb__badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
        </span>
        {variant === 'desktop' ? (
          <span className="nav__appLabel">Alerts</span>
        ) : (
          <span>Alerts</span>
        )}
      </button>

      {open ? (
        <div className="nb__dropdown">
          <div className="nb__header">
            <span className="nb__brow">Notifications</span>
            {notifications.some((n) => !n.read) ? (
              <button type="button" className="nb__markAll" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="nb__list">
            {loading ? (
              <div className="nb__empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="nb__empty">
                <span className="nb__emptyTitle">All caught up</span>
                <span className="nb__emptyDesc">No new notifications.</span>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`nb__item ${!n.read ? 'nb__item--unread' : ''}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className="nb__itemDot" aria-hidden="true" />
                  <div className="nb__itemBody">
                    <span className="nb__itemTitle">{n.title}</span>
                    {n.body ? <span className="nb__itemText">{n.body}</span> : null}
                    <span className="nb__itemTime">{relativeTime(n.created_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
