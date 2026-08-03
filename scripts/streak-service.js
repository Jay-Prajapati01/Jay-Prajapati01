'use strict';

/**
 * streak-service.js
 * Pure calculation engine — zero API calls, zero SVG logic.
 * Input:  raw contributionCalendar from GitHub GraphQL
 * Output: streak statistics object
 */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Flatten the nested weeks→contributionDays structure into a sorted array
 * of { date, weekday, count } objects, excluding future dates.
 */
function flattenCalendar(calendar) {
  if (!calendar || !calendar.weeks) return [];

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const days = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      if (day.date > today) continue; // skip future dates
      days.push({
        date:    day.date,
        weekday: day.weekday,
        count:   day.contributionCount
      });
    }
  }

  // Sort ascending by date (should already be, but be safe)
  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

/**
 * Format a date string like "Jun 15, 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00Z');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Calculate all streak statistics from a contribution calendar.
 *
 * @param {Object} calendar  — raw contributionCalendar from GraphQL
 * @returns {Object}         — streak statistics
 */
function calculateStreaks(calendar) {
  const result = {
    totalContributions:   0,
    currentStreak:        0,
    longestStreak:        0,
    currentStart:         null,
    currentEnd:           null,
    longestStart:         null,
    longestEnd:           null,
    activeDays:           0,
    lastContributionDate: null,
    maxContributionDay:   0,
    maxContributionDate:  null,
    mostActiveWeekday:    null,
    avgPerActiveDay:      0
  };

  const days = flattenCalendar(calendar);
  if (days.length === 0) return result;

  // ─── Basic aggregates ──────────────────────────────────────────────────────
  const weekdayCounts = new Array(7).fill(0);

  for (const day of days) {
    result.totalContributions += day.count;
    if (day.count > 0) {
      result.activeDays++;
      weekdayCounts[day.weekday] += day.count;
      if (day.count > result.maxContributionDay) {
        result.maxContributionDay  = day.count;
        result.maxContributionDate = day.date;
      }
      result.lastContributionDate = day.date;
    }
  }

  // Most active weekday
  let peakWeekday = 0;
  for (let i = 1; i < 7; i++) {
    if (weekdayCounts[i] > weekdayCounts[peakWeekday]) peakWeekday = i;
  }
  result.mostActiveWeekday = DAY_NAMES[peakWeekday];

  // Average per active day
  if (result.activeDays > 0) {
    result.avgPerActiveDay = +(result.totalContributions / result.activeDays).toFixed(1);
  }

  // ─── Streak calculation ────────────────────────────────────────────────────
  // Walk forward to find longest streak
  let streak      = 0;
  let streakStart = null;
  let longestLen  = 0;
  let longestS    = null;
  let longestE    = null;

  for (const day of days) {
    if (day.count > 0) {
      if (streak === 0) streakStart = day.date;
      streak++;
      if (streak > longestLen) {
        longestLen = streak;
        longestS   = streakStart;
        longestE   = day.date;
      }
    } else {
      streak = 0;
      streakStart = null;
    }
  }

  result.longestStreak = longestLen;
  result.longestStart  = longestS;
  result.longestEnd    = longestE;

  // ─── Current streak (walk backward from today) ────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  let currentLen   = 0;
  let currentStart = null;
  let currentEnd   = null;

  // The last day in the calendar might be today or yesterday.
  // If today has 0 contributions, we still check yesterday as the potential
  // streak end (the user hasn't contributed *yet* today, but the streak
  // from yesterday is still alive).
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];

    if (day.count > 0) {
      currentLen++;
      currentStart = day.date;
      if (!currentEnd) currentEnd = day.date;
    } else {
      // Allow skipping *today* only if it's the very last day and has 0
      if (i === days.length - 1 && day.date === today) {
        continue; // today hasn't ended yet — keep looking backward
      }
      break; // real gap found
    }
  }

  result.currentStreak = currentLen;
  result.currentStart  = currentStart;
  result.currentEnd    = currentEnd;

  return result;
}

module.exports = { calculateStreaks, formatDate };
