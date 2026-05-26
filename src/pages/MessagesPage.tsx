import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { clearAuthToken, getAuthenticatedUserId } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import NavIcon from '../components/ui/NavIcon'
import { supabase } from '../supabase'
import '../styles/messages.css'

type Connection = {
  id: string
  conversationId?: string
  name: string
  preview: string
  avatar: string
  role: string
  status: string
  openable: boolean
  chips?: string[]
  details?: Array<{
    title: string
    body: string
  }>
}

type ThreadMessage = {
  id: string
  author: string
  side: 'left' | 'right'
  text: string
  meta: string
}

const SWATCHES = [
  'oklch(0.78 0.10 220)',
  'oklch(0.80 0.11 65)',
  'oklch(0.82 0.08 150)',
  'oklch(0.80 0.08 30)',
  'oklch(0.78 0.10 320)',
  'oklch(0.80 0.09 200)',
  'oklch(0.80 0.08 90)',
  'oklch(0.78 0.10 250)',
]

function swatchFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return SWATCHES[h % SWATCHES.length]
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const messagesThreadBodyRef = useRef<HTMLDivElement>(null)
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [threadLoading, setThreadLoading] = useState(false)

  async function loadThreadMessages(conversation: Connection, showLoader = true) {
    try {
      if (showLoader) setThreadLoading(true)

      const response = await apiRequest('/FeedController/getMessages', {
        method: 'POST',
        body: conversation.conversationId
          ? { conversationId: conversation.conversationId }
          : { recipientId: conversation.id },
      })

      if (!response.ok) {
        setError('Failed to load messages')
        return
      }

      const currentUserId = getAuthenticatedUserId()
      const data = (await response.json()) as Array<{
        id: string
        sender_id: string
        content: string
        created_at: string
      }>

      const formatted: ThreadMessage[] = data.map((message) => ({
        id: message.id,
        author:
          currentUserId !== '' && message.sender_id === currentUserId ? 'You' : conversation.name,
        side:
          currentUserId !== ''
            ? message.sender_id === currentUserId
              ? 'right'
              : 'left'
            : message.sender_id === conversation.id
              ? 'left'
              : 'right',
        text: message.content,
        meta: new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))

      setThreadMessages(formatted)
      setError(null)
    } catch {
      setError('Failed to load messages')
    } finally {
      if (showLoader) setThreadLoading(false)
    }
  }

  const activeConversation = useMemo(
    () => connections.find((c) => c.id === activeConversationId) ?? null,
    [activeConversationId, connections],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveConversationId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function fetchConnections(showLoader = true) {
    try {
      if (showLoader) setLoading(true)

      const response = await apiRequest('/FeedController/getConnections', { method: 'GET' })

      if (!response.ok) {
        setError('Failed to load connections')
        return []
      }

      const data = (await response.json()) as Array<Record<string, unknown>>
      const formatted: Connection[] = data.map((item, index) => ({
        id: String(item.id ?? item.personId ?? item.userId ?? `connection-${index}`),
        conversationId: item.conversationId === undefined ? undefined : String(item.conversationId),
        name: String(item.name ?? item.headline ?? 'Unknown'),
        preview: String(item.preview ?? item.lastMessage ?? item.intro ?? 'Start a contextual conversation.'),
        avatar: String(item.avatar ?? item.name ?? 'U')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase(),
        role: String(item.currentRole ?? item.role ?? 'Professional'),
        status: String(item.status ?? 'Connected'),
        openable: index === 0,
        chips: Array.isArray(item.chips)
          ? item.chips.filter((c): c is string => typeof c === 'string')
          : undefined,
        details: Array.isArray(item.details)
          ? item.details
              .map((d) => {
                if (
                  typeof d === 'object' &&
                  d !== null &&
                  'title' in d &&
                  'body' in d &&
                  typeof d.title === 'string' &&
                  typeof d.body === 'string'
                ) {
                  return { title: d.title, body: d.body }
                }
                return null
              })
              .filter((d): d is { title: string; body: string } => d !== null)
          : undefined,
      }))

      setConnections(formatted.length > 0 ? formatted : [])
      setError(null)
      return formatted
    } catch {
      setError('Failed to load connections')
      return []
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    if (threadLoading || threadMessages.length === 0) return
    const container = messagesThreadBodyRef.current
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100
      if (isAtBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      }
    }
  }, [threadMessages, threadLoading])

  useEffect(() => {
    if (activeConversationId) {
      const timer = setTimeout(() => {
        const container = messagesThreadBodyRef.current
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [activeConversationId])

  useEffect(() => {
    fetchConnections()
  }, [])

  useEffect(() => {
    if (!activeConversationId) {
      setThreadMessages([])
      return
    }

    loadThreadMessages(activeConversation!, true)

    const subscriptionConfig = activeConversation?.conversationId
      ? {
          event: 'INSERT' as const,
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.conversationId}`,
        }
      : {
          event: 'INSERT' as const,
          schema: 'public',
          table: 'messages',
        }

    const channel = supabase
      .channel(`messages:${activeConversation?.conversationId ?? activeConversation?.id}`)
      .on('postgres_changes', subscriptionConfig, () => {
        loadThreadMessages(activeConversation!, false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversationId])

  function handleMobileLogout() {
    clearAuthToken()
    setMobileProfileOpen(false)
    navigate('/login')
  }

  function openConversation(id: string) {
    setDraftMessage('')
    setActiveConversationId(id)
  }

  async function handleSendMessage() {
    if (!activeConversation || draftMessage.trim() === '' || isSending) return

    setIsSending(true)

    try {
      const content = draftMessage.trim()
      const response = await apiRequest('/FeedController/sendMessage', {
        method: 'POST',
        body: { recipientId: activeConversation.id, content },
      })

      if (!response.ok) {
        setError('Failed to send message')
        return
      }

      setConnections((current) =>
        current.map((c) => (c.id === activeConversation.id ? { ...c, preview: content } : c)),
      )
      setDraftMessage('')
      const refreshed = await fetchConnections(false)
      const updated = refreshed.find((c) => c.id === activeConversation.id) ?? activeConversation
      await loadThreadMessages(updated, false)
      setError(null)
    } catch {
      setError('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  function renderConversationItem(connection: Connection) {
    const isActive = activeConversationId === connection.id
    const content = (
      <>
        <div
          className="mp-item__avatar"
          style={{ background: swatchFor(connection.id) }}
          aria-hidden="true"
        >
          {connection.avatar}
        </div>
        <div className="mp-item__body">
          <div className="mp-item__topline">
            <span className="mp-item__name">{connection.name}</span>
            <span className="mp-item__status">{connection.status}</span>
          </div>
          <p className="mp-item__preview">{connection.preview}</p>
        </div>
      </>
    )

    const cls = `mp-item ${isActive ? 'mp-item--active' : ''} ${!connection.openable ? 'mp-item--locked' : ''}`.trim()

    if (!connection.openable) {
      return (
        <article key={connection.id} className={cls}>{content}</article>
      )
    }

    return (
      <button key={connection.id} type="button" className={cls} onClick={() => openConversation(connection.id)}>
        {content}
      </button>
    )
  }

  if (loading) {
    return (
      <LoadingState
        className="mp-loading"
        label="Loading threads"
        detail="Pulling in the connections you have an open line with."
      />
    )
  }

  if (error && connections.length === 0) {
    return (
      <div className="mp-error">
        <span className="mp-eyebrow">Error</span>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="mp">
      {/* ── Mobile header ── */}
      <div className="mp-mobileHead">
        {activeConversation ? (
          <div className="mp-mobileHead__row">
            <button
              type="button"
              className="mp-backbtn"
              onClick={() => setActiveConversationId(null)}
              aria-label="Close conversation"
            >
              ←
            </button>
            <div>
              <span className="mp-eyebrow">Active thread</span>
              <h1 className="mp-mobileHead__title">{activeConversation.name}</h1>
            </div>
          </div>
        ) : (
          <div>
            <span className="mp-eyebrow">Messages · Inbox</span>
            <h1 className="mp-mobileHead__title">Threads.</h1>
          </div>
        )}
      </div>

      <div className="mp-shell">
        {/* ── Sidebar (connection list) ── */}
        <aside
          className={`mp-sidebar ${activeConversation ? 'mp-sidebar--hiddenMobile' : ''}`}
        >
          <header className="mp-sidebar__head">
            <span className="mp-eyebrow">Connections · Mutual</span>
            <h2 className="mp-sidebar__title">Open lines.</h2>
          </header>

          <div className="mp-search">
            <input
              type="search"
              className="mp-searchInput"
              placeholder="Search by name or thread"
              aria-label="Search conversations"
            />
          </div>

          <button type="button" className="mp-requestsRow">
            <span>Sent connection requests</span>
            <span aria-hidden="true">→</span>
          </button>

          <div className="mp-list" aria-label="Conversation list">
            {connections.map((c) => renderConversationItem(c))}
          </div>
        </aside>

        {/* ── Thread ── */}
        <section
          className={`mp-thread ${!activeConversation ? 'mp-thread--hiddenMobile' : ''}`}
        >
          {!activeConversation ? (
            <div className="mp-empty">
              <span className="mp-eyebrow">Chat · Empty</span>
              <h2 className="mp-empty__title">Pick a thread.</h2>
              <p className="mp-empty__body">
                Threads open only on mutual interest. Until then, the inbox stays
                quiet — which is the point.
              </p>
            </div>
          ) : (
            <>
              <header className="mp-thread__head">
                <div>
                  <span className="mp-eyebrow">Active thread</span>
                  <h2 className="mp-thread__title">{activeConversation.name}</h2>
                </div>
                <span className="mp-thread__status">{activeConversation.status}</span>
              </header>

              <div className="mp-thread__body" ref={messagesThreadBodyRef}>
                <div className="mp-thread__inner">
                  {threadLoading ? (
                    <div className="mp-thread__loading el-meta">Loading messages…</div>
                  ) : threadMessages.length > 0 ? (
                    threadMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`mp-bubble ${
                          message.side === 'right' ? 'mp-bubble--out' : 'mp-bubble--in'
                        }`}
                      >
                        <p className="mp-bubble__text">{message.text}</p>
                        <div className="mp-bubble__meta">
                          <span>{message.author}</span>
                          <span className="dot">·</span>
                          <span>{message.meta}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="mp-thread__loading el-meta">
                      No messages yet — send the first opener.
                    </div>
                  )}
                </div>
              </div>

              <footer className="mp-composer">
                <textarea
                  className="mp-composer__input"
                  placeholder="Write something high-context. No fluff."
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  rows={2}
                />
                <div className="mp-composer__row">
                  <span className="mp-composer__hint el-meta">⌘ + ↵ to send</span>
                  <button
                    type="button"
                    className="btn btn--solidDark mp-composer__send"
                    onClick={handleSendMessage}
                    disabled={isSending || draftMessage.trim() === ''}
                  >
                    {isSending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>

        {/* ── Profile context rail ── */}
        <aside className="mp-context">
          {!activeConversation ? (
            <>
              <span className="mp-eyebrow">Profile · Context</span>
              <div className="mp-context__empty">
                <p>Open a thread to see who's on the other side.</p>
              </div>
            </>
          ) : (
            <>
              <span className="mp-eyebrow">Profile · Context</span>

              <div className="mp-context__hero">
                <div
                  className="mp-context__avatar"
                  style={{ background: swatchFor(activeConversation.id) }}
                  aria-hidden="true"
                >
                  {activeConversation.avatar}
                </div>
                <div>
                  <h3 className="mp-context__name">{activeConversation.name}</h3>
                  <p className="mp-context__role">{activeConversation.role}</p>
                </div>
              </div>

              {activeConversation.chips?.length ? (
                <div className="mp-context__chips">
                  {activeConversation.chips.map((chip) => (
                    <span key={chip} className="mp-chip">{chip}</span>
                  ))}
                </div>
              ) : null}

              {activeConversation.details?.map((block) => (
                <div key={block.title} className="mp-context__block">
                  <span className="mp-eyebrow">{block.title}</span>
                  <p>{block.body}</p>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mp-bottomnav" aria-label="Mobile navigation">
        <button type="button" className="mp-bottomnav__item" onClick={() => navigate('/home')}>
          <NavIcon name="home" />
          <span>Home</span>
        </button>
        <button type="button" className="mp-bottomnav__item" onClick={() => navigate('/messages')}>
          <NavIcon name="connections" />
          <span>Connections</span>
        </button>
        <button type="button" className="mp-bottomnav__item mp-bottomnav__item--active">
          <NavIcon name="messages" />
          <span>Messages</span>
        </button>
        <div className="mp-bottomnav__profileWrap">
          <button
            type="button"
            className={`mp-bottomnav__item ${mobileProfileOpen ? 'mp-bottomnav__item--active' : ''}`}
            aria-expanded={mobileProfileOpen}
            onClick={() => setMobileProfileOpen((v) => !v)}
          >
            <NavIcon name="profile" />
            <span>Profile</span>
          </button>

          {mobileProfileOpen ? (
            <div className="mp-bottomnav__menu">
              <button type="button" className="mp-bottomnav__action">View profile</button>
              <button type="button" className="mp-bottomnav__action">Job applications</button>
              <button type="button" className="mp-bottomnav__action" onClick={() => navigate('/messages')}>
                Connections
              </button>
              <button
                type="button"
                className="mp-bottomnav__action mp-bottomnav__action--danger"
                onClick={handleMobileLogout}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
