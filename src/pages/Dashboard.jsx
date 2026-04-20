import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import StudentCard, { Avatar } from '../components/StudentCard'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState({ sent: 0, received: 0 })
  const [hackathons, setHackathons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('profiles').select('*').neq('id', profile.id).eq('is_open', true).order('wins_count', { ascending: false }).limit(6),
      supabase.from('invites').select('id', { count: 'exact' }).eq('from_user_id', profile.id),
      supabase.from('invites').select('id', { count: 'exact' }).eq('to_user_id', profile.id).eq('status', 'pending'),
      supabase.from('hackathons').select('*').eq('is_active', true).order('start_date').limit(3),
    ]).then(([s, sent, rec, h]) => {
      setStudents(s.data || [])
      setStats({ sent: sent.count || 0, received: rec.count || 0 })
      setHackathons(h.data || [])
      setLoading(false)
    })
  }, [profile])

  // 🔥 Check Google provider_token (for Google Slides API)
  const checkToken = async () => {
    const { data } = await supabase.auth.getSession()
    console.log("FULL SESSION:", data.session)
    console.log("TOKEN:", data.session?.provider_token)
    if (data.session?.provider_token) {
      alert("✅ Token found! Check browser console for details.")
    } else {
      alert("❌ No provider_token found.\n\nFix: Sign out → Sign in again with Google (not email/password).")
    }
  }

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const modeStyle = { Online:'b-teal', Offline:'b-rose', Hybrid:'b-amber' }

  const STATS = [
    { l: 'Hackathons', v: profile?.hackathons_count || 0, c: 'var(--purple)' },
    { l: 'Wins', v: profile?.wins_count || 0, c: 'var(--green)' },
    { l: 'Skills', v: profile?.skills?.length || 0, c: 'var(--blue)' },
    { l: 'Invites Sent', v: stats.sent, c: '#0d9488' },
    { l: 'New Invites', v: stats.received, c: 'var(--red)', click: () => navigate('/invites') },
  ]

  return (
    <div className="page-body">
      <div className="container">

        {/* Welcome card */}
        <div className="card" style={{ padding: 'clamp(1.25rem,4vw,1.75rem)', marginBottom: '1.25rem', background: 'linear-gradient(135deg,#faf5ff 0%,white 60%)', borderColor: 'rgba(124,58,237,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Avatar profile={profile} size="av-72" className="av-photo" />
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{greet} ✦</p>
              <h2 style={{ fontSize: 'clamp(1.3rem,4vw,1.8rem)', color: 'var(--text-1)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 5 }}>{profile?.full_name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {profile?.username && <span className="username-chip">@{profile.username}</span>}
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{profile?.role} · {profile?.college}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm sm-hide" onClick={() => navigate('/edit-profile')}>Edit</button>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/leaderboard')}>🏆 Rank</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/browse')}>Browse →</button>
            </div>
          </div>

          {/* AI Match banner */}
          <div onClick={() => navigate('/ai-match')} style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--purple)', borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'var(--t)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--purple)'}
          >
            <span style={{ fontSize: 20 }}>✨</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 1 }}>AI Teammate Matching</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Let AI find your perfect team in seconds</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>→</span>
          </div>

          {/* 🔥 Check Token button — AI banner ke just niche */}
          <button
            onClick={checkToken}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '10px' }}
          >
            Check Token
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: '1.25rem' }}>
          {STATS.map(s => (
            <div key={s.l} className={`card ${s.click ? 'card-hover' : ''}`}
              style={{ padding: '0.875rem 0.5rem', textAlign: 'center', cursor: s.click ? 'pointer' : 'default' }}
              onClick={s.click}
            >
              <div style={{ fontSize: 'clamp(1.4rem,3vw,1.8rem)', fontWeight: 800, color: s.c, letterSpacing: '-0.02em' }}>{s.v}</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tips */}
        {!profile?.achievements && (
          <div style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--r-md)', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)', marginBottom: 2 }}>Complete your profile</p>
              <p style={{ fontSize: 12, color: 'var(--purple)', opacity: 0.75 }}>Add achievements → get 3× more invite responses</p>
            </div>
            <button className="btn btn-purple-soft btn-sm" style={{ flexShrink: 0 }} onClick={() => navigate('/edit-profile')}>Add now →</button>
          </div>
        )}

        {!profile?.username && (
          <div style={{ background: '#fff7ed', border: '1px solid var(--amber-border)', borderRadius: 'var(--r-md)', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)', marginBottom: 2 }}>Set your @username</p>
              <p style={{ fontSize: 12, color: 'var(--amber)', opacity: 0.8 }}>Friends can find you by @username</p>
            </div>
            <button className="btn btn-sm" style={{ background: 'var(--amber)', color: 'white', flexShrink: 0 }} onClick={() => navigate('/edit-profile')}>Set username →</button>
          </div>
        )}

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 290px', gap: '1.5rem', alignItems: 'start' }}>
          <div>
            <div className="section-head">
              <h2 className="section-title">New teammates</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/browse')}>View all →</button>
            </div>
            {loading
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spin spin-md" /></div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 12 }}>
                  {students.map(s => <StudentCard key={s.id} student={s} />)}
                </div>
            }
          </div>

          <div>
            <div className="section-head">
              <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Upcoming</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hackathons')}>All →</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hackathons.map(h => (
                <div key={h.id} className="card" style={{ padding: '1rem' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, lineHeight: 1.3 }}>{h.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{h.organizer}</p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span className={`badge ${modeStyle[h.mode]||'b-gray'}`}>{h.mode}</span>
                    {h.prize_pool && <span className="badge b-amber">🏆 {h.prize_pool}</span>}
                  </div>
                  {h.registration_deadline && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>⏰ {new Date(h.registration_deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>}
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: '✨', label: 'AI Team Matching', to: '/ai-match', color: 'var(--purple)' },
                { icon: '🏆', label: 'Leaderboard', to: '/leaderboard', color: 'var(--amber)' },
                { icon: '⊕', label: 'Find by @username', to: '/search', color: 'var(--blue)' },
              ].map(item => (
                <button key={item.to} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: 8, textAlign: 'left' }} onClick={() => navigate(item.to)}>
                  <span>{item.icon}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}