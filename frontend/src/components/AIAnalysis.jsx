import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const confidenceConfig = {
  Low: { color: 'text-confidence-low bg-confidence-low/10 border-confidence-low/30', icon: '⚠️' },
  Medium: { color: 'text-confidence-medium bg-confidence-medium/10 border-confidence-medium/30', icon: '📊' },
  High: { color: 'text-confidence-high bg-confidence-high/10 border-confidence-high/30', icon: '✅' },
};

function KeyPlayerChip({ player }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-bg-surface/70 rounded-lg border border-white/5">
      <div className="w-8 h-8 rounded-full bg-gradient-cyan-violet flex items-center justify-center text-xs font-bold text-white shrink-0">
        {player.name?.charAt(0)}
      </div>
      <div>
        <p className="font-semibold text-sm text-text-primary">{player.name}</p>
        {player.team && (
          <p className="text-xs text-text-muted">{player.team}</p>
        )}
        <p className="text-xs text-text-secondary mt-1">{player.reason}</p>
      </div>
    </div>
  );
}

export default function AIAnalysis({ fixtureId, initialAnalysis }) {
  const [analysis, setAnalysis] = useState(initialAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    setStreamText('');
    setStatusMsg('');

    try {
      // Try SSE streaming first
      setStreaming(true);
      const es = new EventSource(`${API_BASE}/api/analysis/${fixtureId}/stream`);
      let buffer = '';

      es.addEventListener('status', (e) => {
        const data = JSON.parse(e.data);
        setStatusMsg(data.message);
      });

      es.addEventListener('chunk', (e) => {
        const data = JSON.parse(e.data);
        buffer += data.text;
        setStreamText(buffer);
      });

      es.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        setAnalysis(data.analysis);
        setStreaming(false);
        setStreamText('');
        setLoading(false);
        setStatusMsg('');
        es.close();
      });

      es.addEventListener('error', (e) => {
        es.close();
        // Fallback to POST
        fallbackGenerate();
      });
    } catch {
      fallbackGenerate();
    }
  };

  const fallbackGenerate = async () => {
    setStreaming(false);
    setStreamText('');
    setStatusMsg('Génération en cours...');

    try {
      const res = await fetch(`${API_BASE}/api/analysis/${fixtureId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  if (loading && !streaming) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-accent-cyan">
          <div className="w-5 h-5 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
          <span className="text-sm font-medium">{statusMsg || 'Connexion à Groq...'}</span>
        </div>
        {streamText && (
          <div className="bg-bg-surface/50 rounded-lg p-4 border border-white/5 font-mono text-xs text-text-muted whitespace-pre-wrap">
            {streamText}
            <span className="animate-pulse">▌</span>
          </div>
        )}
      </div>
    );
  }

  if (loading && streaming && streamText) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-accent-cyan text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
          <span>{statusMsg || 'IA en train d\'analyser...'}</span>
        </div>
        <div className="bg-bg-surface/50 rounded-lg p-4 border border-accent-cyan/20 font-mono text-xs text-text-secondary whitespace-pre-wrap max-h-40 overflow-auto">
          {streamText}
          <span className="animate-pulse text-accent-cyan">▌</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-result-loss/10 border border-result-loss/30 rounded-lg p-4 text-result-loss text-sm">
          <p className="font-semibold mb-1">Erreur</p>
          <p>{error}</p>
        </div>
        <button onClick={generateAnalysis} className="btn-secondary text-sm">
          Réessayer
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🤖</div>
        <p className="text-text-secondary mb-2 font-medium">Analyse IA non générée</p>
        <p className="text-text-muted text-sm mb-6">
          Groq analysera les stats des deux équipes, le H2H et la forme récente
          pour produire une prédiction complète.
        </p>
        <button onClick={generateAnalysis} className="btn-primary">
          Générer l'analyse IA
        </button>
      </div>
    );
  }

  const conf = confidenceConfig[analysis.confidence_level] || confidenceConfig.Medium;
  const wp = analysis.win_probability || {};

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header with regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold text-text-primary">Analyse Groq AI</span>
          {analysis.fromCache && (
            <span className="text-xs text-text-muted bg-bg-surface px-2 py-0.5 rounded-full border border-white/10">
              En cache
            </span>
          )}
        </div>
        <button
          onClick={generateAnalysis}
          className="btn-secondary text-xs"
          disabled={loading}
        >
          Régénérer
        </button>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="bg-bg-surface/50 rounded-lg p-4 border border-white/5">
          <p className="text-text-secondary text-sm leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Win probabilities */}
      {wp.home !== undefined && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Probabilités calculées par l'IA
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-result-win/10 rounded-lg p-3 border border-result-win/20">
              <div className="font-mono font-bold text-2xl text-result-win">{wp.home}%</div>
              <div className="text-xs text-text-muted mt-0.5">Domicile</div>
            </div>
            <div className="text-center bg-result-draw/10 rounded-lg p-3 border border-result-draw/20">
              <div className="font-mono font-bold text-2xl text-result-draw">{wp.draw}%</div>
              <div className="text-xs text-text-muted mt-0.5">Nul</div>
            </div>
            <div className="text-center bg-result-loss/10 rounded-lg p-3 border border-result-loss/20">
              <div className="font-mono font-bold text-2xl text-result-loss">{wp.away}%</div>
              <div className="text-xs text-text-muted mt-0.5">Extérieur</div>
            </div>
          </div>
        </div>
      )}

      {/* Key players */}
      {analysis.key_players?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Joueurs à surveiller
          </p>
          <div className="space-y-2">
            {analysis.key_players.map((p, i) => (
              <KeyPlayerChip key={i} player={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {analysis.recommendation && (
        <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-cyan mb-2">
            💡 Recommandation
          </p>
          <p className="text-text-primary text-sm font-medium">{analysis.recommendation}</p>
        </div>
      )}

      {/* Confidence */}
      {analysis.confidence_level && (
        <div className="flex items-start gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${conf.color}`}>
            {conf.icon} {analysis.confidence_level}
          </span>
          {analysis.confidence_reason && (
            <p className="text-text-muted text-sm">{analysis.confidence_reason}</p>
          )}
        </div>
      )}
    </div>
  );
}
