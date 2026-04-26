import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callAI } from '../lib/ai'
import { Avatar } from '../components/StudentCard'

// ── ADDED: poori 6 quick actions wapas ──
const QUICK_ACTIONS = [
  { label: '📄 Make my resume', msg: 'Generate a complete professional resume for me based on my profile.' },
  { label: '✉️ Cover letter — SIH 2025', msg: 'Write a compelling cover letter for Smart India Hackathon 2025.' },
  { label: '💡 Give me project ideas', msg: 'Give me 5 unique hackathon project ideas that match my skills. Focus on real problems faced by people in India.' },
  { label: '🏆 How to win hackathons', msg: 'What are the top strategies to win a hackathon? Give me practical, specific tips that actually work.' },
  { label: '🛠️ Best tech stack', msg: 'What tech stack should I use for building an AI-powered web app in a hackathon?' },
  { label: '🎤 Pitch tips', msg: 'How should I pitch my project to judges? Give me a proven structure and key tips.' },
]

// ── ADDED: profile-aware system prompt ──
function buildSystemPrompt(profile) {
  return `You are HackMate AI — the smartest hackathon assistant in India.
USER: ${profile?.full_name}, ${profile?.role}, Skills: ${profile?.skills?.join(', ')}, College: ${profile?.college} (${profile?.year}), Hackathons: ${profile?.hackathons_count}, Wins: ${profile?.wins_count}
For resume/cover letter: generate the COMPLETE document. Be specific to their profile. Use **bold**, ## headers, bullet points.`
}

export default function AIChat() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false) 
  
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // ── ADDED: welcome message ──
  useEffect(() => {
    if (!profile) return
    setMessages([{
      role: 'assistant',
      content: `Hey ${profile?.full_name?.split(' ')[0]}! 👋 I'm your personal hackathon AI.\n\nI know your profile — you're a **${profile?.role}** with skills in **${profile?.skills?.slice(0,3).join(', ')}**.\n\nWhat do you need today?`,
      time: new Date(),
    }])
  }, [profile])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, time: new Date() }])
    setLoading(true)
    try {
      // ── ADDED: full history + profile system prompt ──
      const history = messages.slice(-14).map(m => ({ role: m.role, content: m.content }))
      const reply = await callAI({
        system: buildSystemPrompt(profile),
        messages: [...history, { role: 'user', content: msg }],
        max_tokens: 1500
      })
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date() }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI is not responding. Try again.', time: new Date(), error: true }])
    }
    setLoading(false)
  }

  // ── ADDED: renderText for markdown formatting ──
  function renderText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n').map(line => {
        if (line.startsWith('## ')) return `<h3 style="font-size:14px;font-weight:800;margin:10px 0 4px">${line.slice(3)}</h3>`
        if (line.match(/^\d+\. /)) return `<div style="padding:2px 0;display:flex;gap:8px"><span style="color:var(--purple);font-weight:800;min-width:20px">${line.match(/^\d+/)[0]}.</span><span style="font-size:14px">${line.replace(/^\d+\. /, '')}</span></div>`
        if (line.startsWith('- ') || line.startsWith('• ')) return `<div style="padding:2px 0;display:flex;gap:6px"><span style="color:var(--purple)">•</span><span style="font-size:14px">${line.slice(2)}</span></div>`
        if (line.trim() === '') return '<div style="height:6px"></div>'
        return `<p style="font-size:14px;line-height:1.6;margin:2px 0">${line}</p>`
      }).join('')
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - var(--nav-h))', 
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      <style>{`
        ${isFocused ? `
          nav, footer, .bottom-navbar, [class*="BottomNav"],
          [class*="FloatingChat"], [class*="floating"], [id*="floating"] { 
            display: none !important; 
          }
        ` : ''}
        @keyframes bounce { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '0.875rem 1.25rem', flexShrink: 0, zIndex: 10 }}>
        <p style={{ fontSize: 15, fontWeight: 800 }}>HackMate AI Chat</p>
      </div>

      {/* Messages area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: isFocused ? '1rem 1rem 80px' : '1rem 1rem 170px',
        transition: 'padding 0.2s ease'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              {msg.role === 'user'
                ? <Avatar profile={profile} size="av-36" />
                : <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--purple),#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✨</div>
              }
              <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                <div style={{ 
                  padding: msg.role === 'user' ? '10px 14px' : '14px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: msg.role === 'user' ? 'var(--purple)' : 'white',
                  color: msg.role === 'user' ? 'white' : 'var(--text-1)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)', wordBreak: 'break-word',
                }}>
                  {msg.role === 'assistant'
                    ? <div dangerouslySetInnerHTML={{ __html: renderText(msg.content) }} />
                    : <p style={{ fontSize: 14, margin: 0, lineHeight: 1.55 }}>{msg.content}</p>
                  }
                </div>
                {/* ── ADDED: timestamp + copy button ── */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{msg.time?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.role === 'assistant' && !msg.error && (
                    <button onClick={() => navigator.clipboard.writeText(msg.content).catch(()=>{})}
                      style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}>
                      📋 copy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* ── ADDED: loading dots ── */}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--purple),#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✨</div>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block', animation: `bounce 1.2s ${i*0.2}s ease infinite` }} />)}
                  <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>Writing for you...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Container for Actions & Input */}
      <div style={{ 
        position: 'absolute', 
        bottom: 0, left: 0, right: 0, 
        zIndex: 999,
        background: isFocused ? 'white' : 'transparent',
        transition: 'all 0.2s ease'
      }}>
        
        {/* Quick Actions - Hidden when typing */}
        {!isFocused && (
          <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: 8, overflowX: 'auto', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(5px)' }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => send(a.msg)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, border: '1px solid #ddd', background: 'white', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Box Area */}
        <div style={{ 
          background: 'white', 
          padding: isFocused 
            ? '10px 20px 24px'                                    // keyboard open — sirf safe area
            : '10px 20px calc(var(--nav-h, 60px) + 12px)',        // keyboard closed — navbar + spacing
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, alignItems: 'center' 
        }}>
          <textarea
            ref={inputRef}
            style={{ 
              flex: 1, resize: 'none', borderRadius: 24, padding: '12px 18px', 
              fontSize: 14, height: 48, border: '1px solid var(--border)', outline: 'none',
            }}
            placeholder="Ask anything..."
            value={input}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <button 
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--purple)', color: 'white', border: 'none', flexShrink: 0, fontSize: 20, cursor: 'pointer' }}
          >
            {loading ? <span className="spin spin-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : '→'}
          </button>
        </div>
      </div>

    </div>
  )
}