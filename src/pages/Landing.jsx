import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: '🎯', title: 'Smart matching', desc: 'Skill match score dikhata hai — complementary skills wale teammates pehle milte hain.' },
  { icon: '👩‍💻', title: 'Safe for girls', desc: 'Verified community aur gender filters taaki girls comfortably team bana sakein.' },
  { icon: '📸', title: 'Real profiles', desc: 'Photo, achievements, GitHub links — pata hoga ki aap kisse team kar rahe ho.' },
  { icon: '@', title: 'Username search', desc: 'Apna @username share karo. Koi bhi directly dhundh ke invite bhej sakta hai.' },
  { icon: '💬', title: 'Chat after match', desc: 'Invite accept hote hi private chat open — wahi pe sab discuss karo.' },
  { icon: '⚡', title: '2-min setup', desc: 'Profile banao, skills add karo, browse karo. Bas.' },
]

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0.875rem 0', boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            Hack<span style={{ color: 'var(--purple)' }}>Mate</span>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Get Started →</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 0 clamp(3rem,5vw,5rem)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle bg pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container fade-up" style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: 'var(--purple)', marginBottom: '1.75rem', letterSpacing: '0.02em' }}>
            <span className="purple-dot" /> For Indian hackathon students
          </div>
          <h1 style={{ fontSize: 'clamp(2.8rem,7vw,5rem)', color: 'var(--text-1)', marginBottom: '1.25rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
            Find your perfect<br /><span style={{ color: 'var(--purple)' }}>hackathon team</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2.2vw,18px)', color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
            No more random teams. Browse real profiles, see skill match scores, and connect with people who complement your skills.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-xl" onClick={() => navigate('/register')}>Create your profile →</button>
            <button className="btn btn-secondary btn-xl" onClick={() => navigate('/login')}>Browse teammates</button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '2rem 0', background: 'white' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, textAlign: 'center' }}>
            {[['500+','Students'],['120+','Teams'],['40+','Hackathons'],['Free','Always']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: 'var(--purple)', letterSpacing: '-0.03em' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem,4vw,3rem)' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--text-1)', marginBottom: 10 }}>Built different</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 15 }}>Features jo real problems solve karte hain</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 14 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 7 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 0', textAlign: 'center', background: 'white', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--text-1)', marginBottom: '1rem' }}>Ready to build?</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: '2.5rem', fontSize: 15 }}>Join hundreds of students already on HackMate</p>
          <button className="btn btn-primary btn-xl" onClick={() => navigate('/register')}>Join HackMate — it's free →</button>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem 0', textAlign: 'center', background: 'var(--bg)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em' }}>© 2025 HackMate · Built for students, by students</p>
      </footer>
    </div>
  )
}
