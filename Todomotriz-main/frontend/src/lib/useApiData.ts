import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from './api';

/**
 * Carga en paralelo uno o más endpoints GET y expone estado de carga, error y recarga.
 * Ej: const { data, loading, error, reload } = useApiData({ productos: '/products' });
 */
export function useApiData<T extends Record<string, unknown>>(endpoints: { [K in keyof T]: string }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(endpoints);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entries = Object.entries(JSON.parse(key) as Record<string, string>);
      const results = await Promise.all(entries.map(([, path]) => api(path)));
      setData(Object.fromEntries(entries.map(([name], i) => [name, results[i]])) as T);
    } catch (err) {
      console.error(err);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, error, reload: load };
}
