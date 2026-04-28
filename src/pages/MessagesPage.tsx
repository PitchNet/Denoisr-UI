import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../auth'
import NavIcon from '../components/ui/NavIcon'

const connections = [
  {
    id: 'aanya',
    name: 'Aanya Mehta',
    preview: 'Shared a note on component systems and trust-heavy workflows.',
    avatar: 'AM',
    role: 'Frontend Engineer',
    status: 'Open to roles',
    openable: true,
    chips: ['React', 'TypeScript', 'Design systems'],
    details: [
      {
        title: 'Current intent',
        body: 'Exploring roles where structured product systems and measurable outcomes matter more than visibility loops.',
      },
      {
        title: 'Shared signal',
        body: 'Strong overlap in workflow products, design systems, and trust-first enterprise tools.',
      },
    ],
  },
  {
    id: 'mateo',
    name: 'Mateo Ruiz',
    preview: 'Sent examples of enterprise UX work for procurement flows.',
    avatar: 'MR',
    role: 'Product Designer',
    status: 'Placeholder',
    openable: false,
  },
  {
    id: 'naomi',
    name: 'Naomi Carter',
    preview: 'Following up on calibrated scorecards and hiring ops systems.',
    avatar: 'NC',
    role: 'Recruiting Ops Lead',
    status: 'Placeholder',
    openable: false,
  },
  {
    id: 'leah',
    name: 'Leah Park',
    preview: 'Open to discussing product design roles in structured teams.',
    avatar: 'LP',
    role: 'Design Systems Lead',
    status: 'Placeholder',
    openable: false,
  },
  {
    id: 'omar',
    name: 'Omar Khan',
    preview: 'Interested in signal-first matching for technical recruiting.',
    avatar: 'OK',
    role: 'Talent Partner',
    status: 'Placeholder',
    openable: false,
  },
]

const placeholderMessages = [
  {
    id: 'm1',
    author: 'Aanya',
    side: 'left',
    text: 'I liked how Denoisr keeps the profile focused on proof rather than noise. Happy to share a few systems I shipped recently.',
    meta: '09:14',
  },
  {
    id: 'm2',
    author: 'You',
    side: 'right',
    text: 'That would be helpful. I am especially interested in interfaces that help operators decide quickly without cognitive overload.',
    meta: '09:18',
  },
  {
    id: 'm3',
    author: 'Aanya',
    side: 'left',
    text: 'Perfect fit. I worked on a recruiter review flow that cut task time by 38% by restructuring evaluation around context and evidence.',
    meta: '09:22',
  },
]

export default function MessagesPage() {
  const navigate = useNavigate()
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const activeConversation = useMemo(
    () => connections.find((connection) => connection.id === activeConversationId) ?? null,
    [activeConversationId],
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

  function handleMobileLogout() {
    clearAuthToken()
    setMobileProfileOpen(false)
    navigate('/login')
  }

  function openConversation(id: string) {
    setActiveConversationId(id)
  }

  function renderConversationItem(connection: (typeof connections)[number], mobile = false) {
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
                  {placeholderMessages.map((message) => (
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
                  ))}
                </div>
              </div>

              <footer className="messagesComposer">
                <div className="messagesComposer__box messagesComposer__box--active">
                  <label className="messagesComposer__field">
                    <div className="messagesComposer__label">Draft message</div>
                    <textarea
                      className="messagesComposer__input"
                      placeholder="Type a thoughtful, high-context reply..."
                    />
                  </label>
                  <button type="button" className="btn btn--solidDark messagesComposer__sendBtn">
                    Send
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
