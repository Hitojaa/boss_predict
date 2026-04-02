const axios = require('axios');
const cache = require('./cacheService');

const BASE_URL = 'https://api.football-data.org/v4';

const COMPETITIONS = {
  UCL: { code: 'CL', id: 2001, name: 'UEFA Champions League', leagueKey: 'ucl' },
  WORLD_CUP: { code: 'WC', id: 2000, name: 'FIFA World Cup', leagueKey: 'worldcup' },
};

// Alias pour compatibilité avec les routes existantes
const LEAGUES = {
  UCL: { id: 2001, season: 2024, name: 'UEFA Champions League' },
  WORLD_CUP: { id: 2000, season: 2026, name: 'FIFA World Cup' },
};

function getHeaders() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key || key === 'your_key_here') {
    throw new Error('FOOTBALL_DATA_API_KEY non configurée. Inscription gratuite : https://www.football-data.org/client/register');
  }
  return { 'X-Auth-Token': key };
}

// Throttle simple pour rester sous 10 req/min
let lastRequestTime = 0;
async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 300) {
    await new Promise(r => setTimeout(r, 300 - elapsed));
  }
  lastRequestTime = Date.now();
}

async function apiRequest(path, params = {}) {
  await throttle();
  const usage = cache.getApiUsageToday();
  if (usage >= 280) {
    throw new Error(`Limite quotidienne atteinte (${usage}/300).`);
  }

  try {
    cache.incrementApiUsage();
    const response = await axios.get(`${BASE_URL}${path}`, {
      headers: getHeaders(),
      params,
      timeout: 12000,
    });
    console.log(`[API] ${path} — usage aujourd'hui : ${usage + 1}/300`);
    return response.data;
  } catch (err) {
    if (err.response?.status === 429) throw new Error('Rate limit (10 req/min). Patiente quelques secondes.');
    if (err.response?.status === 403) throw new Error('Clé API invalide. Vérifie FOOTBALL_DATA_API_KEY dans .env');
    if (err.response?.status === 404) throw new Error(`Ressource introuvable : ${path}`);
    throw err;
  }
}

// Normalise un match football-data.org vers le format attendu par le frontend
function normalizeMatch(match) {
  const comp = Object.values(COMPETITIONS).find(c => c.code === match.competition?.code) || COMPETITIONS.UCL;
  return {
    fixture: {
      id: match.id,
      date: match.utcDate,
      status: { short: match.status },
      venue: { name: match.venue || 'TBD', city: '' },
      referee: match.referees?.[0]?.name || null,
    },
    league: {
      id: comp.id,
      name: match.competition?.name || comp.name,
      logo: `https://crests.football-data.org/${comp.id}.png`,
      season: new Date(match.utcDate).getFullYear(),
    },
    teams: {
      home: {
        id: match.homeTeam?.id,
        name: match.homeTeam?.name || match.homeTeam?.shortName || 'TBD',
        logo: match.homeTeam?.crest || null,
        country: match.homeTeam?.area?.name || null,
      },
      away: {
        id: match.awayTeam?.id,
        name: match.awayTeam?.name || match.awayTeam?.shortName || 'TBD',
        logo: match.awayTeam?.crest || null,
        country: match.awayTeam?.area?.name || null,
      },
    },
    goals: {
      home: match.score?.fullTime?.home ?? null,
      away: match.score?.fullTime?.away ?? null,
    },
  };
}

