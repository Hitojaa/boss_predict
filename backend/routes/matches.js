const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const cache = require('../services/cacheService');

const { LEAGUES } = footballApi;

// GET /api/matches/upcoming?competition=ucl|worldcup|all
router.get('/upcoming', async (req, res) => {
  try {
    const { competition = 'all', next = 10 } = req.query;
    const results = [];

    const leaguesToFetch = [];
    if (competition === 'ucl' || competition === 'all') {
      leaguesToFetch.push(LEAGUES.UCL);
    }
    if (competition === 'worldcup' || competition === 'all') {
      leaguesToFetch.push(LEAGUES.WORLD_CUP);
    }

    for (const league of leaguesToFetch) {
      const matches = await footballApi.getUpcomingMatches(league.id, league.season, parseInt(next));
      results.push(...matches.map(m => ({
        ...m,
        leagueKey: league.id === 2 ? 'ucl' : 'worldcup',
        leagueName: league.name,
      })));
    }

    // Sort by date
    results.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

    const apiUsage = cache.getApiUsageToday();

    res.json({
      matches: results,
      count: results.length,
      apiUsage: { today: apiUsage, limit: 95 },
    });
  } catch (err) {
    console.error('[Route] /matches/upcoming error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:fixtureId — full match detail
router.get('/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const id = parseInt(fixtureId);

    const fixture = await footballApi.getFixture(id);
    if (!fixture) {
      return res.status(404).json({ error: 'Fixture not found' });
    }

    const homeTeamId = fixture.teams?.home?.id;
    const awayTeamId = fixture.teams?.away?.id;
    const leagueId = fixture.league?.id;
    const season = fixture.league?.season;

    // Fetch all data in parallel (with individual error handling)
    const [homeStats, awayStats, h2h, players, injuries] = await Promise.allSettled([
      footballApi.getTeamStats(homeTeamId, leagueId, season),
      footballApi.getTeamStats(awayTeamId, leagueId, season),
      footballApi.getH2H(homeTeamId, awayTeamId),
      footballApi.getPlayerStats(id),
      footballApi.getInjuries(id),
    ]);

    res.json({
      fixture,
      homeStats: homeStats.status === 'fulfilled' ? homeStats.value : null,
      awayStats: awayStats.status === 'fulfilled' ? awayStats.value : null,
      h2h: h2h.status === 'fulfilled' ? h2h.value : [],
      players: players.status === 'fulfilled' ? players.value : [],
      injuries: injuries.status === 'fulfilled' ? injuries.value : [],
    });
  } catch (err) {
    console.error('[Route] /matches/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:fixtureId/h2h
router.get('/:fixtureId/h2h', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const fixture = await footballApi.getFixture(parseInt(fixtureId));
    if (!fixture) return res.status(404).json({ error: 'Fixture not found' });

    const h2h = await footballApi.getH2H(
      fixture.teams?.home?.id,
      fixture.teams?.away?.id
    );
    res.json({ h2h });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/league/:leagueId/scorers
router.get('/league/:leagueId/scorers', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const league = Object.values(LEAGUES).find(l => l.id === parseInt(leagueId));
    if (!league) return res.status(404).json({ error: 'League not found' });

    const scorers = await footballApi.getTopScorers(league.id, league.season);
    res.json({ scorers: scorers.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/status/api-usage
router.get('/status/api-usage', (req, res) => {
  const today = cache.getApiUsageToday();
  res.json({
    today,
    limit: 95,
    remaining: Math.max(0, 95 - today),
    percentage: Math.round((today / 95) * 100),
  });
});

module.exports = router;
