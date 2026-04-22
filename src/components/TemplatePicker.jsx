// src/components/TemplatePicker.jsx
import { useState, useMemo } from 'react'
import { PPT_TEMPLATES, PPT_CATEGORIES, searchTemplates, getTemplatesByCategory } from '../data/pptTemplates'

export default function TemplatePicker({ selected, onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    if (searchQuery.trim()) return searchTemplates(searchQuery)
    if (activeCategory === 'all') return PPT_TEMPLATES
    return getTemplatesByCategory(activeCategory)
  }, [activeCategory, searchQuery])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-1, #fff)',
        borderRadius: 16,
        width: '100%', maxWidth: 900,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Choose Design Template</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '2px 0 0' }}>{PPT_TEMPLATES.length} professional designs — pick one that matches your topic</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}
          >
            ✕ Close
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '1rem 1.5rem 0' }}>
          <input
            type="text"
            placeholder="🔍 Search templates... (e.g. medical, dark, blue, startup)"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveCategory('all') }}
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              background: 'var(--bg-2)', color: 'var(--text-1)',
            }}
          />
        </div>

        {/* Category tabs */}
        {!searchQuery && (
          <div style={{ padding: '0.75rem 1.5rem 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid', transition: 'all 0.15s',
                background: activeCategory === 'all' ? '#7c3aed' : 'transparent',
                color: activeCategory === 'all' ? 'white' : 'var(--text-2)',
                borderColor: activeCategory === 'all' ? '#7c3aed' : 'var(--border)',
              }}
            >
              ✨ All ({PPT_TEMPLATES.length})
            </button>
            {PPT_CATEGORIES.map(cat => {
              const count = getTemplatesByCategory(cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid', transition: 'all 0.15s',
                    background: activeCategory === cat.id ? '#7c3aed' : 'transparent',
                    color: activeCategory === cat.id ? 'white' : 'var(--text-2)',
                    borderColor: activeCategory === cat.id ? '#7c3aed' : 'var(--border)',
                  }}
                >
                  {cat.emoji} {cat.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem 1.5rem' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
            {filtered.length} template{filtered.length !== 1 ? 's' : ''} found
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}>
            {filtered.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selected?.id === template.id}
                onSelect={() => { onSelect(template); onClose() }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ template, isSelected, onSelect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: isSelected ? `2px solid #7c3aed` : hovered ? `1.5px solid #${template.accent}` : '1.5px solid var(--border)',
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        background: 'white', padding: 0, textAlign: 'left',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.15s',
        boxShadow: isSelected ? '0 0 0 3px rgba(124,58,237,0.2)' : 'none',
      }}
    >
      {/* Preview thumbnail */}
      <div style={{
        height: 80, background: `#${template.bg}`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: `#${template.accent}`, opacity: 0.2,
        }} />
        <div style={{
          position: 'absolute', right: 5, top: 5,
          width: 40, height: 40, borderRadius: '50%',
          background: `#${template.accent}`, opacity: 0.3,
        }} />
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 4, background: `#${template.accent}`,
        }} />
        {/* Title preview */}
        <div style={{ padding: '0 12px 0 16px', width: '100%' }}>
          <div style={{
            height: 8, background: `#${template.accent}`,
            borderRadius: 4, width: '70%', marginBottom: 6, opacity: 0.9,
          }} />
          <div style={{
            height: 5, background: 'rgba(255,255,255,0.3)',
            borderRadius: 3, width: '50%', marginBottom: 4,
          }} />
          <div style={{
            height: 5, background: 'rgba(255,255,255,0.2)',
            borderRadius: 3, width: '40%',
          }} />
        </div>
        {/* Selected badge */}
        {isSelected && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: '#7c3aed', borderRadius: '50%',
            width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: 'white',
          }}>✓</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>
          {template.name}
        </p>
        <p style={{ fontSize: 10, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
          {template.desc}
        </p>
        <div style={{ marginTop: 5, display: 'flex', gap: 3 }}>
          {[template.bg, template.accent, template.dark].map((color, i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              background: `#${color}`, border: '1px solid rgba(0,0,0,0.1)',
            }} />
          ))}
        </div>
      </div>
    </button>
  )
}
