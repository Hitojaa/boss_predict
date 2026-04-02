import React from 'react';

function FormBadge({ result }) {
  const r = result?.toUpperCase();
  if (r === 'W') return <span className="badge-form-win">W</span>;
  if (r === 'D') return <span className="badge-form-draw">D</span>;
  return <span className="badge-form-loss">L</span>;
}

export default function TeamForm({ form, className = '' }) {
  if (!form) {
    return (
      <div className={`flex gap-1 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton w-7 h-7 rounded-full" />
        ))}
      </div>
    );
  }

  // form can be a string like "WWDLW" or array
  const chars = typeof form === 'string'
    ? form.slice(-5).split('')
    : form.slice(-5);

  return (
    <div className={`flex gap-1 ${className}`}>
      {chars.map((r, i) => (
        <FormBadge key={i} result={r} />
      ))}
    </div>
  );
}

export function FormFromMatches({ matches, teamId, className = '' }) {
  if (!matches?.length) {
    return (
      <div className={`flex gap-1 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton w-7 h-7 rounded-full" />
        ))}
      </div>
    );
  }

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
