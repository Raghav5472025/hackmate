import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import StudentCard from '../components/StudentCard'

const ROLES = ['Frontend','Backend','Full Stack','ML/AI','UI/UX','Android','iOS','DevOps','Data Analyst']
const EXP = [
  {l:'Any experience',v:''},
  {l:'Fresher (0)',v:'fresher'},
  {l:'1–2 hackathons',v:'mid'},
  {l:'3+ hackathons',v:'exp'},
]

export default function Browse() {
  const { profile } = useAuth()
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [exp, setExp] = useState('')
  const [gender, setGender] = useState('')
  const [openOnly, setOpenOnly] = useState(true)

  const fetch = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    let q = supabase.from('profiles').select('*', { count: 'exact' }).neq('id', profile.id)
    if (openOnly) q = q.eq('is_open', true)
    if (role) q = q.eq('role', role)
    if (gender) q = q.eq('gender', gender)
    if (exp === 'fresher') q = q.eq('hackathons_count', 0)
    if (exp === 'mid') q = q.gte('hackathons_count', 1).lte('hackathons_count', 2)
    if (exp === 'exp') q = q.gte('hackathons_count', 3)
    if (search.trim()) q = q.or(`full_name.ilike.%${search}%,college.ilike.%${search}%,role.ilike.%${search}%`)
    q = q.order('wins_count', { ascending: false }).order('hackathons_count', { ascending: false })
    const { data, count } = await q
    setStudents(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [profile, search, role, exp, gender, openOnly])

  useEffect(() => {
    const t = setTimeout(fetch, 300)
    return () => clearTimeout(t)
  }, [fetch])

  return (
    <div className="page-body">
      <div className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="section-title">Browse Teammates</h1>
          <p className="section-sub">Find the right person for your next hackathon</p>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          {/* Search */}
          <input className="form-input" style={{ marginBottom: '0.875rem' }}
            placeholder="Search by name, college, skill..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {/* Filters row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-select" style={{ flex: '1 1 140px', padding: '10px 36px 10px 12px' }} value={role} onChange={e => setRole(e.target.value)}>
              <option value="">All roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="form-select" style={{ flex: '1 1 150px', padding: '10px 36px 10px 12px' }} value={exp} onChange={e => setExp(e.target.value)}>
              {EXP.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <select className="form-select" style={{ flex: '1 1 130px', padding: '10px 36px 10px 12px' }} value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">All genders</option>
              <option value="Female">Girls only</option>
              <option value="Male">Boys only</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap', padding: '4px 0' }}>
              <input type="checkbox" checked={openOnly} onChange={e => setOpenOnly(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' }} />
              Open only
            </label>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: '1rem' }}>
          {loading ? 'Searching...' : `${total} student${total !== 1 ? 's' : ''} found`}
        </p>

        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spin" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>
          : students.length === 0
            ? <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No students found</h3>
                <p>Try broadening your search or removing filters</p>
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap: 14 }}>
                {students.map(s => <StudentCard key={s.id} student={s} />)}
              </div>
        }
      </div>
    </div>
  )
}
