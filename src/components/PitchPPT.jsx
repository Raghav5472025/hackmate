// src/components/PitchPPT.jsx
// Full AI-driven PPT — AI generates JSON with layout decisions, code renders it
// 10 professional layouts covering all fields

import { useState } from 'react'

// ─── THEME SYSTEM ─────────────────────────────────────────────────────────────
const THEMES = {
  education:   { bg: '1E1B4B', accent: 'A78BFA', accent2: '7C3AED', dark: '13124A', card: 'EDE9FE', cardText: '4C1D95', light: 'F5F3FF', text: '1E293B' },
  business:    { bg: '0F172A', accent: '38BDF8', accent2: '0284C7', dark: '020617', card: 'E0F2FE', cardText: '0C4A6E', light: 'F0F9FF', text: '0F172A' },
  medical:     { bg: '0C4A6E', accent: '34D399', accent2: '059669', dark: '042F2E', card: 'DCFCE7', cardText: '14532D', light: 'F0FDF4', text: '0C4A6E' },
  technology:  { bg: '09090B', accent: '22D3EE', accent2: '0891B2', dark: '000000', card: 'CFFAFE', cardText: '164E63', light: 'ECFEFF', text: '0F172A' },
  finance:     { bg: '1C1917', accent: 'FCD34D', accent2: 'D97706', dark: '0C0A09', card: 'FEF9C3', cardText: '713F12', light: 'FEFCE8', text: '1C1917' },
  environment: { bg: '052E16', accent: '4ADE80', accent2: '16A34A', dark: '021108', card: 'DCFCE7', cardText: '14532D', light: 'F0FDF4', text: '052E16' },
  law:         { bg: '1C1917', accent: 'FCA5A5', accent2: 'DC2626', dark: '0C0A09', card: 'FEE2E2', cardText: '7F1D1D', light: 'FFF1F2', text: '1C1917' },
  psychology:  { bg: '2E1065', accent: 'F0ABFC', accent2: 'C026D3', dark: '1A0540', card: 'FAE8FF', cardText: '701A75', light: 'FDF4FF', text: '2E1065' },
  arts:        { bg: '1C0A00', accent: 'FB923C', accent2: 'EA580C', dark: '0A0400', card: 'FFEDD5', cardText: '7C2D12', light: 'FFF7ED', text: '1C0A00' },
  science:     { bg: '0F172A', accent: '60A5FA', accent2: '2563EB', dark: '020617', card: 'DBEAFE', cardText: '1E3A8A', light: 'EFF6FF', text: '0F172A' },
  default:     { bg: '09061E', accent: '8B5CF6', accent2: '7C3AED', dark: '040210', card: 'EDE9FE', cardText: '4C1D95', light: 'F5F3FF', text: '1E293B' },
}

// ─── PPT BUILDER ──────────────────────────────────────────────────────────────
const W = 10, H = 5.625
const mkShadow = () => ({ type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.12 })

function drawHeader(s, T, text) {
  s.addShape('rect', { x: 0, y: 0, w: W, h: 1.0, fill: { color: T.bg }, line: { type: 'none' } })
  s.addShape('rect', { x: 0, y: 0, w: 0.12, h: 1.0, fill: { color: T.accent }, line: { type: 'none' } })
  s.addText(text || '', { x: 0.3, y: 0, w: 9.2, h: 1.0, fontSize: 22, bold: true, color: 'FFFFFF', valign: 'middle', fontFace: 'Arial Black', wrap: true })
}

function drawSlideNum(s, n) {
  s.addText(String(n), { x: 9.4, y: 0.32, w: 0.45, h: 0.36, fontSize: 10, color: '94A3B8', align: 'right' })
}

