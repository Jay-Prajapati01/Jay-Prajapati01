'use strict';

const fs   = require('fs');
const path = require('path');

const { getAllRepos, getUser, getPRs, getIssues, getRawContributionData } = require('./github-api');
const { processContributionData } = require('./contribution-service');
const { processUserData } = require('./data-processor');
const {
  openCard, closeCard, createHeader,
  createSeparator, createSectionTitle,
  createMetricRow, createProgressBar, createFooter,
  COLORS, escapeXml
} = require('./svg-utils');

const WIDTH   = 495;
const PAD     = 32;
const VALUE_X = WIDTH - PAD;

async function generate() {
  console.log('[engineering-stats] Loading data…');

  const [user, repos, prs, issues, rawContributions] = await Promise.all([
    getUser(),
    getAllRepos(),
    getPRs(),
    getIssues(),
    getRawContributionData()
  ]);

  // Process contributions and streaks
  const contributionStats = processContributionData(rawContributions);

  // Process user and repo info using the contributionStats
  const stats = processUserData(user, repos, prs, issues, contributionStats);
  console.log('[engineering-stats] Processed stats:', stats);

  const metrics = [
    { label: 'Total Contributions', value: stats.totalContributions },
    { label: 'Public Repositories', value: stats.publicRepos        },
    { label: 'Total Stars Earned',  value: stats.totalStars         },
    { label: 'Total Forks',         value: stats.totalForks         },
    { label: 'Pull Requests',       value: stats.totalPRs           },
    { label: 'Issues Opened',       value: stats.totalIssues        },
    { label: 'Followers',           value: stats.followers          },
    { label: 'Following',           value: stats.following          }
  ];

  const maxVal = Math.max(1, ...metrics.map(m => Number(m.value) || 0));

  const metricH = 43;
  const HEIGHT  = 528;

  let svg = openCard(WIDTH, HEIGHT);

  svg += createHeader(WIDTH, 'GITHUB.STATS', stats.lastUpdated);
  svg += createSectionTitle(88, 'Activity Overview');
  svg += createSeparator(96, WIDTH);

  let y = 122;
  for (const { label, value } of metrics) {
    const num     = Number(value) || 0;
    const barW    = WIDTH - PAD * 2;
    const fillW   = num === 0 ? 0 : Math.max(4, (num / maxVal) * barW);

    svg += createMetricRow(y, label, value, VALUE_X);
    svg += createProgressBar(PAD, y + 6, barW, fillW, COLORS.accentMuted, 4);
    y += metricH;
  }

  svg += createSeparator(HEIGHT - 36, WIDTH, 0);
  svg += createFooter(WIDTH, HEIGHT, stats.lastUpdated);
  svg += closeCard();

  const outPath = path.join(__dirname, '..', 'assets', 'engineering-stats.svg');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('[engineering-stats] Written:', outPath);
}

generate().catch(err => {
  console.error('[engineering-stats] Fatal:', err);
  process.exit(1);
});
