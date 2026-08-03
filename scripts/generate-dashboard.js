const fs = require('fs');
const path = require('path');
const { getAllRepos, getUser, getEvents, getLanguages } = require('./github-api');
const { processUserData, processLanguages } = require('./data-processor');
const { escapeXml, COLORS, getLangColor } = require('./svg-utils');

function createStreakCircle(cx, cy, radius, value, color) {
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / 30, 1);
  const dashoffset = circumference * (1 - progress);
  
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${COLORS.separator}" stroke-width="6"/>
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="6" 
    stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}" 
    stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="28" fill="${COLORS.value}" font-weight="700">${value}</text>
  <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="10" fill="${COLORS.label}">Current Streak</text>
  <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-size="9" fill="${COLORS.accent}">days</text>`;
}

async function generate() {
  try {
    console.log('Fetching GitHub data...');
    const [user, repos, events] = await Promise.all([
      getUser(),
      getAllRepos(),
      getEvents()
    ]);
    
    const stats = processUserData(user, repos, events);
    console.log('Stats processed:', stats);
    
    const langMap = await getLanguages(repos);
    const languages = processLanguages(langMap);
    console.log('Languages processed:', languages);
    
    const width = 980;
    const height = 520;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      @font-face { font-family: 'JetBrains Mono'; src: local('JetBrains Mono'), local('IBM Plex Mono'), local('Fira Code'), local('SF Mono'), local('Menlo'); }
      text { font-family: 'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'SF Mono', 'Menlo', monospace; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" rx="16" fill="${COLORS.bg}"/>
  <rect width="${width}" height="${height}" rx="16" fill="none" stroke="${COLORS.border}" stroke-width="1.5"/>`;
    
    // Top section: Contributions | Streak Circle | Longest Streak
    const topY = 60;
    
    // Left: Total Contributions
    svg += `
  <text x="160" y="${topY}" text-anchor="middle" font-size="42" fill="${COLORS.value}" font-weight="700">${stats.contributions}</text>
  <text x="160" y="${topY + 28}" text-anchor="middle" font-size="12" fill="${COLORS.label}">Total Contributions</text>
  <text x="160" y="${topY + 46}" text-anchor="middle" font-size="10" fill="${COLORS.separator}">${stats.firstContribution} - Present</text>`;
    
    // Center: Current Streak Circle
    svg += '\n  ' + createStreakCircle(width / 2, topY + 10, 52, stats.currentStreak, COLORS.accent);
    
    // Right: Longest Streak
    svg += `
  <text x="${width - 160}" y="${topY}" text-anchor="middle" font-size="42" fill="${COLORS.value}" font-weight="700">${stats.longestStreak}</text>
  <text x="${width - 160}" y="${topY + 28}" text-anchor="middle" font-size="12" fill="${COLORS.label}">Longest Streak</text>
  <text x="${width - 160}" y="${topY + 46}" text-anchor="middle" font-size="10" fill="${COLORS.separator}">days</text>`;
    
    // Separator line
    svg += `
  <line x1="32" y1="145" x2="${width - 32}" y2="145" stroke="${COLORS.separator}" stroke-width="0.5"/>`;
    
    // Bottom section: Left (Stats) | Right (Languages)
    const bottomY = 175;
    
    // Left side: GitHub Stats
    svg += `
  <text x="32" y="${bottomY}" font-size="14" fill="${COLORS.header}" font-weight="700" letter-spacing="1">GITHUB.STATS</text>`;
    
    const statsItems = [
      ['Total Stars Earned', stats.totalStars],
      ['Total Commits', stats.contributions],
      ['Total PRs', 'N/A'],
      ['Total Issues', 'N/A'],
      ['Contributed to (last year)', stats.publicRepos]
    ];
    
    let statsY = bottomY + 30;
    for (const [label, value] of statsItems) {
      svg += `
  <text x="32" y="${statsY}" font-size="12" fill="${COLORS.label}">• ${escapeXml(label)}</text>
  <text x="280" y="${statsY}" font-size="12" fill="${COLORS.value}">${escapeXml(String(value))}</text>`;
      statsY += 26;
    }
    
    // Right side: Most Used Languages
    svg += `
  <text x="520" y="${bottomY}" font-size="14" fill="${COLORS.header}" font-weight="700" letter-spacing="1">MOST.USED.LANGUAGES</text>`;
    
    // Language bar
    const barX = 520;
    const barY = bottomY + 20;
    const barWidth = width - 552;
    const barHeight = 14;
    
    svg += `
  <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="7" fill="${COLORS.separator}"/>`;
    
    let currentX = barX;
    for (const lang of languages) {
      const segWidth = (parseFloat(lang.percentage) / 100) * barWidth;
      svg += `
  <rect x="${currentX}" y="${barY}" width="${segWidth}" height="${barHeight}" rx="0" fill="${getLangColor(lang.name)}"/>`;
      currentX += segWidth;
    }
    
    // Language legend
    let langY = barY + 40;
    const col1X = 520;
    const col2X = 740;
    
    for (let i = 0; i < languages.length; i++) {
      const lang = languages[i];
      const x = i % 2 === 0 ? col1X : col2X;
      const y = langY + Math.floor(i / 2) * 28;
      
      svg += `
  <circle cx="${x}" cy="${y - 4}" r="5" fill="${getLangColor(lang.name)}"/>
  <text x="${x + 12}" y="${y}" font-size="11" fill="${COLORS.value}">${escapeXml(lang.name)} ${escapeXml(lang.percentage)}%</text>`;
    }
    
    // Footer
    svg += `
  <text x="${width / 2}" y="${height - 20}" text-anchor="middle" font-size="10" fill="${COLORS.separator}">Last updated: ${stats.lastUpdated} • Auto-generated by GitHub Dashboard</text>`;
    
    svg += '\n</svg>';
    
    const outPath = path.join(__dirname, '..', 'assets', 'github-dashboard.svg');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, svg);
    console.log('Generated:', outPath);
  } catch (error) {
    console.error('Failed to generate dashboard:', error);
    process.exit(1);
  }
}

generate();
