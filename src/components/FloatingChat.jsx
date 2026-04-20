import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { callAI } from '../lib/ai'

const SUGGESTIONS = [
  "📄 Make my resume",
  "✉️ Cover letter for SIH 2025",
  "💡 Project ideas for AI hackathon",
  "🏆 How to win a hackathon?",
  "🛠️ Best tech stack for my project",
]

function buildPrompt(profile) {
  return `You are HackMate AI — a smart hackathon assistant.

USER PROFILE:
- Name: ${profile?.full_name || 'User'}
- Role: ${profile?.role || 'Developer'}
- Skills: ${profile?.skills?.join(', ') || 'Not specified'}
- Hackathons: ${profile?.hackathons_count || 0} done, ${profile?.wins_count || 0} wins
- College: ${profile?.college || 'Unknown'}
- Achievements: ${profile?.achievements || 'None listed'}
- GitHub: ${profile?.github_url || 'Not provided'}
- LinkedIn: ${profile?.linkedin_url || 'Not provided'}

You help with:
1. RESUME — Generate complete professional resume from their profile data
2. COVER LETTER — Personalized letter for any hackathon/company
3. PROJECT IDEAS — 5 unique ideas matching their skills
4. HACKATHON TIPS — Specific, winning strategies
5. TECH STACK — Best tools for their project
6. PITCH HELP — Script, structure, judge prep
7. GENERAL — Any hackathon question

RESUME FORMAT (when asked):
Use this exact structure:
---
# [Full Name]
[College] | [GitHub link] | [LinkedIn link]

## Professional Summary
2-3 lines about background and goals

## Technical Skills
Grouped: Languages | Frameworks | Tools | Databases

## Hackathon Experience
List hackathons with role and what was built

## Projects
2-3 realistic projects based on their skills

## Education
College, degree, year

## Achievements & Awards
Any wins or notable work
---

RULES:
- Use **bold** for key points
- Use bullet points for lists
- Use numbered lists for steps
- Be specific and practical, not generic
- Keep responses under 350 words unless generating a document
- Always be encouraging`
}

export default function FloatingChat() {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setHasNew(false); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hey ${profile?.full_name?.split(' ')[0] || 'there'}! 👋 I'm HackMate AI.\n\nAsk me anything — **resume, cover letter, project ideas, hackathon tips, pitch help**. I already know your profile!\n\nWhat do you need?`,
        time: new Date(),
      }])
    }
  }, [open, profile])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = [...messages, userMsg].slice(-10).map(m => ({
        role: m.role, content: m.content,
      }))

      const reply = await callAI({
        system: buildPrompt(profile),
        messages: history,
        max_tokens: 1000,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date() }])
      if (!open) setHasNew(true)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Connection failed. Please check your internet and try again.',
        time: new Date(), error: true,
      }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function renderText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n').map(line => {
        if (line.startsWith('- ') || line.startsWith('• '))
          return `<div style="display:flex;gap:6px;padding:2px 0"><span style="color:#7c3aed;min-width:12px">•</span><span>${line.slice(2)}</span></div>`
        if (line.match(/^\d+\. /))
          return `<div style="display:flex;gap:6px;padding:2px 0"><span style="color:#7c3aed;font-weight:700;min-width:18px">${line.match(/^\d+/)[0]}.</span><span>${line.replace(/^\d+\. /, '')}</span></div>`
        if (line.startsWith('---'))
          return '<hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0"/>'
        if (line.trim() === '') return '<div style="height:5px"></div>'
        return `<span style="display:block">${line}</span>`
      }).join('')
  }

  return (
    <>
      {/* Floating button */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-h) + 16px)',
        right: 20,
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}>
        {!open && messages.length <= 1 && (
          <div style={{
            background: '#111118', color: 'white', padding: '6px 12px',
            borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
            whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)',
            animation: 'fadeIn 0.4s ease',
          }}>
            Ask AI anything ✨
          </div>
        )}

        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: open ? '#6d28d9' : 'var(--purple)',
            color: 'white', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {open ? '✕' : '✨'}
          {hasNew && !open && (
            <span style={{ position: 'absolute', top: 2, right: 2, width: 12, height: 12, background: 'var(--red)', borderRadius: '50%', border: '2px solid white' }} />
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-h) + 80px)',
          right: 20,
          width: 'min(380px, calc(100vw - 32px))',
          height: 'min(520px, calc(100vh - 160px))',
          background: 'white',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border-md)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.16)',
          display: 'flex', flexDirection: 'column',
          zIndex: 499,
          animation: 'slideUp 0.2s var(--ease)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: 'var(--purple)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✨</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 1 }}>HackMate AI</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Resume · Cover Letter · Strategy</p>
            </div>
            <a href="/ai-hub" style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', background: 'rgba(255,255,255,0.15)', padding: '3px 9px', borderRadius: 99, fontWeight: 600 }}>AI Hub →</a>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: m.role === 'user' ? 'var(--purple-light)' : 'var(--purple)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: m.role === 'user' ? 13 : 12, fontWeight: 700,
                  color: m.role === 'user' ? 'var(--purple)' : 'white',
                }}>
                  {m.role === 'user' ? (profile?.full_name?.[0] || 'U') : '✨'}
                </div>
                <div style={{
                  maxWidth: '82%', padding: '9px 12px', fontSize: 13, lineHeight: 1.55,
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'var(--purple)' : 'var(--bg-2)',
                  color: m.role === 'user' ? 'white' : 'var(--text-1)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  wordBreak: 'break-word',
                }}>
                  {m.role === 'assistant'
                    ? <div dangerouslySetInnerHTML={{ __html: renderText(m.content) }} />
                    : m.content
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white' }}>✨</div>
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block', animation: `bounce 1.2s ${i*0.2}s ease infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ fontSize: 11, padding: '4px 9px', borderRadius: 99, border: '1px solid rgba(124,58,237,0.25)', background: 'var(--purple-light)', color: 'var(--purple)', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ddd6fe'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--purple-light)'}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              ref={inputRef}
              style={{
                flex: 1, resize: 'none', border: '1px solid var(--border-md)', borderRadius: 18,
                padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-body)',
                lineHeight: 1.4, outline: 'none', height: 38, maxHeight: 100,
                color: 'var(--text-1)', background: 'var(--bg-2)', transition: 'border-color 0.2s',
              }}
              placeholder="Ask anything..."
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = '38px'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
              onKeyDown={handleKey}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
              rows={1}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: input.trim() && !loading ? 'var(--purple)' : 'var(--bg-2)',
                color: input.trim() && !loading ? 'white' : 'var(--text-3)',
                border: '1px solid var(--border)', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0, transition: 'all 0.2s',
              }}
            >
              {loading
                ? <span style={{ width: 14, height: 14, border: '2px solid rgba(124,58,237,0.2)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 0.65s linear infinite', display: 'inline-block' }} />
                : '→'
              }
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </>
  )
}
