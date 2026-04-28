import DownloadPPTButton from '../components/PitchPPT'
import TemplatePicker from '../components/TemplatePicker'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callAI } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { SLIDE_COUNT_OPTIONS } from '../data/pptTemplates'

const SLIDE_COUNTS = [6, 8, 10, 12, 15]

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
    id: 'pitch', icon: '🎤', title: 'PPT Generator', badge: '220+ Designs',
    desc: 'Topic batao — AI professional PPT banayega. Design optional hai, direct bhi generate kar sakte ho.',
    how: 'Topic → Direct generate karo · ya design choose karo → Download .pptx',
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

function buildPitchPrompt(input, template, slideCount) {
  const layoutNames = template?.layouts || [
    'title', 'bullets', 'big_stat', 'two_column',
    'three_cards', 'timeline', 'checklist', 'closing'
  ]

  const layoutDefs = {
    title: '"title": heading, subheading, bullets (3 items)',
    bullets: '"bullets": heading, subheading, bullets (4-6 items min 15 words each)',
    big_stat: '"big_stat": heading, stats (3 items: number+label+context), bullets (3 items)',
    two_column: '"two_column": heading, left_heading, left_bullets, right_heading, right_bullets',
    three_cards: '"three_cards": heading, cards (3 items: title+emoji+points[3])',
    timeline: '"timeline": heading, steps (3-4 items: number+title+description)',
    comparison: '"comparison": heading, left_heading, left_bullets, right_heading, right_bullets, verdict',
    quote_focus: '"quote_focus": heading, quote, author, explanation',
    checklist: '"checklist": heading, left_heading, left_items(4), right_heading, right_items(4)',
    case_study: '"case_study": heading, case_name, situation, action, result, lesson',
    closing: '"closing": heading, subheading, key_takeaways (3 items)',
  }

  const available = layoutNames.map(l => layoutDefs[l] || `"${l}"`).join('\n')

  return `You are a world-class presentation designer. Create exactly ${slideCount} slides.

TOPIC: ${input}
DESIGN: ${template?.name || 'Professional'}
TOTAL SLIDES: ${slideCount}

USE ONLY THESE LAYOUTS (pick best fit for each slide):
${available}

RULES:
- Slide 1 must be "title", last slide must be "closing"
- Every bullet minimum 15 words, use real stats and examples
- No double quotes inside strings, no special unicode
- Mix layouts smartly based on content

Return ONLY valid JSON:
{
  "title": "Presentation Title",
  "theme": "${template?.category || 'general'}",
  "slides": [
    { "layout": "title", "heading": "...", "subheading": "...", "bullets": ["...","...","..."] },
    { "layout": "bullets", "heading": "...", "subheading": "...", "bullets": ["...","...","...","..."] },
    { "layout": "big_stat", "heading": "...", "stats": [{"number":"...","label":"...","context":"..."},{"number":"...","label":"...","context":"..."},{"number":"...","label":"...","context":"..."}], "bullets": ["...","...","..."] },
    { "layout": "three_cards", "heading": "...", "cards": [{"title":"...","emoji":"...","points":["...","...","..."]},{"title":"...","emoji":"...","points":["...","...","..."]},{"title":"...","emoji":"...","points":["...","...","..."]}] },
    { "layout": "timeline", "heading": "...", "steps": [{"number":"01","title":"...","description":"..."},{"number":"02","title":"...","description":"..."},{"number":"03","title":"...","description":"..."}] },
    { "layout": "closing", "heading": "Thank You", "subheading": "...", "key_takeaways": ["...","...","..."] }
  ]
}`
}

