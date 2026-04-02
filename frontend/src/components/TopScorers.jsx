import React from 'react';
import PlayerCard, { PlayerCardSkeleton } from './PlayerCard.jsx';

export default function TopScorers({ homeTeam, awayTeam, loading }) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[homeTeam, awayTeam].map((team, t) => (
          <div key={t}>
            <div className="skeleton h-6 w-40 rounded mb-3" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <PlayerCardSkeleton key={i} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function TeamScorers({ team, players }) {
    if (!players?.length) {
      return (
        <div className="text-center py-6 text-text-muted">
          <div className="text-2xl mb-1">📋</div>
          <p className="text-sm">Pas de données joueurs</p>
          <p className="text-xs mt-1">Disponible après le match précédent</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {players.map((p, i) => (
          <PlayerCard key={p.id || i} player={p} rank={i + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-display font-bold text-text-primary mb-3 flex items-center gap-2">
          <img
            src={homeTeam?.logo}
            alt={homeTeam?.name}
            className="w-6 h-6 object-contain"
            onError={e => { e.target.style.display = 'none'; }}
          />
          {homeTeam?.name}
        </h4>
        <TeamScorers team={homeTeam} players={homeTeam?.players} />
      </div>

      <div>
        <h4 className="font-display font-bold text-text-primary mb-3 flex items-center gap-2">
          <img
            src={awayTeam?.logo}
            alt={awayTeam?.name}
            className="w-6 h-6 object-contain"
            onError={e => { e.target.style.display = 'none'; }}
          />
          {awayTeam?.name}
        </h4>
        <TeamScorers team={awayTeam} players={awayTeam?.players} />
      </div>
    </div>
  );
}
