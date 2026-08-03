'use strict';

const fs   = require('fs');
const path = require('path');

const { getRawContributionData } = require('./github-api');
const { processContributionData, formatDate } = require('./contribution-service');
const { openCard, closeCard, createHeader, createFooter, COLORS, escapeXml } = require('./svg-utils');

const WIDTH  = 980;
const HEIGHT = 280;
const PAD    = 40;

// ─── Icon functions (accept variable scale) ─────────────────────────────────

function iconContribution(x, y, color, scale) {
  // Native bounding: x 1–10, y 1–10 → ~11×11 native
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <rect x="1" y="1" width="4" height="4" rx="0.5" fill="${color}" opacity="0.4"/>
    <rect x="6" y="1" width="4" height="4" rx="0.5" fill="${color}" opacity="0.7"/>
    <rect x="1" y="6" width="4" height="4" rx="0.5" fill="${color}"/>
    <rect x="6" y="6" width="4" height="4" rx="0.5" fill="${color}" opacity="0.5"/>
  </g>`;
}

function iconFlame(x, y, color, scale) {
  // Native bounding: x 4.5–8, y 1–8 → center-x ≈ 6.25, height ≈ 7
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <path d="M6 1C6 1 4.5 3.5 4.5 5.5C4.5 6.5 5 7.5 6 8C5 7 4.8 5.5 5.5 4.5C5.5 4.5 6 6 7 6.5C7 6.5 8 5.5 8 4C8 2.5 6 1 6 1Z" fill="${color}">
      <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
    </path>
  </g>`;
}

