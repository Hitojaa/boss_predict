import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function useAnalysis(fixtureId) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if a cached analysis exists on mount
  useEffect(() => {
    if (!fixtureId) return;

    const checkCache = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analysis/${fixtureId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.analysis) {
            setAnalysis(data.analysis);
          }
        }
      } catch {
        // Silently ignore cache check failures
      }
    };

    checkCache();
  }, [fixtureId]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/analysis/${fixtureId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { analysis, loading, error, generate };
}

export function usePlayerScorers(fixtureId) {
  const [scorers, setScorers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fixtureId) return;

    const fetchScorers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/players/fixture/${fixtureId}/scorers`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setScorers(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScorers();
  }, [fixtureId]);

  return { scorers, loading, error };
}
