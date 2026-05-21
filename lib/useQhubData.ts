import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

/**
 * Jednoduchý generický hook na seznam ze serveru.
 * Vrací data, loading, error a `reload()` pro ruční obnovu po mutaci.
 */
export function useCollection<T = any>(path: string | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const result = await api.get<T[]>(path);
      if (mounted.current) {
        setData(Array.isArray(result) ? result : []);
        setError(null);
      }
    } catch (e: any) {
      console.error(`[Q-Hub] useCollection error for path "${path}":`, e);
      if (mounted.current) setError(e);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    mounted.current = true;
    reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  return { data, setData, loading, error, reload };
}

export function useResource<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const r = await api.get<T>(path);
      setData(r);
      setError(null);
    } catch (e: any) {
      console.error(`[Q-Hub] useResource error for path "${path}":`, e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, setData, loading, error, reload };
}
