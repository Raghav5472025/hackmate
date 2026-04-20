// src/components/PitchPPT.jsx
// AI-driven PPT — 15 professional layouts for all fields

import { useState } from 'react'

const THEMES = {
  education:   { bg: '1E1B4B', accent: 'A78BFA', accent2: '7C3AED', dark: '13124A', card: 'EDE9FE', cardText: '4C1D95', light: 'F5F3FF', text: '1E293B', body: 'E2E8F0' },
  business:    { bg: '0F172A', accent: '38BDF8', accent2: '0284C7', dark: '020617', card: 'E0F2FE', cardText: '0C4A6E', light: 'F0F9FF', text: '0F172A', body: 'E2E8F0' },
  medical:     { bg: '064E3B', accent: '34D399', accent2: '059669', dark: '022C22', card: 'D1FAE5', cardText: '065F46', light: 'ECFDF5', text: '1E293B', body: 'D1FAE5' },
  technology:  { bg: '0C0A1A', accent: '818CF8', accent2: '4F46E5', dark: '05040E', card: 'E0E7FF', cardText: '3730A3', light: 'EEF2FF', text: '1E293B', body: 'C7D2FE' },
  finance:     { bg: '1C1917', accent: 'FCD34D', accent2: 'D97706', dark: '0C0A09', card: 'FEF9C3', cardText: '713F12', light: 'FEFCE8', text: '1C1917', body: 'FDE68A' },
  environment: { bg: '052E16', accent: '4ADE80', accent2: '16A34A', dark: '021108', card: 'DCFCE7', cardText: '14532D', light: 'F0FDF4', text: '1E293B', body: 'BBF7D0' },
  law:         { bg: '1C0A00', accent: 'FCD34D', accent2: 'B45309', dark: '0A0400', card: 'FEF3C7', cardText: '78350F', light: 'FFFBEB', text: '1C1917', body: 'FDE68A' },
  psychology:  { bg: '2E1065', accent: 'F0ABFC', accent2: 'C026D3', dark: '1A0540', card: 'FAE8FF', cardText: '701A75', light: 'FDF4FF', text: '1E293B', body: 'F5D0FE' },
  arts:        { bg: '1C0A00', accent: 'FB923C', accent2: 'EA580C', dark: '0A0400', card: 'FFEDD5', cardText: '7C2D12', light: 'FFF7ED', text: '1E293B', body: 'FED7AA' },
  science:     { bg: '0F172A', accent: '60A5FA', accent2: '2563EB', dark: '020617', card: 'DBEAFE', cardText: '1E3A8A', light: 'EFF6FF', text: '1E293B', body: 'BFDBFE' },
  default:     { bg: '09061E', accent: '8B5CF6', accent2: '7C3AED', dark: '040210', card: 'EDE9FE', cardText: '4C1D95', light: 'F5F3FF', text: '1E293B', body: 'DDD6FE' },
}

const W = 10, H = 5.625
const mkS = () => ({ type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.1 })

// ── Shared helpers ─────────────────────────────────────────────────────────────
function hdr(s, T, text) {
  s.addShape('rect', { x: 0, y: 0, w: W, h: 0.95, fill: { color: T.bg }, line: { type: 'none' } })
  s.addShape('rect', { x: 0, y: 0, w: 0.12, h: 0.95, fill: { color: T.accent }, line: { type: 'none' } })
  s.addText(text || '', { x: 0.28, y: 0, w: 9.3, h: 0.95, fontSize: 21, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: 'Arial Black', wrap: true })
}
function num(s, n) {
  s.addText(String(n), { x: 9.4, y: 0.3, w: 0.45, h: 0.35, fontSize: 10, color: '94A3B8', align: 'right' })
}
function footer(s, T, title) {
  s.addShape('rect', { x: 0, y: H - 0.48, w: W, h: 0.48, fill: { color: T.dark }, line: { type: 'none' } })
  s.addText('Powered by HackMate AI', { x: 0.5, y: H - 0.48, w: W - 1, h: 0.48, fontSize: 9, color: T.accent, align: 'center', valign: 'middle' })
}

