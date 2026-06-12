import { useEffect, useState } from 'react';
import { initializeDatabase } from '../db/schema';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    initializeDatabase()
      .then(() => {
        if (mounted) setIsReady(true);
      })
      .catch((err) => {
        if (mounted) setError(err);
      });
    return () => { mounted = false; };
  }, []);

  return { isReady, error };
}
