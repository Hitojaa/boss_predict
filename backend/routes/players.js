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

// GET /api/players/fixture/:fixtureId/scorers
// Utilise les top buteurs de la compétition filtrés par équipe
router.get('/fixture/:fixtureId/scorers', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const id = parseInt(fixtureId);

    const fixture = await footballApi.getFixture(id);
    if (!fixture) return res.status(404).json({ error: 'Fixture not found' });

    const homeTeamId = fixture.teams?.home?.id;
    const awayTeamId = fixture.teams?.away?.id;
    const leagueId = fixture.league?.id;

    // Récupère les top buteurs de la compétition
    const allScorers = await footballApi.getTopScorers(leagueId);

    function computeScorerScore(scorer) {
      const stats = scorer.statistics?.[0];
      const goals = stats?.goals?.total || 0;
      const appearances = stats?.games?.appearances || 1;
      const assists = stats?.goals?.assists || 0;
      // Score pondéré : ratio buts/match + assists
      return Math.min(100, Math.round((goals / appearances) * 55 + (assists / appearances) * 20 + goals * 1.5));
    }

    function filterTeamScorers(teamId) {
      return allScorers
        .filter(s => s.team?.id === teamId)
        .map(s => ({
          id: s.player?.id,
          name: s.player?.name,
          position: 'Attacker',
          photo: s.player?.photo || null,
          goals: s.statistics?.[0]?.goals?.total || 0,
          assists: s.statistics?.[0]?.goals?.assists || 0,
          shots: null,
          shotsOn: null,
          minutes: (s.statistics?.[0]?.games?.appearances || 0) * 80,
          rating: null,
          scorerScore: computeScorerScore(s),
        }))
        .sort((a, b) => b.scorerScore - a.scorerScore)
        .slice(0, 5);
    }

    res.json({
      home: {
        team: fixture.teams?.home,
        players: filterTeamScorers(homeTeamId),
      },
      away: {
        team: fixture.teams?.away,
        players: filterTeamScorers(awayTeamId),
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

// GET /api/players/team/:teamId/form
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
