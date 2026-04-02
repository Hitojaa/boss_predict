const axios = require('axios');
const cache = require('./cacheService');

const BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';
const DAILY_LIMIT = 95; // Keep 5 req buffer from the 100/day limit

const LEAGUES = {
  UCL: { id: 2, season: 2024, name: 'UEFA Champions League' },
  WORLD_CUP: { id: 1, season: 2026, name: 'FIFA World Cup' },
};

function getHeaders() {
  return {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'api-football-v1.p.rapidapi.com',
  };
}

async function apiRequest(endpoint, params = {}) {
  const usage = cache.getApiUsageToday();
  if (usage >= DAILY_LIMIT) {
    throw new Error(`API daily limit reached (${usage}/${DAILY_LIMIT}). Try again tomorrow.`);
  }

  try {
    cache.incrementApiUsage();
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(),
      params,
      timeout: 10000,
    });

    console.log(`[API] ${endpoint} — usage today: ${usage + 1}/${DAILY_LIMIT}`);
    return response.data.response;
  } catch (err) {
    if (err.response?.status === 429) {
      throw new Error('API rate limit hit. Please wait before retrying.');
    }
    throw err;
  }
}

// --- Upcoming matches ---
async function getUpcomingMatches(leagueId, season, next = 10, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cache.getCachedMatches(leagueId);
    if (cached) {
      console.log(`[Cache HIT] Matches for league ${leagueId} (${cached.length} matches)`);
      return cached;
    }
    // No cache and no forceRefresh → return empty, don't consume API quota
    console.log(`[Cache MISS] League ${leagueId} — use forceRefresh=true to fetch from API`);
    return [];
  }

  try {
    console.log(`[API] Fetching fixtures — league=${leagueId} season=${season} next=${next}`);
    const data = await apiRequest('/fixtures', { league: leagueId, season, next });
    console.log(`[API] Raw response for league ${leagueId}: ${JSON.stringify(data)?.slice(0, 300)}`);
    if (data && data.length > 0) {
      cache.setCachedMatches(leagueId, data);
      console.log(`[Cache SET] ${data.length} matches cached for league ${leagueId}`);
    } else {
      console.warn(`[API] Empty response for league ${leagueId} season=${season} — check subscription on RapidAPI`);
    }
    return data || [];
  } catch (err) {
    console.error(`[API Error] getUpcomingMatches league=${leagueId}: ${err.message}`);
    if (err.response) {
      console.error(`[API Error] Status: ${err.response.status}, Body: ${JSON.stringify(err.response.data)?.slice(0, 300)}`);
    }
    return [];
  }
}

// --- Get fixture by ID ---
async function getFixture(fixtureId) {
  const cached = cache.getCachedFixture(fixtureId);
  if (cached) return cached;

  try {
    const data = await apiRequest('/fixtures', { id: fixtureId });
    return data?.[0] || null;
  } catch (err) {
    console.error(`[API Error] getFixture ${fixtureId}: ${err.message}`);
    return null;
  }
}

// --- Team statistics ---
async function getTeamStats(teamId, leagueId, season) {
  const cached = cache.getCachedTeamStats(teamId, leagueId, season);
  if (cached) {
    console.log(`[Cache HIT] Team stats ${teamId}`);
    return cached;
  }

  try {
    const data = await apiRequest('/teams/statistics', { team: teamId, league: leagueId, season });
    if (data) {
      cache.setCachedTeamStats(teamId, leagueId, season, data);
    }
    return data || null;
  } catch (err) {
    console.error(`[API Error] getTeamStats ${teamId}: ${err.message}`);
    return null;
  }
}

// --- H2H ---
async function getH2H(team1Id, team2Id, last = 5) {
  const cached = cache.getCachedH2H(team1Id, team2Id);
  if (cached) {
    console.log(`[Cache HIT] H2H ${team1Id} vs ${team2Id}`);
    return cached;
  }

  try {
    const data = await apiRequest('/fixtures/headtohead', {
      h2h: `${team1Id}-${team2Id}`,
      last,
    });
    if (data) {
      cache.setCachedH2H(team1Id, team2Id, data);
    }
    return data || [];
  } catch (err) {
    console.error(`[API Error] getH2H ${team1Id} vs ${team2Id}: ${err.message}`);
    return [];
  }
}

// --- Player stats for a fixture ---
async function getPlayerStats(fixtureId) {
  const cached = cache.getCachedPlayerStats(fixtureId);
  if (cached) {
    console.log(`[Cache HIT] Player stats fixture ${fixtureId}`);
    return cached;
  }

  try {
    const data = await apiRequest('/fixtures/players', { fixture: fixtureId });
    if (data) {
      cache.setCachedPlayerStats(fixtureId, data);
    }
    return data || [];
  } catch (err) {
    console.error(`[API Error] getPlayerStats fixture ${fixtureId}: ${err.message}`);
    return [];
  }
}

// --- Top scorers ---
async function getTopScorers(leagueId, season) {
  try {
    const data = await apiRequest('/players/topscorers', { league: leagueId, season });
    return data || [];
  } catch (err) {
    console.error(`[API Error] getTopScorers league ${leagueId}: ${err.message}`);
    return [];
  }
}

// --- Injuries for a fixture ---
async function getInjuries(fixtureId) {
  try {
    const data = await apiRequest('/injuries', { fixture: fixtureId });
    return data || [];
  } catch (err) {
    console.error(`[API Error] getInjuries fixture ${fixtureId}: ${err.message}`);
    return [];
  }
}

// --- Team recent form (last N matches) ---
async function getTeamRecentForm(teamId, leagueId, season, last = 5) {
  try {
    const data = await apiRequest('/fixtures', {
      team: teamId,
      league: leagueId,
      season,
      last,
    });
    return data || [];
  } catch (err) {
    console.error(`[API Error] getTeamRecentForm team ${teamId}: ${err.message}`);
    return [];
  }
}

// --- Refresh all upcoming matches (used by scheduler) ---
async function refreshAllUpcomingMatches() {
  console.log('[Refresh] Starting refresh of upcoming matches...');
  const results = {};

  for (const [key, league] of Object.entries(LEAGUES)) {
    try {
      // Force refresh by clearing would need direct DB access;
      // Instead we rely on cache TTL expiry
      const matches = await getUpcomingMatches(league.id, league.season);
      results[key] = matches.length;
      console.log(`[Refresh] ${league.name}: ${matches.length} matches`);
    } catch (err) {
      console.error(`[Refresh Error] ${league.name}: ${err.message}`);
      results[key] = 0;
    }
  }

  return results;
}

// Raw API test — for debugging, no cache
async function testApiConnection(leagueId, season) {
  try {
    const data = await apiRequest('/fixtures', { league: leagueId, season, next: 5 });
    return { ok: true, count: data?.length || 0, sample: data?.[0] || null };
  } catch (err) {
    return { ok: false, error: err.message, status: err.response?.status, body: err.response?.data };
  }
}

module.exports = {
  LEAGUES,
  getUpcomingMatches,
  getFixture,
  getTeamStats,
  getH2H,
  getPlayerStats,
  getTopScorers,
  getInjuries,
  getTeamRecentForm,
  refreshAllUpcomingMatches,
  testApiConnection,
};
