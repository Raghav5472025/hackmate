import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callAI } from '../lib/ai'
import { Avatar } from '../components/StudentCard'

const QUICK_ACTIONS = [
  { label: '📄 Make my resume', msg: 'Generate a complete professional resume for me based on my profile. Make it ready for hackathons and internship applications.' },
  { label: '✉️ Cover letter — SIH 2025', msg: 'Write a compelling cover letter for Smart India Hackathon 2025. Highlight my strengths and why I want to participate.' },
  { label: '💡 Give me project ideas', msg: 'Give me 5 unique hackathon project ideas that match my skills. Focus on real problems faced by people in India.' },
  { label: '🏆 How to win hackathons', msg: 'What are the top strategies to win a hackathon? Give me practical, specific tips that actually work.' },
  { label: '🛠️ Best tech stack', msg: 'What tech stack should I use for building an AI-powered web app in a hackathon? Keep it simple but impressive for judges.' },
  { label: '🎤 Pitch tips', msg: 'How should I pitch my project to judges? Give me a proven structure and key tips to make it memorable.' },
]

function buildSystemPrompt(profile) {
  return `You are HackMate AI — the smartest hackathon assistant in India, built into HackMate platform.

USER PROFILE:
- Name: ${profile?.full_name}
- Role: ${profile?.role}
- Skills: ${profile?.skills?.join(', ')}
- College: ${profile?.college} (${profile?.year})
- Hackathons done: ${profile?.hackathons_count}, Wins: ${profile?.wins_count}
- Achievements: ${profile?.achievements || 'None listed yet'}
- GitHub: ${profile?.github_url || 'Not provided'}
- LinkedIn: ${profile?.linkedin_url || 'Not provided'}
- Looking for: ${profile?.looking_for || 'Good teammates'}

WHAT YOU CAN DO:

1. RESUME BUILDER — When user asks "make resume" or "create resume":
Generate a COMPLETE, professional resume:
---
# ${profile?.full_name || '[Name]'}
${profile?.college || '[College]'} | ${profile?.year || '[Year]'} | ${profile?.github_url || 'GitHub'} | ${profile?.linkedin_url || 'LinkedIn'}

## Professional Summary
Write 2-3 compelling lines about their background as ${profile?.role} with ${profile?.hackathons_count} hackathons experience.

## Technical Skills
**Languages:** [list from their skills]
**Frameworks & Libraries:** [list from their skills]
**Tools & Platforms:** Git, GitHub, VS Code, [others based on skills]

## Hackathon Experience
**HackMate Platform** — ${profile?.hackathons_count} Hackathons | ${profile?.wins_count} Wins
- Built projects using ${profile?.skills?.slice(0,3).join(', ')}
- Collaborated with cross-functional teams

## Projects
Create 2-3 realistic projects based on their skill set

## Education
${profile?.college || '[College]'} | ${profile?.year || '[Year]'}
B.Tech Computer Science / [relevant degree]

## Achievements
${profile?.achievements || 'Add your achievements in Edit Profile'}
---

2. COVER LETTER — Generate complete, personalized letter. Professional but passionate. Include their specific skills.

3. PROJECT IDEAS — 5 unique ideas with: problem, solution, tech stack, why judges will like it.

4. HACKATHON TIPS — Specific winning strategies. Time management, presentation, team dynamics, demo tips.

5. TECH STACK — Recommend specific technologies. Explain why. Keep it hackathon-practical (fast to build, impressive to see).

6. PITCH SCRIPT — Full 2-minute script. Slide-by-slide structure. Judge questions to prepare for.

7. TEAM STRATEGY — How to divide work, daily standup tips, what to build first.

RESPONSE STYLE:
- Use **bold** for important words
- Numbered lists for steps
- Bullet points for features/tips
- Section headers with ##
- For documents (resume/cover letter): generate the COMPLETE thing, not a template
- Be specific to their profile, not generic
- Be encouraging and practical
- Max 400 words for advice, full document for resume/cover letter`
}

