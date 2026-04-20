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
    id: 'pitch', icon: '🎤', title: 'Pitch Generator', badge: 'Judge Favorite',
    desc: 'Topic batao — AI ek professional PPT banayega with perfect layout, deep content, and right theme.',
    how: 'Input: topic → AI generates JSON → Download as professional PowerPoint',
    color: '#e11d48',
    placeholder: 'Create a presentation on Diabetes: Causes, Symptoms and Prevention',
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
    `• ${u.full_name} | ${u.role} | Skills: ${u.skills?.join(', ')} | ${u.hackathons_count} hackathons | ${u.wins_count} wins`
  ).join('\n')

  const base = `USER PROFILE:
- Name: ${profile?.full_name} | Role: ${profile?.role}
- Skills: ${profile?.skills?.join(', ')}
- Hackathons: ${profile?.hackathons_count} | Wins: ${profile?.wins_count}
- College: ${profile?.college}

`

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

    'pitch': base + `You are a world-class presentation designer with expertise in all fields.

TOPIC: As given by the user in their message.

YOUR TASK: Create a complete professional PowerPoint presentation as JSON.

STEP 1 - DETECT FIELD:
Look at the topic and choose one: education, business, medical, technology, finance, environment, law, psychology, arts, science

STEP 2 - DETECT PRESENTATION TYPE:
- Hackathon or startup project: pitch deck with Problem, Solution, Tech, Impact, Team
- Educational concept or subject: educational with Introduction, concepts, examples, benefits
- X vs Y comparison: comparison with define each, differences, advantages, conclusion
- Medical or health topic: medical with definition, causes, symptoms, treatment, prevention
- Business topic: business with overview, market, strategy, financials, conclusion
- General informational: overview, subtopics, data, case study, conclusion

STEP 3 - CHOOSE BEST LAYOUTS for each slide:
- "title" for opening title slide
- "bullets" for heading with 4-6 detailed numbered points
- "two_column" for two sections side by side
- "three_cards" for three cards with emoji, title, 3 points each
- "big_stat" for 3 large numbers or stats with supporting bullets
- "comparison" for left vs right with verdict
- "timeline" for 3-4 numbered steps with descriptions
- "quote_focus" for powerful quote with explanation
- "checklist" for dos and donts
- "case_study" for real example with situation, action, result, lesson
- "closing" for thank you with key takeaways

CONTENT RULES - VERY IMPORTANT:
- Minimum 12 words per bullet point, be specific and detailed
- Use REAL statistics, REAL examples, REAL company or person names
- No generic filler, every sentence must add value
- Make it feel written by a domain expert
- 8 to 12 slides total based on topic complexity
- Never use double quotes inside string values, use single quotes instead

CRITICAL JSON SAFETY RULES:
- Never put double quote characters inside any string value
- Use only simple ASCII characters in all text
- No em dashes, no curly quotes, no special unicode symbols in text
- Write numbers and percentages plainly like 73% or 2.3 million
- Keep all strings simple and clean

Return ONLY this exact JSON structure, nothing else, no text before or after, no markdown:
{
  "title": "Presentation title here",
  "theme": "medical",
  "slides": [
    {
      "layout": "title",
      "heading": "Main title",
      "subheading": "Subtitle here",
      "bullets": ["Point one with full detail", "Point two with full detail", "Point three with full detail"]
    },
    {
      "layout": "bullets",
      "heading": "Slide heading",
      "subheading": "Context line",
      "bullets": ["Detailed point 1", "Detailed point 2", "Detailed point 3", "Detailed point 4"]
    },
    {
      "layout": "big_stat",
      "heading": "Key Numbers",
      "stats": [
        { "number": "463M", "label": "People with diabetes worldwide", "context": "IDF Diabetes Atlas 2021" },
        { "number": "77M", "label": "Diabetics in India alone", "context": "Second highest in the world" },
        { "number": "50%", "label": "Cases go undiagnosed", "context": "WHO Global Report 2022" }
      ],
      "bullets": ["Supporting point one", "Supporting point two", "Supporting point three"]
    },
    {
      "layout": "timeline",
      "heading": "Step by step process",
      "steps": [
        { "number": "01", "title": "Step one title", "description": "Detailed description of step one and why it matters for the topic" },
        { "number": "02", "title": "Step two title", "description": "Detailed description of step two and why it matters for the topic" },
        { "number": "03", "title": "Step three title", "description": "Detailed description of step three and why it matters for the topic" },
        { "number": "04", "title": "Step four title", "description": "Detailed description of step four and why it matters for the topic" }
      ]
    },
    {
      "layout": "two_column",
      "heading": "Comparison heading",
      "left_heading": "Left column title",
      "left_bullets": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "right_heading": "Right column title",
      "right_bullets": ["Point 1", "Point 2", "Point 3", "Point 4"]
    },
    {
      "layout": "three_cards",
      "heading": "Cards heading",
      "cards": [
        { "title": "Card one title", "emoji": "🩺", "points": ["Point 1 with detail", "Point 2 with detail", "Point 3 with detail"] },
        { "title": "Card two title", "emoji": "💊", "points": ["Point 1 with detail", "Point 2 with detail", "Point 3 with detail"] },
        { "title": "Card three title", "emoji": "🏃", "points": ["Point 1 with detail", "Point 2 with detail", "Point 3 with detail"] }
      ]
    },
    {
      "layout": "checklist",
      "heading": "Best practices heading",
      "left_heading": "Do This",
      "left_items": ["Action 1 with explanation", "Action 2 with explanation", "Action 3 with explanation", "Action 4 with explanation"],
      "right_heading": "Avoid This",
      "right_items": ["Mistake 1 and why it is bad", "Mistake 2 and consequences", "Mistake 3 with better alternative", "Mistake 4 and its impact"]
    },
    {
      "layout": "comparison",
      "heading": "X vs Y",
      "left_heading": "Option A",
      "left_bullets": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "right_heading": "Option B",
      "right_bullets": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "verdict": "Clear conclusion about which is better and when to use each"
    },
    {
      "layout": "quote_focus",
      "heading": "Key insight",
      "quote": "A powerful memorable statement directly related to this topic",
      "author": "Name, Title, Organization",
      "explanation": "2 to 3 sentence explanation of why this matters and what it teaches about the topic"
    },
    {
      "layout": "case_study",
      "heading": "Real World Example",
      "case_name": "Specific company person or event name",
      "situation": "2 to 3 sentence description of the problem or challenge they faced",
      "action": "Specific steps taken and strategies applied to address the situation",
      "result": "Measurable outcomes with real numbers percentages revenue users time saved",
      "lesson": "Key insight this case study teaches and how it applies to the topic"
    },
    {
      "layout": "closing",
      "heading": "Thank You",
      "subheading": "Memorable closing tagline",
      "key_takeaways": [
        "Most important insight from this entire presentation",
        "Second most critical point the audience should remember",
        "Clear next step or call to action for the audience"
      ]
    }
  ]
}`,

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

