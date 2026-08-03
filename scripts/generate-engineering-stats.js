const fs = require('fs');
const path = require('path');
const { getAllRepos, getUser, getContributions } = require('./github-api');
const { processUserData } = require('./data-processor');
const { createCard, createSectionTitle, createMetricRow, createSeparator, escapeXml, COLORS } = require('./svg-utils');

async function generate() {
  try {
    console.log('Fetching GitHub data...');
    const [user, repos, contributions] = await Promise.all([
      getUser(),
      getAllRepos(),
      getContributions()
    ]);
    
    const stats = processUserData(user, repos, 0, 0, contributions);
    console.log('Stats processed:', stats);
    
    const width = 580;
    const height = 480;
    
    let svg = createCard(width, height);
    
    svg += `\n  ${createSectionTitle(48, 'ENGINEERING.STATS')}`;
    svg += `\n  ${createSeparator(58, width)}`;
    
    const metrics = [
      ['Repositories', stats.publicRepos],
      ['Total Stars', stats.totalStars],
      ['Followers', stats.followers],
      ['Following', stats.following],
      ['Total Forks', stats.totalForks],
      ['Contributions', stats.totalContributions],
      ['Last Updated', stats.lastUpdated]
    ];
    
    let y = 85;
    for (const [label, value] of metrics) {
      svg += `\n  ${createMetricRow(y, label, value)}`;
      y += 35;
    }
    
    svg += '\n</svg>';
    
    const outPath = path.join(__dirname, '..', 'assets', 'engineering-stats.svg');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, svg);
    console.log('Generated:', outPath);
  } catch (error) {
    console.error('Failed to generate engineering stats:', error);
    process.exit(1);
  }
}

generate();
