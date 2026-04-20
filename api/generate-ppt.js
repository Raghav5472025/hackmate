// api/generate-ppt.js — Full Gamma-like Pipeline
// Mode 1: generateOnly=true  → return slides JSON (preview)
// Mode 2: generateOnly=false → create real Google Slides PPT

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { topic, slides: providedSlides, theme = 'purple', accessToken, profile, generateOnly } = req.body

    // ── MODE 1: Only generate JSON content (no PPT creation) ──
    if (generateOnly) {
      const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

      // DEBUG: Yeh log Vercel dashboard me dikhega — key hai ya nahi
      console.log('ANTHROPIC_KEY present:', !!ANTHROPIC_KEY)

      if (!ANTHROPIC_KEY) {
        console.warn('⚠️  ANTHROPIC_API_KEY missing in env — using fallback slides')
      }

      const slides = ANTHROPIC_KEY
        ? await generateSlidesWithAI(topic, profile, ANTHROPIC_KEY)
        : getFallbackSlides(topic, profile)

      return res.status(200).json({ slides })
    }

    // ── MODE 2: Create actual Google Slides PPT ──
    if (!accessToken || accessToken === 'GENERATE_ONLY') {
      return res.status(401).json({ error: 'Google access token required. Sign in with Google.' })
    }

    const slideData = providedSlides?.length
      ? providedSlides
      : await generateSlidesWithAI(topic, profile, process.env.ANTHROPIC_API_KEY)

    const AUTH = `Bearer ${accessToken}`
    const THEME = THEMES[theme] || THEMES.purple

    // Create blank presentation
    const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: { 'Authorization': AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: (topic || 'Pitch Deck') + ' — HackMate' }),
    })
    if (!createRes.ok) {
      const err = await createRes.json()
      throw new Error('Google Slides: ' + (err.error?.message || 'Check API is enabled'))
    }

    const pres = await createRes.json()
    const pid = pres.presentationId
    const firstSlideId = pres.slides?.[0]?.objectId

    // Insert slides
    const slideIds = slideData.map((_, i) => `sl${i}_${Date.now() + i}`)
    const insertReqs = slideData.map((_, i) => ({ insertSlide: { insertionIndex: i, objectId: slideIds[i] } }))
    if (firstSlideId) insertReqs.push({ deleteObject: { objectId: firstSlideId } })
    await batchUpdate(pid, AUTH, insertReqs)

    // Build + apply design
    const allReqs = []
    slideData.forEach((slide, i) => allReqs.push(...buildSlide(slideIds[i], slide, i, THEME)))
    for (let i = 0; i < allReqs.length; i += 40) {
      await batchUpdate(pid, AUTH, allReqs.slice(i, i + 40))
    }

    // Share publicly
    await fetch(`https://www.googleapis.com/drive/v3/files/${pid}/permissions`, {
      method: 'POST',
      headers: { 'Authorization': AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }).catch(() => {})

    return res.status(200).json({
      success: true,
      presentationId: pid,
      slideCount: slideData.length,
      viewUrl: `https://docs.google.com/presentation/d/${pid}/view`,
      editUrl: `https://docs.google.com/presentation/d/${pid}/edit`,
      exportUrl: `https://docs.google.com/presentation/d/${pid}/export/pptx`,
    })

  } catch (err) {
    console.error('PPT error:', err)
    return res.status(500).json({ error: err.message || 'Failed' })
  }
}

// ── AI Content Generation ─────────────────────────────────────────────────────

