import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './StudentCard'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/dashboard', label: 'Home', icon: '⌂' },
  { to: '/browse', label: 'Browse', icon: '◎' },
  { to: '/chats', label: 'Chats', icon: '💬' },
  { to: '/hackathons', label: 'Events', icon: '◈' },
  { to: '/invites', label: 'Invites', icon: '✉' },
  { to: '/ai-hub', label: 'AI Hub', icon: '✨', highlight: true },
]

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!profile) return
    const fetchCounts = async () => {
      const [{ count: n }, { count: m }] = await Promise.all([
        supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('is_read', false),
        supabase.from('messages').select('id', { count: 'exact' }).eq('is_read', false).neq('sender_id', profile.id),
      ])
      setUnread(n || 0)
      setUnreadMsgs(m || 0)
    }
    fetchCounts()
    const ch = supabase.channel('nav-' + profile.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, fetchCounts)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchCounts)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile])

  useEffect(() => {
    if (!menuOpen) return
    const h = () => setMenuOpen(false)
    setTimeout(() => document.addEventListener('click', h), 0)
    return () => document.removeEventListener('click', h)
  }, [menuOpen])

  const notifCount = (to) => {
    if (to === '/invites') return unread
    if (to === '/chats') return unreadMsgs
    return 0
  }

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 300,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
        height: 'var(--nav-h)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 12 }}>
          <NavLink to="/dashboard" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
              Hack<span style={{ color: 'var(--purple)' }}>Mate</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="sm-hide" style={{ display: 'flex', gap: 1, flex: 1 }}>
            {NAV.map(n => {
              const active = location.pathname === n.to || location.pathname.startsWith(n.to + '/')
              const count = notifCount(n.to)
              return (
                <NavLink key={n.to} to={n.to} style={{
                  textDecoration: 'none',
                  padding: '5px 11px',
                  borderRadius: 'var(--r-full)',
                  fontSize: 13,
                  fontWeight: n.highlight ? 700 : 500,
                  transition: 'var(--t)',
                  color: n.highlight ? (active ? 'white' : 'var(--purple)') : (active ? 'var(--purple)' : 'var(--text-2)'),
                  background: n.highlight
                    ? (active ? 'var(--purple)' : 'var(--purple-light)')
                    : (active ? 'var(--purple-light)' : 'transparent'),
                  display: 'flex', alignItems: 'center', gap: 5,
                  border: n.highlight ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                }}>
                  {n.label}
                  {count > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 17, height: 17, background: n.highlight ? 'white' : 'var(--red)', color: n.highlight ? 'var(--purple)' : 'white', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '0 4px' }}>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            {/* AI Chat quick button */}
            <NavLink to="/ai-chat" className="sm-hide" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', border: '1px solid var(--border)', background: 'var(--bg-2)', transition: 'var(--t)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple-light)'; e.currentTarget.style.color = 'var(--purple)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              💬 AI Chat
            </NavLink>

            {/* Profile */}
            <button onClick={() => setMenuOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: menuOpen ? 'var(--purple-light)' : 'var(--bg-2)',
              border: `1px solid ${menuOpen ? 'rgba(124,58,237,0.3)' : 'var(--border-md)'}`,
              borderRadius: 'var(--r-full)', padding: '4px 12px 4px 4px',
              cursor: 'pointer', transition: 'var(--t)',
            }}>
              <Avatar profile={profile} size="av-28" />
              <span className="sm-hide" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                {profile?.full_name?.split(' ')[0]}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-3)' }}>▾</span>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 16, top: 'calc(var(--nav-h) + 6px)',
                background: 'white', border: '1px solid var(--border-md)',
                borderRadius: 'var(--r-xl)', padding: 8, minWidth: 240,
                boxShadow: '0 20px 60px rgba(0,0,0,0.14)', zIndex: 400,
                animation: 'slideUp 0.15s var(--ease)',
              }}>
                <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{profile?.full_name}</div>
                  {profile?.username && <span className="username-chip" style={{ fontSize: 12 }}>@{profile.username}</span>}
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{profile?.role} · {profile?.college}</div>
                </div>

                <div style={{ marginBottom: 6 }}>
                  {[
                    { l: '👤 My Profile', t: `/profile/${profile?.id}` },
                    { l: '✏️ Edit Profile', t: '/edit-profile' },
                    { l: '💬 My Chats', t: '/chats' },
                    { l: '🔍 Find @username', t: '/search' },
                    { l: '🏆 Leaderboard', t: '/leaderboard' },
                  ].map(item => (
                    <NavLink key={item.t} to={item.t} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, fontSize: 14, color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500, transition: 'var(--t)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text-1)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)' }}
                    >{item.l}</NavLink>
                  ))}
                </div>

                {/* AI Section */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginBottom: 6 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px 2px' }}>AI Features</p>
                  {[
                    { l: '✨ AI Hub', t: '/ai-hub' },
                    { l: '💬 AI Chat', t: '/ai-chat' },
                    { l: '🎯 AI Matching', t: '/ai-match' },
                  ].map(item => (
                    <NavLink key={item.t} to={item.t} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, fontSize: 14, color: 'var(--purple)', textDecoration: 'none', fontWeight: 600, transition: 'var(--t)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple-light)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '' }}
                    >{item.l}</NavLink>
                  ))}
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 6px' }} />
                <button onClick={async () => { await signOut(); navigate('/') }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', fontSize: 14, color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {[
          { to: '/dashboard', label: 'Home', icon: '⌂' },
          { to: '/browse', label: 'Browse', icon: '◎' },
          { to: '/chats', label: 'Chats', icon: '💬' },
          { to: '/ai-hub', label: 'AI', icon: '✨' },
          { to: `/profile/${profile?.id}`, label: 'Me', icon: '◉' },
        ].map(n => {
          const active = location.pathname === n.to || (n.to !== '/dashboard' && location.pathname.startsWith(n.to))
          const count = notifCount(n.to)
          return (
            <NavLink key={n.to} to={n.to} className={`bn-item ${active ? 'active' : ''}`}
              style={n.to === '/ai-hub' ? { color: active ? 'var(--purple)' : 'var(--purple)', opacity: active ? 1 : 0.6 } : {}}
            >
              <span className="bn-icon" style={{ position: 'relative' }}>
                {n.icon}
                {count > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -6, minWidth: 14, height: 14, background: 'var(--red)', color: 'white', borderRadius: 99, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid white' }}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              <span className="bn-label">{n.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
