import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getInitials, getAvColor } from '../components/StudentCard'
import toast from 'react-hot-toast'

const ROLE_BADGE = { 'Frontend':'badge-blue','Backend':'badge-green','Full Stack':'badge-purple','ML/AI':'badge-gold','UI/UX':'badge-pink','Android':'badge-orange','iOS':'badge-orange','DevOps':'badge-gray','Data Analyst':'badge-blue' }

export default function Profile() {
  const { id } = useParams()
  const { user, profile: myProfile } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [invited, setInvited] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const isOwn = id === user?.id || id === 'me'

  useEffect(() => {
    const tid = id === 'me' ? user.id : id
    Promise.all([
      supabase.from('profiles').select('*').eq('id', tid).single(),
      isOwn ? Promise.resolve({ data: null }) : supabase.from('invites').select('id').eq('from_user_id', user.id).eq('to_user_id', tid).single(),
    ]).then(([p, inv]) => {
      setProfile(p.data)
      setInvited(!!inv.data)
      setLoading(false)
    })
  }, [id, user, isOwn])

  async function sendInvite() {
    if (!msg.trim()) { toast.error('Write a message first'); return }
    setSending(true)
    const { error } = await supabase.from('invites').insert({ from_user_id: user.id, to_user_id: profile.id, message: msg.trim() })
    setSending(false)
    if (error) { toast.error(error.code === '23505' ? 'Already invited!' : 'Failed'); return }
    setInvited(true); setShowInvite(false); toast.success('Invite sent! 🎉')
  }

  if (loading) return <div className="page-loader"><div className="spin" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
  if (!profile) return (
    <div className="page-body"><div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h2>Profile not found</h2>
      <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={() => navigate('/browse')}>← Browse</button>
    </div></div>
  )

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 720 }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.25rem' }} onClick={() => navigate(-1)}>← Back</button>

        {/* Header */}
        <div className="card card-gold" style={{ padding: 'clamp(1.25rem,4vw,2rem)', marginBottom: '1.25rem', background: 'linear-gradient(135deg,rgba(212,175,55,0.05) 0%,var(--bg-card) 100%)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className={`avatar ${getAvColor(profile.avatar_color)} av-80`}>{getInitials(profile.full_name)}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontStyle: 'italic', color: 'var(--text-1)' }}>{profile.full_name}</h1>
                {profile.gender === 'Female' && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pink)', background: 'var(--pink-bg)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(244,143,177,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>She/Her</span>
                )}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 10 }}>{profile.role} · {profile.college} · {profile.year}</p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <span className={`badge ${ROLE_BADGE[profile.role] || 'badge-gray'}`}>{profile.role}</span>
                <span className={`badge ${profile.hackathons_count >= 3 ? 'badge-green' : profile.hackathons_count >= 1 ? 'badge-blue' : 'badge-gray'}`}>
                  {profile.hackathons_count === 0 ? 'Fresher' : `${profile.hackathons_count} hackathons`}
                </span>
                {profile.wins_count > 0 && <span className="badge badge-gold">🏆 {profile.wins_count} wins</span>}
                {profile.is_open ? <span className="badge badge-green">● Open to team up</span> : <span className="badge badge-gray">Team full</span>}
              </div>
            </div>
          </div>

          {(profile.github_url || profile.linkedin_url) && (
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">⊕ GitHub</a>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">◈ LinkedIn</a>}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.25rem' }}>
          {[{l:'Hackathons',v:profile.hackathons_count,c:'var(--gold)'},{l:'Wins',v:profile.wins_count,c:'var(--green)'},{l:'Skills',v:profile.skills?.length||0,c:'var(--purple)'}].map(s => (
            <div key={s.l} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontStyle: 'italic', color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {profile.skills.map(s => <span key={s} className="tag">{s}</span>)}
            </div>
          </div>
        )}

        {/* Achievements */}
        {profile.achievements && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>Achievements</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{profile.achievements}</p>
          </div>
        )}

        {/* Looking for */}
        {profile.looking_for && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', borderLeft: '3px solid var(--border-gold)' }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Looking for</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.6 }}>{profile.looking_for}</p>
          </div>
        )}

        {/* Actions */}
        {!isOwn && profile.is_open && !invited && (
          <div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => setShowInvite(v => !v)}>
              {showInvite ? 'Cancel' : 'Send Team Invite'}
            </button>
            {showInvite && (
              <div className="card" style={{ padding: '1.25rem', marginTop: '1rem', animation: 'slideUp 0.2s var(--ease)' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Your message to {profile.full_name.split(' ')[0]}</label>
                  <textarea className="form-textarea" style={{ minHeight: 110 }}
                    placeholder={`Hey ${profile.full_name.split(' ')[0]}, your ${profile.skills?.[0] || 'skills'} experience is exactly what I'm looking for. Would love to team up!`}
                    value={msg} onChange={e => setMsg(e.target.value)} maxLength={400}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>{msg.length}/400</div>
                </div>
                <button className="btn btn-primary btn-block" onClick={sendInvite} disabled={sending}>
                  {sending ? <span className="spin" /> : 'Send Invite →'}
                </button>
              </div>
            )}
          </div>
        )}
        {!isOwn && invited && (
          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--green)', background: 'var(--green-bg)', padding: '14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(111,207,151,0.2)', fontWeight: 600 }}>
            ✓ Invite sent — waiting for their response
          </div>
        )}
        {!isOwn && !profile.is_open && (
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)', padding: '1rem' }}>This student's team is currently full</p>
        )}
        {isOwn && (
          <button className="btn btn-secondary btn-block btn-lg" onClick={() => navigate('/edit-profile')}>Edit My Profile</button>
        )}
      </div>
    </div>
  )
}