async function generateSlidesWithAI(topic, profile, apiKey) {
  if (!apiKey) return getFallbackSlides(topic, profile)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: `You are a presentation expert. Create hackathon pitch deck content.
Creator: ${profile?.full_name || 'Student'} | ${profile?.role || 'Developer'} | ${profile?.college || ''}
Skills: ${profile?.skills?.join(', ') || 'Various'}

IMPORTANT: Every slide must be 100% specific to the topic: "${topic}".
Do NOT use generic content. Use real facts, real numbers, real use cases for this topic.

Return ONLY valid JSON (no extra text, no markdown):
{"slides":[
  {"layout":"title","title":"<project name>","subtitle":"<one-line value prop>","emoji":"🚀","content":[]},
  {"layout":"problem","title":"The Problem","headline":"<key stat specific to topic>","content":["<specific pain point 1>","<specific pain point 2>","<specific pain point 3>"],"emoji":"😤"},
  {"layout":"solution","title":"Our Solution","headline":"<one-line solution>","content":["<feature 1>","<feature 2>","<feature 3>"],"emoji":"💡"},
  {"layout":"how","title":"How It Works","steps":["<step 1>","<step 2>","<step 3>","<step 4>"],"emoji":"⚙️"},
  {"layout":"tech","title":"Tech Stack","content":["Frontend: <relevant tech>","Backend: <relevant tech>","AI: <relevant tech>","DB: <relevant tech>","Cloud: <relevant tech>"],"emoji":"🛠️"},
  {"layout":"impact","title":"Impact & Market","stats":[{"number":"<real number>","label":"<label>"},{"number":"<real number>","label":"<label>"},{"number":"<real number>","label":"<label>"}],"emoji":"📈"},
  {"layout":"demo","title":"Key Features","content":["<feature 1>","<feature 2>","<feature 3>","<feature 4>"],"emoji":"✨"},
  {"layout":"team","title":"Team","members":[{"name":"${profile?.full_name || 'Lead'}","role":"${profile?.role || 'Developer'}"}],"emoji":"👥"}
]}

Rules:
- EVERY point must be SPECIFIC to "${topic}" — no generic filler
- Use real market numbers and statistics
- Bullets max 12 words each
- Return ONLY the JSON object, nothing else`,
      messages: [{ role: 'user', content: `Create a pitch deck for: "${topic}"` }],
    }),
  })

  const data = await res.json()

  // DEBUG: Log raw AI response
  console.log('Anthropic API status:', data?.type)
  console.log('Raw AI text (first 300 chars):', data.content?.[0]?.text?.slice(0, 300))

  // Handle API errors
  if (data.error) {
    console.error('Anthropic API error:', data.error)
    return getFallbackSlides(topic, profile)
  }

  const text = data.content?.[0]?.text || ''

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (!parsed.slides?.length) throw new Error('No slides in response')
    return parsed.slides
  } catch {
    // Try to extract JSON from response
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0]).slides
      } catch {
        console.error('JSON parse failed even after extraction')
      }
    }
    return getFallbackSlides(topic, profile)
  }
}

// ── Slide Builder ─────────────────────────────────────────────────────────────

