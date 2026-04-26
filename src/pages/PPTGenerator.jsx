import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const THEMES = [
  { id: 'purple', label: 'Royal', primary: '#7c3aed', bg: '#faf5ff' },
  { id: 'blue',   label: 'Ocean', primary: '#1d4ed8', bg: '#eff6ff' },
  { id: 'dark',   label: 'Noir',  primary: '#6d28d9', bg: '#1f2937' },
  { id: 'green',  label: 'Forest',primary: '#059669', bg: '#f0fdf4' },
  { id: 'orange', label: 'Fire',  primary: '#ea580c', bg: '#fff7ed' },
]

const LAYOUTS = [
  { id: 'pitch',   icon: '🎤', label: 'Hackathon Pitch',  desc: '8 slides — Problem → Solution → Impact' },
  { id: 'product', icon: '📱', label: 'Product Demo',      desc: '7 slides — Features, tech, demo flow' },
  { id: 'research',icon: '🔬', label: 'Research Project',  desc: '6 slides — Background, method, results' },
  { id: 'custom',  icon: '✏️', label: 'Custom',            desc: 'Describe exactly what you want' },
]

export default function PPTGenerator() {
  const { profile } = useAuth()
  const [step, setStep] = useState(1)  // 1=input, 2=generating, 3=preview, 4=done
  const [topic, setTopic] = useState('')
  const [layout, setLayout] = useState('pitch')
  const [theme, setTheme] = useState('purple')
  const [customDesc, setCustomDesc] = useState('')
  const [slides, setSlides] = useState([])
  const [editingSlide, setEditingSlide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const selectedTheme = THEMES.find(t => t.id === theme)

  const PYTHON_API = import.meta.env.VITE_PPT_API || 'https://ppt-server-osau.onrender.com'

  // ── Step 1 → 2: Generate slides with AI ──────────────────
  async function handleGenerate() {
    if (!topic.trim()) { setError('Please enter your project topic'); return }
    setError('')
    setStep(2)
    setProgress('🧠 AI is analyzing your topic...')

    try {
      const fullTopic = layout === 'custom' && customDesc
        ? `${topic}. ${customDesc}`
        : `${topic} (${LAYOUTS.find(l => l.id === layout)?.label} presentation)`

      setProgress('📝 Generating slide content...')

      const res = await fetch(`${PYTHON_API}/generate-ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: fullTopic,
          slides: [],
          theme,
          profile: {
            full_name: profile?.full_name,
            role: profile?.role,
            skills: profile?.skills,
            college: profile?.college,
          },
          generateOnly: true,
        }),
      })

      const data = await res.json()
      if (data.error && !data.slides) throw new Error(data.error)

      setSlides(data.slides || generateFallbackSlides(topic, profile))
      setProgress('✅ Slides ready!')
      setStep(3)
    } catch (err) {
      setError(err.message)
      setStep(1)
    }
  }

  // ── Step 3 → 4: Create .pptx via Python server ───────────────
  async function handleCreate() {
    setStep(2)
    setProgress('🐍 python-pptx generating your file...')
    setError('')

    try {
      setProgress('🎨 Applying design and diagrams...')

      const res = await fetch(`${PYTHON_API}/generate-ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          slides,
          theme,
          profile: { full_name: profile?.full_name, role: profile?.role },
          generateOnly: false,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Generation failed')
      }

      // Direct .pptx download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${topic.slice(0, 30).replace(/\s+/g, '_')}.pptx`
      a.click()
      URL.revokeObjectURL(url)

      setResult({ downloaded: true, slideCount: slides.length })
      setProgress('✅ Downloaded!')
      setStep(4)
    } catch (err) {
      setError(err.message)
      setStep(3)
    }
  }

  function updateSlideField(i, field, value) {
    setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function updateBullet(si, bi, value) {
    setSlides(prev => prev.map((s, idx) => {
      if (idx !== si) return s
      const arr = [...(s.content || s.steps || [])]
      arr[bi] = value
      const key = s.steps ? 'steps' : 'content'
      return { ...s, [key]: arr }
    }))
  }

  function updateStat(si, statIdx, field, value) {
    setSlides(prev => prev.map((s, idx) => {
      if (idx !== si) return s
      const stats = [...(s.stats || [])]
      stats[statIdx] = { ...stats[statIdx], [field]: value }
      return { ...s, stats }
    }))
  }

  // ── Slide preview card ────────────────────────────────────
  function SlidePreview({ slide, index, theme, onClick, isEditing, onClose }) {
    const T = THEMES.find(t => t.id === theme)
    const isTitle = slide.layout === 'title'
    const bullets = slide.content || slide.steps || []

    return (
      <div
        onClick={onClick}
        style={{
          background: isTitle ? T.primary : T.bg,
          borderRadius: 8,
          padding: '14px',
          cursor: 'pointer',
          border: isEditing ? `2px solid ${T.primary}` : '1px solid rgba(0,0,0,0.1)',
          transition: 'all 0.15s',
          minHeight: 120,
          position: 'relative',
        }}
        onMouseEnter={e => !isEditing && (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={e => e.currentTarget.style.transform = ''}
      >
        {/* Slide number */}
        <div style={{ position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderRadius: '50%', background: isTitle ? 'rgba(255,255,255,0.2)' : T.primary, color: isTitle ? 'white' : 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {index + 1}
        </div>

        <div style={{ paddingTop: 24 }}>
          {/* Emoji */}
          {slide.emoji && <div style={{ fontSize: 20, marginBottom: 4 }}>{slide.emoji}</div>}

          {/* Title */}
          <p style={{ fontSize: 12, fontWeight: 800, color: isTitle ? 'white' : '#1a1a2e', marginBottom: 4, lineHeight: 1.2 }}>
            {slide.title}
          </p>

          {/* Subtitle */}
          {slide.subtitle && <p style={{ fontSize: 10, color: isTitle ? 'rgba(255,255,255,0.8)' : '#6b7280', marginBottom: 4, fontStyle: 'italic' }}>{slide.subtitle}</p>}

          {/* Bullets */}
          {bullets.slice(0, 3).map((b, i) => (
            <div key={i} style={{ fontSize: 9, color: isTitle ? 'rgba(255,255,255,0.7)' : '#374151', display: 'flex', gap: 4, marginBottom: 2 }}>
              <span style={{ color: T.primary, flexShrink: 0 }}>•</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b}</span>
            </div>
          ))}

          {/* Stats preview */}
          {slide.stats && (
            <div style={{ display: 'flex', gap: 4 }}>
              {slide.stats.slice(0, 3).map((s, i) => (
                <div key={i} style={{ flex: 1, background: T.primary, borderRadius: 4, padding: '4px 2px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{s.number}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page-body">
      <div className="container" style={{ maxWidth: 1000 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: 'var(--purple)', marginBottom: 12 }}>
            ✨ AI-Powered · Like Gamma
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.04em', marginBottom: 8 }}>
            PPT Generator
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15 }}>
            Topic → AI generates content → Design applied → Real Google Slides PPT
          </p>
        </div>

        {/* ── STEP 1: Input ── */}
        {step === 1 && (
          <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '1.5rem', alignItems: 'start' }}>

            {/* Left — main input */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">What's your presentation about? *</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 100, fontSize: 15 }}
                  placeholder="e.g. FarmAI — an app that detects crop diseases using computer vision and suggests remedies for Indian farmers"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleGenerate()}
                />
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Ctrl+Enter to generate</p>
              </div>

              {/* Layout selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p className="form-label" style={{ marginBottom: 10 }}>Presentation type</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {LAYOUTS.map(l => (
                    <button key={l.id} onClick={() => setLayout(l.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', border: `1.5px solid ${layout===l.id ? 'var(--purple)' : 'var(--border)'}`, background: layout===l.id ? 'var(--purple-light)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: 20 }}>{l.icon}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: layout===l.id ? 'var(--purple)' : 'var(--text-1)', marginBottom: 1 }}>{l.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {layout === 'custom' && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Additional instructions</label>
                  <textarea className="form-textarea" style={{ minHeight: 70 }} placeholder="Make 6 slides, focus on the technical architecture, include a timeline..." value={customDesc} onChange={e => setCustomDesc(e.target.value)} />
                </div>
              )}

              {error && <div style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red-bg)', padding: '10px 14px', borderRadius: 8, marginBottom: '1rem', border: '1px solid var(--red-border)' }}>❌ {error}</div>}

              <button className="btn btn-primary btn-block btn-lg" onClick={handleGenerate} disabled={!topic.trim()} style={{ gap: 8 }}>
                ✨ Generate Presentation →
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Takes ~10 seconds · 8 slides · Real Google Slides file</p>
            </div>

            {/* Right — theme selector */}
            <div>
              <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                <p className="form-label" style={{ marginBottom: 12 }}>Choose theme</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-md)', border: `1.5px solid ${theme===t.id ? t.primary : 'var(--border)'}`, background: theme===t.id ? t.bg : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.primary, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: theme===t.id ? 700 : 400, color: theme===t.id ? t.primary : 'var(--text-2)' }}>{t.label}</span>
                      {theme === t.id && <span style={{ marginLeft: 'auto', fontSize: 12, color: t.primary }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile context */}
              <div className="card" style={{ padding: '1rem', borderColor: 'rgba(124,58,237,0.15)', background: 'var(--purple-light)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your context</p>
                <p style={{ fontSize: 12, color: 'var(--purple)', marginBottom: 2 }}>{profile?.full_name}</p>
                <p style={{ fontSize: 12, color: 'var(--purple)', opacity: 0.8, marginBottom: 2 }}>{profile?.role} · {profile?.college}</p>
                <p style={{ fontSize: 11, color: 'var(--purple)', opacity: 0.7 }}>{profile?.skills?.slice(0,3).join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Generating (loading) ── */}
        {step === 2 && (
          <div className="card fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--r-xl)', background: selectedTheme?.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 1.5rem' }}>✨</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>Creating your presentation</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: '2rem' }}>{progress}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {['🧠 AI thinking', '📝 Writing slides', '🎨 Applying design', '📊 Creating PPT'].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: 'var(--bg-2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)' }}>
                  <span className="spin spin-sm" style={{ width: 10, height: 10 }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview & Edit ── */}
        {step === 3 && slides.length > 0 && (
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>
                  {slides.length} slides ready — review & edit
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Click any slide to edit. Changes apply to the final PPT.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-ghost btn-sm" onClick={handleGenerate}>🔄 Regenerate</button>
                <button className="btn btn-primary" onClick={handleCreate} style={{ gap: 6 }}>
                  📊 Create PPT →
                </button>
              </div>
            </div>

            {/* Slide grid preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, marginBottom: '1.25rem' }}>
              {slides.map((slide, i) => (
                <SlidePreview
                  key={i}
                  slide={slide}
                  index={i}
                  theme={theme}
                  isEditing={editingSlide === i}
                  onClick={() => setEditingSlide(editingSlide === i ? null : i)}
                />
              ))}
            </div>

            {/* Slide editor panel */}
            {editingSlide !== null && slides[editingSlide] && (
              <div className="card fade-up" style={{ padding: '1.5rem', marginBottom: '1.25rem', borderColor: selectedTheme?.primary + '40' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>
                    Editing Slide {editingSlide + 1}
                  </p>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingSlide(null)}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Slide Title</label>
                    <input className="form-input" value={slides[editingSlide].title || ''} onChange={e => updateSlideField(editingSlide, 'title', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emoji</label>
                    <input className="form-input" value={slides[editingSlide].emoji || ''} onChange={e => updateSlideField(editingSlide, 'emoji', e.target.value)} style={{ fontSize: 20 }} />
                  </div>

                  {slides[editingSlide].subtitle !== undefined && (
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Subtitle / Tagline</label>
                      <input className="form-input" value={slides[editingSlide].subtitle || ''} onChange={e => updateSlideField(editingSlide, 'subtitle', e.target.value)} />
                    </div>
                  )}

                  {slides[editingSlide].headline !== undefined && (
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Headline (bold hook)</label>
                      <input className="form-input" value={slides[editingSlide].headline || ''} onChange={e => updateSlideField(editingSlide, 'headline', e.target.value)} />
                    </div>
                  )}

                  {/* Bullet points */}
                  {(slides[editingSlide].content || slides[editingSlide].steps) && (
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">{slides[editingSlide].steps ? 'Steps' : 'Bullet Points'}</label>
                      {(slides[editingSlide].content || slides[editingSlide].steps || []).map((b, bi) => (
                        <input key={bi} className="form-input" style={{ marginBottom: 6 }} value={b} onChange={e => updateBullet(editingSlide, bi, e.target.value)} placeholder={`Point ${bi + 1}...`} />
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  {slides[editingSlide].stats && (
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Statistics</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {slides[editingSlide].stats.map((stat, si) => (
                          <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input className="form-input" value={stat.number || ''} onChange={e => updateStat(editingSlide, si, 'number', e.target.value)} placeholder="500M+" style={{ fontSize: 16, fontWeight: 700 }} />
                            <input className="form-input" value={stat.label || ''} onChange={e => updateStat(editingSlide, si, 'label', e.target.value)} placeholder="Label" style={{ fontSize: 12 }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && <div style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red-bg)', padding: '10px 14px', borderRadius: 8, marginBottom: '1rem', border: '1px solid var(--red-border)' }}>❌ {error}</div>}

            <button className="btn btn-primary btn-block btn-lg" onClick={handleCreate} style={{ gap: 8 }}>
              📊 Create Google Slides PPT →
            </button>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 4 && result && (
          <div className="card fade-up" style={{ padding: '2.5rem', textAlign: 'center', background: 'linear-gradient(135deg,#f0fdf4,white)', borderColor: 'rgba(22,163,74,0.3)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
              Downloaded!
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: '2rem' }}>
              {result.slideCount} slides — check your Downloads folder for the .pptx file
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleCreate}>⬇️ Download Again</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setStep(1); setSlides([]); setResult(null); setTopic('') }}>
                + New Presentation
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(3)}>
                ← Edit Slides
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Fallback slides (if API fails) ───────────────────────────
function generateFallbackSlides(topic, profile) {
  return [
    { layout: 'title', title: topic, subtitle: 'An innovative solution for real-world problems', emoji: '🚀' },
    { layout: 'problem', title: 'The Problem', headline: 'A critical challenge that needs solving', content: ['Problem affects millions of people', 'Current solutions are inefficient', 'Market gap exists'], emoji: '😤' },
    { layout: 'solution', title: 'Our Solution', headline: `Introducing ${topic}`, content: ['Smart AI-powered approach', 'User-friendly interface', 'Scalable architecture'], emoji: '💡' },
    { layout: 'how', title: 'How It Works', steps: ['User inputs data', 'AI processes & analyzes', 'Smart results generated', 'Action taken'], emoji: '⚙️' },
    { layout: 'tech', title: 'Tech Stack', content: [`Frontend: React / React Native`, `Backend: ${profile?.skills?.includes('Python') ? 'FastAPI + Python' : 'Node.js'}`, `AI/ML: TensorFlow / PyTorch`, `Database: PostgreSQL`, `Cloud: Google Cloud`], emoji: '🛠️' },
    { layout: 'impact', title: 'Impact & Market', stats: [{number:'10M+',label:'Target users'},{number:'₹500Cr',label:'Market size'},{number:'80%',label:'Efficiency gain'}], emoji: '📈' },
    { layout: 'demo', title: 'Key Features', content: ['Real-time processing', 'Intuitive UI/UX', 'Offline capability', 'Data privacy first'], emoji: '✨' },
    { layout: 'team', title: 'Our Team', members: [{name: profile?.full_name || 'Team Lead', role: profile?.role || 'Developer'}], emoji: '👥' },
  ]
}