// ── 1. title ──────────────────────────────────────────────────────────────────
function renderTitle(s, sl, T) {
  s.background = { color: T.bg }
  s.addShape('oval', { x: 5.5, y: -2.5, w: 7.5, h: 7.5, fill: { color: T.accent, transparency: 88 }, line: { type: 'none' } })
  s.addShape('oval', { x: 7.5, y: -0.5, w: 4, h: 4, fill: { color: T.accent2, transparency: 82 }, line: { type: 'none' } })
  s.addShape('oval', { x: -2, y: 3.8, w: 3.5, h: 3.5, fill: { color: T.accent, transparency: 92 }, line: { type: 'none' } })
  s.addShape('rect', { x: 0, y: 0, w: 0.16, h: H, fill: { color: T.accent }, line: { type: 'none' } })
  // Badge
  s.addShape('rect', { x: 0.55, y: 0.42, w: 3.8, h: 0.42, fill: { color: T.accent, transparency: 16 }, line: { type: 'none' } })
  s.addText('✨  AI GENERATED  •  HACKMATE', { x: 0.55, y: 0.42, w: 3.8, h: 0.42, fontSize: 7, bold: true, color: T.accent, align: 'center', valign: 'middle', charSpacing: 1.2 })
  // Title
  const len = (sl.heading || '').length
  const sz = len > 45 ? 26 : len > 32 ? 32 : len > 20 ? 40 : 48
  s.addText(sl.heading || '', { x: 0.5, y: 1.0, w: 8.8, h: 2.1, fontSize: sz, bold: true, color: 'FFFFFF', fontFace: 'Arial Black', align: 'left', valign: 'top', wrap: true })
  // Accent line
  s.addShape('rect', { x: 0.5, y: 3.18, w: 1.5, h: 0.05, fill: { color: T.accent }, line: { type: 'none' } })
  if (sl.subheading) s.addText(sl.subheading, { x: 0.5, y: 3.3, w: 8, h: 0.6, fontSize: 16, color: T.accent, align: 'left', italic: true, wrap: true })
  if (sl.bullets?.length) {
    sl.bullets.slice(0, 3).forEach((b, i) => {
      s.addShape('oval', { x: 0.5, y: 4.05 + i * 0.36, w: 0.2, h: 0.2, fill: { color: T.accent, transparency: 20 }, line: { type: 'none' } })
      s.addText(b, { x: 0.82, y: 4.0 + i * 0.36, w: 7.2, h: 0.3, fontSize: 11, color: 'CBD5E1', valign: 'middle', wrap: true })
    })
  }
  footer(s, T)
}

// ── 2. bullets ────────────────────────────────────────────────────────────────
function renderBullets(s, sl, T, n) {
  s.background = { color: 'F8FAFC' }
  hdr(s, T, sl.heading); num(s, n)
  if (sl.subheading) {
    s.addShape('rect', { x: 0.35, y: 1.0, w: 9.3, h: 0.34, fill: { color: T.card }, line: { type: 'none' } })
    s.addShape('rect', { x: 0.35, y: 1.0, w: 0.08, h: 0.34, fill: { color: T.accent }, line: { type: 'none' } })
    s.addText(sl.subheading, { x: 0.52, y: 1.0, w: 9.0, h: 0.34, fontSize: 11, color: T.cardText, italic: true, valign: 'middle' })
  }
  const yS = sl.subheading ? 1.42 : 1.02
  const items = (sl.bullets || []).slice(0, 6)
  const avH = H - yS - 0.42
  const bh = Math.min(avH / items.length - 0.07, 1.0)
  const gap = Math.max((avH - bh * items.length) / Math.max(items.length - 1, 1), 0.06)
  items.forEach((b, i) => {
    const y = yS + i * (bh + gap)
    s.addShape('rect', { x: 0.35, y, w: 9.3, h: bh, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.5 }, shadow: mkS() })
    s.addShape('rect', { x: 0.35, y, w: 0.1, h: bh, fill: { color: T.accent }, line: { type: 'none' } })
    s.addShape('oval', { x: 0.58, y: y + bh / 2 - 0.15, w: 0.3, h: 0.3, fill: { color: T.card }, line: { type: 'none' } })
    s.addText(String(i + 1), { x: 0.58, y: y + bh / 2 - 0.15, w: 0.3, h: 0.3, fontSize: 9, bold: true, color: T.cardText, align: 'center', valign: 'middle' })
    s.addText(b, { x: 1.02, y, w: 8.48, h: bh, fontSize: 13, color: '1E293B', valign: 'middle', wrap: true })
  })
}

