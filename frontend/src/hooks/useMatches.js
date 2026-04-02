import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useMatches(competition = 'all') {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiUsage, setApiUsage] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/matches/upcoming?competition=${competition}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMatches(data.matches || []);
      setApiUsage(data.apiUsage);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [competition]);

  useEffect(() => {
    setLoading(true);
    fetchMatches();

    const interval = setInterval(fetchMatches, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  return { matches, loading, error, apiUsage, lastUpdated, refetch: fetchMatches };
}

export function useMatchDetail(fixtureId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fixtureId) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/matches/${fixtureId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        setData(d);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [fixtureId]);

  return { data, loading, error };
}