// Check if a string is valid JSON for PPT
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

  async function run() {
    if (!input.trim() || !activeFeature || loading) return
    setLoading(true)
    setOutput('')

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
        max_tokens: 3000,
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
    // If it's JSON for pitch, show a clean preview instead of raw JSON
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
            <p style="font-size:13px;font-weight:700;color:#14532d;margin-bottom:4px">✅ PPT Ready — ${slides.length} slides generated</p>
            <p style="font-size:12px;color:#166534">Theme: ${data.theme || 'default'} &nbsp;|&nbsp; Title: ${data.title || 'Presentation'}</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${slides.map((s, i) => `
              <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;display:flex;align-items:center;gap:10px">
                <div style="width:24px;height:24px;border-radius:50%;background:#7c3aed;color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</div>
                <div>
                  <p style="font-size:12px;font-weight:600;color:#1e293b;margin:0">${s.heading || 'Slide ' + (i + 1)}</p>
                  <p style="font-size:10px;color:#64748b;margin:0;text-transform:uppercase;letter-spacing:0.5px">${s.layout}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <p style="font-size:11px;color:#94a3b8;margin-top:10px;text-align:center">Click Download below to get your PowerPoint file</p>
        `
      } catch {
        // JSON parse failed, show raw
      }
    }

    // Normal markdown rendering for non-pitch features
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
                onClick={() => { setActiveFeature(f); setInput(f.placeholder); setOutput('') }}
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
              onClick={() => { setActiveFeature(null); setInput(''); setOutput('') }}>
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
                    {activeFeature.id === 'pitch' ? 'What is your presentation topic?' : 'Describe your situation / project'}
                  </label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 130, fontSize: 14, lineHeight: 1.6 }}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={activeFeature.placeholder}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 3 }}>{input.length} chars</div>
                </div>

                {/* Profile auto-context */}
                <div style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 'var(--r-sm)', padding: '8px 12px', marginBottom: '1rem', fontSize: 12, color: 'var(--purple)' }}>
                  <strong>Auto-included:</strong> {profile?.full_name} | {profile?.role} | {profile?.skills?.slice(0, 3).join(', ')} | {profile?.hackathons_count} hackathons
                </div>

                {activeFeature.id === 'pitch' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--r-sm)', padding: '8px 12px', marginBottom: '1rem', fontSize: 12, color: '#1e40af' }}>
                    💡 Tip: Just write your topic — AI will choose the best layout, theme, and content automatically
                  </div>
                )}

                <button
                  className="btn btn-primary btn-block btn-lg"
                  onClick={run}
                  disabled={loading || !input.trim()}
                  style={{ gap: 8 }}
                >
                  {loading
                    ? <><span className="spin spin-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> {activeFeature.id === 'pitch' ? 'Generating your PPT...' : 'Generating with AI...'}</>
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
                      <button className="btn btn-ghost btn-sm" onClick={() => setOutput('')}>Clear</button>
                    </div>
                  </div>

                  <div
                    style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}
                    dangerouslySetInnerHTML={{ __html: renderOutput(output) }}
                  />

                  {!isJsonOutput(output) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setOutput(''); run() }}>
                        🔄 Regenerate
                      </button>
                      <button className="btn btn-purple-soft btn-sm" style={{ flex: 1 }} onClick={() => navigate('/ai-chat')}>
                        💬 Ask follow-up in Chat →
                      </button>
                    </div>
                  )}

                  {isJsonOutput(output) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setOutput(''); run() }}>
                        🔄 Regenerate
                      </button>
                    </div>
                  )}

                  {/* PPT Download button - only for pitch feature */}
                  {activeFeature?.id === 'pitch' && (
                    <DownloadPPTButton
                      aiOutput={output}
                      projectName={input.split('"')[1] || input.slice(0, 40) || 'Presentation'}
                    />
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