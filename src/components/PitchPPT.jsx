// src/components/PitchPPT.jsx
// npm install pptxgenjs

import { useState } from 'react'

// ─── THEME ENGINE ─────────────────────────────────────────────────────────────
const THEMES = {
  medical:     { bg: '0C1E3C', accent: '06B6D4', accent2: '0284C7', dark: '071428', card: '0F2D4A', text: 'FFFFFF', sub: '80DEEA' },
  technology:  { bg: '09061E', accent: '8B5CF6', accent2: '7C3AED', dark: '040210', card: '130F2E', text: 'FFFFFF', sub: 'C4B5FD' },
  business:    { bg: '09090B', accent: 'EAB308', accent2: 'CA8A04', dark: '000000', card: '18181B', text: 'FFFFFF', sub: 'FEF08A' },
  finance:     { bg: '0A0F1E', accent: '10B981', accent2: '059669', dark: '050A12', card: '0F1A2E', text: 'FFFFFF', sub: '6EE7B7' },
  education:   { bg: '1E1B4B', accent: 'F97316', accent2: 'EA580C', dark: '13124A', card: '272460', text: 'FFFFFF', sub: 'FED7AA' },
  environment: { bg: '052E16', accent: '84CC16', accent2: '65A30D', dark: '031508', card: '0A4A22', text: 'FFFFFF', sub: 'D9F99D' },
  science:     { bg: '0F172A', accent: '38BDF8', accent2: '0EA5E9', dark: '080E1A', card: '1E293B', text: 'FFFFFF', sub: 'BAE6FD' },
  psychology:  { bg: '1A0A2E', accent: 'EC4899', accent2: 'DB2777', dark: '0F0519', card: '2A1040', text: 'FFFFFF', sub: 'FBCFE8' },
  law:         { bg: '1C1008', accent: 'F59E0B', accent2: 'D97706', dark: '0E0804', card: '2C1A0C', text: 'FFFFFF', sub: 'FDE68A' },
  arts:        { bg: '1A0A0A', accent: 'F87171', accent2: 'EF4444', dark: '0A0404', card: '2A1010', text: 'FFFFFF', sub: 'FECACA' },
  default:     { bg: '09061E', accent: '8B5CF6', accent2: '7C3AED', dark: '040210', card: '130F2E', text: 'FFFFFF', sub: 'C4B5FD' },
}

// ─── JSON PARSER ──────────────────────────────────────────────────────────────
function parseJSON(rawText) {
  let jsonStr = rawText.trim()
  jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
  jsonStr = jsonStr.replace(/^```\s*/i, '').replace(/\s*```$/, '')
  const start = jsonStr.indexOf('{')
  const end = jsonStr.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    jsonStr = jsonStr.substring(start, end + 1)
  }
  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    try {
      return JSON.parse(jsonStr)
    } catch (e2) {
      throw new Error('AI returned invalid JSON. Please click Regenerate and try again.')
    }
  }
}

// ─── PPT GENERATOR (pptxgenjs - fallback) ────────────────────────────────────
const W = 10, H = 5.625

export async function generatePitchPPT(rawText, projectName = 'My Project', template = null) {
  const PptxGenJS = (await import('pptxgenjs')).default
  const data = parseJSON(rawText)
  const theme = template ? {
    bg: template.bg, accent: template.accent, accent2: template.accent2,
    dark: template.dark, card: template.card || template.dark, text: 'FFFFFF', sub: template.accent,
  } : (THEMES[data.theme] || THEMES.default)
  const slides = data.slides || []
  const prs = new PptxGenJS()
  prs.layout = 'LAYOUT_16x9'
  for (const slide of slides) {
    const s = prs.addSlide()
    await renderSlide(prs, s, slide, theme, data.title)
  }
  const fileName = (data.title || projectName).replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_')
  await prs.writeFile({ fileName: `${fileName}_Presentation.pptx` })
}

