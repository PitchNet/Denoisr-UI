import NavIcon from '../components/ui/NavIcon'

const connections = [
  {
    id: 'aanya',
    name: 'Aanya Mehta',
    preview: 'Shared a note on component systems and trust-heavy workflows.',
    avatar: 'AM',
    active: true,
  },
  {
    id: 'mateo',
    name: 'Mateo Ruiz',
    preview: 'Sent examples of enterprise UX work for procurement flows.',
    avatar: 'MR',
  },
  {
    id: 'naomi',
    name: 'Naomi Carter',
    preview: 'Following up on calibrated scorecards and hiring ops systems.',
    avatar: 'NC',
  },
  {
    id: 'leah',
    name: 'Leah Park',
    preview: 'Open to discussing product design roles in structured teams.',
    avatar: 'LP',
  },
  {
    id: 'omar',
    name: 'Omar Khan',
    preview: 'Interested in signal-first matching for technical recruiting.',
    avatar: 'OK',
  },
]

export default function MessagesPage() {
  return (
    <div className="messagesPage denoisr">
      <div className="container messagesShell">
        <section className="messagesMobileHeader">
          <div>
            <div className="sectionLabel sectionLabel--mono">MESSAGES</div>
            <h1 className="messagesTitle">Messages</h1>
          </div>
          <div className="messagesHeaderIcons" aria-hidden="true">
            <span className="messagesHeaderDot" />
            <span className="messagesHeaderDot messagesHeaderDot--filled" />
          </div>
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
            {connections.map((connection) => (
              <article
                key={connection.id}
                className={`messagesListItem ${connection.active ? 'messagesListItem--active' : ''}`}
              >
                <div className="messagesAvatar">{connection.avatar}</div>
                <div className="messagesListItem__body">
                  <div className="messagesListItem__name">{connection.name}</div>
                  <div className="messagesListItem__preview">{connection.preview}</div>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="messagesThread card">
          <header className="messagesThread__header">
            <div>
              <div className="sectionLabel sectionLabel--mono">ACTIVE THREAD</div>
              <h2 className="messagesThread__title">Messages</h2>
            </div>
            <div className="messagesThread__status">No conversation selected</div>
          </header>

          <div className="messagesRequestsRow messagesRequestsRow--mobileOnly">
            <span>View Sent Connection Requests</span>
            <span className="messagesRequestsArrow" aria-hidden="true">→</span>
          </div>

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
        </section>

        <aside className="messagesDetails card">
          <div className="sectionLabel sectionLabel--mono">PROFILE CONTEXT</div>
          <div className="messagesDetails__empty">
            <div className="messagesDetails__emptyIcon">
              <NavIcon name="connections" />
            </div>
            <p className="messagesDetails__emptyText">Connect, chat, and stay in touch with your network.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
