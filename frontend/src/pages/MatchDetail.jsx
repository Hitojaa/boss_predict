import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMatchDetail } from '../hooks/useMatches.js';
import { usePlayerScorers } from '../hooks/useAnalysis.js';
import WinProbability from '../components/WinProbability.jsx';
import TeamForm from '../components/TeamForm.jsx';
import H2HPanel from '../components/H2HPanel.jsx';
import TopScorers from '../components/TopScorers.jsx';
import AIAnalysis from '../components/AIAnalysis.jsx';

function StatRow({ label, home, away }) {
  return (
    <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="font-mono text-sm text-text-primary text-right">{home ?? '—'}</span>
      <span className="text-xs text-text-muted text-center w-28 shrink-0">{label}</span>
      <span className="font-mono text-sm text-text-primary">{away ?? '—'}</span>
    </div>
  );
}

function TeamStatsPanel({ homeStats, awayStats, homeTeam, awayTeam }) {
  if (!homeStats && !awayStats) {
    return (
      <div className="text-center py-8 text-text-muted">
        <div className="text-3xl mb-2">📊</div>
        <p>Stats de saison non disponibles</p>
        <p className="text-xs mt-1">Données chargées après le premier match de la compétition</p>
      </div>
    );
  }

  const getVal = (stats, path) => {
    return path.split('.').reduce((obj, k) => obj?.[k], stats) ?? '—';
  };

  const rows = [
    { label: 'Matchs joués', home: getVal(homeStats, 'fixtures.played.total'), away: getVal(awayStats, 'fixtures.played.total') },
    { label: 'Victoires', home: getVal(homeStats, 'fixtures.wins.total'), away: getVal(awayStats, 'fixtures.wins.total') },
    { label: 'Buts marqués', home: getVal(homeStats, 'goals.for.total.total'), away: getVal(awayStats, 'goals.for.total.total') },
    { label: 'Buts encaissés', home: getVal(homeStats, 'goals.against.total.total'), away: getVal(awayStats, 'goals.against.total.total') },
    { label: 'Clean sheets', home: getVal(homeStats, 'clean_sheet.total'), away: getVal(awayStats, 'clean_sheet.total') },
    { label: 'Buts/match', home: getVal(homeStats, 'goals.for.average.total'), away: getVal(awayStats, 'goals.for.average.total') },
    { label: 'Cartons jaunes', home: getVal(homeStats, 'cards.yellow.0-15.total') !== '—' ? Object.values(getVal(homeStats, 'cards.yellow') || {}).reduce((s, v) => s + (v?.total || 0), 0) : '—', away: getVal(awayStats, 'cards.yellow.0-15.total') !== '—' ? Object.values(getVal(awayStats, 'cards.yellow') || {}).reduce((s, v) => s + (v?.total || 0), 0) : '—' },
  ];

  return (
    <div>
      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center py-2 mb-2">
        <div className="flex items-center gap-2 justify-end">
          {homeTeam?.logo && (
            <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6 object-contain"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
          <span className="font-display font-bold text-sm text-text-primary truncate">{homeTeam?.name}</span>
        </div>
        <span className="text-xs text-text-muted text-center w-28">Stat</span>
        <div className="flex items-center gap-2">
          {awayTeam?.logo && (
            <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6 object-contain"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
          <span className="font-display font-bold text-sm text-text-primary truncate">{awayTeam?.name}</span>
        </div>
      </div>
      {rows.map((r, i) => (
        <StatRow key={i} label={r.label} home={r.home} away={r.away} />
      ))}
    </div>
  );
}

function SectionCard({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-bg-surface/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h2 className="section-title">{title}</h2>
        </div>
        <span className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

export default function MatchDetail() {
  const { fixtureId } = useParams();
  const { data, loading, error } = useMatchDetail(fixtureId);
  const { scorers, loading: scorersLoading } = usePlayerScorers(fixtureId);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-16 rounded" />
          <div className="skeleton h-8 rounded" />
          <div className="skeleton h-20 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="skeleton h-6 w-40 rounded mb-4" />
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => <div key={j} className="skeleton h-8 rounded" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="font-display font-bold text-xl text-text-primary mb-2">Erreur</h2>
        <p className="text-text-muted mb-6">{error}</p>
        <Link to="/" className="btn-primary">← Retour au dashboard</Link>
      </div>
    );
  }

  if (!data) return null;

  const { fixture, homeStats, awayStats, h2h, players, injuries } = data;
  const homeTeam = fixture?.teams?.home;
  const awayTeam = fixture?.teams?.away;
  const matchDate = fixture?.fixture?.date ? new Date(fixture.fixture.date) : null;
  const leagueId = fixture?.league?.id;
  const isUCL = leagueId === 2;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/" className="hover:text-accent-cyan transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-text-secondary">{homeTeam?.name} vs {awayTeam?.name}</span>
      </div>

      {/* Match header card */}
      <div className="card p-5 sm:p-6">
        {/* League + date */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {fixture?.league?.logo && (
              <img src={fixture.league.logo} alt={fixture.league.name}
                className="w-6 h-6 object-contain"
                onError={e => { e.target.style.display = 'none'; }} />
            )}
            <span className={`text-sm font-medium ${isUCL ? 'text-accent-violet' : 'text-accent-cyan'}`}>
              {fixture?.league?.name || 'Compétition inconnue'}
            </span>
          </div>
          {matchDate && (
            <div className="text-right">
              <p className="font-mono text-accent-cyan font-semibold">
                {matchDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="font-mono text-lg font-bold text-text-primary">
                {matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-6 items-center mb-6">
          {/* Home */}
          <div className="flex flex-col items-center text-center gap-3">
            {homeTeam?.logo ? (
              <img src={homeTeam.logo} alt={homeTeam.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl"
                onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-bg-surface flex items-center justify-center text-3xl">⚽</div>
            )}
            <div>
              <p className="font-display font-bold text-lg sm:text-xl text-text-primary">{homeTeam?.name}</p>
              <p className="text-xs text-text-muted">Domicile</p>
            </div>
            <TeamForm form={homeStats?.form} />
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="font-display font-bold text-2xl sm:text-3xl text-text-muted">VS</div>
            {fixture?.fixture?.venue?.name && (
              <p className="text-xs text-text-muted mt-2 max-w-[80px] sm:max-w-none leading-tight">
                📍 {fixture.fixture.venue.name}
              </p>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center text-center gap-3">
            {awayTeam?.logo ? (
              <img src={awayTeam.logo} alt={awayTeam.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl"
                onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-bg-surface flex items-center justify-center text-3xl">⚽</div>
            )}
            <div>
              <p className="font-display font-bold text-lg sm:text-xl text-text-primary">{awayTeam?.name}</p>
              <p className="text-xs text-text-muted">Extérieur</p>
            </div>
            <TeamForm form={awayStats?.form} />
          </div>
        </div>

        {/* Win probability placeholder (filled by AI) */}
        <div className="mt-2">
          <p className="text-xs text-text-muted mb-2 text-center">
            Générez l'analyse IA ci-dessous pour voir les probabilités
          </p>
          <WinProbability
            home={33} draw={34} away={33}
            homeTeam={homeTeam?.name}
            awayTeam={awayTeam?.name}
          />
        </div>
      </div>

      {/* Stats & Form */}
      <SectionCard title="Stats & Forme" icon="📊">
        <TeamStatsPanel
          homeStats={homeStats}
          awayStats={awayStats}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      </SectionCard>

      {/* H2H */}
      <SectionCard title="Confrontations directes (H2H)" icon="⚔️">
        <H2HPanel h2h={h2h} homeTeamId={homeTeam?.id} loading={false} />
      </SectionCard>

      {/* Potential scorers */}
      <SectionCard title="Buteurs potentiels" icon="🎯">
        <TopScorers
          homeTeam={{
            ...homeTeam,
            players: scorers?.home?.players,
          }}
          awayTeam={{
            ...awayTeam,
            players: scorers?.away?.players,
          }}
          loading={scorersLoading}
        />
      </SectionCard>

      {/* AI Analysis */}
      <SectionCard title="Analyse IA (Groq)" icon="🤖" defaultOpen={true}>
        <AIAnalysis fixtureId={fixtureId} />
      </SectionCard>

      {/* Injuries if any */}
      {injuries?.length > 0 && (
        <SectionCard title="Blessures & Indisponibilités" icon="🏥" defaultOpen={false}>
          <div className="space-y-2">
            {injuries.map((inj, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-bg-surface/50 rounded-lg">
                {inj.team?.logo && (
                  <img src={inj.team.logo} alt={inj.team.name} className="w-6 h-6 object-contain"
                    onError={e => { e.target.style.display = 'none'; }} />
                )}
                <div>
                  <p className="text-sm font-medium text-text-primary">{inj.player?.name}</p>
                  <p className="text-xs text-result-loss">{inj.player?.reason || 'Blessure'}</p>
                </div>
                <span className="ml-auto text-xs text-text-muted">{inj.team?.name}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
