import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function useMatches(competition = 'all') {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [apiUsage, setApiUsage] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load from cache only — no API call, no quota used
  const loadFromCache = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/matches/upcoming?competition=${competition}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMatches(data.matches || []);
      setApiUsage(data.apiUsage);
      if (data.matches?.length) setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [competition]);

  // Manual refresh — calls the real API, consumes 2 requests (UCL + WC)
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/matches/upcoming?competition=${competition}&refresh=true`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMatches(data.matches || []);
      setApiUsage(data.apiUsage);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [competition]);

  // On mount and competition change: load cache only
  useEffect(() => {
    setLoading(true);
    loadFromCache();
  }, [loadFromCache]);

  return { matches, loading, refreshing, error, apiUsage, lastUpdated, refresh };
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