export default function AIChat() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Welcome message
  useEffect(() => {
    if (!profile) return
    setMessages([{
      role: 'assistant',
      content: `Hey ${profile?.full_name?.split(' ')[0]}! 👋 I'm your personal hackathon AI.\n\nI know your profile — you're a **${profile?.role}** with skills in **${profile?.skills?.slice(0,3).join(', ')}**.\n\nI can help you with:\n- 📄 Resume & Cover Letters (full documents!)\n- 💡 Project Ideas matched to your skills\n- 🏆 Hackathon Strategy & Winning Tips\n- 🎤 Pitch Scripts & Slide Structure\n- ⚡ Real-time Help when stuck\n\nWhat do you need today?`,
      time: new Date(),
    }])
  }, [profile])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    if (inputRef.current) { inputRef.current.style.height = '50px' }

    const userMsg = { role: 'user', content: msg, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = [...messages, userMsg].slice(-14).map(m => ({
        role: m.role, content: m.content,
      }))

      const reply = await callAI({
        system: buildSystemPrompt(profile),
        messages: history,
        max_tokens: 1500,
      })

      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date() }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ AI is not responding right now. Please check your connection and try again.',
        time: new Date(),
        error: true,
      }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  async function copyMsg(content) {
    try { await navigator.clipboard.writeText(content) } catch {}
  }

  function renderText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:var(--bg-2);padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>')
      .split('\n').map(line => {
        if (line.startsWith('# '))
          return `<h2 style="font-size:17px;font-weight:800;color:var(--text-1);margin:14px 0 6px;border-bottom:2px solid var(--purple-light);padding-bottom:6px">${line.slice(2)}</h2>`
        if (line.startsWith('## '))
          return `<h3 style="font-size:14px;font-weight:800;color:var(--text-1);margin:12px 0 5px">${line.slice(3)}</h3>`
        if (line === '---')
          return '<hr style="border:none;border-top:1px solid var(--border);margin:10px 0"/>'
        if (line.match(/^\d+\. /))
          return `<div style="padding:3px 0;display:flex;gap:8px"><span style="color:var(--purple);font-weight:800;min-width:22px;font-size:13px">${line.match(/^\d+/)[0]}.</span><span style="font-size:14px;line-height:1.6">${line.replace(/^\d+\. /, '')}</span></div>`
        if (line.startsWith('- ') || line.startsWith('• '))
          return `<div style="padding:2px 0;display:flex;gap:8px"><span style="color:var(--purple);min-width:14px">•</span><span style="font-size:14px;line-height:1.6">${line.slice(2)}</span></div>`
        if (line.trim() === '') return '<div style="height:7px"></div>'
        return `<p style="font-size:14px;line-height:1.65;margin:2px 0">${line}</p>`
      }).join('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--nav-h))', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '0.875rem 1.25rem', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
        <div className="container" style={{ maxWidth: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,var(--purple),#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✨</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginBottom: 1 }}>HackMate AI Chat</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Resume · Cover Letter · Ideas · Strategy · Pitch · Real-time help</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm sm-hide" onClick={() => navigate('/ai-hub')}>AI Hub →</button>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setMessages([{
                role: 'assistant',
                content: `Fresh start! What can I help you with today, ${profile?.full_name?.split(' ')[0]}?`,
                time: new Date(),
              }])
            }}>Clear</button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              {/* Avatar */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {msg.time?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'assistant' && !msg.error && (
                    <button onClick={() => copyMsg(msg.content)}
                      style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-body)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >📋 copy</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--purple),#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✨</div>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', padding: '14px 18px', boxShadow: 'var(--shadow-sm)' }}>
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

      {/* Quick action chips */}
      <div style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '0.75rem 1.25rem 0.5rem', flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => send(a.msg)}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple-light)'; e.currentTarget.style.color = 'var(--purple)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >{a.label}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ background: 'white', padding: '0.75rem 1.25rem', paddingBottom: `calc(0.75rem + var(--safe-b))`, flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="form-input"
            style={{ flex: 1, resize: 'none', borderRadius: 24, padding: '12px 18px', lineHeight: 1.5, fontSize: 14, height: 50, maxHeight: 150, overflowY: 'auto' }}
            placeholder="Ask anything — resume, cover letter, project ideas, hackathon tips..."
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = '50px'; e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px' }}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className="btn btn-primary"
            style={{ width: 50, height: 50, borderRadius: '50%', padding: 0, flexShrink: 0, fontSize: 20 }}
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            {loading
              ? <span className="spin spin-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
              : '→'
            }
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 6 }}>
          Enter to send · Shift+Enter for newline · Powered by Claude AI
        </p>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
      `}</style>
    </div>
  )
}
