-- Cache des matchs à venir
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fixture_id INTEGER UNIQUE,
  league_id INTEGER,
  home_team TEXT,
  away_team TEXT,
  match_date TEXT,
  venue TEXT,
  raw_data TEXT,
  cached_at INTEGER
);

-- Cache des analyses IA
CREATE TABLE IF NOT EXISTS ai_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fixture_id INTEGER UNIQUE,
  analysis_json TEXT,
  generated_at INTEGER
);

-- Cache des stats équipes
CREATE TABLE IF NOT EXISTS team_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER,
  league_id INTEGER,
  season INTEGER,
  stats_json TEXT,
  cached_at INTEGER,
  UNIQUE(team_id, league_id, season)
);

-- Cache H2H
CREATE TABLE IF NOT EXISTS h2h_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team1_id INTEGER,
  team2_id INTEGER,
  data_json TEXT,
  cached_at INTEGER,
  UNIQUE(team1_id, team2_id)
);

-- Cache des stats joueurs par fixture
CREATE TABLE IF NOT EXISTS player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fixture_id INTEGER UNIQUE,
  data_json TEXT,
  cached_at INTEGER
);

-- Compteur de requêtes API quotidien
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE,
  count INTEGER DEFAULT 0
);
