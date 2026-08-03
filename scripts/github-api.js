const https = require('https');

const GITHUB_TOKEN = process.env.GH_STATS_TOKEN;
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

async function getPRs() {
  const data = await fetchWithRetry(`/search/issues?q=author:${USERNAME}+type:pr&per_page=1`);
  return data.total_count || 0;
}

async function getIssues() {
  const data = await fetchWithRetry(`/search/issues?q=author:${USERNAME}+type:issue&per_page=1`);
  return data.total_count || 0;
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

async function getContributions() {
  const query = `
query {
  user(login: "${USERNAME}") {

    contributionsCollection {

      contributionCalendar {
        totalContributions
      }

      restrictedContributionsCount

      totalCommitContributions

      totalIssueContributions

      totalPullRequestContributions

      totalPullRequestReviewContributions

      commitContributionsByRepository(maxRepositories: 100) {
        repository {
          name
        }
        contributions {
          totalCount
        }
      }

    }

  }
}
`;
try {
  const res = await fetchGraphQL(query);

  if (res.errors) {
    throw new Error(res.errors[0].message);
  }

  console.log("========== GRAPHQL RESPONSE ==========");
  console.log(JSON.stringify(res.data.user.contributionsCollection, null, 2));
  console.log("======================================");

  return res.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0;

} catch (e) {
  console.error('Failed to fetch contributions:', e.message);
  return 0;
}
}

module.exports = {
  getAllRepos,
  getUser,
  getPRs,
  getIssues,
  getLanguages,
  getContributions
};