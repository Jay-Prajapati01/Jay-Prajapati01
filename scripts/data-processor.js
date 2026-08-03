function processUserData(user, repos, contributions) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const publicRepos = repos.filter(r => !r.fork && !r.archived).length;
  
  const mostActive = repos.reduce((best, r) => 
    (r.pushes_count || 0) > (best.pushes_count || 0) ? r : best, repos[0]);
  
  return {
    username: user.login,
    name: user.name || user.login,
    followers: user.followers,
    following: user.following,
    publicRepos,
    totalStars,
    totalForks,
    contributions,
    mostActiveRepo: mostActive?.name || 'N/A',
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