function buildHubPrompt(profile, users, featureId, input, selectedTemplate, slideCount) {
  const userList = users.slice(0, 15).map(u =>
    `• ${u.full_name} | ${u.role} | Skills: ${u.skills?.join(', ')} | ${u.hackathons_count} hackathons | ${u.wins_count} wins`
  ).join('\n')

  const base = `USER PROFILE:
- Name: ${profile?.full_name} | Role: ${profile?.role}
- Skills: ${profile?.skills?.join(', ')}
- Hackathons: ${profile?.hackathons_count} | Wins: ${profile?.wins_count}
- College: ${profile?.college}

`

  if (featureId === 'pitch') {
    return buildPitchPrompt(input, selectedTemplate, slideCount)
  }

  const prompts = {
    'team-builder': base + `You are a hackathon team builder expert.
Analyze the user's project idea and build the OPTIMAL team structure.

Output in this exact format:
## 🏗️ Optimal Team Structure
State the ideal team size and composition overview.

## 👤 Required Roles
For each role:
**[Role Name]** — [What they'll do]
- Required skills: [list]
- Why essential: [1 line reason]
- Experience needed: [beginner/intermediate/expert]

## ✅ Team from HackMate Platform
${userList}

Pick the 3-4 BEST matches from above and explain why each one is perfect for this project.

## 🎯 Team Compatibility Score
Give a score 0-100 and brief explanation.

## 💡 Pro Tips
3 specific tips for this team to succeed.`,

    'teammate-match': base + `You are a teammate matching AI with access to REAL platform users.

AVAILABLE STUDENTS ON HACKMATE:
${userList}

Analyze who would be the BEST teammates for this user based on their project description.

Output:
## 🎯 Top 5 Teammate Matches

For each match:
**[Rank]. [Name]** — [Role]
- Compatibility: [X]%
- Why perfect: [specific reason related to their query]
- Their key skills: [relevant ones]
- ⭐ Special strength: [what makes them stand out]

## 🤝 Dream Team
If picking just 2-3 of these people, who would make the strongest team and why?`,

    'strategy': base + `You are a hackathon strategy expert. Create a COMPLETE, actionable execution plan.

Output EXACTLY in this format:
## 🎯 Project MVP (Must-Have Only)
List 4-5 core features. No nice-to-haves.

## 👥 Task Division
For each team member: their specific responsibilities (2-3 tasks each)

## ⏰ Hour-by-Hour Timeline
**Hours 0-4:** [What to do]
**Hours 4-8:** [What to do]
**Hours 8-16:** [What to do]
**Hours 16-24:** [What to do]
(continue to 36/48 if needed)

## 🛠️ Recommended Tech Stack
Frontend: [specific tools]
Backend: [specific tools]
Database: [specific tools]
AI/ML: [if applicable]
Deployment: [where to host]

## ⚠️ Top 3 Risks + How to Avoid
List the most common failure points with solutions.

## 🏆 Judging Criteria to Hit
What judges typically look for and how to nail each point.`,

    'evaluator': base + `You are a team compatibility evaluator for hackathons. Be direct and specific.

Output:
## 📊 Overall Compatibility Score: [X]/100

## ✅ Team Strengths (Top 3-4)
Specific strengths based on the skills mentioned.

## ❌ Critical Skill Gaps
What's missing, how serious each gap is (High/Medium/Low impact).

## 📈 Success Probability: [X]%
Explain what factors lead to this prediction.

## 🛠️ Recommended Fixes
For each gap: specific person who should learn it, or who to add to the team.

## 💡 Top 3 Recommendations
Concrete things this team should do before/during the hackathon.`,

    'realtime': base + `You are a hackathon crisis manager. The user is in the middle of a hackathon and needs IMMEDIATE help.

BE SHORT. BE DIRECT. NO FLUFF.

Output:
## ⚡ DO THESE RIGHT NOW (Next 3 Actions)
1. [Specific action] — [Time: X minutes]
2. [Specific action] — [Time: X minutes]
3. [Specific action] — [Time: X minutes]

## 🚨 Biggest Risk
One line: what could kill your chances if ignored.

## ✅ DO THIS NEXT (After above)
Next 3 actions once first batch is done.

## ❌ SKIP THESE (Waste of time right now)
List 2-3 things that seem important but aren't right now.

## 💪 Quick Win
One thing you can do in 15 minutes that will impress judges.`,
  }

  return prompts[featureId] || prompts['strategy']
}

function isJsonOutput(text) {
  if (!text || typeof text !== 'string') return false
  const trimmed = text.trim()
  return trimmed.startsWith('{') && trimmed.includes('"slides"')
}

