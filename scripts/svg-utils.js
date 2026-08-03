const COLORS = {
  bg: '#09090B',
  border: '#22D3EE',
  header: '#22D3EE',
  label: '#94A3B8',
  value: '#F8FAFC',
  accent: '#10B981',
  separator: '#334155'
};

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Default: '#94A3B8'
};

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createCard(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      @font-face { font-family: 'JetBrains Mono'; src: local('JetBrains Mono'), local('IBM Plex Mono'), local('Fira Code'), local('SF Mono'), local('Menlo'); }
      text { font-family: 'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'SF Mono', 'Menlo', monospace; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" rx="16" fill="${COLORS.bg}"/>
  <rect width="${width}" height="${height}" rx="16" fill="none" stroke="${COLORS.border}" stroke-width="1.5"/>`;
}

function createSectionTitle(y, title) {
  return `<text x="32" y="${y}" font-size="13" fill="${COLORS.header}" font-weight="700" letter-spacing="1.5">${escapeXml(title)}</text>`;
}

function createMetricRow(y, label, value) {
  return `<text x="32" y="${y}" font-size="11" fill="${COLORS.label}">${escapeXml(label)}</text>
  <text x="160" y="${y}" font-size="12" fill="${COLORS.value}">${escapeXml(String(value))}</text>`;
}

function createSeparator(y, width) {
  return `<line x1="32" y1="${y}" x2="${width - 32}" y2="${y}" stroke="${COLORS.separator}" stroke-width="0.5"/>`;
}

function getLangColor(name) {
  return LANG_COLORS[name] || LANG_COLORS.Default;
}

module.exports = { COLORS, LANG_COLORS, escapeXml, createCard, createSectionTitle, createMetricRow, createSeparator, getLangColor };