// ── title ──────────────────────────────────────────────────────────────────────
function renderTitle(s, slide, T) {
  s.background = { color: T.bg }
  s.addShape('oval', { x: 5.5, y: -2.5, w: 7, h: 7, fill: { color: T.accent, transparency: 88 }, line: { type: 'none' } })
  s.addShape('oval', { x: 7.0, y: -1.0, w: 4, h: 4, fill: { color: T.accent2, transparency: 82 }, line: { type: 'none' } })
  s.addShape('oval', { x: -1.5, y: 3.5, w: 3, h: 3, fill: { color: T.accent, transparency: 92 }, line: { type: 'none' } })
  s.addShape('rect', { x: 0, y: 0, w: 0.14, h: H, fill: { color: T.accent }, line: { type: 'none' } })
  s.addShape('rect', { x: 0.55, y: 0.42, w: 3.5, h: 0.44, fill: { color: T.accent, transparency: 18 }, line: { type: 'none' } })
  s.addText('✨  AI GENERATED PRESENTATION', { x: 0.55, y: 0.42, w: 3.5, h: 0.44, fontSize: 7, bold: true, color: T.accent, align: 'center', valign: 'middle', charSpacing: 1 })
  const titleLen = (slide.heading || '').length
  const titleSize = titleLen > 40 ? 28 : titleLen > 28 ? 34 : titleLen > 18 ? 42 : 50
  s.addText(slide.heading || '', { x: 0.5, y: 1.0, w: 8.8, h: 2.1, fontSize: titleSize, bold: true, color: 'FFFFFF', fontFace: 'Arial Black', align: 'left', valign: 'top', wrap: true })
  if (slide.subheading) s.addText(slide.subheading, { x: 0.5, y: 3.2, w: 7.5, h: 0.65, fontSize: 16, color: T.accent, align: 'left', italic: true, wrap: true })
  if (slide.bullets?.length) {
    slide.bullets.slice(0, 3).forEach((b, i) => {
      s.addShape('oval', { x: 0.52, y: 3.98 + i * 0.36, w: 0.22, h: 0.22, fill: { color: T.accent, transparency: 25 }, line: { type: 'none' } })
      s.addText(b, { x: 0.85, y: 3.92 + i * 0.36, w: 6.8, h: 0.32, fontSize: 11, color: 'CBD5E1', valign: 'middle', wrap: true })
    })
  }
  s.addShape('rect', { x: 0, y: H - 0.52, w: W, h: 0.52, fill: { color: T.dark }, line: { type: 'none' } })
  s.addText('Powered by HackMate AI', { x: 0.5, y: H - 0.52, w: W - 1, h: 0.52, fontSize: 9, color: T.accent, align: 'center', valign: 'middle' })
}

// ── bullets ────────────────────────────────────────────────────────────────────
function renderBullets(s, slide, T, n) {
  s.background = { color: 'F8FAFC' }
  drawHeader(s, T, slide.heading)
  drawSlideNum(s, n)
  if (slide.subheading) {
    s.addShape('rect', { x: 0.35, y: 1.06, w: 9.3, h: 0.36, fill: { color: T.card }, line: { type: 'none' } })
    s.addShape('rect', { x: 0.35, y: 1.06, w: 0.08, h: 0.36, fill: { color: T.accent }, line: { type: 'none' } })
    s.addText(slide.subheading, { x: 0.55, y: 1.06, w: 9.0, h: 0.36, fontSize: 12, color: T.cardText, italic: true, valign: 'middle' })
  }
  const yStart = slide.subheading ? 1.52 : 1.08
  const bullets = (slide.bullets || []).slice(0, 6)
  const totalH = H - yStart - 0.45
  const bh = Math.min(totalH / bullets.length - 0.08, 1.05)
  const gap = (totalH - bh * bullets.length) / Math.max(bullets.length - 1, 1)
  bullets.forEach((b, i) => {
    const y = yStart + i * (bh + gap)
    s.addShape('rect', { x: 0.35, y, w: 9.3, h: bh, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.5 }, shadow: mkShadow() })
    s.addShape('rect', { x: 0.35, y, w: 0.1, h: bh, fill: { color: T.accent }, line: { type: 'none' } })
    s.addShape('oval', { x: 0.58, y: y + bh / 2 - 0.16, w: 0.32, h: 0.32, fill: { color: T.card }, line: { type: 'none' } })
    s.addText(String(i + 1), { x: 0.58, y: y + bh / 2 - 0.16, w: 0.32, h: 0.32, fontSize: 9, bold: true, color: T.cardText, align: 'center', valign: 'middle' })
    s.addText(b, { x: 1.05, y, w: 8.45, h: bh, fontSize: 13, color: '1E293B', valign: 'middle', wrap: true })
  })
}