function buildSlide(sid, slide, index, T) {
  const R = []
  const isTitle = slide.layout === 'title'
  const bgColor = isTitle ? T.primary : (index % 2 === 0 ? T.bg : T.bg2)

  // Background
  R.push({
    updatePageProperties: {
      objectId: sid,
      pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: rgb(bgColor) } } } },
      fields: 'pageBackgroundFill',
    },
  })

  // Top color bar (non-title slides)
  if (!isTitle) R.push(rect(`br${sid}`, sid, 0, 0, 9144000, 180000, T.primary))

  // Emoji
  if (slide.emoji) {
    R.push(tbox(`em${sid}`, sid, isTitle ? 3800000 : 120000, isTitle ? 700000 : 220000, 1400000, 800000))
    R.push(itxt(`em${sid}`, slide.emoji))
    R.push(stxt(`em${sid}`, isTitle ? 60 : 32, '#111118', false, 'CENTER'))
  }

  if (isTitle) {
    // Title slide
    R.push(tbox(`t${sid}`, sid, 500000, 1700000, 8144000, 1300000))
    R.push(itxt(`t${sid}`, slide.title || ''))
    R.push(stxt(`t${sid}`, 46, '#FFFFFF', true, 'CENTER', 'Montserrat'))

    if (slide.subtitle) {
      R.push(tbox(`s${sid}`, sid, 500000, 3200000, 8144000, 700000))
      R.push(itxt(`s${sid}`, slide.subtitle))
      R.push(stxt(`s${sid}`, 22, '#E0D7FF', false, 'CENTER', 'Lato', true))
    }

    R.push(tbox(`f${sid}`, sid, 500000, 5800000, 8144000, 400000))
    R.push(itxt(`f${sid}`, 'HackMate · Built to Win'))
    R.push(stxt(`f${sid}`, 12, '#C4B5FD', false, 'CENTER'))

  } else if (slide.layout === 'impact') {
    R.push(tbox(`t${sid}`, sid, 457200, 280000, 8229600, 800000))
    R.push(itxt(`t${sid}`, slide.title || ''))
    R.push(stxt(`t${sid}`, 28, T.text, true, 'START', 'Montserrat'))

    const stats = slide.stats || []
    const cw = 2500000
    const sx = (9144000 - cw * 3 - 300000 * 2) / 2

    stats.slice(0, 3).forEach((s, i) => {
      const x = sx + i * (cw + 300000)
      R.push(rect(`sc${sid}${i}`, sid, x, 1400000, cw, 2000000, T.primary))
      R.push(tbox(`sn${sid}${i}`, sid, x + 100000, 1700000, cw - 200000, 900000))
      R.push(itxt(`sn${sid}${i}`, s.number || ''))
      R.push(stxt(`sn${sid}${i}`, 40, '#FFFFFF', true, 'CENTER', 'Montserrat'))
      R.push(tbox(`sl${sid}${i}`, sid, x + 100000, 2700000, cw - 200000, 500000))
      R.push(itxt(`sl${sid}${i}`, s.label || ''))
      R.push(stxt(`sl${sid}${i}`, 15, '#E0D7FF', false, 'CENTER', 'Lato'))
    })

  } else if (slide.layout === 'how') {
    R.push(tbox(`t${sid}`, sid, 457200, 280000, 8229600, 800000))
    R.push(itxt(`t${sid}`, slide.title || ''))
    R.push(stxt(`t${sid}`, 28, T.text, true, 'START', 'Montserrat'))

    const steps = slide.steps || slide.content || []
    const bw = 1850000, bh = 1800000

    steps.slice(0, 4).forEach((s, i) => {
      const x = 400000 + i * (bw + 200000)
      R.push(rect(`sb${sid}${i}`, sid, x, 1500000, bw, bh, T.primary + '25'))
      R.push(tbox(`sn${sid}${i}`, sid, x, 1600000, bw, 500000))
      R.push(itxt(`sn${sid}${i}`, String(i + 1)))
      R.push(stxt(`sn${sid}${i}`, 32, T.primary, true, 'CENTER', 'Montserrat'))
      R.push(tbox(`st${sid}${i}`, sid, x + 80000, 2250000, bw - 160000, 900000))
      R.push(itxt(`st${sid}${i}`, s))
      R.push(stxt(`st${sid}${i}`, 15, T.body, false, 'CENTER', 'Lato'))
      if (i < 3) {
        R.push(tbox(`ar${sid}${i}`, sid, x + bw + 30000, 2150000, 140000, 400000))
        R.push(itxt(`ar${sid}${i}`, '→'))
        R.push(stxt(`ar${sid}${i}`, 24, T.primary, true, 'CENTER'))
      }
    })

  } else if (slide.layout === 'team') {
    R.push(tbox(`t${sid}`, sid, 457200, 280000, 8229600, 800000))
    R.push(itxt(`t${sid}`, slide.title || ''))
    R.push(stxt(`t${sid}`, 28, T.text, true, 'START', 'Montserrat'))

    const ms = slide.members || []
    const cw = 2000000
    const sx = (9144000 - cw * ms.length - 300000 * (ms.length - 1)) / 2

    ms.slice(0, 4).forEach((m, i) => {
      const x = sx + i * (cw + 300000)
      R.push(oval(`av${sid}${i}`, sid, x + 600000, 1600000, 800000, 800000))
      const init = (m.name || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      R.push(itxt(`av${sid}${i}`, init))
      R.push(stxt(`av${sid}${i}`, 26, '#FFFFFF', true, 'CENTER', 'Montserrat'))
      R.push(tbox(`mn${sid}${i}`, sid, x, 2600000, cw, 450000))
      R.push(itxt(`mn${sid}${i}`, m.name || ''))
      R.push(stxt(`mn${sid}${i}`, 16, T.text, true, 'CENTER', 'Montserrat'))
      R.push(tbox(`mr${sid}${i}`, sid, x, 3100000, cw, 400000))
      R.push(itxt(`mr${sid}${i}`, m.role || ''))
      R.push(stxt(`mr${sid}${i}`, 13, T.body, false, 'CENTER', 'Lato'))
    })

  } else {
    // Default: problem, solution, tech, demo slides
    R.push(tbox(`t${sid}`, sid, 457200, 280000, 8229600, 800000))
    R.push(itxt(`t${sid}`, slide.title || ''))
    R.push(stxt(`t${sid}`, 28, T.text, true, 'START', 'Montserrat'))

    let y = 1200000

    if (slide.headline) {
      R.push(tbox(`hl${sid}`, sid, 457200, 1100000, 8229600, 450000))
      R.push(itxt(`hl${sid}`, slide.headline))
      R.push(stxt(`hl${sid}`, 17, T.primary, true, 'START', 'Lato'))
      R.push(rect(`hr${sid}`, sid, 457200, 1620000, 900000, 35000, T.primary))
      y = 1800000
    }

    if (slide.content?.length) {
      const body = slide.content.map(c => `• ${c}`).join('\n')
      R.push(tbox(`bd${sid}`, sid, 457200, y, 8229600, 6858000 - y - 200000))
      R.push(itxt(`bd${sid}`, body))
      R.push(stxt(`bd${sid}`, 19, T.body, false, 'START', 'Lato'))
      R.push({
        updateParagraphStyle: {
          objectId: `bd${sid}`,
          style: { lineSpacing: 175, spaceAbove: { magnitude: 8, unit: 'PT' } },
          fields: 'lineSpacing,spaceAbove',
          textRange: { type: 'ALL' },
        },
      })
    }
  }

  return R
}