// ─── SLIDE RENDERER ───────────────────────────────────────────────────────────
async function renderSlide(prs, s, slide, theme, presTitle) {
  const layout = slide.layout || 'bullets'
  switch (layout) {
    case 'title':      return renderTitle(prs, s, slide, theme)
    case 'bullets':    return renderBullets(prs, s, slide, theme)
    case 'two_column': return renderTwoColumn(prs, s, slide, theme)
    case 'three_cards':return renderThreeCards(prs, s, slide, theme)
    case 'big_stat':   return renderBigStat(prs, s, slide, theme)
    case 'comparison': return renderComparison(prs, s, slide, theme)
    case 'timeline':   return renderTimeline(prs, s, slide, theme)
    case 'quote_focus':return renderQuote(prs, s, slide, theme)
    case 'checklist':  return renderChecklist(prs, s, slide, theme)
    case 'case_study': return renderCaseStudy(prs, s, slide, theme)
    case 'closing':    return renderClosing(prs, s, slide, theme)
    default:           return renderBullets(prs, s, slide, theme)
  }
}

function addHeader(prs, s, title, theme, slideNum) {
  s.addShape(prs.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 1.0, fill: { color: theme.bg }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: 1.0, fill: { color: theme.accent }, line: { type: 'none' } })
  s.addText(title, { x: 0.25, y: 0, w: 8.8, h: 1.0, fontSize: 20, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: 'Arial Black' })
  if (slideNum) s.addText(String(slideNum), { x: 9.5, y: 0.33, w: 0.35, h: 0.34, fontSize: 10, color: '6B7280', align: 'right' })
}

function renderTitle(prs, s, slide, theme) {
  s.background = { color: theme.bg }
  s.addShape(prs.shapes.OVAL, { x: 7.0, y: -2.0, w: 5.5, h: 5.5, fill: { color: theme.accent, transparency: 82 }, line: { type: 'none' } })
  s.addShape(prs.shapes.OVAL, { x: 7.8, y: -0.8, w: 3.0, h: 3.0, fill: { color: theme.accent2, transparency: 78 }, line: { type: 'none' } })
  s.addShape(prs.shapes.OVAL, { x: -1.0, y: 3.8, w: 2.5, h: 2.5, fill: { color: theme.accent, transparency: 88 }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 0, y: 0, w: 0.1, h: H, fill: { color: theme.accent }, line: { type: 'none' } })
  s.addShape(prs.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 0.45, w: 2.5, h: 0.36, fill: { color: theme.accent, transparency: 20 }, line: { type: 'none' }, rectRadius: 0.08 })
  s.addText('AI GENERATED PRESENTATION', { x: 0.55, y: 0.45, w: 2.5, h: 0.36, fontSize: 7, bold: true, color: theme.accent, align: 'center', valign: 'middle', margin: 0, charSpacing: 1 })
  const heading = slide.heading || 'Presentation'
  const fSize = heading.length > 40 ? 30 : heading.length > 25 ? 38 : 46
  s.addText(heading, { x: 0.5, y: 1.0, w: 8.5, h: 2.0, fontSize: fSize, bold: true, color: 'FFFFFF', fontFace: 'Arial Black', align: 'left', valign: 'top', wrap: true })
  if (slide.subheading) s.addText(slide.subheading, { x: 0.5, y: 3.1, w: 7.5, h: 0.65, fontSize: 15, color: theme.sub, align: 'left', italic: true })
  const bullets = (slide.bullets || []).slice(0, 3)
  bullets.forEach((b, i) => {
    s.addShape(prs.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.95 + i * 0.38, w: 6.5, h: 0.3, fill: { color: theme.accent, transparency: 85 }, line: { type: 'none' }, rectRadius: 0.05 })
    s.addText('• ' + b, { x: 0.65, y: 3.95 + i * 0.38, w: 6.3, h: 0.3, fontSize: 10, color: theme.sub, valign: 'middle' })
  })
  s.addShape(prs.shapes.RECTANGLE, { x: 0, y: H - 0.48, w: W, h: 0.48, fill: { color: theme.dark }, line: { type: 'none' } })
  s.addText('Powered by HackMate AI', { x: 0.5, y: H - 0.48, w: W - 1, h: 0.48, fontSize: 9, color: theme.accent, align: 'left', valign: 'middle' })
}

