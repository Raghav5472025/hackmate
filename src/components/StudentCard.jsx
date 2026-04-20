import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export function getInitials(name) {
  if (!name) return '?'
  return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getAvClass(color) {
  const m = { teal:'av-teal',gold:'av-amber',coral:'av-rose',sage:'av-green',lavender:'av-purple',rose:'av-rose',purple:'av-purple',amber:'av-amber',pink:'av-rose',blue:'av-blue',green:'av-green',orange:'av-amber' }
  return m[color] || 'av-purple'
}

/* 🔥 ADD THIS LINE (IMPORTANT FIX) */
export const getAvColor = getAvClass;

const ROLE_BADGE = { 'Frontend':'b-blue','Backend':'b-teal','Full Stack':'b-purple','ML/AI':'b-amber','UI/UX':'b-rose','Android':'b-green','iOS':'b-green','DevOps':'b-gray','Data Analyst':'b-blue' }

function matchScore(mySkills, theirSkills) {
  if (!mySkills?.length || !theirSkills?.length) return 0
  const complement = theirSkills.filter(s => !mySkills.includes(s)).length
  const overlap = theirSkills.filter(s => mySkills.includes(s)).length
  return Math.min(99, Math.round(complement * 18 + overlap * 4))
}

export function Avatar({ profile, size = 'av-44', className = '' }) {
  const cls = getAvClass(profile?.avatar_color)
  if (profile?.avatar_url) {
    return (
      <div className={`av ${size} ${className}`} style={{ border: '2px solid white', boxShadow: '0 0 0 1.5px rgba(124,58,237,0.3)' }}>
        <img src={profile.avatar_url} alt={profile.full_name} style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%' }} />
      </div>
    )
  }
  return <div className={`av ${cls} ${size} ${className}`}>{getInitials(profile?.full_name)}</div>
}

export default function StudentCard({ student, showInvite = true }) {
  const { user, profile: mine } = useAuth()
  const navigate = useNavigate()
  const [invited, setInvited] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const isOwn = user?.id === student.id

  async function sendInvite() {
    if (!msg.trim()) { toast.error('Write a message first'); return }
    setSending(true)
    const { error } = await supabase.from('invites').insert({ from_user_id: user.id, to_user_id: student.id, message: msg.trim() })
    setSending(false)
    if (error) { toast.error(error.code === '23505' ? 'Already invited!' : 'Failed to send'); return }
    setInvited(true); setShowModal(false)
    toast.success(`Invite sent to ${student.full_name.split(' ')[0]}! 🎉`)
  }

  const exp = student.hackathons_count || 0
  const expLabel = exp === 0 ? 'Fresher' : `${exp} hackathon${exp > 1 ? 's' : ''}`
  const expBadge = exp >= 3 ? 'b-green' : exp >= 1 ? 'b-blue' : 'b-gray'
  const score = matchScore(mine?.skills, student.skills)
  const scoreColor = score >= 70 ? 'match-high' : score >= 40 ? 'match-mid' : 'match-low'
  const scoreTextColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--purple)' : 'var(--text-3)'

  return (
    <>
      <div className="card card-hover" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Avatar profile={student} size="av-44" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{student.full_name}</span>
              {student.gender === 'Female' && <span className="badge b-rose" style={{ fontSize: 9 }}>She/Her</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
              {student.username && <span className="username-chip">@{student.username}</span>}
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{student.college}</span>
            </div>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {student.is_open
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--green)', background: 'var(--green-bg)', padding: '3px 8px', borderRadius: 99, border: '1px solid var(--green-border)' }}>
                  <span className="open-dot" />Open
                </span>
              : <span className="badge b-gray">Full</span>
            }
            {score > 10 && !isOwn && (
              <span style={{ fontSize: 11, fontWeight: 700, color: scoreTextColor }}>
                {score}% match
              </span>
            )}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span className={`badge ${ROLE_BADGE[student.role] || 'b-gray'}`}>{student.role}</span>
          <span className={`badge ${expBadge}`}>{expLabel}</span>
          {student.wins_count > 0 && <span className="badge b-amber">🏆 {student.wins_count}W</span>}
        </div>

        {/* Skills */}
        {student.skills?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {student.skills.slice(0, 4).map(s => <span key={s} className="tag" style={{ fontSize: 11, padding: '2px 9px' }}>{s}</span>)}
            {student.skills.length > 4 && <span className="tag" style={{ color: 'var(--text-3)', fontSize: 11 }}>+{student.skills.length - 4}</span>}
          </div>
        )}

        {/* Match bar */}
        {score > 10 && !isOwn && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Skill match</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: scoreTextColor }}>{score}%</span>
            </div>
            <div className="match-bar"><div className={`match-fill ${scoreColor}`} style={{ width: `${score}%` }} /></div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {[{l:'Hackathons',v:exp,c:'var(--purple)'},{l:'Wins',v:student.wins_count||0,c:'var(--green)'},{l:'Skills',v:student.skills?.length||0,c:'var(--blue)'}].map(s => (
            <div key={s.l} style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '7px 4px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {student.looking_for && (
          <p style={{ fontSize: 12, color: 'var(--text-2)', borderLeft: '2px solid var(--border-purple)', paddingLeft: 9, lineHeight: 1.5 }}>{student.looking_for}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 7 }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/profile/${student.id}`)}>View Profile</button>
          {showInvite && !isOwn && student.is_open && (
            <button className={`btn btn-sm ${invited ? 'btn-ghost' : 'btn-primary'}`} style={{ flex: 1 }} disabled={invited} onClick={() => !invited && setShowModal(true)}>
              {invited ? '✓ Sent' : 'Invite →'}
            </button>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <Avatar profile={student} size="av-44" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Invite {student.full_name.split(' ')[0]}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{student.role} · {student.college}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Your message</label>
              <textarea className="form-textarea" style={{ minHeight: 100 }}
                placeholder={`Hey ${student.full_name.split(' ')[0]}, I saw your profile on HackMate — would love to team up!`}
                value={msg} onChange={e => setMsg(e.target.value)} maxLength={400}
              />
              <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>{msg.length}/400</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={sendInvite} disabled={sending}>
                {sending ? <span className="spin spin-sm" /> : 'Send Invite →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
