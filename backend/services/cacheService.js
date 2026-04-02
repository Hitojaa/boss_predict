const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join('/app/data', 'footscout.db');
const SCHEMA_PATH = path.join(__dirname, '../db/schema.sql');

let db;

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  return db;
}

// TTL helpers
const TTL = {
  MATCHES: 60 * 60,           // 1h
  TEAM_STATS: 6 * 60 * 60,    // 6h
  H2H: 24 * 60 * 60,          // 24h
  PLAYER_STATS: 3 * 60 * 60,  // 3h
};

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function isExpired(cachedAt, ttlSeconds) {
  return nowSeconds() - cachedAt > ttlSeconds;
}

// --- Matches cache ---
function getCachedMatches(leagueId) {
  const rows = getDb()
    .prepare('SELECT * FROM matches WHERE league_id = ? ORDER BY match_date ASC')
    .all(leagueId);

  if (!rows.length) return null;

  const oldest = Math.min(...rows.map(r => r.cached_at));
  if (isExpired(oldest, TTL.MATCHES)) return null;

  return rows.map(r => JSON.parse(r.raw_data));
}

function setCachedMatches(leagueId, fixtures) {
  const insert = getDb().prepare(`
    INSERT OR REPLACE INTO matches
      (fixture_id, league_id, home_team, away_team, match_date, venue, raw_data, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = nowSeconds();
  const insertMany = getDb().transaction((items) => {
    for (const fixture of items) {
      insert.run(
        fixture.fixture.id,
        leagueId,
        fixture.teams.home.name,
        fixture.teams.away.name,
        fixture.fixture.date,
        fixture.fixture.venue?.name || '',
        JSON.stringify(fixture),
        now
      );
    }
  });

  insertMany(fixtures);
}

function getCachedFixture(fixtureId) {
  const row = getDb()
    .prepare('SELECT * FROM matches WHERE fixture_id = ?')
    .get(fixtureId);

  if (!row) return null;
  return JSON.parse(row.raw_data);
}

// --- Team stats cache ---
function getCachedTeamStats(teamId, leagueId, season) {
  const row = getDb()
    .prepare('SELECT * FROM team_stats WHERE team_id = ? AND league_id = ? AND season = ?')
    .get(teamId, leagueId, season);

  if (!row || isExpired(row.cached_at, TTL.TEAM_STATS)) return null;
  return JSON.parse(row.stats_json);
}

function setCachedTeamStats(teamId, leagueId, season, stats) {
  getDb().prepare(`
    INSERT OR REPLACE INTO team_stats (team_id, league_id, season, stats_json, cached_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(teamId, leagueId, season, JSON.stringify(stats), nowSeconds());
}

// --- H2H cache ---
function getCachedH2H(team1Id, team2Id) {
  const [t1, t2] = [Math.min(team1Id, team2Id), Math.max(team1Id, team2Id)];
  const row = getDb()
    .prepare('SELECT * FROM h2h_cache WHERE team1_id = ? AND team2_id = ?')
    .get(t1, t2);

  if (!row || isExpired(row.cached_at, TTL.H2H)) return null;
  return JSON.parse(row.data_json);
}

function setCachedH2H(team1Id, team2Id, data) {
  const [t1, t2] = [Math.min(team1Id, team2Id), Math.max(team1Id, team2Id)];
  getDb().prepare(`
    INSERT OR REPLACE INTO h2h_cache (team1_id, team2_id, data_json, cached_at)
    VALUES (?, ?, ?, ?)
  `).run(t1, t2, JSON.stringify(data), nowSeconds());
}

// --- Player stats cache ---
function getCachedPlayerStats(fixtureId) {
  const row = getDb()
    .prepare('SELECT * FROM player_stats WHERE fixture_id = ?')
    .get(fixtureId);

  if (!row || isExpired(row.cached_at, TTL.PLAYER_STATS)) return null;
  return JSON.parse(row.data_json);
}

function setCachedPlayerStats(fixtureId, data) {
  getDb().prepare(`
    INSERT OR REPLACE INTO player_stats (fixture_id, data_json, cached_at)
    VALUES (?, ?, ?)
  `).run(fixtureId, JSON.stringify(data), nowSeconds());
}

// --- AI analyses cache ---
function getCachedAnalysis(fixtureId) {
  const row = getDb()
    .prepare('SELECT * FROM ai_analyses WHERE fixture_id = ?')
    .get(fixtureId);

  if (!row) return null;
  return JSON.parse(row.analysis_json);
}

function setCachedAnalysis(fixtureId, analysis) {
  getDb().prepare(`
    INSERT OR REPLACE INTO ai_analyses (fixture_id, analysis_json, generated_at)
    VALUES (?, ?, ?)
  `).run(fixtureId, JSON.stringify(analysis), nowSeconds());
}

// --- API usage counter ---
function incrementApiUsage() {
  const today = new Date().toISOString().slice(0, 10);
  getDb().prepare(`
    INSERT INTO api_usage (date, count) VALUES (?, 1)
    ON CONFLICT(date) DO UPDATE SET count = count + 1
  `).run(today);
}

function getApiUsageToday() {
  const today = new Date().toISOString().slice(0, 10);
  const row = getDb()
    .prepare('SELECT count FROM api_usage WHERE date = ?')
    .get(today);
  return row ? row.count : 0;
}

module.exports = {
  initDatabase,
  getDb,
  getCachedMatches,
  setCachedMatches,
  getCachedFixture,
  getCachedTeamStats,
  setCachedTeamStats,
  getCachedH2H,
  setCachedH2H,
  getCachedPlayerStats,
  setCachedPlayerStats,
  getCachedAnalysis,
  setCachedAnalysis,
  incrementApiUsage,
  getApiUsageToday,
};
