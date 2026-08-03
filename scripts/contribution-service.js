'use strict';

/**
 * contribution-service.js
 * The single source of truth for contribution calculations and streak algorithms.
 * Input: raw contributionsCollection object from GraphQL.
 * Output: processed contribution and streak metrics.
 */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00Z');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function processContributionData(collection) {
  const result = {
    totalContributions:      0,
    currentStreak:           0,
    longestStreak:           0,
    totalCommits:            0,
    totalPRs:                0,
    totalIssues:             0,
    totalReviews:            0,
    restrictedContributions: 0,
    contributionDays:        [],
    weeks:                   [],
    lastContributionDate:    null,
    longestStart:            null,
    longestEnd:              null,
    currentStart:            null,
    currentEnd:              null,
    activeDays:              0,
    maxContributionDay:      0,
    maxContributionDate:     null,
    mostActiveWeekday:       null,
    avgPerActiveDay:         0
  };

  if (!collection) {
    return result;
  }

  // Populate metadata from collection
  result.totalCommits = collection.totalCommitContributions || 0;
  result.totalPRs = collection.totalPullRequestContributions || 0;
  result.totalIssues = collection.totalIssueContributions || 0;
  result.totalReviews = collection.totalPullRequestReviewContributions || 0;
  result.restrictedContributions = collection.restrictedContributionsCount || 0;

  const calendar = collection.contributionCalendar;
  if (!calendar) {
    return result;
  }

  result.totalContributions = calendar.totalContributions || 0;
  result.weeks = calendar.weeks || [];

  // Flatten calendar days and filter out future dates
  const todayStr = new Date().toISOString().split('T')[0];
  const days = [];
  
  if (calendar.weeks) {
    for (const week of calendar.weeks) {
      if (week.contributionDays) {
        for (const day of week.contributionDays) {
          if (day.date > todayStr) continue; // Skip future dates
          days.push({
            date: day.date,
            weekday: day.weekday,
            count: day.contributionCount || 0
          });
        }
      }
    }
  }

  // Sort ascending by date
  days.sort((a, b) => a.date.localeCompare(b.date));
  result.contributionDays = days;

  if (days.length === 0) {
    return result;
  }

  // Basic statistics
  const weekdayCounts = new Array(7).fill(0);
  for (const day of days) {
    if (day.count > 0) {
      result.activeDays++;
      weekdayCounts[day.weekday] += day.count;
      if (day.count > result.maxContributionDay) {
        result.maxContributionDay = day.count;
        result.maxContributionDate = day.date;
      }
      result.lastContributionDate = day.date;
    }
  }

  // Most active weekday
  let peakWeekday = 0;
  for (let i = 1; i < 7; i++) {
    if (weekdayCounts[i] > weekdayCounts[peakWeekday]) {
      peakWeekday = i;
    }
  }
  result.mostActiveWeekday = DAY_NAMES[peakWeekday];

  // Avg per active day
  if (result.activeDays > 0) {
    result.avgPerActiveDay = +(result.totalContributions / result.activeDays).toFixed(1);
  }

  // Longest Streak calculation (walk forward)
  let streak = 0;
  let streakStart = null;
  let longestLen = 0;
  let longestS = null;
  let longestE = null;

  for (const day of days) {
    if (day.count > 0) {
      if (streak === 0) streakStart = day.date;
      streak++;
      if (streak > longestLen) {
        longestLen = streak;
        longestS = streakStart;
        longestE = day.date;
      }
    } else {
      streak = 0;
      streakStart = null;
    }
  }

  result.longestStreak = longestLen;
  result.longestStart = longestS;
  result.longestEnd = longestE;

  // Current Streak calculation (walk backward)
  let currentLen = 0;
  let currentStart = null;
  let currentEnd = null;

  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];

    if (day.count > 0) {
      currentLen++;
      currentStart = day.date;
      if (!currentEnd) currentEnd = day.date;
    } else {
      // Allow skipping today if today is 0 and it's the last element (today has not ended yet)
      if (i === days.length - 1 && day.date === todayStr) {
        continue;
      }
      break;
    }
  }

  result.currentStreak = currentLen;
  result.currentStart = currentStart;
  result.currentEnd = currentEnd;

  return result;
}

module.exports = { processContributionData, formatDate };
