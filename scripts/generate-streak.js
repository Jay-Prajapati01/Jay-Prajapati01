'use strict';

const fs   = require('fs');
const path = require('path');

const { getContributionCalendar } = require('./github-api');
const { calculateStreaks, formatDate } = require('./streak-service');
const { openCard, closeCard, createHeader, createFooter, createSeparator, COLORS, escapeXml } = require('./svg-utils');

// ─── Layout ──────────────────────────────────────────────────────────────────
const WIDTH  = 980;
const HEIGHT = 220;
const PAD    = 40;

// ─── SVG Icons (inline path data) ───────────────────────────────────────────

function iconContribution(x, y, color) {
  // Grid / activity icon
  return `<g transform="translate(${x},${y}) scale(1.4)">
    <rect x="1" y="1" width="4" height="4" rx="0.5" fill="${color}" opacity="0.4"/>
    <rect x="6" y="1" width="4" height="4" rx="0.5" fill="${color}" opacity="0.7"/>
    <rect x="1" y="6" width="4" height="4" rx="0.5" fill="${color}"/>
    <rect x="6" y="6" width="4" height="4" rx="0.5" fill="${color}" opacity="0.5"/>
  </g>`;
}

function iconFlame(x, y, color) {
  // Flame / fire icon
  return `<g transform="translate(${x},${y}) scale(1.3)">
    <path d="M6 1C6 1 4.5 3.5 4.5 5.5C4.5 6.5 5 7.5 6 8C5 7 4.8 5.5 5.5 4.5C5.5 4.5 6 6 7 6.5C7 6.5 8 5.5 8 4C8 2.5 6 1 6 1Z" fill="${color}">
      <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
    </path>
  </g>`;
}

function iconTrophy(x, y, color) {
  // Trophy icon
  return `<g transform="translate(${x},${y}) scale(1.3)">
    <path d="M3 1h6v1h2v2c0 1-1 2-2 2h0c0 1-1 2-2 2v1h2v1H3v-1h2V6c-1 0-2-1-2-2H3c-1 0-2-1-2-2V2h2V1z" fill="${color}"/>
  </g>`;
}

// ─── SVG Builder ─────────────────────────────────────────────────────────────

function buildStreakSVG(stats) {
  const today = new Date().toISOString().split('T')[0];

  let svg = openCard(WIDTH, HEIGHT);

  // Header
  svg += createHeader(WIDTH, 'CONTRIBUTION.STREAK', today);

  // ─── Three-column layout ───────────────────────────────────────────────────
  const colW     = Math.floor((WIDTH - PAD * 2) / 3);
  const col1X    = PAD;
  const col2X    = PAD + colW;
  const col3X    = PAD + colW * 2;
  const centerY  = 110; // vertical center for big numbers
  const labelY   = centerY + 38;
  const subY     = labelY + 18;

  // Vertical dividers
  svg += `
  <line x1="${col2X}" y1="64" x2="${col2X}" y2="${HEIGHT - 50}" stroke="${COLORS.separator}" stroke-width="1"/>
  <line x1="${col3X}" y1="64" x2="${col3X}" y2="${HEIGHT - 50}" stroke="${COLORS.separator}" stroke-width="1"/>`;

  // ─── Column 1: Total Contributions ─────────────────────────────────────────
  const c1Mid = col1X + colW / 2;

  svg += iconContribution(c1Mid - 8, 68, COLORS.accent);
  svg += `
  <text x="${c1Mid}" y="${centerY}" text-anchor="middle" font-size="36" fill="${COLORS.value}" font-weight="700">${stats.totalContributions}</text>
  <text x="${c1Mid}" y="${labelY}" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">TOTAL CONTRIBUTIONS</text>
  <text x="${c1Mid}" y="${subY}" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${formatDate(stats.lastContributionDate) !== '—' ? 'Last: ' + escapeXml(formatDate(stats.lastContributionDate)) : ''}</text>`;

  // ─── Column 2: Current Streak ──────────────────────────────────────────────
  const c2Mid = col2X + colW / 2;

  svg += iconFlame(c2Mid - 6, 66, '#F97316');
  svg += `
  <text x="${c2Mid}" y="${centerY}" text-anchor="middle" font-size="36" fill="${COLORS.value}" font-weight="700">${stats.currentStreak}</text>
  <text x="${c2Mid}" y="${labelY}" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">CURRENT STREAK</text>
  <text x="${c2Mid}" y="${subY}" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.currentStart ? escapeXml(formatDate(stats.currentStart)) + ' — ' + escapeXml(formatDate(stats.currentEnd)) : ''}</text>`;

  // ─── Column 3: Longest Streak ──────────────────────────────────────────────
  const c3Mid = col3X + colW / 2;

  svg += iconTrophy(c3Mid - 7, 68, '#EAB308');
  svg += `
  <text x="${c3Mid}" y="${centerY}" text-anchor="middle" font-size="36" fill="${COLORS.value}" font-weight="700">${stats.longestStreak}</text>
  <text x="${c3Mid}" y="${labelY}" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">LONGEST STREAK</text>
  <text x="${c3Mid}" y="${subY}" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.longestStart ? escapeXml(formatDate(stats.longestStart)) + ' — ' + escapeXml(formatDate(stats.longestEnd)) : ''}</text>`;

  // Footer
  svg += createFooter(WIDTH, HEIGHT, today);

  svg += closeCard();
  return svg;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function generate() {
  console.log('[streak] Fetching contribution calendar…');

  const calendar = await getContributionCalendar();

  if (!calendar) {
    console.error('[streak] Could not fetch contribution calendar. Generating empty card.');
  }

  const stats = calculateStreaks(calendar);
  console.log('[streak] Stats:', stats);

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
