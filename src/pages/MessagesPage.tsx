import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api'
import { clearAuthToken, getAuthenticatedUserId } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import NavIcon from '../components/ui/NavIcon'
import { supabase } from '../supabase'

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

export default function MessagesPage() {
  const navigate = useNavigate()
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
      if (showLoader) {
        setThreadLoading(true)
      }

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

      const formattedMessages: ThreadMessage[] = data.map((message) => ({
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

      setThreadMessages(formattedMessages)
      setError(null)
    } catch {
      setError('Failed to load messages')
    } finally {
      if (showLoader) {
        setThreadLoading(false)
      }
    }
  }

  const activeConversation = useMemo(
    () => connections.find((connection) => connection.id === activeConversationId) ?? null,
    [activeConversationId, connections],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveConversationId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    async function fetchConnections() {
      try {
        setLoading(true)

        const response = await apiRequest('/FeedController/getConnections', {
          method: 'GET',
        })

        if (!response.ok) {
          setError('Failed to load connections')
          return
        }

        const data = (await response.json()) as Array<Record<string, unknown>>
        const formattedConnections: Connection[] = data.map((item, index) => ({
          id: String(item.id ?? item.personId ?? item.userId ?? `connection-${index}`),
          conversationId:
            item.conversationId === undefined ? undefined : String(item.conversationId),
          name: String(item.name ?? item.headline ?? 'Unknown connection'),
          preview: String(
            item.preview ?? item.lastMessage ?? item.intro ?? 'Start a contextual conversation.',
          ),
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
            ? item.chips.filter((chip): chip is string => typeof chip === 'string')
            : undefined,
          details: Array.isArray(item.details)
            ? item.details
                .map((detail) => {
                  if (
                    typeof detail === 'object' &&
                    detail !== null &&
                    'title' in detail &&
                    'body' in detail &&
                    typeof detail.title === 'string' &&
                    typeof detail.body === 'string'
                  ) {
                    return {
                      title: detail.title,
                      body: detail.body,
                    }
                  }

                  return null
                })
                .filter(
                  (
                    detail,
                  ): detail is {
                    title: string
                    body: string
                  } => detail !== null,
                )
            : undefined,
        }))

        setConnections(formattedConnections.length > 0 ? formattedConnections : [])
        setError(null)
      } catch {
        setError('Failed to load connections')
      } finally {
        setLoading(false)
      }
    }

    fetchConnections()
  }, [])

  useEffect(() => {
    if (!activeConversation) {
      setThreadMessages([])
      return
    }

    loadThreadMessages(activeConversation, true)

    const subscriptionConfig = activeConversation.conversationId
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
      .channel(`messages:${activeConversation.conversationId ?? activeConversation.id}`)
      .on(
        'postgres_changes',
        subscriptionConfig,
        () => {
          loadThreadMessages(activeConversation, false)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversation])

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
    if (!activeConversation || draftMessage.trim() === '' || isSending) {
      return
    }

    setIsSending(true)

    try {
      const content = draftMessage.trim()
      const response = await apiRequest('/FeedController/sendMessage', {
        method: 'POST',
        body: {
          recipientId: activeConversation.id,
          content,
        },
      })

      if (!response.ok) {
        setError('Failed to send message')
        return
      }

      setConnections((currentConnections) =>
        currentConnections.map((connection) =>
          connection.id === activeConversation.id
            ? {
                ...connection,
                preview: content,
              }
            : connection,
        ),
      )
      setDraftMessage('')
      await loadThreadMessages(activeConversation, false)
      setError(null)
    } catch {
      setError('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  function renderConversationItem(connection: Connection, mobile = false) {
    const content = (
      <>
        <div className="messagesAvatar">{connection.avatar}</div>
        <div className="messagesListItem__body">
          <div className="messagesListItem__name">{connection.name}</div>
          <div className="messagesListItem__preview">{connection.preview}</div>
        </div>
      </>
    )

    const classes = `messagesListItem ${
      activeConversationId === connection.id ? 'messagesListItem--active' : ''
    } ${mobile ? 'messagesListItem--mobile' : ''}`.trim()

    if (!connection.openable) {
      return (
        <article key={connection.id} className={classes}>
          {content}
        </article>
      )
    }

    return (
      <button
        key={connection.id}
        type="button"
        className={`${classes} messagesListItemButton`}
        onClick={() => openConversation(connection.id)}
      >
        {content}
      </button>
    )
  }

  if (loading) {
    return (
      <LoadingState
        className="messagesPage"
        label="Loading conversations"
        detail="Bringing your active network threads into view."
      />
    )
  }

  if (error && connections.length === 0) {
    return <div className="messagesPage messagesPage__error">{error}</div>
  }

  return (
    <div className="messagesPage denoisr">
      <div className="container messagesShell">
        <section className="messagesMobileHeader">
          {activeConversation ? (
            <div className="messagesMobileHeader__row">
              <button
                type="button"
                className="messagesBackBtn"
                onClick={() => setActiveConversationId(null)}
                aria-label="Close conversation"
              >
                ←
              </button>
              <div>
                <div className="sectionLabel sectionLabel--mono">ACTIVE THREAD</div>
                <h1 className="messagesTitle messagesTitle--mobile">{activeConversation.name}</h1>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="sectionLabel sectionLabel--mono">MESSAGES</div>
                <h1 className="messagesTitle">Messages</h1>
              </div>
              <div className="messagesHeaderIcons" aria-hidden="true">
                <span className="messagesHeaderDot" />
                <span className="messagesHeaderDot messagesHeaderDot--filled" />
              </div>
            </>
          )}
        </section>

        <aside className="messagesSidebar card">
          <div className="messagesSidebar__searchWrap">
            <input className="field__input messagesSearch" type="search" placeholder="Search conversations" />
          </div>

          <button type="button" className="messagesRequestsRow">
            <span>View Sent Connection Requests</span>
            <span className="messagesRequestsArrow" aria-hidden="true">→</span>
          </button>

          <div className="messagesList" aria-label="Connection list">
            {connections.map((connection) => renderConversationItem(connection))}
          </div>
        </aside>

        <section className="messagesThread card">
          {!activeConversation ? (
            <>
              <div className="messagesThread__mobileList">
                <button type="button" className="messagesRequestsRow messagesRequestsRow--mobileOnly">
                  <span>View Sent Connection Requests</span>
                  <span className="messagesRequestsArrow" aria-hidden="true">→</span>
                </button>

                <div className="messagesList messagesList--mobile" aria-label="Active conversations">
                  {connections.map((connection) => renderConversationItem(connection, true))}
                </div>
              </div>

              <header className="messagesThread__header">
                <div>
                  <div className="sectionLabel sectionLabel--mono">ACTIVE THREAD</div>
                  <h2 className="messagesThread__title">Messages</h2>
                </div>
                <div className="messagesThread__status">No conversation selected</div>
              </header>

              <div className="messagesThread__body messagesThread__body--empty">
                <div className="messagesEmptyState">
                  <div className="sectionLabel sectionLabel--mono">CHAT WINDOW</div>
                  <h3 className="messagesEmptyState__title">Select a conversation to start chatting</h3>
                </div>
              </div>

              <footer className="messagesComposer">
                <div className="messagesComposer__box">
                  <div className="messagesComposer__label">Draft message</div>
                  <div className="messagesComposer__placeholder">Type a thoughtful, high-context reply...</div>
                </div>
              </footer>
            </>
          ) : (
            <>
              <header className="messagesThread__header">
                <div>
                  <div className="sectionLabel sectionLabel--mono">ACTIVE THREAD</div>
                  <h2 className="messagesThread__title">{activeConversation.name}</h2>
                </div>
                <div className="messagesThread__status">{activeConversation.status}</div>
              </header>

              <div className="messagesThread__body">
                <div className="messagesThread__inner">
                  {threadLoading ? (
                    <div className="messagesThreadLoading">Loading messages...</div>
                  ) : threadMessages.length > 0 ? (
                    threadMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`messageBubble ${
                          message.side === 'right' ? 'messageBubble--outbound' : 'messageBubble--inbound'
                        }`}
                      >
                        <div className="messageBubble__author">{message.author}</div>
                        <p className="messageBubble__text">{message.text}</p>
                        <div className="messageBubble__meta">{message.meta}</div>
                      </article>
                    ))
                  ) : (
                    <div className="messagesThreadLoading">No messages yet.</div>
                  )}
                </div>
              </div>

              <footer className="messagesComposer">
                <div className="messagesComposer__box messagesComposer__box--active">
                  <label className="messagesComposer__field">
                    <div className="messagesComposer__label">Draft message</div>
                    <textarea
                      className="messagesComposer__input"
                      placeholder="Type a thoughtful, high-context reply..."
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                    />
                  </label>
                  <button type="button" className="btn btn--solidDark messagesComposer__sendBtn" onClick={handleSendMessage}>
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>

        <aside className="messagesDetails card">
          {!activeConversation ? (
            <>
              <div className="sectionLabel sectionLabel--mono">PROFILE CONTEXT</div>
              <div className="messagesDetails__empty">
                <div className="messagesDetails__emptyIcon">
                  <NavIcon name="connections" />
                </div>
                <p className="messagesDetails__emptyText">Connect, chat, and stay in touch with your network.</p>
              </div>
            </>
          ) : (
            <>
              <div className="sectionLabel sectionLabel--mono">PROFILE CONTEXT</div>
              <div className="messagesDetails__hero">
                <div className="messagesAvatar messagesAvatar--lg">{activeConversation.avatar}</div>
                <div>
                  <h2 className="messagesDetails__name">{activeConversation.name}</h2>
                  <p className="messagesDetails__role">{activeConversation.role}</p>
                </div>
              </div>

              <div className="messagesDetails__chips">
                {activeConversation.chips?.map((chip) => (
                  <span key={chip} className="homeTag">
                    {chip}
                  </span>
                ))}
              </div>

              {activeConversation.details?.map((block) => (
                <div key={block.title} className="messagesDetails__block">
                  <div className="messagesDetails__blockTitle">{block.title}</div>
                  <p className="messagesDetails__blockBody">{block.body}</p>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>

      <nav className="homeBottomNav" aria-label="Mobile navigation">
        <button type="button" className="homeBottomNav__item" onClick={() => navigate('/home')}>
          <NavIcon name="home" />
          <span>Home</span>
        </button>
        <button type="button" className="homeBottomNav__item">
          <NavIcon name="connections" />
          <span>Connections</span>
        </button>
        <button type="button" className="homeBottomNav__item homeBottomNav__item--active">
          <NavIcon name="messages" />
          <span>Messages</span>
        </button>
        <div className="homeBottomNav__profileWrap">
          <button
            type="button"
            className={`homeBottomNav__item ${mobileProfileOpen ? 'homeBottomNav__item--active' : ''}`}
            aria-expanded={mobileProfileOpen}
            onClick={() => setMobileProfileOpen((value) => !value)}
          >
            <NavIcon name="profile" />
            <span>Profile</span>
          </button>

          {mobileProfileOpen ? (
            <div className="homeBottomNav__profileMenu">
              <button type="button" className="homeBottomNav__profileAction">
                View Profile
              </button>
              <button type="button" className="homeBottomNav__profileAction">
                View Job Applications
              </button>
              <button type="button" className="homeBottomNav__profileAction" onClick={() => navigate('/messages')}>
                View Connections
              </button>
              <button
                type="button"
                className="homeBottomNav__profileAction homeBottomNav__profileAction--danger"
                onClick={handleMobileLogout}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
