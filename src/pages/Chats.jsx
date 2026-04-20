import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/StudentCard'

export default function Chats() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Get all accepted invites (these are the chats)
      const { data: invites } = await supabase
        .from('invites')
        .select(`
          id, created_at, status,
          from_profile:profiles!invites_from_user_id_fkey(id,full_name,username,avatar_url,avatar_color,role,college),
          to_profile:profiles!invites_to_user_id_fkey(id,full_name,username,avatar_url,avatar_color,role,college)
        `)
        .eq('status', 'accepted')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (!invites) { setLoading(false); return }

      // Get last message for each invite
      const chatsWithMsg = await Promise.all(
        invites.map(async inv => {
          const partner = inv.from_profile.id === user.id ? inv.to_profile : inv.from_profile
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('invite_id', inv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          const { count: unread } = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('invite_id', inv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id)
          return { ...inv, partner, lastMsg, unread: unread || 0 }
        })
      )

      setChats(chatsWithMsg)
      setLoading(false)
    }
    load()
  }, [user])

  function formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  if (loading) return <div className="page-loader"><div className="spin spin-lg" /></div>

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2rem)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Chats
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
            {chats.length > 0 ? `${chats.length} active conversation${chats.length > 1 ? 's' : ''}` : 'No chats yet — accept an invite to start chatting'}
          </p>
        </div>

        {chats.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No chats yet</h3>
            <p style={{ marginBottom: '1.25rem' }}>Accept invites to start chatting with teammates</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/invites')}>View Invites →</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                cursor: 'pointer',
                transition: 'var(--t)',
                textAlign: 'left', width: '100%',
                marginBottom: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.borderColor = 'var(--border-md)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar profile={chat.partner} size="av-48" />
                {chat.unread > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, background: 'var(--purple)', borderRadius: '50%', border: '2px solid white' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: chat.unread > 0 ? 700 : 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.partner.full_name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, marginLeft: 8 }}>
                    {formatTime(chat.lastMsg?.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontSize: 13, color: chat.unread > 0 ? 'var(--text-1)' : 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: chat.unread > 0 ? 500 : 400 }}>
                    {chat.lastMsg
                      ? (chat.lastMsg.sender_id === user.id ? 'You: ' : '') + chat.lastMsg.content
                      : 'Start a conversation...'
                    }
                  </p>
                  {chat.unread > 0 && (
                    <span style={{ flexShrink: 0, minWidth: 20, height: 20, background: 'var(--purple)', color: 'white', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                      {chat.unread}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {chat.partner.role} · {chat.partner.college}
                </p>
              </div>
              <span style={{ color: 'var(--text-3)', fontSize: 16, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