function renderBullets(prs, s, slide, theme) {
  s.background = { color: 'F8FAFC' }
  addHeader(prs, s, slide.heading || '', theme)
  if (slide.subheading) s.addText(slide.subheading, { x: 0.4, y: 1.05, w: 9.2, h: 0.38, fontSize: 12, color: '64748B', italic: true })
  const bullets = (slide.bullets || []).slice(0, 6)
  const startY = slide.subheading ? 1.5 : 1.25
  const itemH = (H - startY - 0.4) / Math.max(bullets.length, 1)
  bullets.forEach((b, i) => {
    const y = startY + i * itemH
    s.addShape(prs.shapes.OVAL, { x: 0.35, y: y + 0.05, w: 0.38, h: 0.38, fill: { color: theme.accent }, line: { type: 'none' } })
    s.addText(String(i + 1), { x: 0.35, y: y + 0.05, w: 0.38, h: 0.38, fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
    s.addText(b, { x: 0.88, y, w: 8.8, h: itemH - 0.06, fontSize: 13, color: '1E293B', valign: 'middle', wrap: true })
    if (i < bullets.length - 1) s.addShape(prs.shapes.RECTANGLE, { x: 0.35, y: y + itemH - 0.04, w: 9.3, h: 0.01, fill: { color: 'E2E8F0' }, line: { type: 'none' } })
  })
}

function renderTwoColumn(prs, s, slide, theme) {
  s.background = { color: 'F8FAFC' }
  addHeader(prs, s, slide.heading || '', theme)
  const colW = 4.45
  s.addShape(prs.shapes.RECTANGLE, { x: 0.3, y: 1.15, w: colW, h: H - 1.5, fill: { color: theme.bg }, line: { type: 'none' }, shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.12 } })
  s.addShape(prs.shapes.RECTANGLE, { x: 0.3, y: 1.15, w: colW, h: 0.42, fill: { color: theme.accent }, line: { type: 'none' } })
  s.addText(slide.left_heading || 'Left', { x: 0.3, y: 1.15, w: colW, h: 0.42, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  const leftBullets = (slide.left_bullets || []).slice(0, 5)
  s.addText(leftBullets.map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < leftBullets.length - 1, color: 'E5E7EB', fontSize: 12, paraSpaceAfter: 5 } })), { x: 0.45, y: 1.65, w: colW - 0.3, h: H - 2.1 })
  s.addShape(prs.shapes.RECTANGLE, { x: 5.25, y: 1.15, w: colW, h: H - 1.5, fill: { color: theme.card }, line: { type: 'none' }, shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.12 } })
  s.addShape(prs.shapes.RECTANGLE, { x: 5.25, y: 1.15, w: colW, h: 0.42, fill: { color: theme.accent2 }, line: { type: 'none' } })
  s.addText(slide.right_heading || 'Right', { x: 5.25, y: 1.15, w: colW, h: 0.42, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  const rightBullets = (slide.right_bullets || []).slice(0, 5)
  s.addText(rightBullets.map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < rightBullets.length - 1, color: 'E5E7EB', fontSize: 12, paraSpaceAfter: 5 } })), { x: 5.4, y: 1.65, w: colW - 0.3, h: H - 2.1 })
}

function renderThreeCards(prs, s, slide, theme) {
  s.background = { color: 'F8FAFC' }
  addHeader(prs, s, slide.heading || '', theme)
  const cards = (slide.cards || []).slice(0, 3)
  const cardW = 2.9
  const cx = [0.35, 3.55, 6.75]
  cards.forEach((card, i) => {
    s.addShape(prs.shapes.RECTANGLE, { x: cx[i], y: 1.15, w: cardW, h: H - 1.5, fill: { color: theme.bg }, line: { type: 'none' }, shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 135, opacity: 0.15 } })
    s.addShape(prs.shapes.RECTANGLE, { x: cx[i], y: 1.15, w: cardW, h: 0.08, fill: { color: theme.accent }, line: { type: 'none' } })
    s.addText(card.emoji || '💡', { x: cx[i], y: 1.28, w: cardW, h: 0.65, fontSize: 28, align: 'center' })
    s.addText(card.title || '', { x: cx[i] + 0.1, y: 1.95, w: cardW - 0.2, h: 0.45, fontSize: 12, bold: true, color: theme.accent, align: 'center' })
    s.addShape(prs.shapes.RECTANGLE, { x: cx[i] + 0.6, y: 2.42, w: 1.7, h: 0.05, fill: { color: theme.accent }, line: { type: 'none' } })
    const points = (card.points || []).slice(0, 4)
    s.addText(points.map((p, j) => ({ text: p, options: { bullet: true, breakLine: j < points.length - 1, color: 'D1D5DB', fontSize: 11, paraSpaceAfter: 4 } })), { x: cx[i] + 0.15, y: 2.55, w: cardW - 0.3, h: H - 2.95 })
  })
}

