function processUserData(user, repos, prs, issues, contributionStats) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const publicRepos = repos.filter(r => !r.fork && !r.archived).length;
  
  return {
    username: user?.login || 'Jay-Prajapati01',
    name: user?.name || 'Jay Prajapati',
    followers: user?.followers || 0,
    following: user?.following || 0,
    publicRepos,
    totalStars,
    totalForks,
    totalPRs: prs,
    totalIssues: issues,
    totalContributions: contributionStats ? contributionStats.totalContributions : 0,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

function processLanguages(langMap) {
  const filtered = Object.entries(langMap).filter(([name, bytes]) => 
    typeof bytes === 'number' && bytes > 0 && !name.includes('Not Found') && !name.includes('http')
  );
  const total = filtered.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total === 0) return [];
  return filtered
    .map(([name, bytes]) => ({ name, bytes, percentage: ((bytes / total) * 100).toFixed(1) }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 6);
}

module.exports = { processUserData, processLanguages };
