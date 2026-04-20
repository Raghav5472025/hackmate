import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Hackathons() {
  const [hackathons, setHackathons] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    supabase.from('hackathons').select('*').eq('is_active', true).order('start_date')
      .then(({ data }) => { setHackathons(data || []); setLoading(false) })
  }, [])

  const filtered = filter ? hackathons.filter(h => h.mode === filter) : hackathons

  function daysLeft(d) {
    if (!d) return null
    const diff = Math.ceil((new Date(d) - new Date()) / 86400000)
    if (diff < 0) return null
    return diff === 0 ? 'Last day!' : `${diff}d left`
  }

  const modeStyle = { Online: 'badge-green', Offline: 'badge-red', Hybrid: 'badge-gold' }

  return (
    <div className="page-body">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
          <div>
            <h1 className="section-title">Hackathons</h1>
            <p className="section-sub">Find an event and build your team</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['', 'Online', 'Offline', 'Hybrid'].map(m => (
              <button key={m} className={`btn btn-sm ${filter === m ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(m)}>
                {m || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spin" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>
          : filtered.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">🗓️</div><h3>No hackathons</h3><p>Check back soon</p></div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 14 }}>
                {filtered.map(h => {
                  const dl = daysLeft(h.registration_deadline)
                  return (
                    <div key={h.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontStyle: 'italic', color: 'var(--text-1)', lineHeight: 1.2, marginBottom: 4 }}>{h.name}</h3>
                          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{h.organizer}</p>
                        </div>
                        {dl && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'var(--red-bg)', padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(235,87,87,0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{dl}</span>}
                      </div>

                      {h.description && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{h.description}</p>}

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`badge ${modeStyle[h.mode] || 'badge-gray'}`}>{h.mode}</span>
                        {h.prize_pool && <span className="badge badge-gold">🏆 {h.prize_pool}</span>}
                        <span className="badge badge-gray">👥 {h.team_size_min}–{h.team_size_max}</span>
                      </div>

                      {h.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {h.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      )}

                      {(h.start_date || h.registration_deadline) && (
                        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {h.start_date && <span>📅 {new Date(h.start_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}{h.end_date && ` – ${new Date(h.end_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`}</span>}
                          {h.registration_deadline && <span>⏰ Register by {new Date(h.registration_deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>}
                          {h.location && <span>📍 {h.location}</span>}
                        </div>
                      )}

                      {h.website_url && (
                        <a href={h.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm btn-block" style={{ textDecoration: 'none', marginTop: 'auto' }}>
                          Register Now →
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
        }
      </div>
    </div>
  )
}