function renderBigStat(prs, s, slide, theme) {
  s.background = { color: 'F8FAFC' }
  addHeader(prs, s, slide.heading || '', theme)
  const stats = (slide.stats || []).slice(0, 3)
  const cx = [0.35, 3.55, 6.75]
  stats.forEach((stat, i) => {
    s.addShape(prs.shapes.RECTANGLE, { x: cx[i], y: 1.15, w: 2.9, h: 2.1, fill: { color: theme.bg }, line: { type: 'none' }, shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 135, opacity: 0.15 } })
    s.addShape(prs.shapes.RECTANGLE, { x: cx[i], y: 1.15, w: 2.9, h: 0.08, fill: { color: theme.accent }, line: { type: 'none' } })
    s.addText(stat.number || '', { x: cx[i], y: 1.28, w: 2.9, h: 0.9, fontSize: 34, bold: true, color: theme.accent, align: 'center', fontFace: 'Arial Black' })
    s.addText(stat.label || '', { x: cx[i] + 0.1, y: 2.18, w: 2.7, h: 0.42, fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', wrap: true })
    if (stat.context) s.addText(stat.context, { x: cx[i] + 0.1, y: 2.6, w: 2.7, h: 0.5, fontSize: 9, color: '9CA3AF', align: 'center', wrap: true })
  })
  const bullets = (slide.bullets || []).slice(0, 4)
  if (bullets.length) {
    s.addShape(prs.shapes.RECTANGLE, { x: 0.35, y: 3.4, w: 9.3, h: H - 3.75, fill: { color: theme.card }, line: { type: 'none' } })
    s.addText(bullets.map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < bullets.length - 1, color: 'E5E7EB', fontSize: 12, paraSpaceAfter: 3 } })), { x: 0.6, y: 3.48, w: 8.9, h: H - 3.88 })
  }
}

function renderComparison(prs, s, slide, theme) {
  s.background = { color: 'F8FAFC' }
  addHeader(prs, s, slide.heading || '', theme)
  const colW = 4.2
  const leftH = slide.verdict ? H - 2.85 : H - 1.6
  s.addShape(prs.shapes.RECTANGLE, { x: 0.3, y: 1.12, w: colW, h: leftH, fill: { color: theme.bg }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 0.3, y: 1.12, w: colW, h: 0.4, fill: { color: theme.accent }, line: { type: 'none' } })
  s.addText(slide.left_heading || 'Option A', { x: 0.3, y: 1.12, w: colW, h: 0.4, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  const lb = (slide.left_bullets || []).slice(0, 5)
  s.addText(lb.map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < lb.length - 1, color: 'E5E7EB', fontSize: 11.5, paraSpaceAfter: 5 } })), { x: 0.45, y: 1.6, w: colW - 0.3, h: leftH - 0.55 })
  s.addShape(prs.shapes.OVAL, { x: 4.6, y: 2.3, w: 0.8, h: 0.8, fill: { color: theme.accent }, line: { type: 'none' } })
  s.addText('VS', { x: 4.6, y: 2.3, w: 0.8, h: 0.8, fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  s.addShape(prs.shapes.RECTANGLE, { x: 5.5, y: 1.12, w: colW, h: leftH, fill: { color: theme.card }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 5.5, y: 1.12, w: colW, h: 0.4, fill: { color: theme.accent2 }, line: { type: 'none' } })
  s.addText(slide.right_heading || 'Option B', { x: 5.5, y: 1.12, w: colW, h: 0.4, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  const rb = (slide.right_bullets || []).slice(0, 5)
  s.addText(rb.map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < rb.length - 1, color: 'E5E7EB', fontSize: 11.5, paraSpaceAfter: 5 } })), { x: 5.65, y: 1.6, w: colW - 0.3, h: leftH - 0.55 })
  if (slide.verdict) {
    s.addShape(prs.shapes.RECTANGLE, { x: 0.3, y: H - 1.45, w: 9.4, h: 0.95, fill: { color: theme.accent, transparency: 15 }, line: { color: theme.accent, pt: 1 } })
    s.addText('Verdict: ' + slide.verdict, { x: 0.5, y: H - 1.45, w: 9.1, h: 0.95, fontSize: 12, color: 'FFFFFF', valign: 'middle', wrap: true, bold: true })
  }
}

