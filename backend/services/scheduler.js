const cron = require('node-cron');
const { refreshAllUpcomingMatches } = require('./footballApi');
const { getApiUsageToday } = require('./cacheService');

function startScheduler() {
  // Refresh upcoming matches every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] Running hourly match refresh...');
    const usage = getApiUsageToday();
    if (usage >= 90) {
      console.warn(`[Scheduler] Skipping refresh — API usage at ${usage}/100`);
      return;
    }
    try {
      const results = await refreshAllUpcomingMatches();
      console.log('[Scheduler] Refresh complete:', results);
    } catch (err) {
      console.error('[Scheduler] Refresh failed:', err.message);
    }
  });

  // Log API usage every 6 hours
  cron.schedule('0 */6 * * *', () => {
    const usage = getApiUsageToday();
    console.log(`[Scheduler] API usage today: ${usage}/100`);
    if (usage >= 80) {
      console.warn(`[Scheduler] WARNING: Approaching API daily limit (${usage}/100)`);
    }
  });

  console.log('[Scheduler] Jobs registered: hourly match refresh, 6h usage log');
}

module.exports = { startScheduler };
