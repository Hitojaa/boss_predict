import React from 'react';

function H2HRow({ match, homeTeamId }) {
  const home = match.teams?.home;
  const away = match.teams?.away;
  const homeGoals = match.goals?.home ?? '?';
  const awayGoals = match.goals?.away ?? '?';
  const date = match.fixture?.date
    ? new Date(match.fixture.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  const isHome = home?.id === homeTeamId;
  const scored = isHome ? homeGoals : awayGoals;
  const conceded = isHome ? awayGoals : homeGoals;

  let result = 'D';
  if (homeGoals !== '?' && awayGoals !== '?') {
    if (isHome) result = homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';
    else result = awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D';
  }

  const resultColors = {
    W: 'text-result-win bg-result-win/10 border-result-win/30',
    D: 'text-result-draw bg-result-draw/10 border-result-draw/30',
    L: 'text-result-loss bg-result-loss/10 border-result-loss/30',
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-text-muted w-24 shrink-0">{date}</span>
      <div className="flex-1 grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-sm">
        <span className={`truncate font-medium ${home?.id === homeTeamId ? 'text-text-primary' : 'text-text-secondary'}`}>
          {home?.name}
        </span>
        <span className="font-mono font-bold text-text-primary whitespace-nowrap px-2">
          {homeGoals} – {awayGoals}
        </span>
        <span className={`truncate font-medium text-right ${away?.id === homeTeamId ? 'text-text-primary' : 'text-text-secondary'}`}>
          {away?.name}
        </span>
      </div>
      <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold border ${resultColors[result]}`}>
        {result}
      </span>
    </div>
  );
}

export default function H2HPanel({ h2h, homeTeamId, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-10 rounded" />
        ))}
      </div>
    );
  }

  if (!h2h?.length) {
    return (
      <div className="text-center py-8 text-text-muted">
        <div className="text-3xl mb-2">📊</div>
        <p>Aucun historique disponible</p>
      </div>
    );
  }

  // Stats summary
  const wins = h2h.filter(m => {
    const hg = m.goals?.home;
    const ag = m.goals?.away;
    const isHome = m.teams?.home?.id === homeTeamId;
    if (hg === null || ag === null) return false;
    return isHome ? hg > ag : ag > hg;
  }).length;

  const draws = h2h.filter(m => m.goals?.home === m.goals?.away && m.goals?.home !== null).length;
  const losses = h2h.length - wins - draws;

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center bg-result-win/10 rounded-lg p-2 border border-result-win/20">
          <div className="font-mono font-bold text-xl text-result-win">{wins}</div>
          <div className="text-xs text-text-muted">Victoires</div>
        </div>
        <div className="text-center bg-result-draw/10 rounded-lg p-2 border border-result-draw/20">
          <div className="font-mono font-bold text-xl text-result-draw">{draws}</div>
          <div className="text-xs text-text-muted">Nuls</div>
        </div>
        <div className="text-center bg-result-loss/10 rounded-lg p-2 border border-result-loss/20">
          <div className="font-mono font-bold text-xl text-result-loss">{losses}</div>
          <div className="text-xs text-text-muted">Défaites</div>
        </div>
      </div>

      {/* Match list */}
      <div>
        {h2h.slice(0, 5).map((m, i) => (
          <H2HRow key={m.fixture?.id || i} match={m} homeTeamId={homeTeamId} />
        ))}
      </div>
    </div>
  );
}
