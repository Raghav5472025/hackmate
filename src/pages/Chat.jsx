import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/StudentCard'
import toast from 'react-hot-toast'

export default function Chat() {
  const { inviteId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [partner, setPartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: inv } = await supabase
        .from('invites')
        .select('*, from_profile:profiles!invites_from_user_id_fkey(*), to_profile:profiles!invites_to_user_id_fkey(*)')
        .eq('id', inviteId)
        .single()

      if (!inv || inv.status !== 'accepted') {
        toast.error('Chat not available — invite must be accepted first')
        navigate(-1)
        return
      }

      const partnerProfile = inv.from_user_id === user.id ? inv.to_profile : inv.from_profile
      setPartner(partnerProfile)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('invite_id', inviteId)
        .order('created_at', { ascending: true })
      setMessages(msgs || [])
      setLoading(false)

      // Mark notifications as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .contains('data', { invite_id: inviteId })
    }
    load()
  }, [inviteId, user, navigate])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat-' + inviteId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `invite_id=eq.${inviteId}` },
        payload => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [inviteId])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text) return
    setSending(true)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '44px'

    const { error } = await supabase.from('messages').insert({
      invite_id: inviteId,
      sender_id: user.id,
      content: text,
    })
    setSending(false)
    if (error) {
      toast.error('Failed to send')
      setInput(text)
    }
    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function autoResize(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px'
  }

  function formatTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  function groupMessages(msgs) {
    const groups = []
    msgs.forEach((m, i) => {
      const prev = msgs[i - 1]
      const sameGroup = prev && prev.sender_id === m.sender_id && (new Date(m.created_at) - new Date(prev.created_at)) < 60000
      if (sameGroup) groups[groups.length - 1].msgs.push(m)
      else groups.push({ senderId: m.sender_id, msgs: [m] })
    })
    return groups
  }

  if (loading) return <div className="page-loader"><div className="spin spin-lg" /></div>

  const groups = groupMessages(messages)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - var(--nav-h))',
      background: 'var(--bg)',
    }}>
      {/* Chat header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0.875rem 1.25rem',
        background: 'white',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        flexShrink: 0, zIndex: 10,
      }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate('/invites')}
          style={{ color: 'var(--text-2)', flexShrink: 0 }}
        >
          ←
        </button>

        {partner && (
          <>
            <Avatar profile={partner} size="av-40" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {partner.full_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                {partner.role} · {partner.college}
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/profile/${partner.id}`)}
              style={{ flexShrink: 0 }}
            >
              Profile
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>👋</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Start the conversation!
            </p>
            <p style={{ fontSize: 13 }}>
              Say hi to {partner?.full_name?.split(' ')[0]}
            </p>
          </div>
        )}

        {groups.map((group, gi) => {
          const isMine = group.senderId === user.id
          return (
            <div key={gi} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 2 }}>
              {/* Partner name — show above first message in group */}
              {!isMine && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <Avatar profile={partner} size="av-28" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                    {partner?.full_name?.split(' ')[0]}
                  </span>
                </div>
              )}

              {group.msgs.map((m, mi) => {
                const isFirst = mi === 0
                const isLast = mi === group.msgs.length - 1
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      padding: '9px 14px',
                      maxWidth: 'min(72%, 380px)',
                      minWidth: 60,
                      wordBreak: 'break-word',
                      fontSize: 14, lineHeight: 1.55,
                      background: isMine ? 'var(--purple)' : 'white',
                      color: isMine ? 'white' : 'var(--text-1)',
                      border: isMine ? 'none' : '1px solid var(--border)',
                      boxShadow: isMine ? 'none' : 'var(--shadow-sm)',
                      borderRadius: isMine
                        ? (isFirst && isLast ? '18px 18px 4px 18px' : isFirst ? '18px 18px 4px 18px' : isLast ? '18px 4px 4px 18px' : '18px 4px 4px 18px')
                        : (isFirst && isLast ? '18px 18px 18px 4px' : isFirst ? '18px 18px 18px 4px' : isLast ? '4px 18px 18px 18px' : '4px 18px 18px 4px'),
                    }}>
                      {m.content}
                    </div>
                    {isLast && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, padding: '0 4px' }}>
                        {formatTime(m.created_at)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '0.875rem 1.25rem',
        paddingBottom: `calc(0.875rem + var(--safe-b))`,
        background: 'white',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={el => { inputRef.current = el; textareaRef.current = el }}
            className="form-input"
            style={{
              flex: 1, resize: 'none', borderRadius: 22,
              padding: '11px 16px', lineHeight: 1.5, fontSize: 14,
              height: 44, minHeight: 44, maxHeight: 130,
              overflowY: 'auto',
            }}
            placeholder={`Message ${partner?.full_name?.split(' ')[0] || ''}...`}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(e) }}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className="btn btn-primary"
            style={{ width: 44, height: 44, borderRadius: '50%', padding: 0, flexShrink: 0, fontSize: 18 }}
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            {sending ? <span className="spin spin-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : '→'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
