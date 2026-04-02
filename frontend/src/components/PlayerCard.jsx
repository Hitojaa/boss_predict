import React from 'react';

function ScorerBar({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="w-full bg-bg-surface rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, #00d4ff ${100 - pct}%, #7c3aed 100%)`,
        }}
      />
    </div>
  );
}

export default function PlayerCard({ player, rank }) {
  const { name, position, photo, goals, assists, shots, shotsOn, minutes, rating, scorerScore } = player;

  const positionColors = {
    Attacker: 'text-result-loss bg-result-loss/10 border-result-loss/30',
    Midfielder: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30',
    Defender: 'text-result-win bg-result-win/10 border-result-win/30',
    Goalkeeper: 'text-result-draw bg-result-draw/10 border-result-draw/30',
  };
  const posColor = positionColors[position] || 'text-text-muted bg-bg-surface border-white/10';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface/50 border border-white/5 hover:border-accent-cyan/20 transition-all duration-200">
      {/* Rank */}
      <div className="w-6 text-center font-mono text-xs text-text-muted shrink-0">
        #{rank}
      </div>

      {/* Photo */}
      {photo ? (
        <img
          src={photo}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-lg shrink-0 border border-white/10">
          👤
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm text-text-primary truncate">{name}</p>
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium border ${posColor}`}>
            {position?.slice(0, 3) || 'N/A'}
          </span>
        </div>

        <ScorerBar score={scorerScore} />

        <div className="flex gap-3 mt-1 text-xs font-mono text-text-muted">
          <span title="Buts">⚽ {goals}</span>
          <span title="Passes décisives">🎯 {assists}</span>
          <span title="Tirs cadrés">📐 {shotsOn}/{shots}</span>
          {rating && <span title="Note">⭐ {parseFloat(rating).toFixed(1)}</span>}
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <div className="font-mono font-bold text-lg text-accent-cyan">{scorerScore}</div>
        <div className="text-xs text-text-muted">score</div>
      </div>
    </div>
  );
}

export function PlayerCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface/50 border border-white/5 animate-pulse">
      <div className="skeleton w-6 h-4 rounded" />
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="skeleton w-12 h-10 rounded" />
    </div>
  );
}