// ── two_column ─────────────────────────────────────────────────────────────────
function renderTwoColumn(s, slide, T, n) {
  s.background = { color: 'F8FAFC' }
  drawHeader(s, T, slide.heading)
  drawSlideNum(s, n)
  const cw = 4.45
  // Left — white
  s.addShape('rect', { x: 0.3, y: 1.08, w: cw, h: H - 1.55, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.5 }, shadow: mkShadow() })
  s.addShape('rect', { x: 0.3, y: 1.08, w: cw, h: 0.48, fill: { color: T.bg }, line: { type: 'none' } })
  s.addText(slide.left_heading || 'Column A', { x: 0.45, y: 1.08, w: cw - 0.25, h: 0.48, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' });
  (slide.left_bullets || []).slice(0, 5).forEach((b, i) => {
    s.addShape('rect', { x: 0.42, y: 1.68 + i * 0.7, w: 0.08, h: 0.55, fill: { color: T.accent }, line: { type: 'none' } })
    s.addText(b, { x: 0.6, y: 1.65 + i * 0.7, w: cw - 0.42, h: 0.62, fontSize: 12, color: '1E293B', valign: 'middle', wrap: true })
  })
  // Right — dark
  s.addShape('rect', { x: 5.25, y: 1.08, w: cw, h: H - 1.55, fill: { color: T.bg }, line: { type: 'none' }, shadow: mkShadow() })
  s.addShape('rect', { x: 5.25, y: 1.08, w: cw, h: 0.48, fill: { color: T.accent }, line: { type: 'none' } })
  s.addText(slide.right_heading || 'Column B', { x: 5.4, y: 1.08, w: cw - 0.25, h: 0.48, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' });
  (slide.right_bullets || []).slice(0, 5).forEach((b, i) => {
    s.addShape('rect', { x: 5.35, y: 1.68 + i * 0.7, w: 0.08, h: 0.55, fill: { color: T.accent }, line: { type: 'none' } })
    s.addText(b, { x: 5.52, y: 1.65 + i * 0.7, w: cw - 0.42, h: 0.62, fontSize: 12, color: 'E2E8F0', valign: 'middle', wrap: true })
  })
}

// ── three_cards ────────────────────────────────────────────────────────────────
function renderThreeCards(s, slide, T, n) {
  s.background = { color: 'F8FAFC' }
  drawHeader(s, T, slide.heading)
  drawSlideNum(s, n)
  const cards = (slide.cards || []).slice(0, 3)
  const cw = (W - 0.7) / 3
  cards.forEach((card, i) => {
    const x = 0.35 + i * (cw + 0.0)
    s.addShape('rect', { x, y: 1.08, w: cw - 0.08, h: H - 1.55, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.5 }, shadow: mkShadow() })
    s.addShape('rect', { x, y: 1.08, w: cw - 0.08, h: 0.06, fill: { color: T.accent }, line: { type: 'none' } })
    s.addShape('oval', { x: x + (cw - 0.08) / 2 - 0.38, y: 1.22, w: 0.76, h: 0.76, fill: { color: T.card }, line: { type: 'none' } })
    s.addText(card.emoji || '📌', { x: x + (cw - 0.08) / 2 - 0.38, y: 1.22, w: 0.76, h: 0.76, fontSize: 20, align: 'center', valign: 'middle' })
    s.addText(card.title || '', { x: x + 0.08, y: 2.1, w: cw - 0.24, h: 0.52, fontSize: 13, bold: true, color: T.text, align: 'center', wrap: true })
    s.addShape('rect', { x: x + (cw - 0.08) * 0.28, y: 2.66, w: (cw - 0.08) * 0.44, h: 0.04, fill: { color: T.accent }, line: { type: 'none' } });
    (card.points || []).slice(0, 3).forEach((pt, j) => {
      s.addText([
        { text: '• ', options: { bold: true, color: T.accent2 } },
        { text: pt, options: { color: '374151' } }
      ], { x: x + 0.12, y: 2.78 + j * 0.72, w: cw - 0.32, h: 0.65, fontSize: 11, wrap: true, valign: 'top' })
    })
  })
}

// ── big_stat ───────────────────────────────────────────────────────────────────
function renderBigStat(s, slide, T, n) {
  s.background = { color: T.bg }
  drawHeader(s, T, slide.heading)
  drawSlideNum(s, n)
  const stats = (slide.stats || []).slice(0, 3)
  const sw = stats.length === 2 ? 4.2 : 2.88
  const totalW = sw * stats.length + 0.18 * (stats.length - 1)
  const startX = (W - totalW) / 2
  stats.forEach((stat, i) => {
    const x = startX + i * (sw + 0.18)
    s.addShape('rect', { x, y: 1.1, w: sw, h: 1.95, fill: { color: T.accent, transparency: 14 }, line: { color: T.accent, width: 0.8 } })
    s.addShape('rect', { x, y: 1.1, w: sw, h: 0.08, fill: { color: T.accent }, line: { type: 'none' } })
    s.addText(stat.number || '', { x, y: 1.18, w: sw, h: 1.0, fontSize: 40, bold: true, color: T.accent, align: 'center', fontFace: 'Arial Black' })
    s.addText(stat.label || '', { x: x + 0.1, y: 2.22, w: sw - 0.2, h: 0.44, fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', wrap: true })
    if (stat.context) s.addText(stat.context, { x: x + 0.08, y: 2.68, w: sw - 0.16, h: 0.32, fontSize: 10, color: 'CBD5E1', align: 'center', wrap: true })
  })
  const bullets = (slide.bullets || []).slice(0, 3)
  if (bullets.length) {
    s.addShape('rect', { x: 0.35, y: 3.1, w: W - 0.7, h: 0.04, fill: { color: T.accent, transparency: 60 }, line: { type: 'none' } })
    bullets.forEach((b, i) => {
      s.addShape('oval', { x: 0.38, y: 3.22 + i * 0.56, w: 0.28, h: 0.28, fill: { color: T.accent }, line: { type: 'none' } })
      s.addText(b, { x: 0.78, y: 3.2 + i * 0.56, w: 8.9, h: 0.5, fontSize: 12, color: 'E2E8F0', valign: 'middle', wrap: true })
    })
  }
}

// ── comparison ─────────────────────────────────────────────────────────────────
function renderComparison(s, slide, T, n) {
  s.background = { color: 'F8FAFC' }
  drawHeader(s, T, slide.heading)
  drawSlideNum(s, n)
  const cw = 4.45
  const hasVerdict = !!slide.verdict
  const colH = hasVerdict ? H - 1.98 : H - 1.55
  s.addShape('rect', { x: 0.3, y: 1.08, w: cw, h: colH, fill: { color: 'FFFFFF' }, line: { color: T.accent, width: 1.2 }, shadow: mkShadow() })
  s.addShape('rect', { x: 0.3, y: 1.08, w: cw, h: 0.5, fill: { color: T.bg }, line: { type: 'none' } })
  s.addText(slide.left_heading || 'Option A', { x: 0.45, y: 1.08, w: cw - 0.3, h: 0.5, fontSize: 14, bold: true, color: 'FFFFFF', valign: 'middle' });
  (slide.left_bullets || []).slice(0, 5).forEach((b, i) => {
    s.addShape('oval', { x: 0.42, y: 1.7 + i * 0.65, w: 0.24, h: 0.24, fill: { color: T.card }, line: { type: 'none' } })
    s.addText(b, { x: 0.75, y: 1.66 + i * 0.65, w: cw - 0.55, h: 0.6, fontSize: 12, color: '1E293B', valign: 'middle', wrap: true })
  })
  s.addShape('rect', { x: 5.25, y: 1.08, w: cw, h: colH, fill: { color: T.bg }, line: { type: 'none' }, shadow: mkShadow() })
  s.addShape('rect', { x: 5.25, y: 1.08, w: cw, h: 0.5, fill: { color: T.accent }, line: { type: 'none' } })
  s.addText(slide.right_heading || 'Option B', { x: 5.4, y: 1.08, w: cw - 0.3, h: 0.5, fontSize: 14, bold: true, color: 'FFFFFF', valign: 'middle' });
  (slide.right_bullets || []).slice(0, 5).forEach((b, i) => {
    s.addShape('oval', { x: 5.35, y: 1.7 + i * 0.65, w: 0.24, h: 0.24, fill: { color: T.accent, transparency: 40 }, line: { type: 'none' } })
    s.addText(b, { x: 5.68, y: 1.66 + i * 0.65, w: cw - 0.55, h: 0.6, fontSize: 12, color: 'E2E8F0', valign: 'middle', wrap: true })
  })
  if (slide.verdict) {
    s.addShape('rect', { x: 0.3, y: H - 0.78, w: W - 0.6, h: 0.44, fill: { color: T.card }, line: { type: 'none' } })
    s.addText('💡  ' + slide.verdict, { x: 0.45, y: H - 0.78, w: W - 0.9, h: 0.44, fontSize: 12, color: T.cardText, valign: 'middle', italic: true, wrap: true })
  }
}

// ── timeline ───────────────────────────────────────────────────────────────────
function renderTimeline(s, slide, T, n) {
  s.background = { color: T.bg }
  drawHeader(s, T, slide.heading)
  drawSlideNum(s, n)
  const steps = (slide.steps || []).slice(0, 4)
  const sw = (W - 0.6) / steps.length
  steps.forEach((step, i) => {
    const x = 0.3 + i * sw
    const isLast = i === steps.length - 1
    s.addShape('rect', { x, y: 1.1, w: sw - 0.1, h: H - 1.55, fill: { color: isLast ? T.accent2 : 'FFFFFF' }, line: { color: isLast ? T.accent2 : 'E2E8F0', width: 0.5 }, shadow: mkShadow() })
    s.addShape('oval', { x: x + (sw - 0.1) / 2 - 0.38, y: 1.22, w: 0.76, h: 0.76, fill: { color: isLast ? 'FFFFFF' : T.bg }, line: { type: 'none' } })
    s.addText(step.number || String(i + 1), { x: x + (sw - 0.1) / 2 - 0.38, y: 1.22, w: 0.76, h: 0.76, fontSize: 18, bold: true, color: isLast ? T.accent2 : 'FFFFFF', align: 'center', valign: 'middle', fontFace: 'Arial Black' })
    if (!isLast) s.addText('▶', { x: x + sw - 0.16, y: 1.5, w: 0.18, h: 0.4, fontSize: 12, color: T.accent, align: 'center' })
    s.addText(step.title || '', { x: x + 0.1, y: 2.1, w: sw - 0.3, h: 0.55, fontSize: 12, bold: true, color: isLast ? 'FFFFFF' : T.text, align: 'center', wrap: true })
    s.addShape('rect', { x: x + (sw - 0.1) * 0.25, y: 2.7, w: (sw - 0.1) * 0.5, h: 0.04, fill: { color: isLast ? 'FFFFFF' : T.accent }, line: { type: 'none' } })
    s.addText(step.description || '', { x: x + 0.1, y: 2.8, w: sw - 0.3, h: H - 3.32, fontSize: 11, color: isLast ? 'F0F9FF' : '374151', wrap: true, valign: 'top' })
  })
}

// ── quote_focus ────────────────────────────────────────────────────────────────
function renderQuoteFocus(s, slide, T, n) {
  s.background = { color: T.bg }
  s.addShape('oval', { x: -2, y: -2, w: 6, h: 6, fill: { color: T.accent, transparency: 92 }, line: { type: 'none' } })
  s.addShape('oval', { x: 7, y: 2, w: 5, h: 5, fill: { color: T.accent, transparency: 92 }, line: { type: 'none' } })
  drawSlideNum(s, n)
  if (slide.heading) {
    s.addShape('rect', { x: 0, y: 0, w: W, h: 0.52, fill: { color: T.dark }, line: { type: 'none' } })
    s.addText(slide.heading, { x: 0.3, y: 0, w: W - 0.6, h: 0.52, fontSize: 13, color: T.accent, valign: 'middle', bold: true })
  }
  s.addText('\u201C', { x: 0.3, y: 0.55, w: 1.2, h: 1.1, fontSize: 80, color: T.accent, transparency: 40, fontFace: 'Arial Black' })
  s.addText(slide.quote || '', { x: 0.8, y: 1.05, w: 8.4, h: 2.1, fontSize: 21, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', wrap: true, italic: true })
  s.addShape('rect', { x: 3.5, y: 3.25, w: 3.0, h: 0.06, fill: { color: T.accent }, line: { type: 'none' } })
  if (slide.author) s.addText('— ' + slide.author, { x: 0.5, y: 3.38, w: W - 1, h: 0.38, fontSize: 13, color: T.accent, align: 'center', italic: true })
  if (slide.explanation) {
    s.addShape('rect', { x: 0.5, y: 3.88, w: W - 1, h: 0.52, fill: { color: T.accent, transparency: 88 }, line: { type: 'none' } })
    s.addText(slide.explanation, { x: 0.65, y: 3.88, w: W - 1.3, h: 0.52, fontSize: 12, color: 'CBD5E1', valign: 'middle', wrap: true, align: 'center' })
  }
}

// ── checklist ──────────────────────────────────────────────────────────────────
function renderChecklist(s, slide, T, n) {
  s.background = { color: 'F8FAFC' }
  drawHeader(s, T, slide.heading)
  drawSlideNum(s, n)
  const cw = 4.45
  s.addShape('rect', { x: 0.3, y: 1.08, w: cw, h: H - 1.55, fill: { color: 'F0FDF4' }, line: { color: '86EFAC', width: 0.8 }, shadow: mkShadow() })
  s.addShape('rect', { x: 0.3, y: 1.08, w: cw, h: 0.48, fill: { color: '16A34A' }, line: { type: 'none' } })
  s.addText(slide.left_heading || '✅ Do This', { x: 0.45, y: 1.08, w: cw - 0.3, h: 0.48, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' });
  (slide.left_items || []).slice(0, 5).forEach((item, i) => {
    s.addText('✓', { x: 0.42, y: 1.68 + i * 0.65, w: 0.3, h: 0.55, fontSize: 14, bold: true, color: '16A34A', valign: 'middle' })
    s.addText(item, { x: 0.76, y: 1.65 + i * 0.65, w: cw - 0.6, h: 0.58, fontSize: 12, color: '14532D', valign: 'middle', wrap: true })
  })
  s.addShape('rect', { x: 5.25, y: 1.08, w: cw, h: H - 1.55, fill: { color: 'FFF1F2' }, line: { color: 'FCA5A5', width: 0.8 }, shadow: mkShadow() })
  s.addShape('rect', { x: 5.25, y: 1.08, w: cw, h: 0.48, fill: { color: 'DC2626' }, line: { type: 'none' } })
  s.addText(slide.right_heading || '❌ Avoid This', { x: 5.4, y: 1.08, w: cw - 0.3, h: 0.48, fontSize: 13, bold: true, color: 'FFFFFF', valign: 'middle' });
  (slide.right_items || []).slice(0, 5).forEach((item, i) => {
    s.addText('✗', { x: 5.37, y: 1.68 + i * 0.65, w: 0.3, h: 0.55, fontSize: 14, bold: true, color: 'DC2626', valign: 'middle' })
    s.addText(item, { x: 5.7, y: 1.65 + i * 0.65, w: cw - 0.6, h: 0.58, fontSize: 12, color: '7F1D1D', valign: 'middle', wrap: true })
  })
}

// ── case_study ─────────────────────────────────────────────────────────────────
function renderCaseStudy(s, slide, T, n) {
  s.background = { color: 'F8FAFC' }
  drawHeader(s, T, slide.heading || 'Real World Case Study')
  drawSlideNum(s, n)
  s.addShape('rect', { x: 0.3, y: 1.08, w: W - 0.6, h: 0.44, fill: { color: T.bg }, line: { type: 'none' } })
  s.addText('📌  ' + (slide.case_name || ''), { x: 0.45, y: 1.08, w: W - 0.9, h: 0.44, fontSize: 14, bold: true, color: T.accent, valign: 'middle' })
  const sections = [
    { label: 'SITUATION', icon: '🔍', text: slide.situation || '', color: 'EFF6FF', border: '93C5FD', textColor: '1E3A8A' },
    { label: 'ACTION', icon: '⚡', text: slide.action || '', color: 'F0FDF4', border: '86EFAC', textColor: '14532D' },
    { label: 'RESULT', icon: '📈', text: slide.result || '', color: 'FEF9C3', border: 'FDE047', textColor: '713F12' },
    { label: 'KEY LESSON', icon: '💡', text: slide.lesson || '', color: 'FAE8FF', border: 'E879F9', textColor: '701A75' },
  ]
  const sw = (W - 0.7) / 2
  sections.forEach((sec, i) => {
    const x = 0.3 + (i % 2) * (sw + 0.1)
    const y = 1.62 + Math.floor(i / 2) * 1.82
    s.addShape('rect', { x, y, w: sw, h: 1.7, fill: { color: sec.color }, line: { color: sec.border, width: 0.5 }, shadow: mkShadow() })
    s.addText(sec.icon + '  ' + sec.label, { x: x + 0.1, y: y + 0.06, w: sw - 0.2, h: 0.32, fontSize: 10, bold: true, color: sec.textColor, charSpacing: 0.5 })
    s.addShape('rect', { x: x + 0.1, y: y + 0.4, w: sw - 0.2, h: 0.03, fill: { color: sec.border }, line: { type: 'none' } })
    s.addText(sec.text, { x: x + 0.1, y: y + 0.48, w: sw - 0.2, h: 1.15, fontSize: 11, color: sec.textColor, wrap: true, valign: 'top' })
  })
}

// ── closing ────────────────────────────────────────────────────────────────────
function renderClosing(s, slide, T) {
  s.background = { color: T.bg }
  s.addShape('oval', { x: -2.5, y: -2.5, w: 7, h: 7, fill: { color: T.accent, transparency: 90 }, line: { type: 'none' } })
  s.addShape('oval', { x: 7.5, y: 2.0, w: 6, h: 6, fill: { color: T.accent, transparency: 90 }, line: { type: 'none' } })
  s.addShape('rect', { x: 0, y: 0, w: 0.14, h: H, fill: { color: T.accent }, line: { type: 'none' } })
  s.addText(slide.heading || 'Thank You!', { x: 0.5, y: 0.6, w: 9, h: 1.8, fontSize: 62, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial Black' })
  s.addShape('rect', { x: 3.0, y: 2.5, w: 4.0, h: 0.07, fill: { color: T.accent }, line: { type: 'none' } })
  if (slide.subheading) s.addText(slide.subheading, { x: 0.5, y: 2.65, w: 9, h: 0.6, fontSize: 17, color: T.accent, align: 'center', italic: true, wrap: true })
  if (slide.key_takeaways?.length) {
    s.addText('KEY TAKEAWAYS', { x: 0.8, y: 3.38, w: 8.4, h: 0.28, fontSize: 10, color: '94A3B8', align: 'center', charSpacing: 1.5, bold: true })
    slide.key_takeaways.slice(0, 3).forEach((pt, i) => {
      s.addShape('oval', { x: 0.8, y: 3.74 + i * 0.42, w: 0.26, h: 0.26, fill: { color: T.accent, transparency: 22 }, line: { type: 'none' } })
      s.addText(pt, { x: 1.15, y: 3.72 + i * 0.42, w: 8.1, h: 0.36, fontSize: 12, color: 'CBD5E1', valign: 'middle', wrap: true })
    })
  }
  s.addShape('rect', { x: 0, y: H - 0.52, w: W, h: 0.52, fill: { color: T.dark }, line: { type: 'none' } })
  s.addText('Powered by HackMate AI', { x: 0.5, y: H - 0.52, w: W - 1, h: 0.52, fontSize: 9, color: T.accent, align: 'center', valign: 'middle' })
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────
export async function generatePitchPPT(jsonData, fallbackName = 'Presentation') {
  const PptxGenJS = (await import('pptxgenjs')).default
  const prs = new PptxGenJS()
  prs.layout = 'LAYOUT_16x9'

  let data = jsonData
  if (typeof jsonData === 'string') {
    try {
      // Remove markdown fences
      let clean = jsonData.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      // Extract JSON object boundaries
      const start = clean.indexOf('{')
      const end = clean.lastIndexOf('}')
      if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1)
      // Fix trailing commas before ] or }
      clean = clean.replace(/,\s*([}\]])/g, '$1')
      data = JSON.parse(clean)
    } catch {
      // Try extracting just the JSON block
      const m = jsonData.match(/\{[\s\S]*\}/)
      if (m) {
        try {
          let attempt = m[0].replace(/,\s*([}\]])/g, '$1')
          data = JSON.parse(attempt)
        } catch {
          throw new Error('AI returned invalid JSON. Please click Regenerate and try again.')
        }
      } else {
        throw new Error('AI response is not valid JSON. Please click Regenerate.')
      }
    }
  }

  const T = THEMES[data.theme] || THEMES.default
  const slides = data.slides || []

  slides.forEach((slide, idx) => {
    const s = prs.addSlide()
    const n = idx + 1
    switch (slide.layout) {
      case 'title':        renderTitle(s, slide, T); break
      case 'two_column':   renderTwoColumn(s, slide, T, n); break
      case 'three_cards':  renderThreeCards(s, slide, T, n); break
      case 'big_stat':     renderBigStat(s, slide, T, n); break
      case 'comparison':   renderComparison(s, slide, T, n); break
      case 'timeline':     renderTimeline(s, slide, T, n); break
      case 'quote_focus':  renderQuoteFocus(s, slide, T, n); break
      case 'checklist':    renderChecklist(s, slide, T, n); break
      case 'case_study':   renderCaseStudy(s, slide, T, n); break
      case 'closing':      renderClosing(s, slide, T); break
      default:             renderBullets(s, slide, T, n); break
    }
  })

  const fileName = (data.title || fallbackName).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_')
  await prs.writeFile({ fileName: `${fileName}_Presentation.pptx` })
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
      console.error('PPT error:', err)
      setError('Failed: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={handleDownload}
        disabled={loading || !aiOutput}
        style={{
          padding: '13px 20px', color: 'white', border: 'none', borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
          background: done ? '#16a34a' : loading ? '#6b7280' : 'linear-gradient(135deg, #7c3aed 0%, #e11d48 100%)',
          transition: 'all 0.2s', letterSpacing: '0.3px',
        }}
      >
        {done ? '✅ PPT Downloaded!' : loading ? '⏳ Building your PPT...' : '📥 Download Professional PPT'}
      </button>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{error}</p>}
    </div>
  )
}