// Calcule les stats d'équipe à partir de ses derniers matchs
function buildTeamStats(teamMatches, teamId) {
  if (!teamMatches?.length) return null;

  const finished = teamMatches.filter(m =>
    m.score?.fullTime?.home !== null && m.score?.fullTime?.away !== null
  );

  const form = finished.slice(-5).map(m => {
    const isHome = m.homeTeam?.id === teamId || m.teams?.home?.id === teamId;
    const hg = m.score?.fullTime?.home ?? m.goals?.home ?? 0;
    const ag = m.score?.fullTime?.away ?? m.goals?.away ?? 0;
    if (isHome) return hg > ag ? 'W' : hg < ag ? 'L' : 'D';
    return ag > hg ? 'W' : ag < hg ? 'L' : 'D';
  }).join('');

  const wins = finished.filter(m => {
    const isHome = m.homeTeam?.id === teamId || m.teams?.home?.id === teamId;
    const hg = m.score?.fullTime?.home ?? m.goals?.home ?? 0;
    const ag = m.score?.fullTime?.away ?? m.goals?.away ?? 0;
    return isHome ? hg > ag : ag > hg;
  }).length;

  const goalsFor = finished.reduce((sum, m) => {
    const isHome = m.homeTeam?.id === teamId || m.teams?.home?.id === teamId;
    return sum + (isHome ? (m.score?.fullTime?.home ?? m.goals?.home ?? 0) : (m.score?.fullTime?.away ?? m.goals?.away ?? 0));
  }, 0);

  const goalsAgainst = finished.reduce((sum, m) => {
    const isHome = m.homeTeam?.id === teamId || m.teams?.home?.id === teamId;
    return sum + (isHome ? (m.score?.fullTime?.away ?? m.goals?.away ?? 0) : (m.score?.fullTime?.home ?? m.goals?.home ?? 0));
  }, 0);

  const cleanSheets = finished.filter(m => {
    const isHome = m.homeTeam?.id === teamId || m.teams?.home?.id === teamId;
    const conceded = isHome
      ? (m.score?.fullTime?.away ?? m.goals?.away ?? -1)
      : (m.score?.fullTime?.home ?? m.goals?.home ?? -1);
    return conceded === 0;
  }).length;

  return {
    form,
    fixtures: {
      played: { total: finished.length },
      wins: { total: wins },
    },
    goals: {
      for: {
        total: { total: goalsFor },
        average: { total: finished.length > 0 ? (goalsFor / finished.length).toFixed(1) : '0' },
      },
      against: {
        total: { total: goalsAgainst },
      },
    },
    clean_sheet: { total: cleanSheets },
  };
}

// --- Matchs à venir ---
async function getUpcomingMatches(leagueId, season, next = 10, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cache.getCachedMatches(leagueId);
    if (cached) {
      console.log(`[Cache HIT] Matchs ligue ${leagueId} (${cached.length})`);
      return cached;
    }
    console.log(`[Cache MISS] Ligue ${leagueId} — clique "Refresh API" pour charger`);
    return [];
  }

  const comp = Object.values(COMPETITIONS).find(c => c.id === leagueId);
  if (!comp) return [];

  try {
    const today = new Date().toISOString().slice(0, 10);
    const inTwoMonths = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const data = await apiRequest(`/competitions/${comp.code}/matches`, {
      status: 'SCHEDULED',
      dateFrom: today,
      dateTo: inTwoMonths,
    });

    const matches = (data.matches || [])
      .slice(0, next)
      .map(m => normalizeMatch(m));

    if (matches.length > 0) {
      cache.setCachedMatches(leagueId, matches);
      console.log(`[Cache SET] ${matches.length} matchs mis en cache pour ligue ${leagueId}`);
    } else {
      console.warn(`[API] Aucun match planifié pour ${comp.code} — compétition peut-être en trêve`);
    }

    return matches;
  } catch (err) {
    console.error(`[API Error] getUpcomingMatches ${comp?.code}: ${err.message}`);
    return [];
  }
}

// --- Détail d'un fixture ---
async function getFixture(fixtureId) {
  const cached = cache.getCachedFixture(fixtureId);
  if (cached) return cached;

  try {
    const data = await apiRequest(`/matches/${fixtureId}`);
    const normalized = normalizeMatch(data);
    // Stocker en cache
    const leagueId = normalized.league?.id;
    if (leagueId) cache.setCachedMatches(leagueId, [normalized]);
    return normalized;
  } catch (err) {
    console.error(`[API Error] getFixture ${fixtureId}: ${err.message}`);
    return null;
  }
}

// --- Stats équipe (calculées depuis les derniers matchs) ---
async function getTeamStats(teamId, leagueId, season) {
  const cached = cache.getCachedTeamStats(teamId, leagueId, season);
  if (cached) {
    console.log(`[Cache HIT] Stats équipe ${teamId}`);
    return cached;
  }

  try {
    const comp = Object.values(COMPETITIONS).find(c => c.id === leagueId) || COMPETITIONS.UCL;
    const data = await apiRequest(`/teams/${teamId}/matches`, {
      competitions: comp.code,
      status: 'FINISHED',
      limit: 20,
    });

    const stats = buildTeamStats(data.matches || [], teamId);
    if (stats) cache.setCachedTeamStats(teamId, leagueId, season, stats);
    return stats;
  } catch (err) {
    console.error(`[API Error] getTeamStats ${teamId}: ${err.message}`);
    return null;
  }
}