// ── Helper Functions ──────────────────────────────────────────────────────────

const e = (v) => ({ magnitude: v, unit: 'EMU' })
const p = (v) => ({ magnitude: v, unit: 'PT' })

function tbox(id, pg, x, y, w, h) {
  return {
    createShape: {
      objectId: id, shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: pg,
        size: { width: e(w), height: e(h) },
        transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: 'EMU' },
      },
    },
  }
}

function rect(id, pg, x, y, w, h, fillHex) {
  const req = {
    createShape: {
      objectId: id, shapeType: 'RECTANGLE',
      elementProperties: {
        pageObjectId: pg,
        size: { width: e(w), height: e(h) },
        transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: 'EMU' },
      },
    },
  }
  // Apply fill color if provided
  if (fillHex) {
    return [
      req,
      {
        updateShapeProperties: {
          objectId: id,
          shapeProperties: {
            shapeBackgroundFill: {
              solidFill: { color: { rgbColor: rgb(fillHex) } },
            },
          },
          fields: 'shapeBackgroundFill',
        },
      },
    ]
  }
  return req
}

function oval(id, pg, x, y, w, h) {
  return {
    createShape: {
      objectId: id, shapeType: 'ELLIPSE',
      elementProperties: {
        pageObjectId: pg,
        size: { width: e(w), height: e(h) },
        transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: 'EMU' },
      },
    },
  }
}

function itxt(id, text) {
  return { insertText: { objectId: id, text: text || '', insertionIndex: 0 } }
}

