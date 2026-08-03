'use strict';

const fs   = require('fs');
const path = require('path');

const { getRawContributionData } = require('./github-api');
const { processContributionData, formatDate } = require('./contribution-service');
const { openCard, closeCard, createHeader, createFooter, COLORS, escapeXml } = require('./svg-utils');

const WIDTH  = 980;
const HEIGHT = 220;
const PAD    = 40;

function iconContribution(x, y, color, scale = 2.2) {
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <rect x="1" y="1" width="4" height="4" rx="0.5" fill="${color}" opacity="0.4"/>
    <rect x="6" y="1" width="4" height="4" rx="0.5" fill="${color}" opacity="0.7"/>
    <rect x="1" y="6" width="4" height="4" rx="0.5" fill="${color}"/>
    <rect x="6" y="6" width="4" height="4" rx="0.5" fill="${color}" opacity="0.5"/>
  </g>`;
}

function iconFlame(x, y, color, scale = 2.2) {
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <path d="M6 1C6 1 4.5 3.5 4.5 5.5C4.5 6.5 5 7.5 6 8C5 7 4.8 5.5 5.5 4.5C5.5 4.5 6 6 7 6.5C7 6.5 8 5.5 8 4C8 2.5 6 1 6 1Z" fill="${color}">
      <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
    </path>
  </g>`;
}

function iconTrophy(x, y, color, scale = 2.2) {
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <path d="M3 1h6v1h2v2c0 1-1 2-2 2h0c0 1-1 2-2 2v1h2v1H3v-1h2V6c-1 0-2-1-2-2H3c-1 0-2-1-2-2V2h2V1z" fill="${color}"/>
  </g>`;
}

function buildStreakSVG(stats) {
  const today = new Date().toISOString().split('T')[0];

  let svg = openCard(WIDTH, HEIGHT);

  svg += createHeader(WIDTH, 'CONTRIBUTION.STREAK', today);

  const colW     = Math.floor((WIDTH - PAD * 2) / 3);
  const col1X    = PAD;
  const col2X    = PAD + colW;
  const col3X    = PAD + colW * 2;
  
  const c1Mid = col1X + colW / 2;
  const c2Mid = col2X + colW / 2;
  const c3Mid = col3X + colW / 2;

  svg += `
  <line x1="${col2X}" y1="64" x2="${col2X}" y2="${HEIGHT - 50}" stroke="${COLORS.separator}" stroke-width="1"/>
  <line x1="${col3X}" y1="64" x2="${col3X}" y2="${HEIGHT - 50}" stroke="${COLORS.separator}" stroke-width="1"/>`;

  // Column 1: Total Contributions
  const c1IconX = c1Mid - (11 * 2.2) / 2;
  svg += iconContribution(c1IconX, 60, COLORS.accent, 2.2);
  svg += `
  <text x="${c1Mid}" y="110" text-anchor="middle" font-size="36" fill="${COLORS.value}" font-weight="700">${stats.totalContributions}</text>
  <text x="${c1Mid}" y="148" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">TOTAL CONTRIBUTIONS</text>
  <text x="${c1Mid}" y="166" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.lastContributionDate ? 'Last: ' + escapeXml(formatDate(stats.lastContributionDate)) : '—'}</text>`;

  // Column 2: Current Streak
  const hasStreak = stats.currentStreak > 0;
  
  if (hasStreak) {
    // Enclosing circle ring: cx = c2Mid (490), cy = 92, r = 44
    // Circumference = 2 * PI * 44 = ~276.46
    svg += `
    <circle cx="${c2Mid}" cy="92" r="44" fill="none" stroke="#2DD4BF" stroke-width="5" stroke-dasharray="277" stroke-dashoffset="277" stroke-linecap="round">
      <animate attributeName="stroke-dashoffset" from="277" to="0" dur="1s" fill="freeze" />
    </circle>`;
    
    // Flame icon positioned at the top of the ring (slightly overlapping upper edge)
    // Horizontal center: 490 - (6.2 * 2.2) = 476.36
    // Top of ring is 48. Align bottom of flame (native y=8) to 48: 48 - (8 * 2.2) = 30.4
    const c2FlameX = c2Mid - 13.64;
    svg += iconFlame(c2FlameX, 30.4, '#F97316', 2.2);
    
    svg += `
    <text x="${c2Mid}" y="104" text-anchor="middle" font-size="36" fill="${COLORS.value}" font-weight="700">${stats.currentStreak}</text>
    <text x="${c2Mid}" y="156" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">CURRENT STREAK</text>
    <text x="${c2Mid}" y="174" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.currentStart ? escapeXml(formatDate(stats.currentStart)) + ' — ' + escapeXml(formatDate(stats.currentEnd)) : '—'}</text>`;
  } else {
    // Normal layout if streak is 0 (no circle)
    const c2FlameX = c2Mid - 13.64;
    svg += iconFlame(c2FlameX, 60, '#F97316', 2.2);
    svg += `
    <text x="${c2Mid}" y="110" text-anchor="middle" font-size="36" fill="${COLORS.value}" font-weight="700">${stats.currentStreak}</text>
    <text x="${c2Mid}" y="148" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">CURRENT STREAK</text>
    <text x="${c2Mid}" y="166" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.currentStart ? escapeXml(formatDate(stats.currentStart)) + ' — ' + escapeXml(formatDate(stats.currentEnd)) : '—'}</text>`;
  }

  // Column 3: Longest Streak
  const c3IconX = c3Mid - (10 * 2.2) / 2;
  svg += iconTrophy(c3IconX, 60, '#EAB308', 2.2);
  svg += `
  <text x="${c3Mid}" y="110" text-anchor="middle" font-size="36" fill="${COLORS.value}" font-weight="700">${stats.longestStreak}</text>
  <text x="${c3Mid}" y="148" text-anchor="middle" font-size="12" fill="${COLORS.label}" letter-spacing="1">LONGEST STREAK</text>
  <text x="${c3Mid}" y="166" text-anchor="middle" font-size="10" fill="${COLORS.dim}">${stats.longestStart ? escapeXml(formatDate(stats.longestStart)) + ' — ' + escapeXml(formatDate(stats.longestEnd)) : '—'}</text>`;

  svg += createFooter(WIDTH, HEIGHT, today);
  svg += closeCard();
  return svg;
}

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
