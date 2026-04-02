const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');

// GET /api/players/fixture/:fixtureId — player stats for a match
router.get('/fixture/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const data = await footballApi.getPlayerStats(parseInt(fixtureId));
    res.json({ players: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/fixture/:fixtureId/scorers — top scorer predictions for a match
router.get('/fixture/:fixtureId/scorers', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const id = parseInt(fixtureId);

    const fixture = await footballApi.getFixture(id);
    if (!fixture) return res.status(404).json({ error: 'Fixture not found' });

    const playerData = await footballApi.getPlayerStats(id);

    if (!playerData?.length) {
      return res.json({ home: [], away: [] });
    }

    function computeScorerScore(stats) {
      const s = stats.statistics?.[0];
      if (!s) return 0;
      const goals = s.goals?.total || 0;
      const shots = s.shots?.total || 0;
      const shotsOn = s.shots?.on || 0;
      const assists = s.goals?.assists || 0;
      // Weighted scoring formula
      return goals * 30 + shotsOn * 10 + shots * 5 + assists * 8;
    }

    function processTeamPlayers(teamData) {
      return (teamData?.players || [])
        .map(p => {
          const s = p.statistics?.[0];
          const score = computeScorerScore(p);
          return {
            id: p.player?.id,
            name: p.player?.name,
            number: p.player?.number,
            position: s?.games?.position || 'N/A',
            photo: p.player?.photo,
            goals: s?.goals?.total || 0,
            assists: s?.goals?.assists || 0,
            shots: s?.shots?.total || 0,
            shotsOn: s?.shots?.on || 0,
            minutes: s?.games?.minutes || 0,
            rating: s?.games?.rating || null,
            scorerScore: Math.min(100, Math.round(score)),
          };
        })
        .filter(p => p.minutes > 0)
        .sort((a, b) => b.scorerScore - a.scorerScore)
        .slice(0, 5);
    }

    const homeTeamId = fixture.teams?.home?.id;
    const awayTeamId = fixture.teams?.away?.id;

    const homeData = playerData.find(t => t.team?.id === homeTeamId);
    const awayData = playerData.find(t => t.team?.id === awayTeamId);

    res.json({
      home: {
        team: fixture.teams?.home,
        players: processTeamPlayers(homeData),
      },
      away: {
        team: fixture.teams?.away,
        players: processTeamPlayers(awayData),
      },
    });
  } catch (err) {
    console.error('[Route] /players/fixture/:id/scorers error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/league/:leagueId/topscorers
router.get('/league/:leagueId/topscorers', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { LEAGUES } = footballApi;
    const league = Object.values(LEAGUES).find(l => l.id === parseInt(leagueId));
    if (!league) return res.status(404).json({ error: 'League not found' });

    const scorers = await footballApi.getTopScorers(league.id, league.season);
    res.json({ scorers: scorers.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/team/:teamId/form — recent form
router.get('/team/:teamId/form', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { leagueId, season = 2024 } = req.query;
    if (!leagueId) return res.status(400).json({ error: 'leagueId is required' });

    const matches = await footballApi.getTeamRecentForm(
      parseInt(teamId),
      parseInt(leagueId),
      parseInt(season)
    );
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