export default function AIHub() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [activeFeature, setActiveFeature] = useState(null)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [slideCount, setSlideCount] = useState(8)

  async function run() {
    if (!input.trim() || !activeFeature || loading) return

    // ── FIX 1: Template NOT required anymore — direct generate karo ──
    // Removed: if (activeFeature.id === 'pitch' && !selectedTemplate) { ... }

    setLoading(true)
    setOutput('')

    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id,full_name,role,skills,hackathons_count,wins_count,college,is_open')
        .neq('id', profile?.id || '')
        .eq('is_open', true)
        .limit(20)

      const systemPrompt = buildHubPrompt(profile, users || [], activeFeature.id, input, selectedTemplate, slideCount)

      const reply = await callAI({
        system: systemPrompt,
        messages: [{ role: 'user', content: input }],
        max_tokens: 6000,
      })

      setOutput(reply)
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

  function renderOutput(text) {
    if (isJsonOutput(text)) {
      try {
        let clean = text.trim()
        const start = clean.indexOf('{')
        const end = clean.lastIndexOf('}')
        if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1)
        clean = clean.replace(/,\s*([}\]])/g, '$1')
        const data = JSON.parse(clean)
        const slides = data.slides || []
        return `
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:12px">
            <p style="font-size:13px;font-weight:700;color:#14532d;margin:0 0 4px">✅ PPT Ready — ${slides.length} slides generated</p>
            <p style="font-size:12px;color:#166534;margin:0">Theme: ${data.theme || 'default'} | Title: ${data.title || 'Presentation'}</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${slides.map((s, i) => `
              <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;display:flex;align-items:center;gap:10px">
                <div style="width:22px;height:22px;border-radius:50%;background:#7c3aed;color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</div>
                <div>
                  <p style="font-size:12px;font-weight:600;color:#1e293b;margin:0">${s.heading || 'Slide ' + (i + 1)}</p>
                  <p style="font-size:10px;color:#64748b;margin:0;text-transform:uppercase;letter-spacing:0.5px">${s.layout}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <p style="font-size:11px;color:#94a3b8;margin-top:10px;text-align:center">Click Download below to get your PowerPoint file</p>
        `
      } catch (e) {}
    }

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

  return (
    <div className="page-body">
      {showTemplatePicker && (
        <TemplatePicker
          selected={selectedTemplate}
          onSelect={(template) => { setSelectedTemplate(template); setShowTemplatePicker(false) }}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      <div className="container" style={{ maxWidth: 1100 }}>

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

        {!activeFeature && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 14 }}>
            {FEATURES.map(f => (
              <button key={f.id}
                onClick={() => { setActiveFeature(f); setInput(f.placeholder); setOutput(''); setSelectedTemplate(null) }}
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

        {activeFeature && (
          <div className="fade-up">
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.25rem', gap: 6 }}
              onClick={() => { setActiveFeature(null); setInput(''); setOutput(''); setSelectedTemplate(null) }}>
              ← Back to AI Hub
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: output ? '1fr 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>

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
                    {activeFeature.id === 'pitch' ? 'Enter your presentation topic' : 'Describe your situation / project'}
                  </label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 100, fontSize: 14, lineHeight: 1.6 }}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={activeFeature.placeholder}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 3 }}>{input.length} chars</div>
                </div>

                {/* PPT options — template OPTIONAL */}
                {activeFeature.id === 'pitch' && (
                  <>
                    {/* ── FIX 2: Template optional — dashed border toggle ── */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Design template
                        <span style={{ fontSize: 10, background: 'var(--bg-2)', color: 'var(--text-3)', padding: '1px 7px', borderRadius: 99, fontWeight: 400 }}>optional</span>
                      </label>
                      <button
                        onClick={() => setShowTemplatePicker(true)}
                        style={{
                          width: '100%', padding: '10px 14px',
                          border: selectedTemplate ? `2px solid #${selectedTemplate.accent}` : '1.5px dashed var(--border)',
                          borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                          background: selectedTemplate ? `#${selectedTemplate.bg}` : 'transparent',
                          display: 'flex', alignItems: 'center', gap: 10,
                          transition: 'all 0.2s',
                        }}
                      >
                        {selectedTemplate ? (
                          <>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[selectedTemplate.bg, selectedTemplate.accent, selectedTemplate.dark].map((c, i) => (
                                <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: `#${c}`, border: '1px solid rgba(255,255,255,0.2)' }} />
                              ))}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>{selectedTemplate.name}</p>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{selectedTemplate.desc}</p>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Change →</span>
                          </>
                        ) : (
                          <>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                              🎨
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>Browse 220+ designs (optional)</p>
                              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Skip to auto-generate with default style</p>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: 18, color: 'var(--text-3)' }}>→</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Slide count */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Number of slides</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {SLIDE_COUNTS.map(n => (
                          <button key={n} onClick={() => setSlideCount(n)} style={{
                            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', border: '1.5px solid',
                            background: slideCount === n ? 'var(--purple)' : 'transparent',
                            color: slideCount === n ? 'white' : 'var(--text-2)',
                            borderColor: slideCount === n ? 'var(--purple)' : 'var(--border)',
                            transition: 'all 0.15s',
                          }}>{n}</button>
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                        {slideCount} slides — AI will pick best layouts for your topic
                      </p>
                    </div>
                  </>
                )}

                <div style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 'var(--r-sm)', padding: '8px 12px', marginBottom: '1rem', fontSize: 12, color: 'var(--purple)' }}>
                  <strong>Auto-included:</strong> {profile?.full_name} | {profile?.role} | {profile?.skills?.slice(0, 3).join(', ')} | {profile?.hackathons_count} hackathons
                </div>

                {/* ── FIX 3: Button always shows Generate — no "Choose Design First" ── */}
                <button
                  className="btn btn-primary btn-block btn-lg"
                  onClick={run}
                  disabled={loading || !input.trim()}
                  style={{ gap: 8 }}
                >
                  {loading
                    ? <><span className="spin spin-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                        {activeFeature.id === 'pitch' ? `Generating ${slideCount} slides...` : 'Generating with AI...'}
                      </>
                    : <>{activeFeature.icon} Generate {activeFeature.title} →</>
                  }
                </button>
                {/* ── FIX 3: "You need to choose template" warning HATAYA ── */}
              </div>

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
                      <button className="btn btn-ghost btn-sm" onClick={() => setOutput('')}>Clear</button>
                    </div>
                  </div>

                  <div
                    style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}
                    dangerouslySetInnerHTML={{ __html: renderOutput(output) }}
                  />

                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setOutput(''); run() }}>
                      🔄 Regenerate
                    </button>
                    {activeFeature.id !== 'pitch' && (
                      <button className="btn btn-purple-soft btn-sm" style={{ flex: 1 }} onClick={() => navigate('/ai-chat')}>
                        💬 Ask follow-up in Chat →
                      </button>
                    )}
                  </div>

                  {activeFeature?.id === 'pitch' && (
                    <DownloadPPTButton
                      aiOutput={output}
                      projectName={input.slice(0, 50)}
                      template={selectedTemplate}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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