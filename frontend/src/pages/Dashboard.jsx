import React, { useState } from 'react';
import { useMatches } from '../hooks/useMatches.js';
import MatchCard, { MatchCardSkeleton } from '../components/MatchCard.jsx';
import CompetitionFilter from '../components/CompetitionFilter.jsx';

function ApiUsageBar({ apiUsage }) {
  if (!apiUsage) return null;
  const pct = Math.round((apiUsage.today / apiUsage.limit) * 100);
  const color = pct >= 80 ? 'bg-result-loss' : pct >= 60 ? 'bg-result-draw' : 'bg-result-win';

  return (
    <div className="flex items-center gap-3 text-xs text-text-muted">
      <span>API Football</span>
      <div className="flex-1 max-w-[120px] h-1.5 bg-bg-surface rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono">{apiUsage.today}/{apiUsage.limit}</span>
    </div>
  );
}

function EmptyState({ competition }) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="text-5xl mb-4">
        {competition === 'ucl' ? '🏆' : competition === 'worldcup' ? '🌍' : '⚽'}
      </div>
      <h3 className="text-xl font-display font-bold text-text-primary mb-2">
        Aucun match à venir
      </h3>
      <p className="text-text-muted max-w-md mx-auto">
        Aucun match trouvé pour les 7 prochains jours.
        Vérifiez vos clés API dans le fichier <code className="font-mono text-accent-cyan text-xs">.env</code>.
      </p>
      <div className="mt-6 bg-bg-card border border-white/10 rounded-xl p-4 max-w-sm mx-auto text-left">
        <p className="text-xs font-semibold text-text-secondary mb-2">Checklist :</p>
        <ul className="space-y-1 text-xs text-text-muted">
          <li>✓ <code className="font-mono text-accent-cyan">RAPIDAPI_KEY</code> configurée dans .env</li>
          <li>✓ Backend démarré sur port 3001</li>
          <li>✓ Plan gratuit API-Football actif</li>
        </ul>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [competition, setCompetition] = useState('all');
  const { matches, loading, refreshing, error, apiUsage, lastUpdated, refresh } = useMatches(competition);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-2">
          Football <span className="text-accent-cyan">Scout</span>{' '}
          <span className="text-accent-violet">AI</span>
        </h1>
        <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto">
          Analyse IA des matchs à venir — Champions League & Coupe du Monde
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CompetitionFilter active={competition} onChange={setCompetition} />
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <ApiUsageBar apiUsage={apiUsage} />
            <button
              onClick={refresh}
              disabled={refreshing}
              title="Appel API réel — consomme ~2 requêtes"
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                ${refreshing
                  ? 'bg-bg-surface border-white/10 text-text-muted cursor-not-allowed'
                  : 'bg-bg-surface border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10 active:scale-95'
                }
              `}
            >
              <span className={refreshing ? 'animate-spin' : ''}>↻</span>
              {refreshing ? 'Chargement…' : 'Refresh API'}
            </button>
          </div>
          {lastUpdated && (
            <span className="text-xs text-text-muted">
              Mis à jour {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-result-loss/10 border border-result-loss/30 rounded-xl p-4 text-result-loss text-sm">
          <p className="font-semibold mb-1">Erreur de connexion</p>
          <p className="text-result-loss/70">{error}</p>
          <p className="mt-2 text-xs text-text-muted">
            Vérifiez que le backend est démarré sur <code className="font-mono">localhost:3001</code>
          </p>
        </div>
      )}

      {/* Match grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {[...Array(6)].map((_, i) => <MatchCardSkeleton key={i} />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState competition={competition} />
      ) : (
        <div>
          <p className="text-sm text-text-muted mb-4">
            {matches.length} match{matches.length > 1 ? 's' : ''} à venir
          </p>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {matches.map(match => (
              <MatchCard
                key={match.fixture?.id}
                match={match}
                analysis={null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
