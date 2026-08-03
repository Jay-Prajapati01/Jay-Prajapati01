'use strict';

const fs   = require('fs');
const path = require('path');

const { getAllRepos, getLanguages } = require('./github-api');
const { processLanguages }         = require('./data-processor');
const {
  openCard, closeCard, createHeader,
  createSeparator, createSectionTitle,
  createSegmentedBar, createLangLegendItem,
  createFooter, getLangColor,
  COLORS, escapeXml
} = require('./svg-utils');

// ─── Layout constants ────────────────────────────────────────────────────────
const WIDTH      = 495;
const PAD        = 32;
const BAR_H      = 10;
const LEGEND_COL = 2;
const LEGEND_ROW_H = 36;

async function generate() {
  console.log('[language-stats] Fetching data…');

  const repos     = await getAllRepos();
  const langMap   = await getLanguages(repos);
  const languages = processLanguages(langMap);

  console.log('[language-stats] Languages:', languages);

  const today = new Date().toISOString().split('T')[0];

  // ─── Layout maths ──────────────────────────────────────────────────────────
  const legendRows = Math.ceil(languages.length / LEGEND_COL);
  
  // Fixed height to perfectly match engineering-stats card
  const HEIGHT = 528;

  let svg = openCard(WIDTH, HEIGHT);

  // Header
  svg += createHeader(WIDTH, 'MOST.USED.LANGUAGES', today);

  // Section label
  svg += createSectionTitle(88, 'By byte count · excluding HTML & CSS');
  svg += createSeparator(96, WIDTH);

  // Segmented bar
  const barY  = 110;
  const barW  = WIDTH - PAD * 2;
  const segs  = languages.map(l => ({
    color:    getLangColor(l.name),
    fraction: parseFloat(l.percentage) / 100
  }));
  svg += createSegmentedBar(PAD, barY, barW, segs, BAR_H);

  // Legend grid
  let legendY = barY + BAR_H + 28;
  const colW  = Math.floor(barW / LEGEND_COL);

  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    const col  = i % LEGEND_COL;
    const row  = Math.floor(i / LEGEND_COL);
    const lx   = PAD + col * colW;
    const ly   = legendY + row * LEGEND_ROW_H;
    svg += createLangLegendItem(lx, ly, lang.name, lang.percentage, getLangColor(lang.name));
  }

  // Footer
  svg += createFooter(WIDTH, HEIGHT, today);

  svg += closeCard();

  // ─── Write file ─────────────────────────────────────────────────────────────
  const outPath = path.join(__dirname, '..', 'assets', 'top-languages.svg');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('[language-stats] Written:', outPath);
}

generate().catch(err => {
  console.error('[language-stats] Fatal:', err);
  process.exit(1);
});
