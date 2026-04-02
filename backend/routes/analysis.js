const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');
const footballApi = require('../services/footballApi');
const cache = require('../services/cacheService');

// GET /api/analysis/:fixtureId — get cached analysis
router.get('/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const cached = cache.getCachedAnalysis(parseInt(fixtureId));
    if (cached) {
      return res.json({ analysis: cached, fromCache: true });
    }
    res.json({ analysis: null, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analysis/:fixtureId/generate — trigger AI analysis
router.post('/:fixtureId/generate', async (req, res) => {
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

    const [homeStats, awayStats, h2h, players, injuries] = await Promise.allSettled([
      footballApi.getTeamStats(homeTeamId, leagueId, season),
      footballApi.getTeamStats(awayTeamId, leagueId, season),
      footballApi.getH2H(homeTeamId, awayTeamId),
      footballApi.getPlayerStats(id),
      footballApi.getInjuries(id),
    ]);

    const matchData = {
      fixture: fixture.fixture,
      homeTeam: fixture.teams?.home,
      awayTeam: fixture.teams?.away,
      homeStats: homeStats.status === 'fulfilled' ? homeStats.value : null,
      awayStats: awayStats.status === 'fulfilled' ? awayStats.value : null,
      h2h: h2h.status === 'fulfilled' ? h2h.value : [],
      players: players.status === 'fulfilled' ? players.value : [],
      injuries: injuries.status === 'fulfilled' ? injuries.value : [],
    };

    const analysis = await groqService.generateAnalysis(id, matchData);
    res.json({ analysis, fixture: { home: fixture.teams?.home?.name, away: fixture.teams?.away?.name } });
  } catch (err) {
    console.error('[Route] /analysis/:id/generate error:', err.message);
    if (err.message.includes('GROQ_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Add GROQ_API_KEY to .env' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/:fixtureId/stream — SSE streaming analysis
router.get('/:fixtureId/stream', async (req, res) => {
  const { fixtureId } = req.params;
  const id = parseInt(fixtureId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const fixture = await footballApi.getFixture(id);
    if (!fixture) {
      send('error', { message: 'Fixture not found' });
      return res.end();
    }

    const homeTeamId = fixture.teams?.home?.id;
    const awayTeamId = fixture.teams?.away?.id;
    const leagueId = fixture.league?.id;
    const season = fixture.league?.season;

    send('status', { message: 'Fetching match data...' });

    const [homeStats, awayStats, h2h, players, injuries] = await Promise.allSettled([
      footballApi.getTeamStats(homeTeamId, leagueId, season),
      footballApi.getTeamStats(awayTeamId, leagueId, season),
      footballApi.getH2H(homeTeamId, awayTeamId),
      footballApi.getPlayerStats(id),
      footballApi.getInjuries(id),
    ]);

    const matchData = {
      fixture: fixture.fixture,
      homeTeam: fixture.teams?.home,
      awayTeam: fixture.teams?.away,
      homeStats: homeStats.status === 'fulfilled' ? homeStats.value : null,
      awayStats: awayStats.status === 'fulfilled' ? awayStats.value : null,
      h2h: h2h.status === 'fulfilled' ? h2h.value : [],
      players: players.status === 'fulfilled' ? players.value : [],
      injuries: injuries.status === 'fulfilled' ? injuries.value : [],
    };

    send('status', { message: 'Generating AI analysis...' });

    let buffer = '';
    const result = await groqService.generateAnalysisStream(id, matchData, (chunk) => {
      buffer += chunk;
      send('chunk', { text: chunk });
    });

    if (result) {
      send('complete', { analysis: result });
    } else {
      send('error', { message: 'Failed to parse AI response' });
    }
  } catch (err) {
    console.error('[SSE] Error:', err.message);
    send('error', { message: err.message });
  } finally {
    res.end();
  }
});

module.exports = router;
