import { useState, useEffect, useCallback } from 'react';
import { getDailySummaryReport, getTopProducts } from '../db/reports';
import type { DailySummary } from '../types/database';

export function useDailySummary(date: string) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [topProducts, setTopProducts] = useState<{ product_name: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, topProductsData] = await Promise.all([
        getDailySummaryReport(date),
        getTopProducts(date),
      ]);
      setSummary(summaryData);
      setTopProducts(topProductsData);
    } catch {
      setSummary(null);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, topProducts, loading, refresh };
}
