import React from 'react';

function FormBadge({ result }) {
  const r = result?.toUpperCase();
  if (r === 'W') return <span className="badge-form-win">W</span>;
  if (r === 'D') return <span className="badge-form-draw">D</span>;
  return <span className="badge-form-loss">L</span>;
}

// État vide — pas de données disponibles (pas de skeleton loader trompeur)
function EmptyForm({ className = '' }) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-bg-surface/50 text-text-muted border border-white/5"
        >
          ?
        </span>
      ))}
    </div>
  );
}

export default function TeamForm({ form, className = '' }) {
  if (!form) return <EmptyForm className={className} />;

  const chars = typeof form === 'string'
    ? form.slice(-5).split('')
    : form.slice(-5);

  if (!chars.length) return <EmptyForm className={className} />;

  return (
    <div className={`flex gap-1 ${className}`}>
      {chars.map((r, i) => (
        <FormBadge key={i} result={r} />
      ))}
    </div>
  );
}

export function FormFromMatches({ matches, teamId, className = '' }) {
  if (!matches?.length) return <EmptyForm className={className} />;

  const form = matches.slice(-5).map(m => {
    const homeId = m.teams?.home?.id;
    const homeGoals = m.goals?.home;
    const awayGoals = m.goals?.away;
    const isHome = homeId === teamId;

    if (homeGoals === null || awayGoals === null) return 'D';

    if (isHome) {
      if (homeGoals > awayGoals) return 'W';
      if (homeGoals < awayGoals) return 'L';
      return 'D';
    } else {
      if (awayGoals > homeGoals) return 'W';
      if (awayGoals < homeGoals) return 'L';
      return 'D';
    }
  });

  return (
    <div className={`flex gap-1 ${className}`}>
      {form.map((r, i) => (
        <FormBadge key={i} result={r} />
      ))}
    </div>
  );
}
