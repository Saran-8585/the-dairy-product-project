import { useState, useEffect, useCallback } from 'react';
import { getLowStockItems } from '../db/inventory';

export function useLowStockAlerts() {
  const [items, setItems] = useState<{ product_id: number; product_name: string; quantity: number; threshold: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLowStockItems('shop');
      setItems(result);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh, count: items.length };
}