function stxt(id, sz, hex, bold, align, font, italic) {
  return {
    updateTextStyle: {
      objectId: id,
      style: {
        fontSize: p(sz),
        bold: !!bold,
        italic: !!italic,
        foregroundColor: { opaqueColor: { rgbColor: rgb(hex) } },
        ...(font ? { fontFamily: font } : {}),
      },
      fields: `fontSize,bold,italic,foregroundColor${font ? ',fontFamily' : ''}`,
      textRange: { type: 'ALL' },
    },
  }
}

function rgb(h) {
  h = (h || '#000').replace('#', '').replace(/^([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => r + r + g + g + b + b)
  // Handle hex with alpha like '#7c3aed25' — take first 6 chars only
  h = h.slice(0, 6)
  return {
    red: parseInt(h.slice(0, 2), 16) / 255,
    green: parseInt(h.slice(2, 4), 16) / 255,
    blue: parseInt(h.slice(4, 6), 16) / 255,
  }
}

async function batchUpdate(pid, auth, requests) {
  // Flatten arrays (rect() now returns array when fillHex provided)
  const flat = requests.flat()
  if (!flat?.length) return
  const r = await fetch(`https://slides.googleapis.com/v1/presentations/${pid}:batchUpdate`, {
    method: 'POST',
    headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: flat }),
  })
  const d = await r.json()
  if (d.error) throw new Error(`Slides: ${d.error.message}`)
  return d
}

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES = {
  purple: { primary: '#7c3aed', bg: '#faf5ff', bg2: '#f3f0ff', text: '#4c1d95', body: '#374151' },
  blue:   { primary: '#1d4ed8', bg: '#eff6ff', bg2: '#dbeafe', text: '#1e3a8a', body: '#374151' },
  dark:   { primary: '#6d28d9', bg: '#1f2937', bg2: '#111827', text: '#f9fafb', body: '#d1d5db' },
  green:  { primary: '#059669', bg: '#f0fdf4', bg2: '#dcfce7', text: '#064e3b', body: '#374151' },
  orange: { primary: '#ea580c', bg: '#fff7ed', bg2: '#fed7aa', text: '#7c2d12', body: '#374151' },
}

// ── Fallback Slides (used only when API key is missing) ───────────────────────

function getFallbackSlides(topic, profile) {
  return [
    { layout: 'title',   title: topic || 'My Project', subtitle: 'An innovative hackathon solution', emoji: '🚀', content: [] },
    { layout: 'problem', title: 'The Problem',   headline: 'A critical challenge affecting many', content: ['Current solutions are slow and inefficient', 'Users face real pain points daily', 'No affordable solution exists yet'], emoji: '😤' },
    { layout: 'solution',title: 'Our Solution',  headline: `Introducing ${topic || 'our platform'}`, content: ['AI-powered smart approach', 'Simple and intuitive design', 'Scalable from day one'], emoji: '💡' },
    { layout: 'how',     title: 'How It Works',  steps: ['User inputs data', 'AI analyzes instantly', 'Smart results generated', 'User takes action'], emoji: '⚙️' },
    { layout: 'tech',    title: 'Tech Stack',    content: ['Frontend: React / Next.js', 'Backend: Node.js / FastAPI', 'AI/ML: Claude / Gemini', 'Database: PostgreSQL', 'Cloud: Vercel / GCP'], emoji: '🛠️' },
    { layout: 'impact',  title: 'Impact',        stats: [{ number: '10M+', label: 'Target users' }, { number: '₹500Cr', label: 'Market size' }, { number: '80%', label: 'Efficiency gain' }], emoji: '📈' },
    { layout: 'demo',    title: 'Key Features',  content: ['Real-time processing', 'Intuitive UI/UX', 'Offline support', 'Privacy first'], emoji: '✨' },
    { layout: 'team',    title: 'Team',          members: [{ name: profile?.full_name || 'Team Lead', role: profile?.role || 'Developer' }], emoji: '👥' },
  ]
}