// ── 3. two_column ─────────────────────────────────────────────────────────────
function renderTwoColumn(s, sl, T, n) {
  s.background = { color: 'F8FAFC' }
  hdr(s, T, sl.heading); num(s, n)
  const cw = 4.45
  s.addShape('rect', { x: 0.3, y: 1.02, w: cw, h: H - 1.5, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.5 }, shadow: mkS() })
  s.addShape('rect', { x: 0.3, y: 1.02, w: cw, h: 0.46, fill: { color: T.bg }, line: { type: 'none' } })
  s.addText(sl.left_heading || 'Column A', { x: 0.44, y: 1.02, w: cw - 0.2, h: 0.46, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' })
  ;(sl.left_bullets || []).slice(0, 5).forEach((b, i) => {
    s.addShape('rect', { x: 0.42, y: 1.6 + i * 0.7, w: 0.08, h: 0.52, fill: { color: T.accent }, line: { type: 'none' } })
    s.addText(b, { x: 0.6, y: 1.58 + i * 0.7, w: cw - 0.42, h: 0.62, fontSize: 12, color: '1E293B', valign: 'middle', wrap: true })
  })
  s.addShape('rect', { x: 5.25, y: 1.02, w: cw, h: H - 1.5, fill: { color: T.bg }, line: { type: 'none' }, shadow: mkS() })
  s.addShape('rect', { x: 5.25, y: 1.02, w: cw, h: 0.46, fill: { color: T.accent }, line: { type: 'none' } })
  s.addText(sl.right_heading || 'Column B', { x: 5.38, y: 1.02, w: cw - 0.2, h: 0.46, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' })
  ;(sl.right_bullets || []).slice(0, 5).forEach((b, i) => {
    s.addShape('rect', { x: 5.32, y: 1.6 + i * 0.7, w: 0.08, h: 0.52, fill: { color: T.accent }, line: { type: 'none' } })
    s.addText(b, { x: 5.5, y: 1.58 + i * 0.7, w: cw - 0.42, h: 0.62, fontSize: 12, color: T.body, valign: 'middle', wrap: true })
  })
}

// ── 4. three_cards ────────────────────────────────────────────────────────────
function renderThreeCards(s, sl, T, n) {
  s.background = { color: 'F8FAFC' }
  hdr(s, T, sl.heading); num(s, n)
  const cards = (sl.cards || []).slice(0, 3)
  const cw = (W - 0.7) / 3
  cards.forEach((card, i) => {
    const x = 0.35 + i * cw
    const isMiddle = i === 1
    s.addShape('rect', { x, y: 1.02, w: cw - 0.08, h: H - 1.5, fill: { color: isMiddle ? T.bg : 'FFFFFF' }, line: { color: isMiddle ? T.accent : 'E2E8F0', width: isMiddle ? 1.5 : 0.5 }, shadow: mkS() })
    s.addShape('rect', { x, y: 1.02, w: cw - 0.08, h: 0.06, fill: { color: T.accent }, line: { type: 'none' } })
    s.addShape('oval', { x: x + (cw - 0.08) / 2 - 0.36, y: 1.15, w: 0.72, h: 0.72, fill: { color: isMiddle ? T.accent : T.card }, line: { type: 'none' } })
    s.addText(card.emoji || '📌', { x: x + (cw - 0.08) / 2 - 0.36, y: 1.15, w: 0.72, h: 0.72, fontSize: 19, align: 'center', valign: 'middle' })
    s.addText(card.title || '', { x: x + 0.08, y: 2.0, w: cw - 0.24, h: 0.5, fontSize: 12, bold: true, color: isMiddle ? 'FFFFFF' : T.text, align: 'center', wrap: true })
    s.addShape('rect', { x: x + (cw - 0.08) * 0.3, y: 2.55, w: (cw - 0.08) * 0.4, h: 0.04, fill: { color: T.accent }, line: { type: 'none' } })
    ;(card.points || []).slice(0, 3).forEach((pt, j) => {
      s.addText([{ text: '• ', options: { bold: true, color: T.accent } }, { text: pt, options: { color: isMiddle ? 'E2E8F0' : '374151' } }],
        { x: x + 0.1, y: 2.65 + j * 0.72, w: cw - 0.28, h: 0.65, fontSize: 11, wrap: true, valign: 'top' })
    })
  })
}

// ── 5. big_stat ───────────────────────────────────────────────────────────────
function renderBigStat(s, sl, T, n) {
  s.background = { color: T.bg }
  hdr(s, T, sl.heading); num(s, n)
  const stats = (sl.stats || []).slice(0, 3)
  const sw = stats.length === 2 ? 4.1 : 2.85
  const totalW = sw * stats.length + 0.2 * (stats.length - 1)
  const sX = (W - totalW) / 2
  stats.forEach((st, i) => {
    const x = sX + i * (sw + 0.2)
    s.addShape('rect', { x, y: 1.05, w: sw, h: 1.9, fill: { color: T.accent, transparency: 14 }, line: { color: T.accent, width: 0.8 } })
    s.addShape('rect', { x, y: 1.05, w: sw, h: 0.08, fill: { color: T.accent }, line: { type: 'none' } })
    s.addText(st.number || '', { x, y: 1.12, w: sw, h: 0.95, fontSize: 38, bold: true, color: T.accent, align: 'center', fontFace: 'Arial Black' })
    s.addText(st.label || '', { x: x + 0.1, y: 2.1, w: sw - 0.2, h: 0.42, fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', wrap: true })
    if (st.context) s.addText(st.context, { x: x + 0.08, y: 2.55, w: sw - 0.16, h: 0.32, fontSize: 9, color: 'CBD5E1', align: 'center', wrap: true })
  })
  const buls = (sl.bullets || []).slice(0, 3)
  if (buls.length) {
    s.addShape('rect', { x: 0.35, y: 3.02, w: W - 0.7, h: 0.04, fill: { color: T.accent, transparency: 55 }, line: { type: 'none' } })
    buls.forEach((b, i) => {
      s.addShape('oval', { x: 0.38, y: 3.14 + i * 0.56, w: 0.26, h: 0.26, fill: { color: T.accent }, line: { type: 'none' } })
      s.addText(b, { x: 0.74, y: 3.12 + i * 0.56, w: 9.0, h: 0.48, fontSize: 12, color: T.body, valign: 'middle', wrap: true })
    })
  }
}

// ── 6. comparison ─────────────────────────────────────────────────────────────
function renderComparison(s, sl, T, n) {
  s.background = { color: 'F8FAFC' }
  hdr(s, T, sl.heading); num(s, n)
  const cw = 4.45, hasV = !!sl.verdict
  const colH = hasV ? H - 1.95 : H - 1.5
  s.addShape('rect', { x: 0.3, y: 1.02, w: cw, h: colH, fill: { color: 'FFFFFF' }, line: { color: T.accent, width: 1.2 }, shadow: mkS() })
  s.addShape('rect', { x: 0.3, y: 1.02, w: cw, h: 0.48, fill: { color: T.bg }, line: { type: 'none' } })
  s.addText(sl.left_heading || 'Option A', { x: 0.44, y: 1.02, w: cw - 0.28, h: 0.48, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' })
  ;(sl.left_bullets || []).slice(0, 5).forEach((b, i) => {
    s.addShape('oval', { x: 0.42, y: 1.62 + i * 0.64, w: 0.22, h: 0.22, fill: { color: T.card }, line: { type: 'none' } })
    s.addText(b, { x: 0.74, y: 1.58 + i * 0.64, w: cw - 0.54, h: 0.58, fontSize: 12, color: '1E293B', valign: 'middle', wrap: true })
  })
  s.addShape('rect', { x: 5.25, y: 1.02, w: cw, h: colH, fill: { color: T.bg }, line: { type: 'none' }, shadow: mkS() })
  s.addShape('rect', { x: 5.25, y: 1.02, w: cw, h: 0.48, fill: { color: T.accent }, line: { type: 'none' } })
  s.addText(sl.right_heading || 'Option B', { x: 5.38, y: 1.02, w: cw - 0.28, h: 0.48, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' })
  ;(sl.right_bullets || []).slice(0, 5).forEach((b, i) => {
    s.addShape('oval', { x: 5.34, y: 1.62 + i * 0.64, w: 0.22, h: 0.22, fill: { color: T.accent, transparency: 40 }, line: { type: 'none' } })
    s.addText(b, { x: 5.64, y: 1.58 + i * 0.64, w: cw - 0.54, h: 0.58, fontSize: 12, color: T.body, valign: 'middle', wrap: true })
  })
  if (sl.verdict) {
    s.addShape('rect', { x: 0.3, y: H - 0.8, w: W - 0.6, h: 0.44, fill: { color: T.card }, line: { type: 'none' } })
    s.addText('💡  ' + sl.verdict, { x: 0.45, y: H - 0.8, w: W - 0.9, h: 0.44, fontSize: 12, color: T.cardText, valign: 'middle', italic: true, wrap: true })
  }
}

// ── 7. timeline ───────────────────────────────────────────────────────────────
function renderTimeline(s, sl, T, n) {
  s.background = { color: T.bg }
  hdr(s, T, sl.heading); num(s, n)
  const steps = (sl.steps || []).slice(0, 4)
  const sw = (W - 0.6) / steps.length
  steps.forEach((st, i) => {
    const x = 0.3 + i * sw
    const last = i === steps.length - 1
    s.addShape('rect', { x, y: 1.05, w: sw - 0.1, h: H - 1.55, fill: { color: last ? T.accent2 : 'FFFFFF' }, line: { color: last ? T.accent : 'E2E8F0', width: 0.5 }, shadow: mkS() })
    const cx = x + (sw - 0.1) / 2
    s.addShape('oval', { x: cx - 0.36, y: 1.16, w: 0.72, h: 0.72, fill: { color: last ? 'FFFFFF' : T.bg }, line: { type: 'none' } })
    s.addText(st.number || String(i + 1), { x: cx - 0.36, y: 1.16, w: 0.72, h: 0.72, fontSize: 17, bold: true, color: last ? T.accent2 : 'FFFFFF', align: 'center', valign: 'middle', fontFace: 'Arial Black' })
    if (!last) s.addText('▶', { x: x + sw - 0.18, y: 1.44, w: 0.2, h: 0.38, fontSize: 12, color: T.accent, align: 'center' })
    s.addText(st.title || '', { x: x + 0.1, y: 2.0, w: sw - 0.3, h: 0.52, fontSize: 12, bold: true, color: last ? 'FFFFFF' : T.text, align: 'center', wrap: true })
    s.addShape('rect', { x: cx - (sw - 0.1) * 0.22, y: 2.57, w: (sw - 0.1) * 0.44, h: 0.04, fill: { color: last ? 'FFFFFF' : T.accent }, line: { type: 'none' } })
    s.addText(st.description || '', { x: x + 0.1, y: 2.68, w: sw - 0.3, h: H - 3.25, fontSize: 11, color: last ? 'F0FFF4' : '374151', wrap: true, valign: 'top' })
  })
}

// ── 8. quote_focus ────────────────────────────────────────────────────────────
function renderQuoteFocus(s, sl, T, n) {
  s.background = { color: T.bg }
  s.addShape('oval', { x: -2.5, y: -2, w: 7, h: 7, fill: { color: T.accent, transparency: 92 }, line: { type: 'none' } })
  s.addShape('oval', { x: 7, y: 2.5, w: 5, h: 5, fill: { color: T.accent2, transparency: 92 }, line: { type: 'none' } })
  num(s, n)
  if (sl.heading) {
    s.addShape('rect', { x: 0, y: 0, w: W, h: 0.5, fill: { color: T.dark }, line: { type: 'none' } })
    s.addText(sl.heading, { x: 0.3, y: 0, w: W - 0.6, h: 0.5, fontSize: 12, color: T.accent, valign: 'middle', bold: true })
  }
  s.addText('\u201C', { x: 0.28, y: 0.52, w: 1.2, h: 1.1, fontSize: 78, color: T.accent, transparency: 38, fontFace: 'Arial Black' })
  s.addText(sl.quote || '', { x: 0.75, y: 1.0, w: 8.5, h: 2.15, fontSize: 20, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', wrap: true, italic: true })
  s.addShape('rect', { x: 3.5, y: 3.22, w: 3.0, h: 0.06, fill: { color: T.accent }, line: { type: 'none' } })
  if (sl.author) s.addText('— ' + sl.author, { x: 0.5, y: 3.35, w: W - 1, h: 0.36, fontSize: 13, color: T.accent, align: 'center', italic: true })
  if (sl.explanation) {
    s.addShape('rect', { x: 0.5, y: 3.82, w: W - 1, h: 0.52, fill: { color: T.accent, transparency: 88 }, line: { type: 'none' } })
    s.addText(sl.explanation, { x: 0.65, y: 3.82, w: W - 1.3, h: 0.52, fontSize: 11, color: 'CBD5E1', valign: 'middle', wrap: true, align: 'center' })
  }
}

// ── 9. checklist ──────────────────────────────────────────────────────────────
function renderChecklist(s, sl, T, n) {
  s.background = { color: 'F8FAFC' }
  hdr(s, T, sl.heading); num(s, n)
  const cw = 4.45
  s.addShape('rect', { x: 0.3, y: 1.02, w: cw, h: H - 1.5, fill: { color: 'F0FDF4' }, line: { color: '86EFAC', width: 0.8 }, shadow: mkS() })
  s.addShape('rect', { x: 0.3, y: 1.02, w: cw, h: 0.46, fill: { color: '16A34A' }, line: { type: 'none' } })
  s.addText(sl.left_heading || 'Do This', { x: 0.44, y: 1.02, w: cw - 0.28, h: 0.46, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' })
  ;(sl.left_items || []).slice(0, 5).forEach((item, i) => {
    s.addText('✓', { x: 0.4, y: 1.6 + i * 0.64, w: 0.3, h: 0.52, fontSize: 14, bold: true, color: '16A34A', valign: 'middle' })
    s.addText(item, { x: 0.72, y: 1.58 + i * 0.64, w: cw - 0.58, h: 0.56, fontSize: 12, color: '14532D', valign: 'middle', wrap: true })
  })
  s.addShape('rect', { x: 5.25, y: 1.02, w: cw, h: H - 1.5, fill: { color: 'FFF1F2' }, line: { color: 'FCA5A5', width: 0.8 }, shadow: mkS() })
  s.addShape('rect', { x: 5.25, y: 1.02, w: cw, h: 0.46, fill: { color: 'DC2626' }, line: { type: 'none' } })
  s.addText(sl.right_heading || 'Avoid This', { x: 5.38, y: 1.02, w: cw - 0.28, h: 0.46, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' })
  ;(sl.right_items || []).slice(0, 5).forEach((item, i) => {
    s.addText('✗', { x: 5.35, y: 1.6 + i * 0.64, w: 0.3, h: 0.52, fontSize: 14, bold: true, color: 'DC2626', valign: 'middle' })
    s.addText(item, { x: 5.68, y: 1.58 + i * 0.64, w: cw - 0.58, h: 0.56, fontSize: 12, color: '7F1D1D', valign: 'middle', wrap: true })
  })
}

// ── 10. case_study ────────────────────────────────────────────────────────────
function renderCaseStudy(s, sl, T, n) {
  s.background = { color: 'F8FAFC' }
  hdr(s, T, sl.heading || 'Real World Case Study'); num(s, n)
  s.addShape('rect', { x: 0.3, y: 1.02, w: W - 0.6, h: 0.42, fill: { color: T.bg }, line: { type: 'none' } })
  s.addText('📌  ' + (sl.case_name || 'Case Study'), { x: 0.44, y: 1.02, w: W - 0.88, h: 0.42, fontSize: 14, bold: true, color: T.accent, valign: 'middle' })
  const secs = [
    { label: 'SITUATION', icon: '🔍', text: sl.situation || '', bg: 'EFF6FF', bd: '93C5FD', tc: '1E3A8A' },
    { label: 'ACTION', icon: '⚡', text: sl.action || '', bg: 'F0FDF4', bd: '86EFAC', tc: '14532D' },
    { label: 'RESULT', icon: '📈', text: sl.result || '', bg: 'FEF9C3', bd: 'FDE047', tc: '713F12' },
    { label: 'LESSON', icon: '💡', text: sl.lesson || '', bg: 'FAE8FF', bd: 'E879F9', tc: '701A75' },
  ]
  const sw = (W - 0.7) / 2
  secs.forEach((sec, i) => {
    const x = 0.3 + (i % 2) * (sw + 0.1)
    const y = 1.54 + Math.floor(i / 2) * 1.78
    s.addShape('rect', { x, y, w: sw, h: 1.66, fill: { color: sec.bg }, line: { color: sec.bd, width: 0.5 }, shadow: mkS() })
    s.addText(sec.icon + '  ' + sec.label, { x: x + 0.1, y: y + 0.06, w: sw - 0.2, h: 0.3, fontSize: 10, bold: true, color: sec.tc, charSpacing: 0.5 })
    s.addShape('rect', { x: x + 0.1, y: y + 0.38, w: sw - 0.2, h: 0.03, fill: { color: sec.bd }, line: { type: 'none' } })
    s.addText(sec.text, { x: x + 0.1, y: y + 0.46, w: sw - 0.2, h: 1.12, fontSize: 11, color: sec.tc, wrap: true, valign: 'top' })
  })
}

// ── 11. closing ───────────────────────────────────────────────────────────────
function renderClosing(s, sl, T) {
  s.background = { color: T.bg }
  s.addShape('oval', { x: -3, y: -3, w: 8, h: 8, fill: { color: T.accent, transparency: 90 }, line: { type: 'none' } })
  s.addShape('oval', { x: 7.5, y: 2.5, w: 6, h: 6, fill: { color: T.accent2, transparency: 90 }, line: { type: 'none' } })
  s.addShape('rect', { x: 0, y: 0, w: 0.16, h: H, fill: { color: T.accent }, line: { type: 'none' } })
  s.addText(sl.heading || 'Thank You!', { x: 0.5, y: 0.55, w: 9, h: 1.8, fontSize: 60, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial Black' })
  s.addShape('rect', { x: 3.0, y: 2.45, w: 4.0, h: 0.07, fill: { color: T.accent }, line: { type: 'none' } })
  if (sl.subheading) s.addText(sl.subheading, { x: 0.5, y: 2.6, w: 9, h: 0.6, fontSize: 16, color: T.accent, align: 'center', italic: true, wrap: true })
  if (sl.key_takeaways?.length) {
    s.addText('KEY TAKEAWAYS', { x: 0.8, y: 3.32, w: 8.4, h: 0.28, fontSize: 9, color: '94A3B8', align: 'center', charSpacing: 1.8, bold: true })
    sl.key_takeaways.slice(0, 3).forEach((pt, i) => {
      s.addShape('oval', { x: 0.8, y: 3.68 + i * 0.42, w: 0.25, h: 0.25, fill: { color: T.accent, transparency: 20 }, line: { type: 'none' } })
      s.addText(pt, { x: 1.14, y: 3.66 + i * 0.42, w: 8.1, h: 0.36, fontSize: 12, color: 'CBD5E1', valign: 'middle', wrap: true })
    })
  }
  footer(s, T)
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────
export async function generatePitchPPT(jsonData, fallbackName = 'Presentation') {
  const PptxGenJS = (await import('pptxgenjs')).default
  const prs = new PptxGenJS()
  prs.layout = 'LAYOUT_16x9'

  let data = jsonData
  if (typeof jsonData === 'string') {
    // Remove markdown fences
    let clean = jsonData.replace(/^```json\s*/im, '').replace(/```\s*$/m, '').trim()
    // Find JSON boundaries
    const s0 = clean.indexOf('{'), e0 = clean.lastIndexOf('}')
    if (s0 !== -1 && e0 !== -1) clean = clean.slice(s0, e0 + 1)
    // Fix trailing commas
    clean = clean.replace(/,(\s*[}\]])/g, '$1')
    try { data = JSON.parse(clean) }
    catch {
      const m = clean.match(/\{[\s\S]*\}/)
      if (m) {
        try { data = JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')) }
        catch { throw new Error('AI returned invalid JSON. Please click Regenerate.') }
      } else throw new Error('No JSON found in AI response. Please click Regenerate.')
    }
  }

  const T = THEMES[data.theme] || THEMES.default
  const slides = data.slides || []

  slides.forEach((sl, idx) => {
    const s = prs.addSlide()
    const n = idx + 1
    switch (sl.layout) {
      case 'title':       renderTitle(s, sl, T); break
      case 'two_column':  renderTwoColumn(s, sl, T, n); break
      case 'three_cards': renderThreeCards(s, sl, T, n); break
      case 'big_stat':    renderBigStat(s, sl, T, n); break
      case 'comparison':  renderComparison(s, sl, T, n); break
      case 'timeline':    renderTimeline(s, sl, T, n); break
      case 'quote_focus': renderQuoteFocus(s, sl, T, n); break
      case 'checklist':   renderChecklist(s, sl, T, n); break
      case 'case_study':  renderCaseStudy(s, sl, T, n); break
      case 'closing':     renderClosing(s, sl, T); break
      default:            renderBullets(s, sl, T, n); break
    }
  })

  const fName = (data.title || fallbackName).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_')
  await prs.writeFile({ fileName: `${fName}_Presentation.pptx` })
}

// ─── DOWNLOAD BUTTON ──────────────────────────────────────────────────────────
export default function DownloadPPTButton({ aiOutput, projectName }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    if (!aiOutput) return
    setLoading(true); setDone(false); setError('')
    try {
      await generatePitchPPT(aiOutput, projectName || 'Presentation')
      setDone(true)
      setTimeout(() => setDone(false), 4000)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button onClick={handleDownload} disabled={loading || !aiOutput}
        style={{ padding: '13px 20px', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', background: done ? '#16a34a' : loading ? '#6b7280' : 'linear-gradient(135deg, #7c3aed 0%, #e11d48 100%)', transition: 'all 0.2s' }}>
        {done ? '✅ PPT Downloaded!' : loading ? '⏳ Building your PPT...' : '📥 Download Professional PPT'}
      </button>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>❌ {error}</p>}
    </div>
  )
}