function renderTimeline(prs, s, slide, theme) {
  s.background = { color: theme.bg }
  addHeader(prs, s, slide.heading || '', theme)
  const steps = (slide.steps || []).slice(0, 4)
  const isTwo = steps.length <= 2
  const colW = isTwo ? 4.0 : 2.1
  const cols = isTwo ? 2 : Math.min(steps.length, 4)
  const startX = (W - cols * colW - (cols - 1) * 0.2) / 2
  steps.forEach((step, i) => {
    const x = startX + i * (colW + 0.2)
    const y = 1.25
    s.addShape(prs.shapes.RECTANGLE, { x, y, w: colW, h: H - 1.6, fill: { color: i % 2 === 0 ? theme.card : '0F172A' }, line: { type: 'none' }, shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 135, opacity: 0.2 } })
    s.addText(step.number || String(i + 1).padStart(2, '0'), { x, y: y + 0.1, w: colW, h: 0.9, fontSize: 36, bold: true, color: theme.accent, align: 'center', fontFace: 'Arial Black' })
    s.addShape(prs.shapes.RECTANGLE, { x: x + colW * 0.2, y: y + 1.05, w: colW * 0.6, h: 0.05, fill: { color: theme.accent }, line: { type: 'none' } })
    s.addText(step.title || '', { x: x + 0.08, y: y + 1.18, w: colW - 0.16, h: 0.5, fontSize: 12, bold: true, color: theme.accent, align: 'center', wrap: true })
    s.addText(step.description || '', { x: x + 0.1, y: y + 1.72, w: colW - 0.2, h: H - 3.45, fontSize: 10.5, color: 'D1D5DB', align: 'center', wrap: true, valign: 'top' })
    if (i < steps.length - 1) s.addText('▶', { x: x + colW, y: y + 1.5, w: 0.22, h: 0.4, fontSize: 12, color: theme.accent, align: 'center' })
  })
}

function renderQuote(prs, s, slide, theme) {
  s.background = { color: theme.bg }
  s.addShape(prs.shapes.OVAL, { x: -1, y: -1, w: 4, h: 4, fill: { color: theme.accent, transparency: 90 }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 0, y: 0, w: 0.1, h: H, fill: { color: theme.accent }, line: { type: 'none' } })
  s.addText(slide.heading || 'Key Insight', { x: 0.4, y: 0.25, w: 9.2, h: 0.55, fontSize: 13, bold: true, color: theme.accent })
  s.addText('❝', { x: 0.4, y: 0.9, w: 1, h: 1, fontSize: 52, color: theme.accent })
  const quote = slide.quote || ''
  s.addText(quote, { x: 0.5, y: 1.5, w: 9, h: 1.8, fontSize: quote.length > 100 ? 16 : 20, color: 'FFFFFF', italic: true, bold: true, wrap: true, align: 'left', valign: 'top', fontFace: 'Georgia' })
  s.addShape(prs.shapes.RECTANGLE, { x: 0.5, y: 3.45, w: 2.5, h: 0.06, fill: { color: theme.accent }, line: { type: 'none' } })
  s.addText('— ' + (slide.author || ''), { x: 0.5, y: 3.6, w: 9, h: 0.4, fontSize: 13, color: theme.sub, bold: true })
  if (slide.explanation) {
    s.addShape(prs.shapes.RECTANGLE, { x: 0.4, y: 4.15, w: 9.2, h: 1.1, fill: { color: theme.card }, line: { type: 'none' } })
    s.addText(slide.explanation, { x: 0.6, y: 4.15, w: 8.9, h: 1.1, fontSize: 11.5, color: 'D1D5DB', valign: 'middle', wrap: true })
  }
}

