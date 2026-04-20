import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/StudentCard'
import toast from 'react-hot-toast'

const ROLES = ['Frontend','Backend','Full Stack','ML/AI','UI/UX','Android','iOS','DevOps','Data Analyst']
const YEARS = ['1st year','2nd year','3rd year','4th year','Postgrad']
const AV_COLORS = ['purple','blue','green','rose','amber','teal']
const AV_HEX = { purple:'#7c3aed',blue:'#2563eb',green:'#16a34a',rose:'#e11d48',amber:'#d97706',teal:'#0d9488' }

export default function EditProfile() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const [form, setForm] = useState(null)
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'checking' | 'ok' | 'taken'

  useEffect(() => {
    if (profile) {
      setForm({ ...profile })
      setPhotoPreview(profile.avatar_url || null)
    }
  }, [profile])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function checkUsername(raw) {
    const val = raw.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30)
    set('username', val)
    if (val.length < 3 || val === profile?.username) { setUsernameStatus(null); return }
    setUsernameStatus('checking')
    const { data } = await supabase.from('profiles').select('id').eq('username', val).neq('id', profile.id).maybeSingle()
    setUsernameStatus(data ? 'taken' : 'ok')
  }

  function addSkill(e) {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const val = skillInput.trim().replace(',', '')
    if (val && !form.skills.includes(val)) set('skills', [...form.skills, val])
    setSkillInput('')
  }

  async function save(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Name required'); return }
    if (usernameStatus === 'taken') { toast.error('Username taken'); return }
    setLoading(true)

    let avatar_url = form.avatar_url

    // Upload photo if selected
    if (photoFile) {
      try {
        const ext = photoFile.name.split('.').pop().toLowerCase() || 'jpg'
        const path = `${profile.id}/avatar.${ext}`
        
        const { data: upData, error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, {
            upsert: true,
            contentType: photoFile.type || 'image/jpeg',
          })

        if (upErr) {
          console.error('Upload error:', upErr)
          toast.error('Photo upload failed — check Supabase storage settings')
        } else {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          avatar_url = `${urlData.publicUrl}?v=${Date.now()}`
          toast.success('Photo uploaded!')
        }
      } catch (err) {
        console.error('Photo error:', err)
        toast.error('Photo upload failed')
      }
    }

    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name.trim(),
      username: form.username?.trim() || null,
      college: form.college?.trim() || '',
      year: form.year,
      gender: form.gender,
      role: form.role,
      skills: form.skills || [],
      hackathons_count: Number(form.hackathons_count) || 0,
      wins_count: Number(form.wins_count) || 0,
      achievements: form.achievements?.trim() || '',
      github_url: form.github_url?.trim() || '',
      linkedin_url: form.linkedin_url?.trim() || '',
      preferred_team_size: Number(form.preferred_team_size) || 4,
      is_open: Boolean(form.is_open),
      looking_for: form.looking_for?.trim() || '',
      avatar_color: form.avatar_color || 'purple',
      avatar_url,
    }).eq('id', profile.id)

    setLoading(false)

    if (error) {
      console.error('Save error:', error)
      toast.error('Save failed: ' + error.message)
      return
    }

    await refreshProfile()
    toast.success('Profile saved! ✓')
    navigate(`/profile/${profile.id}`)
  }

  if (!form) return <div className="page-loader"><div className="spin spin-lg" /></div>

  const S = ({ title }) => (
    <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
      <p className="form-label">{title}</p>
    </div>
  )

  const usernameIcon = usernameStatus === 'checking' ? <span className="spin spin-sm" /> : usernameStatus === 'ok' ? '✅' : usernameStatus === 'taken' ? '❌' : null

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>←</button>
          <h1 style={{ fontSize: 'clamp(1.4rem,4vw,1.8rem)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Edit Profile</h1>
        </div>

        {/* Photo card */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {photoPreview
              ? <img src={photoPreview} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 0 0 2px rgba(124,58,237,0.3)' }} onError={() => setPhotoPreview(null)} />
              : <Avatar profile={form} size="av-88" />
            }
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--purple)', color: 'white', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
            >📷</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 3 }}>{form.full_name || 'Your Name'}</p>
            {form.username && <span className="username-chip">@{form.username}</span>}
            <p style={{ fontSize: 12, color: photoFile ? 'var(--green)' : 'var(--text-3)', marginTop: 5 }}>
              {photoFile ? '✓ New photo selected — save to apply' : 'Click 📷 to upload a photo (max 5MB)'}
            </p>
          </div>
        </div>

        <form onSubmit={save}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Avatar color */}
              <div style={{ gridColumn: '1/-1' }}>
                <p className="form-label" style={{ marginBottom: 10 }}>Avatar color</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {AV_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => set('avatar_color', c)} style={{ width: 34, height: 34, borderRadius: '50%', background: AV_HEX[c], border: 'none', cursor: 'pointer', outline: form.avatar_color === c ? '3px solid white' : 'none', boxShadow: form.avatar_color === c ? `0 0 0 4px ${AV_HEX[c]}50` : 'none', transition: 'var(--t)' }} />
                  ))}
                </div>
              </div>

              <S title="Basic Info" />

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} required placeholder="Priya Sharma" />
              </div>

              <div className="form-group">
                <label className="form-label">@Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', fontWeight: 800 }}>@</span>
                  <input
                    className="form-input"
                    style={{ paddingLeft: 26, borderColor: usernameStatus === 'taken' ? 'var(--red)' : usernameStatus === 'ok' ? 'var(--green)' : undefined }}
                    value={form.username || ''}
                    onChange={e => checkUsername(e.target.value)}
                    placeholder="priya_ml"
                    autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  />
                  {usernameIcon && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>{usernameIcon}</span>}
                </div>
                {usernameStatus === 'taken' && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>Username taken</p>}
                {usernameStatus === 'ok' && <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 3 }}>@{form.username} is available!</p>}
              </div>

              <div className="form-group">
                <label className="form-label">College *</label>
                <input className="form-input" value={form.college || ''} onChange={e => set('college', e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role || 'Full Stack'} onChange={e => set('role', e.target.value)}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Year</label>
                <select className="form-select" value={form.year || '2nd year'} onChange={e => set('year', e.target.value)}>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender || 'Prefer not to say'} onChange={e => set('gender', e.target.value)}>
                  {['Female','Male','Non-binary','Prefer not to say'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              <S title="Skills & Experience" />

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Skills (press Enter to add)</label>
                <input className="form-input" placeholder="React, Python, Figma..." value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} />
                {form.skills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {form.skills.map(s => (
                      <span key={s} className="tag tag-rm" onClick={() => set('skills', form.skills.filter(x => x !== s))}>
                        {s} <span style={{ color: 'var(--red)', fontSize: 14 }}>×</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Hackathons done</label>
                <input className="form-input" type="number" min="0" value={form.hackathons_count || 0} onChange={e => set('hackathons_count', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Wins / Top 3</label>
                <input className="form-input" type="number" min="0" value={form.wins_count || 0} onChange={e => set('wins_count', e.target.value)} />
              </div>

              <S title="Achievements & Links" />

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Achievements</label>
                <textarea className="form-textarea" value={form.achievements || ''} onChange={e => set('achievements', e.target.value)} placeholder="Won SIH 2024, published paper, built app with 1k+ users..." />
              </div>

              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" type="url" value={form.github_url || ''} onChange={e => set('github_url', e.target.value)} placeholder="https://github.com/..." />
              </div>

              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" type="url" value={form.linkedin_url || ''} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>

              <S title="Preferences" />

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Looking for</label>
                <input className="form-input" value={form.looking_for || ''} onChange={e => set('looking_for', e.target.value)} placeholder="ML engineer + UI designer..." />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred team size</label>
                <select className="form-select" value={form.preferred_team_size || 4} onChange={e => set('preferred_team_size', e.target.value)}>
                  {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} members</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <button type="button" onClick={() => set('is_open', !form.is_open)} style={{ width: 48, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', background: form.is_open ? 'var(--purple)' : '#d1d5db', position: 'relative', transition: 'var(--t)', boxShadow: form.is_open ? 'var(--shadow-purple)' : 'none' }}>
                    <span style={{ position: 'absolute', top: 3, left: form.is_open ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'var(--t)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{form.is_open ? '● Open to team up' : '○ Not looking'}</span>
                </div>
              </div>

              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <><span className="spin spin-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Saving...</> : 'Save Changes ✓'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
