import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const ROLES = ['Frontend Developer','Backend Developer','Full Stack Developer','ML/AI Engineer','UI/UX Designer','Android Developer','iOS Developer','DevOps Engineer','Data Analyst']
const YEARS = ['1st year','2nd year','3rd year','4th year','Postgrad']
const GENDERS = ['Female','Male','Non-binary','Prefer not to say']
const AV_COLORS = ['purple','blue','green','rose','amber','teal']
const AV_HEX = { purple:'#7c3aed',blue:'#2563eb',green:'#16a34a',rose:'#e11d48',amber:'#d97706',teal:'#0d9488' }
const STEPS = ['Basic Info','Username & Photo','Skills','Preferences']

export default function SetupProfile() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvail, setUsernameAvail] = useState(null)
  const [form, setForm] = useState({
    full_name:'',username:'',college:'',year:'2nd year',gender:'Female',
    role:'Full Stack Developer',skills:[],hackathons_count:0,wins_count:0,
    achievements:'',github_url:'',linkedin_url:'',
    preferred_team_size:4,is_open:true,looking_for:'',avatar_color:'purple',
  })
  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  function addSkill(e) {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const val = skillInput.trim().replace(',','')
    if (val && !form.skills.includes(val)) set('skills',[...form.skills,val])
    setSkillInput('')
  }

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function checkUsername(val) {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g,'')
    set('username', clean)
    if (clean.length < 3) { setUsernameAvail(null); return }
    setUsernameChecking(true)
    const { data } = await supabase.from('profiles').select('id').eq('username', clean).neq('id', user.id)
    setUsernameChecking(false)
    setUsernameAvail(!data?.length)
  }

  async function submit() {
    if (!user) return
    if (!form.full_name.trim()) { toast.error('Enter your full name'); return }
    if (!form.username || form.username.length < 3) { toast.error('Username must be at least 3 characters'); return }
    if (usernameAvail === false) { toast.error('Username already taken'); return }
    if (form.skills.length === 0) { toast.error('Add at least one skill'); return }
    setLoading(true)

    let avatar_url = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert: true })
      if (!uploadErr) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = data.publicUrl + '?t=' + Date.now()
      }
    }

    const role = form.role.replace(/ Developer| Engineer| Designer| Analyst/,'')
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...form, role, avatar_url })
    setLoading(false)
    if (error) { toast.error('Save failed: ' + error.message); return }
    await refreshProfile()
    toast.success('Profile created! Welcome to HackMate 🎉')
    navigate('/dashboard')
  }

  const canNext = () => {
    if (step === 0) return form.full_name.trim() && form.college.trim()
    if (step === 1) return form.username.length >= 3 && usernameAvail !== false
    if (step === 2) return form.skills.length > 0
    return true
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4, letterSpacing: '-0.03em' }}>
            Hack<span style={{ color: 'var(--purple)' }}>Mate</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Step {step+1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Progress */}
        <div style={{ height: 4, background: 'var(--border-md)', borderRadius: 99, marginBottom: '1.75rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--purple)', borderRadius: 99, width: `${((step+1)/STEPS.length)*100}%`, transition: 'width 0.35s var(--ease)' }} />
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>

          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p className="form-label" style={{ marginBottom: 10 }}>Avatar color</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {AV_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => set('avatar_color',c)} style={{ width: 36, height: 36, borderRadius: '50%', background: AV_HEX[c], border: 'none', cursor: 'pointer', outline: form.avatar_color===c ? '3px solid white' : 'none', boxShadow: form.avatar_color===c ? `0 0 0 5px ${AV_HEX[c]}40` : 'none', transition: 'var(--t)' }} />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Priya Sharma" value={form.full_name} onChange={e => set('full_name',e.target.value)} autoComplete="name" />
              </div>
              <div className="form-group">
                <label className="form-label">College / University *</label>
                <input className="form-input" placeholder="IIT Delhi, NIT Trichy..." value={form.college} onChange={e => set('college',e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select className="form-select" value={form.year} onChange={e => set('year',e.target.value)}>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => set('gender',e.target.value)}>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Primary Role</label>
                <select className="form-select" value={form.role} onChange={e => set('role',e.target.value)}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 1 — Username & Photo */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Photo upload */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 0 0 2px var(--border-purple)' }} />
                    : <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--purple)', border: '3px solid white', boxShadow: '0 0 0 2px var(--border-purple)' }}>
                        {form.full_name ? form.full_name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?'}
                      </div>
                  }
                  <label style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white', fontSize: 12 }}>
                    📷
                    <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  </label>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Tap the camera icon to upload (max 5MB)</p>
              </div>

              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username * (unique, like @priya_ml)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontWeight: 700, fontSize: 15 }}>@</span>
                  <input className="form-input" style={{ paddingLeft: 28, borderColor: usernameAvail === false ? 'var(--red)' : usernameAvail === true ? 'var(--green)' : undefined }}
                    placeholder="priya_ml" value={form.username}
                    onChange={e => checkUsername(e.target.value)}
                    autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>
                    {usernameChecking ? <span className="spin spin-sm" /> : usernameAvail === true ? '✅' : usernameAvail === false ? '❌' : ''}
                  </span>
                </div>
                {usernameAvail === false && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>This username is taken. Try another.</p>}
                {usernameAvail === true && <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>@{form.username} is available! ✓</p>}
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Only letters, numbers, dots and underscores. This is what friends will search for.</p>
              </div>
            </div>
          )}

          {/* Step 2 — Skills */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Skills * (Enter or comma to add)</label>
                <input className="form-input" placeholder="React, Python, Figma..." value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} />
                {form.skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {form.skills.map(s => (
                      <span key={s} className="tag tag-rm" onClick={() => set('skills',form.skills.filter(x=>x!==s))}>
                        {s} <span style={{ color: 'var(--red)', fontSize: 14 }}>×</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Hackathons done</label>
                  <input className="form-input" type="number" min="0" max="50" value={form.hackathons_count} onChange={e => set('hackathons_count',parseInt(e.target.value)||0)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Wins / Top 3</label>
                  <input className="form-input" type="number" min="0" max="50" value={form.wins_count} onChange={e => set('wins_count',parseInt(e.target.value)||0)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Achievements (optional)</label>
                <textarea className="form-textarea" style={{ minHeight: 80 }} placeholder="Won Smart India Hackathon 2024, IEEE paper published..." value={form.achievements} onChange={e => set('achievements',e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">GitHub</label>
                  <input className="form-input" type="url" placeholder="https://github.com/..." value={form.github_url} onChange={e => set('github_url',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">LinkedIn</label>
                  <input className="form-input" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={e => set('linkedin_url',e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Preferences */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Looking for</label>
                <input className="form-input" placeholder="ML engineer + UI designer who's passionate..." value={form.looking_for} onChange={e => set('looking_for',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred team size</label>
                <select className="form-select" value={form.preferred_team_size} onChange={e => set('preferred_team_size',parseInt(e.target.value))}>
                  {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} members</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>Open to team up</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Others can send you invites</p>
                </div>
                <button type="button" onClick={() => set('is_open',!form.is_open)} style={{ width: 48, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', background: form.is_open ? 'var(--purple)' : '#d1d5db', position: 'relative', transition: 'var(--t)', flexShrink: 0, boxShadow: form.is_open ? 'var(--shadow-purple)' : 'none' }}>
                  <span style={{ position: 'absolute', top: 3, left: form.is_open ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'var(--t)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
            {step > 0 && <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(s=>s-1)}>← Back</button>}
            {step < STEPS.length-1
              ? <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(s=>s+1)} disabled={!canNext()}>Next →</button>
              : <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                  {loading ? <span className="spin spin-sm" /> : 'Create Profile 🎉'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
