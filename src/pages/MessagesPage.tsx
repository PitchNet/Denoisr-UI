import { useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../api'
import { getAuthenticatedUserId } from '../auth'
import LoadingState from '../components/ui/LoadingState'
import ReportUserModal from '../components/ui/ReportUserModal'
import { useToast } from '../components/ui/Toast'
import { supabase } from '../supabase'
import '../styles/messages.css'

type Connection = {
  id: string
  conversationId?: string
  name: string
  preview: string
  avatar: string
  photo: string
  role: string
  status: string
  openable: boolean
  muted?: boolean
  chips?: string[]
  details?: Array<{
    title: string
    body: string
  }>
}

type Reaction = {
  emoji: string
  count: number
  mine: boolean
}

type ThreadMessage = {
  id: string
  author: string
  side: 'left' | 'right'
  text: string
  meta: string
  createdAt: string
  reactions: Reaction[]
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

type SentRequest = {
  id: string
  name: string
  role: string
  photo: string
  avatar: string
  sentAt: string
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
  const { showToast } = useToast()
  const userId = getAuthenticatedUserId()
  const messagesThreadBodyRef = useRef<HTMLDivElement>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [threadLoading, setThreadLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [sidebarView, setSidebarView] = useState<'connections' | 'requests' | 'archived'>('connections')
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
  const [sentRequestsLoading, setSentRequestsLoading] = useState(false)
  const [archivedConnections, setArchivedConnections] = useState<Connection[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null)
  const [reactionPickerId, setReactionPickerId] = useState<string | null>(null)
  const activeConversationRef = useRef<Connection | null>(null)
  const searchVersionRef = useRef(0)
  // Render-time ref updates — callbacks always read the latest values
  const searchQueryRef = useRef(searchQuery)
  searchQueryRef.current = searchQuery
  const fetchConnectionsRef = useRef<typeof fetchConnections | null>(null)

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

      const payload = (await response.json()) as {
        messages: Array<{
          id: string
          sender_id: string
          content: string
          created_at: string
          message_reactions?: Array<{ id: string; user_id: string; emoji: string }>
        }>
        otherReadAt: string | null
      }

      const formatted: ThreadMessage[] = payload.messages.map((message) => {
        const grouped = new Map<string, Reaction>()
        for (const r of message.message_reactions ?? []) {
          const existing = grouped.get(r.emoji)
          const mine = userId !== '' && r.user_id === userId
          if (existing) {
            existing.count += 1
            existing.mine = existing.mine || mine
          } else {
            grouped.set(r.emoji, { emoji: r.emoji, count: 1, mine })
          }
        }

        return {
          id: message.id,
          author:
            userId !== '' && message.sender_id === userId ? 'You' : conversation.name,
          side:
            userId !== ''
              ? message.sender_id === userId
                ? 'right'
                : 'left'
              : message.sender_id === conversation.id
                ? 'left'
                : 'right',
          text: message.content,
          createdAt: message.created_at,
          meta: new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          reactions: Array.from(grouped.values()),
        }
      })

      setThreadMessages(formatted)
      setOtherReadAt(payload.otherReadAt)
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

  const lastOwnMessage = useMemo(
    () => [...threadMessages].reverse().find((m) => m.side === 'right') ?? null,
    [threadMessages],
  )
  const lastOwnMessageSeen = Boolean(
    lastOwnMessage && otherReadAt && new Date(otherReadAt) >= new Date(lastOwnMessage.createdAt),
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveConversationId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function fetchConnections(showLoader = true, q = '') {
    const version = ++searchVersionRef.current
    try {
      if (showLoader) setLoading(true)

      const url = q.trim()
        ? `/FeedController/getConnections?q=${encodeURIComponent(q.trim())}`
        : '/FeedController/getConnections'
      const response = await apiRequest(url, { method: 'GET' })

      if (!response.ok) {
        setError('Failed to load connections')
        return []
      }

      const data = (await response.json()) as Array<Record<string, unknown>>
      const formatted: Connection[] = data.map((item, index) => ({
        id: String(item.id ?? item.personId ?? item.userId ?? `connection-${index}`),
        conversationId: item.conversationId === undefined ? undefined : String(item.conversationId),
        name: String(item.name ?? item.headline ?? 'Unknown'),
        preview: !item.lastMessage
          ? 'Say hi to your new connection.'
          : typeof item.lastMessage === 'string'
            ? item.lastMessage
            : String((item.lastMessage as Record<string, unknown>).content ?? item.lastMessage),
        avatar: String(item.avatar ?? '')
          ? String(item.avatar)
          : String(item.name ?? 'U')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase(),
        photo: String(item.photo ?? ''),
        role: String(item.currentRole ?? item.role ?? 'Professional'),
        status: String(item.status ?? 'Connected'),
        openable: true,
        muted: Boolean(item.muted),
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

      if (version !== searchVersionRef.current) return []
      setConnections(formatted)
      setError(null)
      return formatted
    } catch {
      if (version !== searchVersionRef.current) return []
      setError('Failed to load connections')
      return []
    } finally {
      if (version === searchVersionRef.current) {
        if (showLoader) setLoading(false)
        setIsSearching(false)
      }
    }
  }

  fetchConnectionsRef.current = fetchConnections

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    // Clear search: immediately reload the full list
    if (!value.trim()) {
      setLastSearchedQuery('')
      fetchConnections(false, '')
    }
  }

  function handleSearchSubmit() {
    const q = searchQuery.trim()
    if (!q) return
    setLastSearchedQuery(q)
    setIsSearching(true)
    fetchConnections(false, q)
  }

  async function fetchSentRequests() {
    setSentRequestsLoading(true)
    try {
      const res = await apiRequest('/FeedController/getSentRequests', { method: 'GET' })
      if (res.ok) {
        const data = (await res.json()) as SentRequest[]
        setSentRequests(data)
      }
    } catch {
      // silently fail — list just stays empty
    } finally {
      setSentRequestsLoading(false)
    }
  }

  async function handleWithdraw(req: SentRequest) {
    // Optimistic remove
    setSentRequests((prev) => prev.filter((r) => r.id !== req.id))
    try {
      const res = await apiRequest('/FeedController/withdrawRequest', {
        method: 'POST',
        body: { peopleId: req.id },
      })
      if (!res.ok) throw new Error('failed')
    } catch {
      // Restore on failure
      setSentRequests((prev) => {
        const already = prev.some((r) => r.id === req.id)
        return already ? prev : [req, ...prev]
      })
      showToast('Failed to withdraw request', 'error')
    }
  }

  function openSentRequestsView() {
    setSidebarView('requests')
    fetchSentRequests()
  }

  useEffect(() => {
    if (!openMenuId) return
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Element
      if (!target.closest('.mp-item__menu') && !target.closest('.mp-item__menuBtn')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openMenuId])

  useEffect(() => {
    if (!contextMenuOpen) return
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Element
      if (!target.closest('.mp-context__menu') && !target.closest('.mp-context__menuBtn')) {
        setContextMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [contextMenuOpen])

  useEffect(() => {
    if (!reactionPickerId) return
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Element
      if (!target.closest('.mp-reactionPicker') && !target.closest('.mp-bubble__reactBtn')) {
        setReactionPickerId(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [reactionPickerId])

  async function fetchArchivedConnections() {
    setArchivedLoading(true)
    try {
      const res = await apiRequest('/FeedController/getConnections?archived=true', { method: 'GET' })
      if (res.ok) {
        const data = (await res.json()) as Array<Record<string, unknown>>
        const formatted: Connection[] = data.map((item, index) => ({
          id: String(item.id ?? item.personId ?? item.userId ?? `connection-${index}`),
          conversationId: item.conversationId === undefined ? undefined : String(item.conversationId),
          name: String(item.name ?? item.headline ?? 'Unknown'),
          preview: !item.lastMessage
            ? 'Say hi to your new connection.'
            : typeof item.lastMessage === 'string'
              ? item.lastMessage
              : String((item.lastMessage as Record<string, unknown>).content ?? item.lastMessage),
          avatar: String(item.avatar ?? '')
            ? String(item.avatar)
            : String(item.name ?? 'U')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase(),
          photo: String(item.photo ?? ''),
          role: String(item.currentRole ?? item.role ?? 'Professional'),
          status: String(item.status ?? 'Connected'),
          openable: true,
          muted: Boolean(item.muted),
        }))
        setArchivedConnections(formatted)
      }
    } catch {
      // silently fail — list just stays empty
    } finally {
      setArchivedLoading(false)
    }
  }

  async function handleArchive(connection: Connection) {
    if (!connection.conversationId) return
    if (activeConversationId === connection.id) setActiveConversationId(null)
    setConnections((prev) => prev.filter((c) => c.id !== connection.id))
    try {
      const res = await apiRequest('/FeedController/archiveConversation', {
        method: 'POST',
        body: { conversationId: connection.conversationId, archived: true },
      })
      if (!res.ok) throw new Error('failed')
      setArchivedConnections((prev) => {
        const already = prev.some((c) => c.id === connection.id)
        return already ? prev : [connection, ...prev]
      })
    } catch {
      setConnections((prev) => {
        const already = prev.some((c) => c.id === connection.id)
        return already ? prev : [connection, ...prev]
      })
      showToast('Failed to archive conversation', 'error')
    }
  }

  async function handleUnarchive(connection: Connection) {
    if (!connection.conversationId) return
    setArchivedConnections((prev) => prev.filter((c) => c.id !== connection.id))
    try {
      const res = await apiRequest('/FeedController/archiveConversation', {
        method: 'POST',
        body: { conversationId: connection.conversationId, archived: false },
      })
      if (!res.ok) throw new Error('failed')
      setConnections((prev) => {
        const already = prev.some((c) => c.id === connection.id)
        return already ? prev : [connection, ...prev]
      })
    } catch {
      setArchivedConnections((prev) => {
        const already = prev.some((c) => c.id === connection.id)
        return already ? prev : [connection, ...prev]
      })
      showToast('Failed to unarchive conversation', 'error')
    }
  }

  async function handleMute(connection: Connection) {
    if (!connection.conversationId) return
    const newMuted = !connection.muted
    setConnections((prev) =>
      prev.map((c) => (c.id === connection.id ? { ...c, muted: newMuted } : c)),
    )
    try {
      const res = await apiRequest('/FeedController/muteConversation', {
        method: 'POST',
        body: { conversationId: connection.conversationId, muted: newMuted },
      })
      if (!res.ok) throw new Error('failed')
    } catch {
      setConnections((prev) =>
        prev.map((c) => (c.id === connection.id ? { ...c, muted: !newMuted } : c)),
      )
      showToast('Failed to update mute setting', 'error')
    }
  }

  async function handleBlock(connection: Connection) {
    if (!window.confirm(`Block ${connection.name}? They won't be able to message you again, and you won't see each other anymore.`)) {
      return
    }
    try {
      const res = await apiRequest('/FeedController/blockUser', {
        method: 'POST',
        body: { peopleId: connection.id },
      })
      if (!res.ok) throw new Error('failed')
      setConnections((prev) => prev.filter((c) => c.id !== connection.id))
      if (activeConversationId === connection.id) setActiveConversationId(null)
      showToast(`Blocked ${connection.name}`, 'success')
    } catch {
      showToast('Failed to block user', 'error')
    }
  }

  async function handleReportSubmit(connection: Connection, reason: string, details: string) {
    setReportSubmitting(true)
    try {
      const res = await apiRequest('/FeedController/reportUser', {
        method: 'POST',
        body: { peopleId: connection.id, reason, details },
      })
      if (!res.ok) throw new Error('failed')
      setReportModalOpen(false)
      showToast('Report submitted. Thanks for letting us know.', 'success')
    } catch {
      showToast('Failed to submit report', 'error')
    } finally {
      setReportSubmitting(false)
    }
  }

  function openArchivedView() {
    setSidebarView('archived')
    fetchArchivedConnections()
  }

  // Tracks whether the user was scrolled to the bottom *before* the latest
  // threadMessages update, so new content doesn't retroactively decide
  // "was I at the bottom" using a scrollHeight that already includes itself.
  const wasAtBottomRef = useRef(true)

  useEffect(() => {
    const container = messagesThreadBodyRef.current
    if (!container) return
    function handleScroll() {
      wasAtBottomRef.current = container!.scrollHeight - container!.scrollTop - container!.clientHeight < 80
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (threadLoading || threadMessages.length === 0) return
    const container = messagesThreadBodyRef.current
    if (container && wasAtBottomRef.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [threadMessages, threadLoading])

  useEffect(() => {
    if (!activeConversationId) return
    wasAtBottomRef.current = true
  }, [activeConversationId])

  useEffect(() => {
    if (threadLoading) return
    const container = messagesThreadBodyRef.current
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'auto' })
  }, [activeConversationId, threadLoading])

  useEffect(() => {
    fetchConnections()
    fetchSentRequests()
  }, [])

  // Global inbox subscription — re-sorts the list and updates previews for
  // messages received in ANY of the user's conversations, not just the active one.
  const conversationIdsKey = connections
    .map((c) => c.conversationId)
    .filter(Boolean)
    .sort()
    .join(',')

  useEffect(() => {
    if (!conversationIdsKey || !userId) return

    const channel = supabase
      .channel(`inbox:${userId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${conversationIdsKey})`,
        },
        (payload: { new: Record<string, unknown> }) => {
          // Ignore messages we sent — handleSendMessage already calls fetchConnections
          if (payload.new?.sender_id === userId) return
          fetchConnectionsRef.current?.(false, searchQueryRef.current)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationIdsKey, userId])

  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  useEffect(() => {
    if (!activeConversationId) {
      setThreadMessages([])
      return
    }

    // Clear messages immediately when switching conversations
    setThreadMessages([])

    const conversation = activeConversation!
    activeConversationRef.current = conversation

    loadThreadMessages(conversation, true).then(() => markRead(conversation))

    const subscriptionConfig = conversation.conversationId
      ? {
          event: 'INSERT' as const,
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.conversationId}`,
        }
      : {
          event: 'INSERT' as const,
          schema: 'public',
          table: 'messages',
        }

    const channelBuilder = supabase
      .channel(`messages:${conversation.conversationId ?? conversation.id}`)
      .on('postgres_changes', subscriptionConfig, (payload: { new: Record<string, unknown> }) => {
        const latest = activeConversationRef.current
        if (!latest || latest.id !== conversation.id) return
        loadThreadMessages(latest, false).then(() => markRead(latest))
        // Bubble this conversation to the top with the incoming message as the preview
        const incomingContent = typeof payload.new?.content === 'string' ? payload.new.content : undefined
        setConnections((prev) => {
          const idx = prev.findIndex((c) => c.id === latest.id)
          if (idx <= 0) return prev
          const updated = [...prev]
          const [item] = updated.splice(idx, 1)
          updated.unshift({ ...item, preview: incomingContent ?? item.preview })
          return updated
        })
      })

    if (conversation.conversationId) {
      channelBuilder
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'message_reactions',
            filter: `conversation_id=eq.${conversation.conversationId}`,
          },
          () => {
            const latest = activeConversationRef.current
            if (!latest || latest.id !== conversation.id) return
            loadThreadMessages(latest, false)
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversation_participants',
            filter: `conversation_id=eq.${conversation.conversationId}`,
          },
          () => {
            const latest = activeConversationRef.current
            if (!latest || latest.id !== conversation.id) return
            loadThreadMessages(latest, false)
          },
        )
    }

    const channel = channelBuilder.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversationId])

  async function markRead(conversation: Connection) {
    if (!conversation.conversationId) return
    try {
      await apiRequest('/FeedController/markRead', {
        method: 'POST',
        body: { conversationId: conversation.conversationId },
      })
    } catch {
      // best-effort — a missed read receipt isn't worth surfacing to the user
    }
  }

  async function handleReact(messageId: string, emoji: string) {
    setThreadMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m
        const existing = m.reactions.find((r) => r.emoji === emoji)
        if (existing?.mine) {
          const updated = m.reactions
            .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r))
            .filter((r) => r.count > 0)
          return { ...m, reactions: updated }
        }
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r)),
          }
        }
        return { ...m, reactions: [...m.reactions, { emoji, count: 1, mine: true }] }
      }),
    )

    try {
      const res = await apiRequest('/FeedController/reactToMessage', {
        method: 'POST',
        body: { messageId, emoji },
      })
      if (!res.ok) throw new Error('failed')
    } catch {
      showToast('Failed to react to message', 'error')
      // Re-sync with the server rather than guess at the rollback shape
      if (activeConversation) loadThreadMessages(activeConversation, false)
    }
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
        if (response.status === 403) {
          const data = await response.json().catch(() => ({}))
          showToast((data as { detail?: string }).detail ?? 'You can\'t message this person', 'error')
        } else {
          showToast('Failed to send message', 'error')
        }
        return
      }

      setConnections((current) =>
        current.map((c) => (c.id === activeConversation.id ? { ...c, preview: content } : c)),
      )
      setDraftMessage('')
      const refreshed = await fetchConnections(false, searchQuery)
      const updated = refreshed.find((c) => c.id === activeConversation.id) ?? activeConversation
      await loadThreadMessages(updated, false)
      setError(null)
    } catch {
      showToast('Failed to send message', 'error')
    } finally {
      setIsSending(false)
    }
  }

  function renderConversationItem(connection: Connection, showArchiveOption = true) {
    const isActive = activeConversationId === connection.id
    const content = (
      <>
        <div
          className={`mp-item__avatar${connection.photo ? ' mp-item__avatar--photo' : ''}`}
          style={connection.photo ? { backgroundImage: `url(${connection.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: swatchFor(connection.id) }}
          aria-hidden="true"
        >
          {connection.photo ? null : connection.avatar}
        </div>
        <div className="mp-item__body">
          <div className="mp-item__topline">
            <span className="mp-item__name">{connection.name}</span>
            <span className="mp-item__status">{connection.muted ? 'Muted' : connection.status}</span>
          </div>
          <p className="mp-item__preview">{connection.preview}</p>
        </div>
      </>
    )

    const cls = `mp-item ${isActive ? 'mp-item--active' : ''} ${!connection.openable ? 'mp-item--locked' : ''}`.trim()

    const itemEl = connection.openable
      ? <button type="button" className={cls} onClick={() => openConversation(connection.id)}>{content}</button>
      : <article className={cls}>{content}</article>

    return (
      <div key={connection.id} className="mp-item__wrap">
        {itemEl}
        <button
          type="button"
          className="mp-item__menuBtn"
          aria-label={`Options for ${connection.name}`}
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenuId(openMenuId === connection.id ? null : connection.id)
          }}
        >
          ···
        </button>
        {openMenuId === connection.id && (
          <div className="mp-item__menu" role="menu">
            {showArchiveOption ? (
              <>
                <button
                  type="button"
                  className="mp-item__menuAction"
                  role="menuitem"
                  onClick={() => { handleArchive(connection); setOpenMenuId(null) }}
                >
                  Archive
                </button>
                <button
                  type="button"
                  className="mp-item__menuAction"
                  role="menuitem"
                  onClick={() => { handleMute(connection); setOpenMenuId(null) }}
                >
                  {connection.muted ? 'Unmute' : 'Mute'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="mp-item__menuAction"
                role="menuitem"
                onClick={() => { handleUnarchive(connection); setOpenMenuId(null) }}
              >
                Unarchive
              </button>
            )}
          </div>
        )}
      </div>
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
      {!activeConversation ? (
        <div className="mp-mobileHead">
          <div>
            <span className="mp-eyebrow">Messages · Inbox</span>
            <h1 className="mp-mobileHead__title">Threads.</h1>
          </div>
        </div>
      ) : null}

      <div className="mp-shell">
        {/* ── Sidebar ── */}
        <aside
          className={`mp-sidebar ${activeConversation ? 'mp-sidebar--hiddenMobile' : ''}`}
        >
          {sidebarView === 'requests' ? (
            /* ── Sent requests view ── */
            <>
              <header className="mp-sidebar__head mp-sidebar__head--requests">
                <button
                  type="button"
                  className="mp-backBtn"
                  onClick={() => setSidebarView('connections')}
                  aria-label="Back to threads"
                >
                  ←
                </button>
                <div>
                  <span className="mp-eyebrow">Connections · Pending</span>
                  <h2 className="mp-sidebar__title">
                    Sent requests.
                    {sentRequests.length > 0 ? (
                      <span className="mp-sidebar__count">{sentRequests.length}</span>
                    ) : null}
                  </h2>
                </div>
              </header>

              <div className="mp-list" aria-label="Sent connection requests">
                {sentRequestsLoading ? (
                  <p className="mp-searchStatus">Loading…</p>
                ) : sentRequests.length === 0 ? (
                  <div className="mp-reqEmpty">
                    <p className="mp-reqEmpty__title">No pending requests.</p>
                    <p className="mp-reqEmpty__sub">When you swipe right on someone, they'll appear here until you connect.</p>
                  </div>
                ) : (
                  sentRequests.map((req) => (
                    <div key={req.id} className="mp-reqItem">
                      <div
                        className={`mp-item__avatar${req.photo ? ' mp-item__avatar--photo' : ''}`}
                        style={req.photo
                          ? { backgroundImage: `url(${req.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { background: swatchFor(req.id) }
                        }
                        aria-hidden="true"
                      >
                        {req.photo ? null : req.avatar}
                      </div>
                      <div className="mp-reqItem__body">
                        <span className="mp-reqItem__name">{req.name}</span>
                        {req.role ? <span className="mp-reqItem__role">{req.role}</span> : null}
                      </div>
                      <button
                        type="button"
                        className="mp-reqItem__withdraw"
                        onClick={() => handleWithdraw(req)}
                        aria-label={`Withdraw request to ${req.name}`}
                      >
                        Withdraw
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : sidebarView === 'archived' ? (
            /* ── Archived conversations view ── */
            <>
              <header className="mp-sidebar__head mp-sidebar__head--requests">
                <button
                  type="button"
                  className="mp-backBtn"
                  onClick={() => setSidebarView('connections')}
                  aria-label="Back to threads"
                >
                  ←
                </button>
                <div>
                  <span className="mp-eyebrow">Conversations · Archived</span>
                  <h2 className="mp-sidebar__title">
                    Archived.
                    {archivedConnections.length > 0 ? (
                      <span className="mp-sidebar__count">{archivedConnections.length}</span>
                    ) : null}
                  </h2>
                </div>
              </header>

              <div className="mp-list" aria-label="Archived conversations">
                {archivedLoading ? (
                  <p className="mp-searchStatus">Loading…</p>
                ) : archivedConnections.length === 0 ? (
                  <div className="mp-reqEmpty">
                    <p className="mp-reqEmpty__title">Nothing archived yet.</p>
                    <p className="mp-reqEmpty__sub">Archive conversations you've wrapped up to keep your inbox clean.</p>
                  </div>
                ) : (
                  archivedConnections.map((c) => renderConversationItem(c, false))
                )}
              </div>
            </>
          ) : (
            /* ── Default: connections list ── */
            <>
              <header className="mp-sidebar__head">
                <span className="mp-eyebrow">Connections · Mutual</span>
                <h2 className="mp-sidebar__title">Open lines.</h2>
              </header>

              <div className="mp-search">
                <input
                  type="search"
                  className={`mp-searchInput${isSearching ? ' mp-searchInput--searching' : ''}`}
                  placeholder="Search by name or thread"
                  aria-label="Search conversations"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
                />
              </div>

              <button type="button" className="mp-requestsRow" onClick={openSentRequestsView}>
                <span>Sent connection requests</span>
                <span className="mp-requestsRow__right">
                  {sentRequests.length > 0 ? (
                    <span className="mp-requestsBadge">{sentRequests.length}</span>
                  ) : null}
                  <span aria-hidden="true">→</span>
                </span>
              </button>

              <button type="button" className="mp-requestsRow" onClick={openArchivedView}>
                <span>Archived conversations</span>
                <span className="mp-requestsRow__right">
                  <span aria-hidden="true">→</span>
                </span>
              </button>

              <div className="mp-list" aria-label="Conversation list">
                {connections.length === 0 && !isSearching && lastSearchedQuery ? (
                  <p className="mp-searchStatus">No results for "{lastSearchedQuery}"</p>
                ) : (
                  connections.map((c) => renderConversationItem(c))
                )}
              </div>
            </>
          )}
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
                <div className="mp-thread__headLeft">
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
                    <h2 className="mp-thread__title">{activeConversation.name}</h2>
                  </div>
                </div>
                <div className="mp-thread__headRight">
                  <span className="mp-thread__status">{activeConversation.status}</span>
                  <div className="mp-context__kebab">
                    <button
                      type="button"
                      className="mp-context__menuBtn"
                      aria-label={`Options for ${activeConversation.name}`}
                      onClick={() => setContextMenuOpen((open) => !open)}
                    >
                      ···
                    </button>
                    {contextMenuOpen && (
                      <div className="mp-context__menu" role="menu">
                        <button
                          type="button"
                          className="mp-context__menuAction"
                          role="menuitem"
                          onClick={() => { setContextMenuOpen(false); setReportModalOpen(true) }}
                        >
                          Report
                        </button>
                        <button
                          type="button"
                          className="mp-context__menuAction"
                          role="menuitem"
                          onClick={() => { setContextMenuOpen(false); handleBlock(activeConversation) }}
                        >
                          Block
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              <div className="mp-thread__body" ref={messagesThreadBodyRef}>
                <div className="mp-thread__inner">
                  {threadLoading ? (
                    <div className="mp-thread__loading el-meta">Loading messages…</div>
                  ) : threadMessages.length > 0 ? (
                    threadMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`mp-bubble__wrap ${
                          message.side === 'right' ? 'mp-bubble__wrap--out' : 'mp-bubble__wrap--in'
                        }`}
                      >
                        <article
                          className={`mp-bubble ${
                            message.side === 'right' ? 'mp-bubble--out' : 'mp-bubble--in'
                          }`}
                        >
                          <p className="mp-bubble__text">{message.text}</p>
                          <div className="mp-bubble__meta">
                            <span>{message.author}</span>
                            <span className="dot">·</span>
                            <span>{message.meta}</span>
                            {message.id === lastOwnMessage?.id && lastOwnMessageSeen ? (
                              <>
                                <span className="dot">·</span>
                                <span>Seen</span>
                              </>
                            ) : null}
                          </div>
                        </article>

                        {message.reactions.length > 0 ? (
                          <div className="mp-bubble__reactions">
                            {message.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                type="button"
                                className={`mp-reaction${r.mine ? ' mp-reaction--mine' : ''}`}
                                onClick={() => handleReact(message.id, r.emoji)}
                              >
                                {r.emoji} {r.count}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <button
                          type="button"
                          className="mp-bubble__reactBtn"
                          aria-label="Add reaction"
                          onClick={() =>
                            setReactionPickerId(reactionPickerId === message.id ? null : message.id)
                          }
                        >
                          ☺
                        </button>
                        {reactionPickerId === message.id ? (
                          <div className="mp-reactionPicker" role="menu">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                role="menuitem"
                                onClick={() => { handleReact(message.id, emoji); setReactionPickerId(null) }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
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
                  className={`mp-context__avatar${activeConversation.photo ? ' mp-context__avatar--photo' : ''}`}
                  style={activeConversation.photo ? { backgroundImage: `url(${activeConversation.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: swatchFor(activeConversation.id) }}
                  aria-hidden="true"
                >
                  {activeConversation.photo ? null : activeConversation.avatar}
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

      {reportModalOpen && activeConversation && (
        <ReportUserModal
          name={activeConversation.name}
          submitting={reportSubmitting}
          onCancel={() => setReportModalOpen(false)}
          onSubmit={(reason, details) => handleReportSubmit(activeConversation, reason, details)}
        />
      )}
    </div>
  )
}
