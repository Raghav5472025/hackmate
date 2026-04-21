import DownloadPPTButton from '../components/PitchPPT'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callAI } from '../lib/ai'
import { supabase } from '../lib/supabase'

const FEATURES = [
  {
    id: 'team-builder', icon: '👥', title: 'Team Builder', badge: 'Most Popular',
    desc: 'Apna idea aur required skills batao — AI best team composition suggest karega with roles and reason.',
    how: 'Input: idea + skills needed → AI analyzes → Output: role-wise team structure',
    color: '#7c3aed',
    placeholder: 'I want to build a crop disease detection app using ML. Need a team for SIH 2025. What should be the ideal team composition?',
  },
  {
    id: 'teammate-match', icon: '🎯', title: 'Teammate Matching', badge: 'Live Data',
    desc: 'Real users fetch honge. AI dekhega ki tera project + skills ke hisaab se kaun best match hai.',
    how: 'Tera profile + available users list → AI scoring → Top 5 matches with reason',
    color: '#2563eb',
    placeholder: 'I am building a fintech AI app and need a React frontend developer and a good UI designer. Find me the best matches.',
  },
  {
    id: 'strategy', icon: '🗺️', title: 'Strategy Planner',
    desc: 'Idea batao — AI ek complete execution plan dega. MVP features, task division, 24-48 hour timeline.',
    how: 'Input: idea + team size + duration → Output: structured plan with tasks and timeline',
    color: '#0d9488',
    placeholder: 'Plan a 36-hour hackathon strategy for building an AI-based traffic management system in Indian cities. Team of 4 people.',
  },
  {
    id: 'evaluator', icon: '📊', title: 'Team Evaluator',
    desc: 'Apni current team ke members ke skills paste karo — AI compatibility score dega, strengths aur gaps highlight karega.',
    how: 'Input: team members + their skills → AI analysis → Score + detailed breakdown',
    color: '#d97706',
    placeholder: 'Evaluate my team:\n- Me: ML/AI, Python, TensorFlow, Java\n- Priya: UI/UX, Figma, Adobe XD\n- Rahul: Full Stack, React, Node.js\n- Ananya: Backend, FastAPI, PostgreSQL\n\nProject: AI-based EdTech platform',
  },
  {
    id: 'pitch', icon: '🎤', title: 'PPT Generator', badge: '✨ AI Design',
    desc: 'Topic likho — AI topic samjhega, best layout choose karega, deep content bharna aur professional PPT download karo.',
    how: 'Topic → AI detects field → Chooses layouts → Fills content → Download PPT',
    color: '#e11d48',
    placeholder: 'Diabetes: Causes, Symptoms and Prevention',
  },
  {
    id: 'realtime', icon: '⚡', title: 'Real-time Help',
    desc: 'Hackathon chal raha hai aur stuck ho? AI turant priority tasks aur next actions dega. No fluff.',
    how: 'Input: current situation → AI: short, actionable steps only — no fluff',
    color: '#7c3aed',
    placeholder: 'We have 5 hours left in the hackathon. Backend API is mostly done (80%). Frontend is 40% complete. No presentation/PPT made yet. Demo video not recorded. What should we do?',
  },
]

