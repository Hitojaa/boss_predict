# FootScout AI ⚡

Dashboard de scouting football avec prédictions IA — Champions League & Coupe du Monde.

## Stack

| Couche | Tech |
|---|---|
| Frontend | React 18 + Tailwind CSS v3 |
| Backend | Node.js + Express |
| IA | Groq API (llama-3.3-70b-versatile) |
| Data | API-Football via RapidAPI |
| Base de données | SQLite (better-sqlite3) |
| Infra | Docker + docker-compose |

## Prérequis

- Docker & Docker Compose
- Clé [RapidAPI API-Football](https://rapidapi.com/api-sports/api/api-football) (plan gratuit : 100 req/jour)
- Clé [Groq API](https://console.groq.com/) (gratuit)

## Démarrage rapide

```bash
# 1. Clone
git clone https://github.com/hitojaa/boss_predict.git
cd boss_predict

# 2. Configurer les clés API
cp .env.example .env
# Éditer .env avec vos clés RAPIDAPI_KEY et GROQ_API_KEY

# 3. Lancer
docker-compose up --build

# Frontend → http://localhost:3000
# Backend API → http://localhost:3001
```

## Développement local (sans Docker)

```bash
# Backend
cd backend
npm install
cp ../.env.example .env  # ajouter vos clés
npm run dev  # port 3001

# Frontend (autre terminal)
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:3001 npm run dev  # port 5173
```

## Variables d'environnement

```env
RAPIDAPI_KEY=       # Clé RapidAPI (API-Football)
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com
GROQ_API_KEY=       # Clé Groq
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3001
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/matches/upcoming?competition=ucl\|worldcup\|all` | Matchs à venir |
| `GET /api/matches/:fixtureId` | Détail complet d'un match |
| `GET /api/matches/status/api-usage` | Consommation API du jour |
| `GET /api/analysis/:fixtureId` | Analyse IA en cache |
| `POST /api/analysis/:fixtureId/generate` | Générer une analyse IA |
| `GET /api/analysis/:fixtureId/stream` | Analyse IA en streaming (SSE) |
| `GET /api/players/fixture/:fixtureId/scorers` | Buteurs potentiels |

## Cache SQLite

| Donnée | TTL |
|---|---|
| Matchs à venir | 1h |
| Stats équipes | 6h |
| H2H | 24h |
| Stats joueurs | 3h |
| Analyses IA | Permanent (jusqu'à régénération) |

## Architecture

```
boss_predict/
├── backend/
│   ├── server.js           # Express + CORS + routes
│   ├── routes/
│   │   ├── matches.js      # Matchs, H2H, top scorers
│   │   ├── analysis.js     # Groq AI (POST + SSE stream)
│   │   └── players.js      # Stats joueurs par fixture
│   ├── services/
│   │   ├── footballApi.js  # Wrapper API-Football + cache
│   │   ├── groqService.js  # Prompts + parsing JSON Groq
│   │   ├── cacheService.js # SQLite TTL cache
│   │   └── scheduler.js    # Cron hourly refresh
│   └── db/schema.sql
├── frontend/
│   └── src/
│       ├── components/     # MatchCard, WinProbability, AIAnalysis...
│       ├── pages/          # Dashboard, MatchDetail
│       └── hooks/          # useMatches, useAnalysis
└── docker-compose.yml
```

## Limites API-Football (plan gratuit)

- 100 requêtes/jour
- Le cache SQLite est essentiel pour rester dans cette limite
- Un compteur journalier est affiché dans l'interface

## Fonctionnalités

- ✅ Dashboard matchs à venir (LDC + Coupe du Monde)
- ✅ Filtre par compétition
- ✅ Forme récente des équipes (5 derniers matchs)
- ✅ Page détail avec stats saison
- ✅ H2H avec résumé victoires/nuls/défaites
- ✅ Top buteurs potentiels avec score de probabilité
- ✅ Analyse IA Groq en streaming (SSE)
- ✅ Cache SQLite multicouche
- ✅ Cron job refresh toutes les heures
- ✅ Dark mode complet
- ✅ Responsive mobile
- ✅ Docker-compose ready
