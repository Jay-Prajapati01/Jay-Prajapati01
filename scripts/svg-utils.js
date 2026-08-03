// ─── Design Tokens ──────────────────────────────────────────────────────────

const COLORS = {
  bg:          '#09090B',
  surface:     '#0F172A',
  border:      '#1E293B',
  accent:      '#22D3EE',
  accentMuted: '#0E7490',
  positive:    '#14B8A6',
  label:       '#64748B',
  sublabel:    '#475569',
  value:       '#F1F5F9',
  dim:         '#334155',
  separator:   '#1E293B'
};

const LANG_COLORS = {
  JavaScript:       '#F7DF1E',
  TypeScript:       '#3178C6',
  Python:           '#3572A5',
  Java:             '#B07219',
  'C++':            '#F34B7D',
  C:                '#555555',
  Go:               '#00ADD8',
  Rust:             '#DEA584',
  Ruby:             '#701516',
  PHP:              '#4F5D95',
  Swift:            '#F05138',
  Kotlin:           '#A97BFF',
  Dart:             '#00B4AB',
  Shell:            '#89E051',
  HTML:             '#E34C26',
  CSS:              '#563D7C',
  'Jupyter Notebook': '#DA5B0B',
  PLpgSQL:          '#336791',
  CoffeeScript:     '#244776',
  Default:          '#475569'
};

const FONT  = `'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'SF Mono', 'Menlo', monospace`;
const FONT_FACE = `@font-face { font-family: 'JetBrains Mono'; src: local('JetBrains Mono'), local('IBM Plex Mono'), local('Fira Code'), local('SF Mono'), local('Menlo'); }`;

// ─── Utilities ───────────────────────────────────────────────────────────────

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getLangColor(name) {
  return LANG_COLORS[name] || LANG_COLORS.Default;
}

// ─── Layout Components ───────────────────────────────────────────────────────

/**
 * Opens an SVG with the card shell: background, border, font face.
 * Does NOT close the tag — caller appends content then calls closeCard().
 */
function openCard(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <defs>
    <style>
      ${FONT_FACE}
      text { font-family: ${FONT}; }
    </style>
  </defs>
  <!-- Card background -->
  <rect width="${width}" height="${height}" rx="16" fill="${COLORS.bg}"/>
  <!-- Card border -->
  <rect width="${width}" height="${height}" rx="16" fill="none" stroke="${COLORS.border}" stroke-width="1"/>`;
}

function closeCard() {
  return `\n</svg>`;
}

/**
 * Top header bar: dark surface strip with title + optional right-label.
 */
function createHeader(width, title, rightLabel = '') {
  const headerH = 48;
  let out = `
  <rect x="0" y="0" width="${width}" height="${headerH}" rx="16" fill="${COLORS.surface}"/>
  <rect x="0" y="${headerH - 16}" width="${width}" height="16" fill="${COLORS.surface}"/>
  <line x1="0" y1="${headerH}" x2="${width}" y2="${headerH}" stroke="${COLORS.separator}" stroke-width="1"/>
  <text x="32" y="31" font-size="14" fill="${COLORS.accent}" font-weight="700" letter-spacing="2">${escapeXml(title)}</text>`;
  if (rightLabel) {
    out += `
  <text x="${width - 32}" y="31" font-size="12" fill="${COLORS.label}" text-anchor="end" letter-spacing="0.5">${escapeXml(rightLabel)}</text>`;
  }
  return out;
}

/**
 * Horizontal separator line.
 */
function createSeparator(y, width, padX = 32) {
  return `
  <line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="${COLORS.separator}" stroke-width="1"/>`;
}

/**
 * Section label (category heading inside card body).
 */
function createSectionTitle(y, title) {
  return `
  <text x="32" y="${y}" font-size="11" fill="${COLORS.accentMuted}" font-weight="700" letter-spacing="2">${escapeXml(title.toUpperCase())}</text>`;
}

/**
 * Two-column metric row: label left, value right-aligned at valueX.
 */
function createMetricRow(y, label, value, valueX = 280) {
  return `
  <text x="32" y="${y}" font-size="14" fill="${COLORS.label}">${escapeXml(label)}</text>
  <text x="${valueX}" y="${y}" font-size="15" fill="${COLORS.value}" font-weight="600" text-anchor="end">${escapeXml(String(value))}</text>`;
}

/**
 * Full-width progress bar with background track.
 * @param {number} x         left edge
 * @param {number} y         top edge
 * @param {number} totalW    total bar width
 * @param {number} fillW     filled portion width
 * @param {string} color     fill color
 * @param {number} h         bar height
 */
function createProgressBar(x, y, totalW, fillW, color, h = 6) {
  const safeW = Math.max(0, Math.min(fillW, totalW));
  return `
  <rect x="${x}" y="${y}" width="${totalW}" height="${h}" rx="${h / 2}" fill="${COLORS.dim}"/>
  <rect x="${x}" y="${y}" width="${safeW}" height="${h}" rx="${h / 2}" fill="${color}"/>`;
}

/**
 * Segmented bar (for language breakdown).
 * segments: [{color, fraction}]  fractions must sum to ≤ 1
 */
function createSegmentedBar(x, y, totalW, segments, h = 8) {
  let out = `
  <rect x="${x}" y="${y}" width="${totalW}" height="${h}" rx="${h / 2}" fill="${COLORS.dim}"/>`;
  let cursor = x;
  for (let i = 0; i < segments.length; i++) {
    const w = Math.max(0, segments[i].fraction * totalW);
    const rx = i === 0 ? `${h / 2}` : '0';
    const rxRight = i === segments.length - 1 ? `${h / 2}` : '0';
    out += `
  <rect x="${cursor.toFixed(2)}" y="${y}" width="${w.toFixed(2)}" height="${h}" rx="${rx}" fill="${segments[i].color}"/>`;
    cursor += w;
  }
  return out;
}

/**
 * Dot + language name + percentage legend item.
 */
function createLangLegendItem(x, y, name, percentage, color) {
  return `
  <rect x="${x}" y="${y - 6}" width="10" height="10" rx="2" fill="${color}"/>
  <text x="${x + 18}" y="${y + 2}" font-size="13" fill="${COLORS.value}">${escapeXml(name)}</text>
  <text x="${x + 18}" y="${y + 18}" font-size="12" fill="${COLORS.label}">${escapeXml(percentage)}%</text>`;
}

/**
 * Footer bar with centered timestamp text.
 */
function createFooter(width, height, dateStr) {
  const footerY = height - 36;
  return `
  <line x1="0" y1="${footerY}" x2="${width}" y2="${footerY}" stroke="${COLORS.separator}" stroke-width="1"/>
  <text x="${width / 2}" y="${height - 14}" text-anchor="middle" font-size="11" fill="${COLORS.sublabel}" letter-spacing="0.5">Updated ${escapeXml(dateStr)} · jay-prajapati01 · github-actions</text>`;
}

// ─── Legacy shim (keeps generate-engineering-stats.js working) ───────────────

/** @deprecated — use openCard() instead */
function createCard(width, height) {
  return openCard(width, height);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  COLORS,
  LANG_COLORS,
  escapeXml,
  getLangColor,
  openCard,
  closeCard,
  createCard,      // legacy shim
  createHeader,
  createSeparator,
  createSectionTitle,
  createMetricRow,
  createProgressBar,
  createSegmentedBar,
  createLangLegendItem,
  createFooter
};
