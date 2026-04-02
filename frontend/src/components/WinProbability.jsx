import React from 'react';

export default function WinProbability({ home, draw, away, homeTeam, awayTeam, compact = false }) {
  const hasData = home != null && draw != null && away != null;
  const total = hasData ? ((home || 0) + (draw || 0) + (away || 0)) : 0;
  const homeP = total > 0 ? Math.round((home / total) * 100) : 0;
  const drawP = total > 0 ? Math.round((draw / total) * 100) : 0;
  const awayP = total > 0 ? (100 - homeP - drawP) : 0;

  if (compact) {
    if (!hasData) {
      return (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-2 h-2 rounded-full bg-accent-cyan/40" />
          <span>Cliquer pour générer l'analyse IA</span>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          <div className="bg-result-win transition-all duration-500" style={{ width: `${homeP}%` }} />
          <div className="bg-result-draw transition-all duration-500" style={{ width: `${drawP}%` }} />
          <div className="bg-result-loss transition-all duration-500" style={{ width: `${awayP}%` }} />
        </div>
        <div className="flex justify-between text-xs font-mono text-text-muted">
          <span className="text-result-win">{homeP}%</span>
          <span className="text-result-draw">{drawP}%</span>
          <span className="text-result-loss">{awayP}%</span>
        </div>
      </div>
    );
  }

  // Version complète (page détail)
  if (!hasData) {
    return (
      <div className="text-center py-4 text-text-muted text-sm">
        <p>Génère l'analyse IA ci-dessous pour voir les probabilités</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm text-text-secondary">
        <span className="truncate max-w-[120px]">{homeTeam}</span>
        <span className="text-text-muted">Nul</span>
        <span className="truncate max-w-[120px] text-right">{awayTeam}</span>
      </div>

      <div className="flex h-5 rounded-full overflow-hidden gap-px shadow-inner">
        <div
          className="bg-result-win flex items-center justify-center transition-all duration-700 ease-out"
          style={{ width: `${homeP}%` }}
        >
          {homeP > 15 && <span className="text-xs font-mono font-bold text-white">{homeP}%</span>}
        </div>
        <div
          className="bg-result-draw flex items-center justify-center transition-all duration-700 ease-out"
          style={{ width: `${drawP}%` }}
        >
          {drawP > 10 && <span className="text-xs font-mono font-bold text-white">{drawP}%</span>}
        </div>
        <div
          className="bg-result-loss flex items-center justify-center transition-all duration-700 ease-out"
          style={{ width: `${awayP}%` }}
        >
          {awayP > 15 && <span className="text-xs font-mono font-bold text-white">{awayP}%</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-result-win/10 rounded-lg p-2 border border-result-win/20">
          <div className="font-mono text-lg font-bold text-result-win">{homeP}%</div>
          <div className="text-xs text-text-muted mt-0.5">Victoire dom.</div>
        </div>
        <div className="bg-result-draw/10 rounded-lg p-2 border border-result-draw/20">
          <div className="font-mono text-lg font-bold text-result-draw">{drawP}%</div>
          <div className="text-xs text-text-muted mt-0.5">Nul</div>
        </div>
        <div className="bg-result-loss/10 rounded-lg p-2 border border-result-loss/20">
          <div className="font-mono text-lg font-bold text-result-loss">{awayP}%</div>
          <div className="text-xs text-text-muted mt-0.5">Victoire ext.</div>
        </div>
      </div>
    </div>
  );
}
