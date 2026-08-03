'use strict';

const fs   = require('fs');
const path = require('path');

const { getAllRepos, getUser, getPRs, getIssues, getContributions } = require('./github-api');
const { processUserData } = require('./data-processor');
const {
  openCard, closeCard, createHeader,
  createSeparator, createSectionTitle,
  createMetricRow, createProgressBar, createFooter,
  COLORS, escapeXml
} = require('./svg-utils');

// ─── Layout constants ────────────────────────────────────────────────────────
const WIDTH   = 495;
const PAD     = 32;
const VALUE_X = WIDTH - PAD;

async function generate() {
  console.log('[engineering-stats] Fetching data…');

  const [user, repos, prs, issues, contributions] = await Promise.all([
    getUser(),
    getAllRepos(),
    getPRs(),
    getIssues(),
    getContributions()
  ]);

  const stats = processUserData(user, repos, prs, issues, contributions);
  console.log('[engineering-stats] Stats:', stats);

  // ─── Metric rows ───────────────────────────────────────────────────────────
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

  // Tallest metric is contributions — build a max-relative bar for each
  const maxVal = Math.max(1, ...metrics.map(m => Number(m.value) || 0));

  // ─── SVG layout ────────────────────────────────────────────────────────────
  // Header 48px + section title 32px + (metrics * 52px) + footer 36px
  const metricH = 52;
  const HEIGHT  = 48 + 28 + metrics.length * metricH + 36;

  let svg = openCard(WIDTH, HEIGHT);

  // Header
  svg += createHeader(WIDTH, 'ENGINEERING.STATS', stats.lastUpdated);

  // Section label
  svg += createSectionTitle(88, 'Activity Overview');

  // Separator under section title
  svg += createSeparator(96, WIDTH);

  // Metrics
  let y = 96 + 34;
  for (const { label, value } of metrics) {
    const num     = Number(value) || 0;
    const barW    = WIDTH - PAD * 2;
    const fillW   = num === 0 ? 0 : Math.max(4, (num / maxVal) * barW);

    svg += createMetricRow(y, label, value, VALUE_X);
    svg += createProgressBar(PAD, y + 6, barW, fillW, COLORS.accentMuted, 4);
    y += metricH;
  }

  // Footer
  svg += createSeparator(HEIGHT - 36, WIDTH, 0);
  svg += createFooter(WIDTH, HEIGHT, stats.lastUpdated);

  svg += closeCard();

  // ─── Write file ─────────────────────────────────────────────────────────────
  const outPath = path.join(__dirname, '..', 'assets', 'engineering-stats.svg');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('[engineering-stats] Written:', outPath);
}

generate().catch(err => {
  console.error('[engineering-stats] Fatal:', err);
  process.exit(1);
});