// --- H2H ---
async function getH2H(team1Id, team2Id) {
  const cached = cache.getCachedH2H(team1Id, team2Id);
  if (cached) {
    console.log(`[Cache HIT] H2H ${team1Id} vs ${team2Id}`);
    return cached;
  }

  try {
    const data = await apiRequest(`/teams/${team1Id}/matches`, {
      status: 'FINISHED',
      limit: 30,
    });

    const h2hMatches = (data.matches || [])
      .filter(m => m.homeTeam?.id === team2Id || m.awayTeam?.id === team2Id)
      .slice(0, 5)
      .map(m => normalizeMatch(m));

    if (h2hMatches.length > 0) cache.setCachedH2H(team1Id, team2Id, h2hMatches);
    return h2hMatches;
  } catch (err) {
    console.error(`[API Error] getH2H ${team1Id} vs ${team2Id}: ${err.message}`);
    return [];
  }
}

// --- Stats joueurs par fixture (non dispo sur free tier football-data.org) ---
async function getPlayerStats(fixtureId) {
  return [];
}

// --- Top buteurs ---
async function getTopScorers(leagueId, season) {
  const comp = Object.values(COMPETITIONS).find(c => c.id === leagueId);
  if (!comp) return [];

  try {
    const data = await apiRequest(`/competitions/${comp.code}/scorers`, { limit: 20 });
    return (data.scorers || []).map(s => ({
      player: {
        id: s.player?.id,
        name: s.player?.name,
        photo: null,
        nationality: s.player?.nationality,
      },
      statistics: [{
        goals: { total: s.goals, assists: s.assists || 0 },
        games: { appearances: s.playedMatches },
        shots: { total: null, on: null },
      }],
      team: {
        id: s.team?.id,
        name: s.team?.name,
        logo: s.team?.crest,
      },
    }));
  } catch (err) {
    console.error(`[API Error] getTopScorers ${comp.code}: ${err.message}`);
    return [];
  }
}

// --- Blessures (non dispo sur free tier) ---
async function getInjuries(fixtureId) {
  return [];
}

// --- Forme récente d'une équipe ---
async function getTeamRecentForm(teamId, leagueId, season, last = 5) {
  try {
    const comp = Object.values(COMPETITIONS).find(c => c.id === leagueId) || COMPETITIONS.UCL;
    const data = await apiRequest(`/teams/${teamId}/matches`, {
      competitions: comp.code,
      status: 'FINISHED',
      limit: last,
    });
    return (data.matches || []).map(m => normalizeMatch(m));
  } catch (err) {
    console.error(`[API Error] getTeamRecentForm ${teamId}: ${err.message}`);
    return [];
  }
}

// --- Refresh global (utilisé par le cron) ---
async function refreshAllUpcomingMatches() {
  console.log('[Refresh] Démarrage du refresh des matchs à venir...');
  const results = {};
  for (const [key, comp] of Object.entries(COMPETITIONS)) {
    try {
      const matches = await getUpcomingMatches(comp.id, null, 10, true);
      results[key] = matches.length;
      console.log(`[Refresh] ${comp.name}: ${matches.length} matchs`);
    } catch (err) {
      console.error(`[Refresh Error] ${comp.name}: ${err.message}`);
      results[key] = 0;
    }
  }
  return results;
}

// --- Test de connexion API ---
async function testApiConnection(leagueId) {
  try {
    const comp = Object.values(COMPETITIONS).find(c => c.id === leagueId) || COMPETITIONS.UCL;
    const data = await apiRequest(`/competitions/${comp.code}`);
    return {
      ok: true,
      competition: data.name,
      currentSeason: data.currentSeason?.startDate,
      endDate: data.currentSeason?.endDate,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      status: err.response?.status,
    };
  }
}

module.exports = {
  LEAGUES,
  COMPETITIONS,
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
