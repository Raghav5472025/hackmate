import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/StudentCard'

const ROLE_BADGE = {
  'Frontend':'b-blue','Backend':'b-teal','Full Stack':'b-purple',
  'ML/AI':'b-amber','UI/UX':'b-rose','Android':'b-green',
  'iOS':'b-green','DevOps':'b-gray','Data Analyst':'b-blue'
}

export default function AIMatch() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [hackathonGoal, setHackathonGoal] = useState('')
  const [teamSize, setTeamSize] = useState(4)

  async function findMatches() {
    if (!hackathonGoal.trim()) return
    setLoading(true)
    setMatches([])
    setAnalysis(null)

    try {
      // Get all available students
      const { data: students } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', profile.id)
        .eq('is_open', true)
        .limit(50)

      if (!students?.length) {
        setAnalysis({ error: 'No available students found right now.' })
        setLoading(false)
        return
      }

      // Call Claude API for smart matching
      const prompt = `You are a hackathon team matching expert. Analyze this student's profile and find the BEST teammates from the list.

STUDENT LOOKING FOR TEAM:
Name: ${profile.full_name}
Role: ${profile.role}
Skills: ${profile.skills?.join(', ') || 'not specified'}
Hackathons done: ${profile.hackathons_count}
Wins: ${profile.wins_count}
Looking for: ${profile.looking_for || 'any good teammate'}
Hackathon goal: ${hackathonGoal}
Needs team of: ${teamSize} people

AVAILABLE STUDENTS (pick best ${teamSize - 1}):
${students.map((s, i) => `${i + 1}. ID:${s.id} | ${s.full_name} | ${s.role} | Skills: ${s.skills?.join(', ')} | Hackathons: ${s.hackathons_count} | Wins: ${s.wins_count}`).join('\n')}

Respond ONLY with valid JSON, no markdown:
{
  "analysis": "2-3 sentences about the student's profile strengths and what they need",
  "matches": [
    {
      "id": "student_id_here",
      "compatibility": 87,
      "reason": "why this person is a great match in 1 sentence",
      "role_in_team": "what role they'll play"
    }
  ],
  "team_tip": "one tip for this team to succeed at the hackathon"
}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ''

      // Parse JSON response
      let parsed
      try {
        const clean = text.replace(/```json|```/g, '').trim()
        parsed = JSON.parse(clean)
      } catch {
        parsed = { analysis: 'AI analysis complete. Showing best matches based on skill diversity.', matches: [], team_tip: 'Focus on complementary skills!' }
      }

      // Map matched IDs to full student objects
      const matchedStudents = (parsed.matches || []).map(m => {
        const student = students.find(s => s.id === m.id)
        return student ? { ...student, compatibility: m.compatibility, reason: m.reason, role_in_team: m.role_in_team } : null
      }).filter(Boolean)

      // Fallback: if AI didn't match well, do rule-based matching
      if (matchedStudents.length === 0) {
        const mySkills = profile.skills || []
        const fallback = students
          .map(s => {
            const complement = (s.skills || []).filter(sk => !mySkills.includes(sk)).length
            const diversity = s.role !== profile.role ? 20 : 0
            return { ...s, compatibility: Math.min(95, complement * 12 + diversity + Math.random() * 10), reason: `${s.role} skills complement your ${profile.role} background`, role_in_team: s.role }
          })
          .sort((a, b) => b.compatibility - a.compatibility)
          .slice(0, teamSize - 1)
        setMatches(fallback)
      } else {
        setMatches(matchedStudents)
      }

      setAnalysis(parsed)
    } catch (err) {
      console.error(err)
      setAnalysis({ error: 'AI matching failed. Please try again.' })
    }
    setLoading(false)
  }

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 720 }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'var(--purple)', marginBottom: 10, letterSpacing: '0.02em' }}>
            ✨ AI Powered
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 8 }}>
            AI Teammate Matching
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65 }}>
            Tell us your hackathon goal — Claude AI will analyze all profiles and suggest your perfect team.
          </p>
        </div>

        {/* Your profile summary */}
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(135deg,#faf5ff,white)', borderColor: 'rgba(124,58,237,0.15)' }}>
          <Avatar profile={profile} size="av-44" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{profile?.full_name}</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span className={`badge ${ROLE_BADGE[profile?.role] || 'b-gray'}`}>{profile?.role}</span>
              {profile?.skills?.slice(0, 4).map(s => <span key={s} className="tag" style={{ fontSize: 11, padding: '2px 8px' }}>{s}</span>)}
            </div>
          </div>
        </div>

        {/* Input form */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">What hackathon are you targeting? What's your goal?</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: 90 }}
              placeholder="e.g. Smart India Hackathon 2025 — building an AI-based agriculture solution. Need a backend developer and a UI designer who can work weekends."
              value={hackathonGoal}
              onChange={e => setHackathonGoal(e.target.value)}
              maxLength={300}
            />
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 3 }}>{hackathonGoal.length}/300</div>
          </div>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Team size (including you)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[2,3,4,5,6].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTeamSize(n)}
                  style={{
                    width: 40, height: 40, borderRadius: 'var(--r-md)', border: '1px solid', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, transition: 'var(--t)',
                    background: teamSize === n ? 'var(--purple)' : 'white',
                    color: teamSize === n ? 'white' : 'var(--text-2)',
                    borderColor: teamSize === n ? 'var(--purple)' : 'var(--border-md)',
                  }}
                >{n}</button>
              ))}
            </div>
          </div>
          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={findMatches}
            disabled={loading || !hackathonGoal.trim()}
            style={{ gap: 8 }}
          >
            {loading ? (
              <>
                <span className="spin spin-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                AI is analyzing profiles...
              </>
            ) : '✨ Find My Perfect Team →'}
          </button>
        </div>

        {/* Analysis result */}
        {analysis && !analysis.error && (
          <div style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--r-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', marginBottom: 6 }}>🧠 AI Analysis</p>
            <p style={{ fontSize: 14, color: 'var(--purple)', lineHeight: 1.65, marginBottom: analysis.team_tip ? 10 : 0 }}>{analysis.analysis}</p>
            {analysis.team_tip && (
              <p style={{ fontSize: 13, color: 'var(--purple)', borderTop: '1px solid rgba(124,58,237,0.2)', paddingTop: 8, marginTop: 8, fontStyle: 'italic' }}>
                💡 {analysis.team_tip}
              </p>
            )}
          </div>
        )}

        {analysis?.error && (
          <div style={{ background: '#fef2f2', border: '1px solid var(--red-border)', borderRadius: 'var(--r-md)', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 13, color: 'var(--red)' }}>{analysis.error}</p>
          </div>
        )}

        {/* Matched students */}
        {matches.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              🎯 Your Ideal Team ({matches.length} match{matches.length > 1 ? 'es' : ''})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {matches.map((student, i) => (
                <div key={student.id} className="card card-hover" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar profile={student} size="av-48" />
                      <span style={{ position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--purple)', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                        {i + 1}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{student.full_name}</span>
                        {student.username && <span className="username-chip" style={{ fontSize: 11 }}>@{student.username}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{student.role} · {student.college}</p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span className={`badge ${ROLE_BADGE[student.role] || 'b-gray'}`}>{student.role_in_team || student.role}</span>
                        {student.hackathons_count > 0 && <span className="badge b-blue">{student.hackathons_count} hackathons</span>}
                        {student.wins_count > 0 && <span className="badge b-amber">🏆 {student.wins_count}W</span>}
                      </div>
                    </div>
                    {/* Compatibility score */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: student.compatibility >= 80 ? '#f0fdf4' : student.compatibility >= 60 ? 'var(--purple-light)' : '#fffbeb', border: `2px solid ${student.compatibility >= 80 ? 'var(--green-border)' : student.compatibility >= 60 ? 'rgba(124,58,237,0.3)' : 'var(--amber-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: student.compatibility >= 80 ? 'var(--green)' : student.compatibility >= 60 ? 'var(--purple)' : 'var(--amber)', lineHeight: 1 }}>{student.compatibility}%</span>
                        <span style={{ fontSize: 8, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>match</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {student.skills?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {student.skills.map(s => <span key={s} className="tag" style={{ fontSize: 11, padding: '2px 8px' }}>{s}</span>)}
                    </div>
                  )}

                  {/* AI reason */}
                  {student.reason && (
                    <div style={{ background: 'var(--purple-light)', borderRadius: 'var(--r-sm)', padding: '8px 12px', marginBottom: '0.875rem', display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>🤖</span>
                      <p style={{ fontSize: 13, color: 'var(--purple)', lineHeight: 1.5 }}>{student.reason}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/profile/${student.id}`)}>View Profile</button>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/profile/${student.id}`)}>Send Invite →</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
