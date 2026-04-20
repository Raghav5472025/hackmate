import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/StudentCard'
import toast from 'react-hot-toast'

const ROLE_BADGE = {
  'Frontend':'b-blue','Backend':'b-teal','Full Stack':'b-purple',
  'ML/AI':'b-amber','UI/UX':'b-rose','Android':'b-green',
  'iOS':'b-green','DevOps':'b-gray','Data Analyst':'b-blue'
}

export default function Search() {
  const { user, profile: myProfile } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [invited, setInvited] = useState(false)

  async function search() {
    const q = query.trim().replace('@', '').toLowerCase().trim()
    if (!q) { toast.error('Enter a username or User ID'); return }
    setLoading(true)
    setResult(null)
    setNotFound(false)
    setInvited(false)
    setShowInvite(false)

    // Search by username (case insensitive)
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', q)
      .neq('id', user.id)
      .limit(1)
      .maybeSingle()

    // If not found, try searching by User ID (first 8 chars)
    if (!data) {
      const { data: byId } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(20)

      // Manual filter since we can't do ilike on uuid
      data = byId?.find(p => p.id.startsWith(q) || p.id === q) || null
    }

    setLoading(false)

    if (!data) {
      setNotFound(true)
      return
    }

    setResult(data)

    // Check already invited
    const { data: inv } = await supabase
      .from('invites')
      .select('id')
      .eq('from_user_id', user.id)
      .eq('to_user_id', data.id)
      .maybeSingle()
    if (inv) setInvited(true)
  }

  async function sendInvite() {
    if (!msg.trim()) { toast.error('Write a message first'); return }
    setSending(true)
    const { error } = await supabase.from('invites').insert({
      from_user_id: user.id,
      to_user_id: result.id,
      message: msg.trim(),
    })
    setSending(false)
    if (error) {
      toast.error(error.code === '23505' ? 'Already invited!' : 'Failed to send')
      return
    }
    setInvited(true)
    setShowInvite(false)
    toast.success('Invite sent! 🎉')
  }

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 620 }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, color: 'var(--text-1)', marginBottom: 8, letterSpacing: '-0.03em' }}>
            Find by @username
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65 }}>
            Dost ne username share kiya? Search karke directly invite bhejo.
          </p>
        </div>

        {/* Tip */}
        <div style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 'var(--r-md)', padding: '0.875rem 1.1rem', marginBottom: '1.5rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 13, color: 'var(--purple)', lineHeight: 1.6 }}>
            <strong>Real use:</strong> "HackMate pe mera username hai <strong>@{myProfile?.username || 'set_yours'}</strong> — wahan invite bhejo aur chat pe discuss karte hain!"
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', fontWeight: 800, fontSize: 16, pointerEvents: 'none' }}>@</span>
            <input
              className="form-input"
              style={{ paddingLeft: 30 }}
              placeholder="username (e.g. priya_ml)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              autoComplete="off" autoCapitalize="none" spellCheck={false}
            />
          </div>
          <button className="btn btn-primary" onClick={search} disabled={loading || !query.trim()} style={{ minWidth: 90 }}>
            {loading ? <span className="spin spin-sm" /> : 'Search'}
          </button>
        </div>

        {/* Not found */}
        {notFound && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>No one found with "@{query.replace('@','')}"</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1.25rem' }}>Check spelling — usernames are case-insensitive.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/browse')}>Browse all students →</button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card fade-up" style={{ padding: '1.5rem', borderColor: 'rgba(124,58,237,0.2)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: '1rem' }}>
              <Avatar profile={result} size="av-72" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{result.full_name}</span>
                  {result.gender === 'Female' && <span className="badge b-rose" style={{ fontSize: 9 }}>She/Her</span>}
                </div>
                {result.username && <div style={{ marginBottom: 6 }}><span className="username-chip">@{result.username}</span></div>}
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>{result.role} · {result.college} · {result.year}</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <span className={`badge ${ROLE_BADGE[result.role] || 'b-gray'}`}>{result.role}</span>
                  {result.hackathons_count > 0 && <span className="badge b-blue">{result.hackathons_count} hackathons</span>}
                  {result.wins_count > 0 && <span className="badge b-amber">🏆 {result.wins_count}W</span>}
                  {result.is_open ? <span className="badge b-green">● Open</span> : <span className="badge b-gray">Full</span>}
                </div>
              </div>
            </div>

            {result.skills?.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                {result.skills.map(s => <span key={s} className="tag" style={{ fontSize: 12 }}>{s}</span>)}
              </div>
            )}

            {result.achievements && (
              <p style={{ fontSize: 13, color: 'var(--text-2)', borderLeft: '2px solid rgba(124,58,237,0.3)', paddingLeft: 10, marginBottom: '1rem', fontStyle: 'italic', lineHeight: 1.6 }}>{result.achievements}</p>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/profile/${result.id}`)}>View Profile</button>
              {result.is_open && !invited && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(v => !v)}>
                  {showInvite ? 'Cancel' : 'Send Invite →'}
                </button>
              )}
              {invited && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--green)', padding: '6px 14px', background: 'var(--green-bg)', borderRadius: 99, border: '1px solid var(--green-border)' }}>
                  ✓ Invite Sent
                </span>
              )}
            </div>

            {showInvite && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                  <label className="form-label">Message to {result.full_name.split(' ')[0]}</label>
                  <textarea
                    className="form-textarea" style={{ minHeight: 90 }}
                    placeholder={`Hey ${result.full_name.split(' ')[0]}! Found you on HackMate — would love to team up!`}
                    value={msg} onChange={e => setMsg(e.target.value)} maxLength={400}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 3 }}>{msg.length}/400</div>
                </div>
                <button className="btn btn-primary btn-block" onClick={sendInvite} disabled={sending}>
                  {sending ? <span className="spin spin-sm" /> : 'Send Invite →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* My username */}
        <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: 'white', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your username</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="username-chip" style={{ fontSize: 14, padding: '4px 14px' }}>
              @{myProfile?.username || 'not set yet'}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/edit-profile')}>
              {myProfile?.username ? 'Change →' : 'Set username →'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 7, lineHeight: 1.5 }}>Share this with friends to get found directly.</p>
        </div>
      </div>
    </div>
  )
}
