const fs = require('fs');
const path = require('path');
const { getAllRepos, getLanguages } = require('./github-api');
const { processLanguages } = require('./data-processor');
const { createCard, escapeXml, COLORS, getLangColor } = require('./svg-utils');

async function generate() {
  try {
    console.log('Fetching repository data...');
    const repos = await getAllRepos();
    
    console.log('Fetching language data...');
    const langMap = await getLanguages(repos);
    const languages = processLanguages(langMap);
    console.log('Languages processed:', languages);
    
    const width = 580;
    const barHeight = 24;
    const rowHeight = 60;
    const startY = 85;
    const height = startY + (languages.length * rowHeight) + 40;
    
    let svg = createCard(width, height);
    
    svg += `\n  <text x="32" y="48" font-size="13" fill="${COLORS.header}" font-weight="700" letter-spacing="1.5">${escapeXml('TOP.LANGUAGES')}</text>`;
    svg += `\n  <line x1="32" y1="58" x2="${width - 32}" y2="58" stroke="${COLORS.separator}" stroke-width="0.5"/>`;
    
    let y = startY;
    for (const lang of languages) {
      const color = getLangColor(lang.name);
      const barWidth = (parseFloat(lang.percentage) / 100) * (width - 200);
      
      svg += `\n  <text x="32" y="${y}" font-size="12" fill="${COLORS.value}">${escapeXml(lang.name)}</text>`;
      svg += `\n  <text x="${width - 32}" y="${y}" font-size="11" fill="${COLORS.label}" text-anchor="end">${escapeXml(lang.percentage)}%</text>`;
      svg += `\n  <rect x="32" y="${y + 10}" width="${width - 64}" height="${barHeight}" rx="4" fill="${COLORS.separator}"/>`;
      svg += `\n  <rect x="32" y="${y + 10}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}"/>`;
      
      y += rowHeight;
    }
    
    svg += '\n</svg>';
    
    const outPath = path.join(__dirname, '..', 'assets', 'top-languages.svg');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, svg);
    console.log('Generated:', outPath);
  } catch (error) {
    console.error('Failed to generate language stats:', error);
    process.exit(1);
  }
}

generate();
