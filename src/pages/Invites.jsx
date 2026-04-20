import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getInitials, getAvColor } from '../components/StudentCard'
import toast from 'react-hot-toast'

function InviteCard({ invite, person, type, onAccept, onReject, onView, onChat }) {
  const STATUS = {
    pending: { l: 'Pending', c: 'b-gray' },
    accepted: { l: 'Accepted ✓', c: 'b-green' },
    rejected: { l: 'Declined', c: 'b-red' },
  }
  const s = STATUS[invite.status] || STATUS.pending

  return (
    <div className="card" style={{ padding: '1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div className={`av ${getAvColor(person?.avatar_color)} av-40`}>{getInitials(person?.full_name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--text-1)' }}>{person?.full_name}</span>
            <span className={`badge ${s.c}`}>{s.l}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{person?.role} · {person?.college}</p>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>
          {new Date(invite.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {invite.message && (
        <p style={{ fontSize: 13, color: 'var(--text-2)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 12px', marginBottom: 10, lineHeight: 1.55, fontStyle: 'italic' }}>
          "{invite.message}"
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={onView}>Profile</button>
        {invite.status === 'accepted' && (
          <button className="btn btn-primary btn-sm" onClick={onChat} style={{ gap: 6 }}>
            💬 Open Chat
          </button>
        )}
        {type === 'received' && invite.status === 'pending' && (
          <>
            <button className="btn btn-primary btn-sm" onClick={onAccept}>Accept ✓</button>
            <button className="btn btn-danger btn-sm" onClick={onReject}>Decline</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Invites() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('received')
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('invites').select('*, from_profile:profiles!invites_from_user_id_fkey(*)').eq('to_user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('invites').select('*, to_profile:profiles!invites_to_user_id_fkey(*)').eq('from_user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([r, s]) => {
      setReceived(r.data || [])
      setSent(s.data || [])
      setLoading(false)
    })

    // Mark all invite notifications as read
    supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('type', 'invite')

    // Realtime updates
    const ch = supabase.channel('invites-page-' + user.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'invites' }, payload => {
        setReceived(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } : i))
        setSent(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } : i))
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  async function updateStatus(id, status) {
    const { error } = await supabase.from('invites').update({ status }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    setReceived(p => p.map(i => i.id === id ? { ...i, status } : i))
    toast.success(status === 'accepted' ? '🎉 Accepted! Chat is now open.' : 'Invite declined')
  }

  const pendingCount = received.filter(i => i.status === 'pending').length

  if (loading) return <div className="page-loader"><div className="spin spin-lg" /></div>

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 700 }}>
        <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.2rem)', fontStyle: 'italic', color: 'var(--text-1)', marginBottom: '1.5rem' }}>Invites</h1>

        {/* Accepted chats banner */}
        {[...received, ...sent].some(i => i.status === 'accepted') && (
          <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(76,175,130,0.2)', borderRadius: 'var(--r-md)', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <p style={{ fontSize: 13, color: 'var(--green)' }}>You have accepted connections — open their invite card to start chatting!</p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', padding: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-full)', width: 'fit-content' }}>
          {[{ k: 'received', l: `Received${pendingCount > 0 ? ` (${pendingCount})` : ''}` }, { k: 'sent', l: `Sent (${sent.length})` }].map(t => (
            <button key={t.k} className={`btn btn-sm ${tab === t.k ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 'var(--r-full)' }} onClick={() => setTab(t.k)}>{t.l}</button>
          ))}
        </div>

        {tab === 'received' && (
          received.length === 0
            ? <div className="empty-state"><div className="empty-icon">📭</div><h3>No invites yet</h3><p>Set your profile to "Open to team up" to receive invites</p></div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {received.map(inv => (
                  <InviteCard key={inv.id} invite={inv} person={inv.from_profile} type="received"
                    onAccept={() => updateStatus(inv.id, 'accepted')}
                    onReject={() => updateStatus(inv.id, 'rejected')}
                    onView={() => navigate(`/profile/${inv.from_user_id}`)}
                    onChat={() => navigate(`/chat/${inv.id}`)}
                  />
                ))}
              </div>
        )}

        {tab === 'sent' && (
          sent.length === 0
            ? <div className="empty-state">
                <div className="empty-icon">📤</div>
                <h3>No invites sent</h3>
                <p style={{ marginBottom: '1rem' }}>Browse students and send your first invite</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/browse')}>Browse →</button>
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sent.map(inv => (
                  <InviteCard key={inv.id} invite={inv} person={inv.to_profile} type="sent"
                    onView={() => navigate(`/profile/${inv.to_user_id}`)}
                    onChat={() => navigate(`/chat/${inv.id}`)}
                  />
                ))}
              </div>
        )}
      </div>
    </div>
  )
}