function buildHubPrompt(profile, users, featureId) {
  const userList = users.slice(0, 15).map(u =>
    `- ${u.full_name} | ${u.role} | Skills: ${u.skills?.join(', ')} | ${u.hackathons_count} hackathons`
  ).join('\n')

  const base = `USER: ${profile?.full_name} | ${profile?.role} | Skills: ${profile?.skills?.join(', ')} | College: ${profile?.college}\n\n`

  const prompts = {
    'team-builder': base + `You are a hackathon team builder expert. Analyze the project idea and build OPTIMAL team structure.

## 🏗️ Optimal Team Structure
[Team size and overview]

## 👤 Required Roles
**[Role]** — [responsibilities]
- Skills: [list] | Why: [reason] | Level: [beginner/mid/expert]

## ✅ Best Matches from HackMate
${userList}
Pick 3-4 best matches with reasons.

## 🎯 Compatibility Score: [X]/100
## 💡 Pro Tips
3 specific tips for success.`,

    'teammate-match': base + `You are a teammate matching AI.

AVAILABLE USERS:
${userList}

## 🎯 Top 5 Matches
**[Rank]. [Name]** — [Role]
- Compatibility: [X]% | Why: [reason] | Skills: [list] | ⭐ Strength: [standout]

## 🤝 Dream Team (2-3 people)
[Best combination and why]`,

    'strategy': base + `You are a hackathon strategy expert.

## 🎯 MVP Features (Must-Have Only)
[4-5 core features]

## 👥 Task Division
[Per member responsibilities]

## ⏰ Timeline
**Hours 0-4:** [tasks]
**Hours 4-8:** [tasks]
**Hours 8-16:** [tasks]
**Hours 16-24:** [tasks]

## 🛠️ Tech Stack
Frontend/Backend/Database/AI/Deploy

## ⚠️ Top 3 Risks + Solutions
## 🏆 What Judges Look For`,

    'evaluator': base + `You are a team compatibility evaluator.

## 📊 Score: [X]/100
## ✅ Strengths (3-4)
## ❌ Skill Gaps (High/Medium/Low impact)
## 📈 Success Probability: [X]%
## 🛠️ Fixes
## 💡 Top 3 Recommendations`,

    'pitch': `You are a world-class presentation designer. Create a COMPLETE professional PowerPoint as JSON.

TOPIC: As given by user.

CRITICAL RULES:
1. Detect field: education, business, medical, technology, finance, environment, law, psychology, arts, science
2. Choose 8-12 slides — EVERY slide must have FULL content, NO empty arrays
3. VARY layouts across slides — do NOT repeat same layout consecutively
4. Each bullet point: minimum 12 words, specific, expert-level with real data
5. Use REAL statistics, REAL names, REAL examples specific to the topic
6. NEVER use double quotes inside strings — use apostrophes only
7. Return ONLY raw JSON — no markdown, no backticks, no text before or after
8. ALL array fields must have content — left_bullets, right_bullets, cards, steps, left_items, right_items, stats MUST be filled

LAYOUT RULES — fill ALL fields for chosen layout:

"title": needs heading, subheading, bullets(3 items)
"bullets": needs heading, subheading, bullets(4-6 items each 12+ words)
"two_column": needs heading, left_heading, left_bullets(4 items), right_heading, right_bullets(4 items) — BOTH sides must have content
"three_cards": needs heading, cards(3 items each with title, emoji, points(3 items each 10+ words))
"big_stat": needs heading, stats(3 items each with number, label, context), bullets(2-3 items)
"comparison": needs heading, left_heading, left_bullets(4 items), right_heading, right_bullets(4 items), verdict
"timeline": needs heading, steps(4 items each with number, title, description(20+ words))
"quote_focus": needs heading, quote(powerful statement), author, explanation(2-3 sentences)
"checklist": needs heading, left_heading, left_items(4 items each 10+ words), right_heading, right_items(4 items each 10+ words)
"case_study": needs heading, case_name, situation(2-3 sentences), action(2-3 sentences), result(with numbers), lesson
"closing": needs heading, subheading, key_takeaways(3 items)

FULL JSON EXAMPLE — follow this structure exactly:
{"title":"Topic Title","theme":"education","slides":[
{"layout":"title","heading":"Full Topic Title","subheading":"Powerful subtitle","bullets":["Key insight one about this topic","Key insight two about this topic","Key insight three about this topic"]},
{"layout":"bullets","heading":"Introduction","subheading":"Overview of the topic","bullets":["First detailed point with real data and specific information about the topic","Second detailed point explaining core concept with example from real world","Third detailed point covering important aspect with statistics or evidence","Fourth detailed point providing expert insight on the subject matter"]},
{"layout":"big_stat","heading":"Key Statistics","stats":[{"number":"73%","label":"Relevant metric label","context":"Source: Organization Year"},{"number":"2.5M","label":"Another metric label","context":"Source: Report Year"},{"number":"40%","label":"Third metric label","context":"Source: Study Year"}],"bullets":["Supporting insight one explaining what these numbers mean","Supporting insight two on implications for the topic","Supporting insight three on future trends"]},
{"layout":"two_column","heading":"Two Perspectives","left_heading":"First Aspect Title","left_bullets":["Detailed point about first aspect with explanation","Second point about first aspect with real example","Third point about first aspect with data or evidence","Fourth point about first aspect with expert view"],"right_heading":"Second Aspect Title","right_bullets":["Detailed point about second aspect with explanation","Second point about second aspect with real example","Third point about second aspect with data or evidence","Fourth point about second aspect with expert view"]},
{"layout":"three_cards","heading":"Three Key Areas","cards":[{"title":"First Area","emoji":"📊","points":["Detailed point one about first area with context","Detailed point two about first area with example","Detailed point three about first area with impact"]},{"title":"Second Area","emoji":"💡","points":["Detailed point one about second area with context","Detailed point two about second area with example","Detailed point three about second area with impact"]},{"title":"Third Area","emoji":"🚀","points":["Detailed point one about third area with context","Detailed point two about third area with example","Detailed point three about third area with impact"]}]},
{"layout":"timeline","heading":"Step by Step Process","steps":[{"number":"01","title":"First Step","description":"Detailed explanation of what happens in this step, why it matters, and what actions are involved in the process"},{"number":"02","title":"Second Step","description":"Detailed explanation of what happens in this step, why it matters, and what actions are involved in the process"},{"number":"03","title":"Third Step","description":"Detailed explanation of what happens in this step, why it matters, and what actions are involved in the process"},{"number":"04","title":"Fourth Step","description":"Detailed explanation of what happens in this step, why it matters, and what actions are involved in the process"}]},
{"layout":"comparison","heading":"Comparison Title","left_heading":"Option A","left_bullets":["First point about Option A with detail","Second point about Option A with evidence","Third point about Option A with example","Fourth point about Option A with impact"],"right_heading":"Option B","right_bullets":["First point about Option B with detail","Second point about Option B with evidence","Third point about Option B with example","Fourth point about Option B with impact"],"verdict":"Clear conclusion about which approach works best and in what circumstances"},
{"layout":"checklist","heading":"Best Practices","left_heading":"Do This","left_items":["First recommended action with full explanation of why it works","Second recommended action with specific steps to follow","Third recommended action with expected positive outcome","Fourth recommended action with real world evidence"],"right_heading":"Avoid This","right_items":["First common mistake and why it causes problems or negative outcomes","Second mistake with specific consequences to be aware of","Third mistake with better alternative that should be used instead","Fourth mistake with real world example of negative impact"]},
{"layout":"quote_focus","heading":"Key Insight","quote":"A powerful and memorable statement directly related to this topic that captures the essence","author":"Name, Title, Organization","explanation":"Two to three sentence explanation of why this quote matters deeply, what it reveals about the topic, and how it applies to our understanding today"},
{"layout":"case_study","heading":"Real World Example","case_name":"Specific Company or Person Name","situation":"Two to three sentence description of the specific challenge or problem faced, including relevant context and background information","action":"Specific steps that were taken to address the situation, including strategies applied and decisions made along the way","result":"Measurable outcomes achieved including specific numbers, percentages, or other quantifiable improvements","lesson":"The key insight this case study teaches us and how it directly applies to the broader topic"},
{"layout":"closing","heading":"Thank You","subheading":"Memorable and relevant closing tagline","key_takeaways":["The single most important insight from this presentation that audience must remember","Second critical point that reinforces the main message of the presentation","Clear actionable next step or call to action for the audience to take"]}
]}`,

    'realtime': base + `You are a hackathon crisis manager. SHORT. DIRECT. NO FLUFF.

## ⚡ DO NOW (Next 3 Actions)
1. [Action] — [X minutes]
2. [Action] — [X minutes]
3. [Action] — [X minutes]

## 🚨 Biggest Risk
[One line]

## ✅ DO NEXT
[3 actions after above]

## ❌ SKIP NOW
[2-3 time-wasters]

## 💪 Quick Win (15 min)
[One impressive thing]`,
  }

  return prompts[featureId] || prompts['strategy']
}

