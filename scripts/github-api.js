const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = 'Jay-Prajapati01';

const options = {
  hostname: 'api.github.com',
  headers: {
    'User-Agent': 'GitHub-Dashboard-Generator',
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
  }
};

function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    const req = https.get({ ...options, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function fetchWithRetry(path, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchJSON(path);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function getAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const data = await fetchWithRetry(`/users/${USERNAME}/repos?per_page=100&page=${page}&type=all`);
    if (!data.length) break;
    repos.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return repos;
}

async function getUser() {
  return fetchWithRetry(`/users/${USERNAME}`);
}

async function getContributions() {
  const data = await fetchWithRetry(`/users/${USERNAME}/events?per_page=100`);
  return data.filter(e => e.type === 'PushEvent').length;
}

async function getLanguages(repos) {
  const langMap = {};
  for (const repo of repos) {
    if (repo.archived || repo.fork || !repo.language) continue;
    try {
      const langs = await fetchWithRetry(`/repos/${USERNAME}/${repo.name}/languages`);
      if (langs.message && langs.message.includes('Not Found')) continue;
      for (const [lang, bytes] of Object.entries(langs)) {
        if (['HTML', 'CSS'].includes(lang)) continue;
        if (typeof bytes === 'number') {
          langMap[lang] = (langMap[lang] || 0) + bytes;
        }
      }
    } catch (e) {
      console.error(`Failed to fetch languages for ${repo.name}:`, e.message);
    }
  }
  return langMap;
}

module.exports = { getAllRepos, getUser, getContributions, getLanguages };
