const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GH_STATS_TOKEN;
const USERNAME = 'Jay-Prajapati01';

if (!GITHUB_TOKEN) {
  throw new Error('GH_STATS_TOKEN is missing — please check your repository secrets.');
}

const CACHE_FILE = path.join(__dirname, '..', '.api-cache.json');

const options = {
  hostname: 'api.github.com',
  headers: {
    'User-Agent': 'GitHub-Dashboard-Generator',
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
  }
};

function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to read API cache:', e.message);
  }
  return {};
}

function writeCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write API cache:', e.message);
  }
}

async function getCachedOrFetch(key, fetchFn) {
  const cache = readCache();
  
  // Check if we have a valid, non-empty cached response
  if (cache[key] !== undefined && cache[key] !== null) {
    const isArrayEmpty = Array.isArray(cache[key]) && cache[key].length === 0;
    const isObjectEmpty = typeof cache[key] === 'object' && Object.keys(cache[key]).length === 0;
    if (!isArrayEmpty && !isObjectEmpty) {
      console.log(`[cache] Using cached data for key: ${key}`);
      return cache[key];
    }
  }
  
  const data = await fetchFn();
  
  // Only cache if the response is non-null and non-empty
  if (data !== null && data !== undefined) {
    const isArrayEmpty = Array.isArray(data) && data.length === 0;
    const isObjectEmpty = typeof data === 'object' && Object.keys(data).length === 0;
    if (!isArrayEmpty && !isObjectEmpty) {
      cache[key] = data;
      writeCache(cache);
    }
  }
  
  return data;
}

function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    const req = https.get({ ...options, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`GitHub API returned status ${res.statusCode}: ${data}`));
          return;
        }
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
  return getCachedOrFetch('repos', async () => {
    const repos = [];
    let page = 1;
    while (true) {
      const data = await fetchWithRetry(`/users/${USERNAME}/repos?per_page=100&page=${page}&type=all`);
      if (!data || !data.length) break;
      repos.push(...data);
      if (data.length < 100) break;
      page++;
    }
    return repos;
  });
}

async function getUser() {
  return getCachedOrFetch('user', () => fetchWithRetry(`/users/${USERNAME}`));
}

async function getPRs() {
  return getCachedOrFetch('prs', async () => {
    const data = await fetchWithRetry(`/search/issues?q=author:${USERNAME}+type:pr&per_page=1`);
    return data.total_count || 0;
  });
}

async function getIssues() {
  return getCachedOrFetch('issues', async () => {
    const data = await fetchWithRetry(`/search/issues?q=author:${USERNAME}+type:issue&per_page=1`);
    return data.total_count || 0;
  });
}

async function getLanguages(repos) {
  return getCachedOrFetch('languages', async () => {
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
  });
}

function fetchGraphQL(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'User-Agent': 'GitHub-Dashboard-Generator',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(GITHUB_TOKEN && { 'Authorization': `bearer ${GITHUB_TOKEN}` })
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`GraphQL API returned status ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse GraphQL response: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getRawContributionData() {
  return getCachedOrFetch('rawContributions', async () => {
    const query = `
query {
  user(login: "${USERNAME}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            weekday
            contributionCount
          }
        }
      }
      restrictedContributionsCount
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
    }
  }
}
`;
    const res = await fetchGraphQL(query);
    if (res.errors) throw new Error(res.errors[0].message);
    return res.data?.user?.contributionsCollection || null;
  });
}

module.exports = {
  getAllRepos,
  getUser,
  getPRs,
  getIssues,
  getLanguages,
  getRawContributionData
};