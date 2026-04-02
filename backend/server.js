require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./services/cacheService');
const { startScheduler } = require('./services/scheduler');

const matchesRouter = require('./routes/matches');
const analysisRouter = require('./routes/analysis');
const playersRouter = require('./routes/players');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['http://localhost:3000']
    : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/matches', matchesRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/players', playersRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

async function start() {
  try {
    initDatabase();
    console.log('[DB] SQLite initialized');

    if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'ta_clé_ici') {
      startScheduler();
      console.log('[Scheduler] Cron jobs started');
    } else {
      console.warn('[Scheduler] RAPIDAPI_KEY not set — scheduler disabled');
    }

    app.listen(PORT, () => {
      console.log(`[Server] FootScout AI running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Fatal] Failed to start server:', err);
    process.exit(1);
  }
}

start();