function iconTrophy(x, y, color, scale) {
  // Premium symmetric trophy SVG built inside a 24x24 box
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <!-- Cup Body -->
    <path d="M6 2h12v7c0 3.3-2.7 6-6 6s-6-2.7-6-6V2z" fill="${color}" />
    <!-- Pedestal & Base -->
    <path d="M10 15v4h-3v2h10v-2h-3v-4h-4z" fill="${color}" />
    <!-- Left Handle -->
    <path d="M6 4.5c-2.2 0-3.5 1.2-3.5 3s1.3 3 3.5 3" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" />
    <!-- Right Handle -->
    <path d="M18 4.5c2.2 0 3.5 1.2 3.5 3s-1.3 3-3.5 3" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" />
  </g>`;
}

// ─── SVG Builder ─────────────────────────────────────────────────────────────

function buildStreakSVG(stats) {
  const today = new Date().toISOString().split('T')[0];

  let svg = openCard(WIDTH, HEIGHT);

  svg += createHeader(WIDTH, 'CONTRIBUTION.STREAK', today);

  const colW  = Math.floor((WIDTH - PAD * 2) / 3);
  const col1X = PAD;
  const col2X = PAD + colW;
  const col3X = PAD + colW * 2;

  const c1Mid = col1X + colW / 2;
  const c2Mid = col2X + colW / 2;
  const c3Mid = col3X + colW / 2;

  // Vertical dividers
  svg += `
  <line x1="${col2X}" y1="55" x2="${col2X}" y2="${HEIGHT - 42}" stroke="${COLORS.separator}" stroke-width="1"/>
  <line x1="${col3X}" y1="55" x2="${col3X}" y2="${HEIGHT - 42}" stroke="${COLORS.separator}" stroke-width="1"/>`;

  // ─── Column 1: Total Contributions ─────────────────────────────────────────
  // Grid icon: scale 3.8 → rendered ~42×42
  const gridScale = 3.8;
  const gridW = 11 * gridScale;
  const gridX = c1Mid - gridW / 2;
  svg += iconContribution(gridX, 56, COLORS.accent, gridScale);
  svg += `
  <text x="${c1Mid}" y="142" text-anchor="middle" font-size="44" fill="${COLORS.value}" font-weight="700">${stats.totalContributions}</text>
  <text x="${c1Mid}" y="176" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">TOTAL CONTRIBUTIONS</text>
  <text x="${c1Mid}" y="196" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.lastContributionDate ? 'Last: ' + escapeXml(formatDate(stats.lastContributionDate)) : '—'}</text>`;

  // ─── Column 2: Current Streak ──────────────────────────────────────────────
  const hasStreak = stats.currentStreak > 0;

  if (hasStreak) {
    const cx = c2Mid;
    const cy = 118;
    const r  = 50;
    const strokeW = 6;
    
    // Mathematical arc calculation for gap at 12 o'clock (opening from 288 degrees to 252 degrees)
    // x1 = cx + r*cos(288), y1 = cy + r*sin(288) -> (505.45, 70.45)
    // x2 = cx + r*cos(252), y2 = cy + r*sin(252) -> (474.55, 70.45)
    // Circumference of 324 degrees arc length = 2 * PI * 50 * (324/360) = 282.7
    const arcLength = 283;

    // Teal progress ring with top gap
    svg += `
    <path d="M 505.45 70.45 A 50 50 0 1 1 474.55 70.45" fill="none" stroke="#2DD4BF" stroke-width="${strokeW}" stroke-dasharray="${arcLength}" stroke-dashoffset="${arcLength}" stroke-linecap="round" opacity="0.95">
      <animate attributeName="stroke-dashoffset" from="${arcLength}" to="0" dur="1s" fill="freeze"/>
    </path>`;

    // Flame: scale 3.2 (rendered ~22.4px height)
    // Perfectly centered horizontally on 12 o'clock position (cx = 490)
    // Vertical center exactly at circle edge (y = 68). Native center y ≈ 4.5 -> y_t = 68 - 4.5 * 3.2 = 53.6
    const flameScale = 3.2;
    const flameX = cx - 6.25 * flameScale;  // 470
    const flameY = (cy - r) - 4.5 * flameScale;  // 53.6
    svg += iconFlame(flameX, flameY, '#F97316', flameScale);

    // Number centered inside the ring
    svg += `
    <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="44" fill="${COLORS.value}" font-weight="700">${stats.currentStreak}</text>`;

    // Label + date below the ring
    svg += `
    <text x="${c2Mid}" y="${cy + r + 26}" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">CURRENT STREAK</text>
    <text x="${c2Mid}" y="${cy + r + 44}" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.currentStart ? escapeXml(formatDate(stats.currentStart)) + ' — ' + escapeXml(formatDate(stats.currentEnd)) : '—'}</text>`;
  } else {
    // No streak -> same layout as columns 1 & 3 (no ring)
    const flameScale = 3.2;
    const flameX = c2Mid - 6.25 * flameScale;
    svg += iconFlame(flameX, 68, '#F97316', flameScale);
    svg += `
    <text x="${c2Mid}" y="142" text-anchor="middle" font-size="44" fill="${COLORS.value}" font-weight="700">${stats.currentStreak}</text>
    <text x="${c2Mid}" y="176" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">CURRENT STREAK</text>
    <text x="${c2Mid}" y="196" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.currentStart ? escapeXml(formatDate(stats.currentStart)) + ' — ' + escapeXml(formatDate(stats.currentEnd)) : '—'}</text>`;
  }

  // ─── Column 3: Longest Streak ──────────────────────────────────────────────
  // Trophy icon: scale 2.2 (rendered ~52.8x52.8) -> centered horizontally and vertically
  const trophyScale = 2.2;
  const trophyNativeSize = 24;
  const trophyX = c3Mid - (trophyNativeSize * trophyScale) / 2;
  svg += iconTrophy(trophyX, 52, '#EAB308', trophyScale);
  svg += `
  <text x="${c3Mid}" y="142" text-anchor="middle" font-size="44" fill="${COLORS.value}" font-weight="700">${stats.longestStreak}</text>
  <text x="${c3Mid}" y="176" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">LONGEST STREAK</text>
  <text x="${c3Mid}" y="196" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.longestStart ? escapeXml(formatDate(stats.longestStart)) + ' — ' + escapeXml(formatDate(stats.longestEnd)) : '—'}</text>`;

  // Footer
  svg += createFooter(WIDTH, HEIGHT, today);
  svg += closeCard();
  return svg;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function generate() {
  console.log('[streak] Loading data…');
  const rawContributions = await getRawContributionData();
  const stats = processContributionData(rawContributions);
  console.log('[streak] Streak stats:', stats);

  const svg     = buildStreakSVG(stats);
  const outPath = path.join(__dirname, '..', 'assets', 'contribution-streak.svg');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('[streak] Written:', outPath);
}

generate().catch(err => {
  console.error('[streak] Fatal:', err);
  process.exit(1);
});
