import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/StudentCard'

export default function Leaderboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('wins_count', { ascending: false })
        .order('hackathons_count', { ascending: false })
        .limit(50)
      if (data) {
        const ranked = data.map((p, i) => ({
          ...p,
          rank: i + 1,
          score: p.hackathons_count * 10 + p.wins_count * 25 + (p.reputation_score || 0),
        }))
        setLeaders(ranked)
        const myIdx = ranked.findIndex(p => p.id === profile?.id)
        if (myIdx !== -1) setMyRank(myIdx + 1)
      }
      setLoading(false)
    }
    load()
  }, [profile])

  const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

  if (loading) return <div className="page-loader"><div className="spin spin-lg" /></div>

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.2rem)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 6 }}>
            🏆 Leaderboard
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            Top students ranked by hackathon wins + participation
          </p>
        </div>

        {/* Score formula */}
        <div style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 'var(--r-md)', padding: '0.875rem 1.1rem', marginBottom: '1.5rem', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 600 }}>Score formula:</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['Win', '+25pts'], ['Hackathon', '+10pts'], ['Invite accepted', '+5pts']].map(([l, v]) => (
              <span key={l} style={{ fontSize: 12, background: 'white', color: 'var(--purple)', padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(124,58,237,0.2)', fontWeight: 600 }}>
                {l} = {v}
              </span>
            ))}
          </div>
        </div>

        {/* My rank card */}
        {myRank && (
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', borderColor: 'rgba(124,58,237,0.2)', background: 'linear-gradient(135deg,#faf5ff,white)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: 'var(--purple)', flexShrink: 0 }}>
                #{myRank}
              </div>
              <Avatar profile={profile} size="av-40" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Your rank</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {leaders.find(l => l.id === profile?.id)?.score || 0} points
                </p>
              </div>
              <button className="btn btn-purple-soft btn-sm" onClick={() => navigate('/edit-profile')}>
                Improve →
              </button>
            </div>
          </div>
        )}

        {/* Leaders list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {leaders.map((p, i) => {
            const isMe = p.id === profile?.id
            return (
              <div
                key={p.id}
                className="card"
                onClick={() => navigate(`/profile/${p.id}`)}
                style={{ padding: '12px 16px', cursor: 'pointer', borderColor: isMe ? 'rgba(124,58,237,0.3)' : undefined, background: isMe ? '#faf5ff' : 'white' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Rank */}
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    {MEDAL[p.rank]
                      ? <span style={{ fontSize: 22 }}>{MEDAL[p.rank]}</span>
                      : <span style={{ fontSize: 14, fontWeight: 800, color: p.rank <= 10 ? 'var(--purple)' : 'var(--text-3)' }}>#{p.rank}</span>
                    }
                  </div>
                  <Avatar profile={p} size="av-40" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{p.full_name}</span>
                      {p.username && <span className="username-chip" style={{ fontSize: 10, padding: '1px 7px' }}>@{p.username}</span>}
                      {isMe && <span className="badge b-purple" style={{ fontSize: 9 }}>You</span>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{p.role} · {p.college}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: p.rank <= 3 ? 'var(--purple)' : 'var(--text-1)' }}>{p.score}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>pts</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end', marginLeft: 8 }}>
                    <span className="badge b-amber" style={{ fontSize: 10 }}>🏆 {p.wins_count}W</span>
                    <span className="badge b-blue" style={{ fontSize: 10 }}>{p.hackathons_count} events</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