function renderChecklist(prs, s, slide, theme) {
  s.background = { color: 'F8FAFC' }
  addHeader(prs, s, slide.heading || '', theme)
  const colW = 4.4
  s.addShape(prs.shapes.RECTANGLE, { x: 0.3, y: 1.12, w: colW, h: H - 1.5, fill: { color: '052E16' }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 0.3, y: 1.12, w: colW, h: 0.42, fill: { color: '16A34A' }, line: { type: 'none' } })
  s.addText(slide.left_heading || '✅ Do This', { x: 0.3, y: 1.12, w: colW, h: 0.42, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  const doItems = (slide.left_items || []).slice(0, 5)
  doItems.forEach((item, i) => {
    s.addText('✅', { x: 0.45, y: 1.65 + i * 0.62, w: 0.35, h: 0.45, fontSize: 13, align: 'center', valign: 'middle' })
    s.addText(item, { x: 0.85, y: 1.62 + i * 0.62, w: 3.7, h: 0.55, fontSize: 11, color: 'D1FAE5', valign: 'middle', wrap: true })
  })
  s.addShape(prs.shapes.RECTANGLE, { x: 4.8, y: 1.3, w: 0.4, h: H - 1.7, fill: { color: 'E2E8F0' }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 5.3, y: 1.12, w: colW, h: H - 1.5, fill: { color: '1C0505' }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 5.3, y: 1.12, w: colW, h: 0.42, fill: { color: 'DC2626' }, line: { type: 'none' } })
  s.addText(slide.right_heading || '❌ Avoid This', { x: 5.3, y: 1.12, w: colW, h: 0.42, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })
  const avoidItems = (slide.right_items || []).slice(0, 5)
  avoidItems.forEach((item, i) => {
    s.addText('❌', { x: 5.45, y: 1.65 + i * 0.62, w: 0.35, h: 0.45, fontSize: 13, align: 'center', valign: 'middle' })
    s.addText(item, { x: 5.85, y: 1.62 + i * 0.62, w: 3.7, h: 0.55, fontSize: 11, color: 'FEE2E2', valign: 'middle', wrap: true })
  })
}

function renderCaseStudy(prs, s, slide, theme) {
  s.background = { color: 'F8FAFC' }
  addHeader(prs, s, slide.heading || 'Case Study', theme)
  s.addShape(prs.shapes.RECTANGLE, { x: 0.3, y: 1.08, w: 9.4, h: 0.5, fill: { color: theme.accent, transparency: 15 }, line: { color: theme.accent, pt: 1 } })
  s.addText('📌  ' + (slide.case_name || ''), { x: 0.5, y: 1.08, w: 9.2, h: 0.5, fontSize: 13, bold: true, color: theme.bg, valign: 'middle' })
  const sections = [
    { label: '🔍 Situation', content: slide.situation, color: '1E3A5F', textColor: 'DBEAFE' },
    { label: '⚡ Action Taken', content: slide.action, color: '1A3320', textColor: 'DCFCE7' },
    { label: '📈 Result', content: slide.result, color: '3B1A06', textColor: 'FED7AA' },
    { label: '💡 Key Lesson', content: slide.lesson, color: '2D1458', textColor: 'EDE9FE' },
  ]
  const sW = 4.55
  sections.forEach((sec, i) => {
    const x = i % 2 === 0 ? 0.3 : 5.15
    const y = i < 2 ? 1.68 : 3.55
    s.addShape(prs.shapes.RECTANGLE, { x, y, w: sW, h: 1.72, fill: { color: sec.color }, line: { type: 'none' } })
    s.addText(sec.label, { x: x + 0.12, y: y + 0.08, w: sW - 0.24, h: 0.36, fontSize: 11, bold: true, color: theme.accent })
    s.addText(sec.content || '', { x: x + 0.12, y: y + 0.46, w: sW - 0.24, h: 1.18, fontSize: 11, color: sec.textColor, wrap: true, valign: 'top' })
  })
}

function renderClosing(prs, s, slide, theme) {
  s.background = { color: theme.bg }
  s.addShape(prs.shapes.OVAL, { x: -2, y: -2, w: 6.5, h: 6.5, fill: { color: theme.accent, transparency: 88 }, line: { type: 'none' } })
  s.addShape(prs.shapes.OVAL, { x: 7.5, y: 2.5, w: 5, h: 5, fill: { color: theme.accent, transparency: 88 }, line: { type: 'none' } })
  s.addShape(prs.shapes.OVAL, { x: 4.5, y: -1.2, w: 2.8, h: 2.8, fill: { color: theme.accent2, transparency: 90 }, line: { type: 'none' } })
  s.addShape(prs.shapes.RECTANGLE, { x: 0, y: 0, w: 0.1, h: H, fill: { color: theme.accent }, line: { type: 'none' } })
  s.addText(slide.heading || 'Thank You!', { x: 0.5, y: 0.7, w: 9, h: 1.5, fontSize: 58, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial Black' })
  s.addShape(prs.shapes.RECTANGLE, { x: 3.2, y: 2.35, w: 3.6, h: 0.08, fill: { color: theme.accent }, line: { type: 'none' } })
  if (slide.subheading) s.addText(slide.subheading, { x: 0.5, y: 2.55, w: 9, h: 0.65, fontSize: 16, color: theme.sub, align: 'center', italic: true })
  const takeaways = (slide.key_takeaways || []).slice(0, 3)
  if (takeaways.length) {
    s.addText('Key Takeaways', { x: 0.5, y: 3.32, w: 9, h: 0.38, fontSize: 11, bold: true, color: theme.accent, align: 'center' })
    takeaways.forEach((t, i) => {
      const x = 0.5 + i * 3.1
      s.addShape(prs.shapes.ROUNDED_RECTANGLE, { x, y: 3.72, w: 2.85, h: 1.35, fill: { color: theme.card }, line: { color: theme.accent, pt: 0.5 }, rectRadius: 0.08 })
      s.addText(t, { x: x + 0.1, y: 3.78, w: 2.65, h: 1.22, fontSize: 10.5, color: 'E5E7EB', align: 'center', valign: 'middle', wrap: true })
    })
  }
  s.addShape(prs.shapes.RECTANGLE, { x: 0, y: H - 0.48, w: W, h: 0.48, fill: { color: theme.dark }, line: { type: 'none' } })
  s.addText('Powered by HackMate AI', { x: 0.5, y: H - 0.48, w: W - 1, h: 0.48, fontSize: 9, color: theme.accent, align: 'center', valign: 'middle' })
}

// ─── DOWNLOAD BUTTON — NOW USES RENDER PYTHON SERVER ─────────────────────────
const PYTHON_API = import.meta.env.VITE_PPT_API || 'https://ppt-server-osau.onrender.com'

export default function DownloadPPTButton({ aiOutput, projectName, template }) {
  const [status, setStatus] = useState('idle') // idle | waking | generating | done | error
  const [error, setError] = useState('')

  const handleDownload = async () => {
    if (!aiOutput) return
    setError('')

    // Parse AI JSON to get slides
    let slidesData = null
    try {
      slidesData = parseJSON(aiOutput)
    } catch (e) {
      setError('Could not parse AI output. Please regenerate.')
      return
    }

    // Try Render Python server first
    try {
      setStatus('waking')

      const res = await fetch(`${PYTHON_API}/generate-ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: projectName || 'Presentation',
          slides: slidesData.slides || [],
          theme: template?.category || 'purple',
          profile: {},
          generateOnly: false,
        }),
      })

      if (!res.ok) throw new Error('Server error')

      setStatus('generating')
      const blob = await res.blob()

      // Download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(projectName || 'Presentation').replace(/\s+/g, '_')}.pptx`
      a.click()
      URL.revokeObjectURL(url)

      setStatus('done')
      setTimeout(() => setStatus('idle'), 4000)

    } catch (err) {
      // Render server failed — fallback to pptxgenjs
      console.warn('Render server unavailable, falling back to pptxgenjs:', err)
      setStatus('generating')
      try {
        await generatePitchPPT(aiOutput, projectName || 'My Project', template)
        setStatus('done')
        setTimeout(() => setStatus('idle'), 4000)
      } catch (err2) {
        setStatus('error')
        setError(err2.message || 'Failed to generate PPT')
      }
    }
  }

  const btnText = {
    idle: '📥 Download Professional PPT',
    waking: '⏳ Connecting to server...',
    generating: '🎨 Building your presentation...',
    done: '✅ PPT Downloaded!',
    error: '❌ Try Again',
  }[status]

  const btnBg = {
    idle: 'linear-gradient(135deg, #7c3aed 0%, #e11d48 100%)',
    waking: '#6b7280',
    generating: '#6b7280',
    done: '#16a34a',
    error: '#dc2626',
  }[status]

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={handleDownload}
        disabled={status === 'waking' || status === 'generating' || !aiOutput}
        style={{
          padding: '13px 20px', color: 'white', border: 'none', borderRadius: 10,
          fontSize: 14, fontWeight: 700,
          cursor: (status === 'waking' || status === 'generating') ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', justifyContent: 'center',
          background: btnBg, transition: 'all 0.2s', letterSpacing: '0.3px',
        }}
      >
        {btnText}
      </button>
      {status === 'waking' && (
        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6, textAlign: 'center' }}>
          🔄 Server waking up — may take 20-30 sec on first use
        </p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6, lineHeight: 1.4 }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}