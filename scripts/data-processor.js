function processUserData(user, repos, events) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const publicRepos = repos.filter(r => !r.fork && !r.archived).length;
  
  const pushEvents = events.filter(e => e.type === 'PushEvent');
  const contributions = pushEvents.length;
  
  const mostActive = repos.reduce((best, r) => 
    (r.pushes_count || 0) > (best.pushes_count || 0) ? r : best, repos[0]);
  
  // Calculate streaks
  const contributionDates = [...new Set(
    events
      .filter(e => ['PushEvent', 'IssuesEvent', 'PullRequestEvent', 'CreateEvent', 'DeleteEvent'].includes(e.type))
      .map(e => new Date(e.created_at).toISOString().split('T')[0])
  )].sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Check if today or yesterday has contributions
  const hasRecent = contributionDates.includes(today) || contributionDates.includes(yesterday);
  
  if (hasRecent) {
    let checkDate = contributionDates.includes(today) ? new Date() : new Date(Date.now() - 86400000);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (contributionDates.includes(dateStr)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
  }
  
  // Calculate longest streak
  for (let i = 0; i < contributionDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(contributionDates[i - 1]);
      const curr = new Date(contributionDates[i]);
      const diffDays = (curr - prev) / 86400000;
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }
  
  // Get first and last contribution dates
  const firstContribution = contributionDates[0] || today;
  const lastContribution = contributionDates[contributionDates.length - 1] || today;
  
  return {
    username: user.login,
    name: user.name || user.login,
    followers: user.followers,
    following: user.following,
    publicRepos,
    totalStars,
    totalForks,
    contributions,
    currentStreak,
    longestStreak,
    firstContribution,
    lastContribution,
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