// Safe JSON parser for PPT output
function parsePPTJson(text) {
  if (!text || typeof text !== 'string') return null
  try {
    let clean = text.trim()
    // Remove markdown fences
    clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    // Find JSON boundaries
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start === -1 || end === -1) return null
    clean = clean.slice(start, end + 1)
    // Fix trailing commas
    clean = clean.replace(/,(\s*[}\]])/g, '$1')
    const parsed = JSON.parse(clean)
    if (parsed && parsed.slides && Array.isArray(parsed.slides)) return parsed
    return null
  } catch {
    return null
  }
}

function isJsonOutput(text) {
  return parsePPTJson(text) !== null
}

const LAYOUT_ICONS = {
  title: '🎯', bullets: '📝', two_column: '⬜', three_cards: '🃏',
  big_stat: '📊', comparison: '⚖️', timeline: '⏱️', quote_focus: '💬',
  checklist: '✅', case_study: '🔍', closing: '🎉', default: '📄'
}

export default function AIHub() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [activeFeature, setActiveFeature] = useState(null)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [parsedPPT, setParsedPPT] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function run() {
    if (!input.trim() || !activeFeature || loading) return
    setLoading(true)
    setOutput('')
    setParsedPPT(null)

    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id,full_name,role,skills,hackathons_count,wins_count,college,is_open')
        .neq('id', profile?.id || '')
        .eq('is_open', true)
        .limit(20)

      const systemPrompt = buildHubPrompt(profile, users || [], activeFeature.id)

      const reply = await callAI({
        system: systemPrompt,
        messages: [{ role: 'user', content: input }],
        max_tokens: 4000,
      })

      setOutput(reply)

      // Try to parse as PPT JSON
      if (activeFeature.id === 'pitch') {
        const parsed = parsePPTJson(reply)
        setParsedPPT(parsed)
      }
    } catch (err) {
      setOutput('❌ AI failed to respond. Please check your connection and try again.')
    }
    setLoading(false)
  }

  function copyOutput() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function renderMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n').map(line => {
        if (line.startsWith('## '))
          return `<h3 style="font-size:15px;font-weight:800;color:var(--text-1);margin:16px 0 7px;padding-bottom:5px;border-bottom:2px solid var(--purple-light)">${line.slice(3)}</h3>`
        if (line.startsWith('# '))
          return `<h2 style="font-size:18px;font-weight:800;color:var(--text-1);margin:16px 0 8px">${line.slice(2)}</h2>`
        if (line === '---')
          return '<hr style="border:none;border-top:1px solid var(--border);margin:12px 0"/>'
        if (line.match(/^\d+\. /))
          return `<div style="padding:4px 0;display:flex;gap:8px"><span style="color:var(--purple);font-weight:800;min-width:22px;font-size:13px">${line.match(/^\d+/)[0]}.</span><span style="font-size:14px;line-height:1.6">${line.replace(/^\d+\. /, '')}</span></div>`
        if (line.startsWith('- ') || line.startsWith('• '))
          return `<div style="padding:2px 0;display:flex;gap:8px"><span style="color:var(--purple);min-width:14px">•</span><span style="font-size:14px;line-height:1.6">${line.slice(2)}</span></div>`
        if (line.trim() === '') return '<div style="height:6px"></div>'
        return `<p style="font-size:14px;line-height:1.65;margin:2px 0">${line}</p>`
      }).join('')
  }

  // PPT Preview component — shows clean slide list, not raw JSON
  function PPTPreview({ data }) {
    if (!data) return null
    const slides = data.slides || []
    const themeColors = {
      medical: '#059669', education: '#7c3aed', business: '#0284c7',
      technology: '#0891b2', finance: '#d97706', environment: '#16a34a',
      law: '#dc2626', psychology: '#c026d3', arts: '#ea580c', science: '#2563eb',
      default: '#7c3aed'
    }
    const color = themeColors[data.theme] || themeColors.default

    return (
      <div>
        {/* Header card */}
        <div style={{ background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#14532d', margin: 0 }}>
              ✅ {slides.length} slides ready to download
            </p>
          </div>
          <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>
            <strong>Title:</strong> {data.title} &nbsp;|&nbsp; <strong>Theme:</strong> {data.theme}
          </p>
        </div>

        {/* Slide list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slides.map((slide, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slide.heading || `Slide ${i + 1}`}
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {LAYOUT_ICONS[slide.layout] || '📄'} {slide.layout}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, textAlign: 'center' }}>
          👇 Click Download below to get your PowerPoint file
        </p>
      </div>
    )
  }

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: 'var(--purple)', marginBottom: 14 }}>
            ✨ AI-Powered Features
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.04em', marginBottom: 12 }}>
            HackMate <span style={{ color: 'var(--purple)' }}>AI Hub</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 500, margin: '0 auto' }}>
            6 powerful AI tools to help you build, plan, pitch, and win hackathons.
          </p>
        </div>

        {/* Feature cards grid */}
        {!activeFeature && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 14 }}>
            {FEATURES.map(f => (
              <button
                key={f.id}
                onClick={() => { setActiveFeature(f); setInput(f.placeholder); setOutput(''); setParsedPPT(null) }}
                style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.4rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${f.color}20` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                {f.badge && (
                  <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, background: f.color + '18', color: f.color, padding: '2px 8px', borderRadius: 99, border: `1px solid ${f.color}30` }}>
                    {f.badge}
                  </span>
                )}
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>{f.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-2)', padding: '7px 10px', borderRadius: 'var(--r-sm)', lineHeight: 1.5, borderLeft: `3px solid ${f.color}` }}>
                  {f.how}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Active feature workspace */}
        {activeFeature && (
          <div className="fade-up">
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.25rem', gap: 6 }}
              onClick={() => { setActiveFeature(null); setInput(''); setOutput(''); setParsedPPT(null) }}>
              ← Back to AI Hub
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: output ? '1fr 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>

              {/* Input panel */}
              <div className="card" style={{ padding: '1.5rem', borderColor: activeFeature.color + '30' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: activeFeature.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {activeFeature.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 2 }}>{activeFeature.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{activeFeature.desc}</p>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    {activeFeature.id === 'pitch' ? '🎯 Enter your presentation topic' : 'Describe your situation / project'}
                  </label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 120, fontSize: 14, lineHeight: 1.6 }}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={activeFeature.placeholder}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 3 }}>{input.length} chars</div>
                </div>

                {activeFeature.id === 'pitch' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                    💡 <strong>Just write the topic name</strong> — AI will automatically choose the best design, layout, and fill all content. Works for any field: medical, business, education, tech, law, etc.
                  </div>
                )}

                <div style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: '1rem', fontSize: 12, color: 'var(--purple)' }}>
                  <strong>Auto-included:</strong> {profile?.full_name} | {profile?.role} | {profile?.skills?.slice(0, 3).join(', ')} | {profile?.hackathons_count} hackathons
                </div>

                <button
                  className="btn btn-primary btn-block btn-lg"
                  onClick={run}
                  disabled={loading || !input.trim()}
                  style={{ gap: 8 }}
                >
                  {loading
                    ? <><span className="spin spin-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                        {activeFeature.id === 'pitch' ? 'AI is designing your PPT...' : 'Generating with AI...'}</>
                    : <>{activeFeature.icon} Generate {activeFeature.title} →</>
                  }
                </button>
              </div>

              {/* Output panel */}
              {output && (
                <div className="card fade-up" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
                      {activeFeature.id === 'pitch' ? '📊 Presentation Ready' : '✨ AI Output'}
                    </p>
                    <div style={{ display: 'flex', gap: 7 }}>
                      {activeFeature.id !== 'pitch' && (
                        <button className="btn btn-secondary btn-sm" onClick={copyOutput}>
                          {copied ? '✓ Copied!' : '📋 Copy All'}
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => { setOutput(''); setParsedPPT(null) }}>Clear</button>
                    </div>
                  </div>

                  <div style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                    {/* PITCH: Show clean preview OR error message */}
                    {activeFeature.id === 'pitch' ? (
                      parsedPPT ? (
                        <PPTPreview data={parsedPPT} />
                      ) : (
                        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>⚠️ JSON parse failed — try Regenerate</p>
                          <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>AI response was incomplete. Click Regenerate below.</p>
                        </div>
                      )
                    ) : (
                      /* OTHER FEATURES: Show markdown */
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }} />
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setOutput(''); setParsedPPT(null); run() }}>
                      🔄 Regenerate
                    </button>
                    {activeFeature.id !== 'pitch' && (
                      <button className="btn btn-purple-soft btn-sm" style={{ flex: 1 }} onClick={() => navigate('/ai-chat')}>
                        💬 Ask follow-up →
                      </button>
                    )}
                  </div>

                  {/* PPT Download — only for pitch */}
                  {activeFeature.id === 'pitch' && parsedPPT && (
                    <DownloadPPTButton
                      aiOutput={output}
                      projectName={parsedPPT?.title || input.slice(0, 40) || 'Presentation'}
                    />
                  )}

                  {/* Show error if pitch but no valid JSON */}
                  {activeFeature.id === 'pitch' && !parsedPPT && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#991b1b' }}>
                      ⚠️ Could not parse AI response. Click Regenerate to try again.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom links */}
        {!activeFeature && (
          <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.75rem', background: 'linear-gradient(135deg,#faf5ff,white)', borderRadius: 'var(--r-xl)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Need quick help? Use the floating AI chat →</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1rem' }}>Click the ✨ button at bottom-right of any page</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/ai-chat')}>Open AI Chat →</button>
          </div>
        )}
      </div>
    </div>
  )
}