import { create } from 'zustand';
import type { DailySummary, WeeklyTrend, MonthlyOverview, ProductPerformance } from '../types/database';
import * as ReportsDB from '../db/reports';

interface ReportsStore {
  dailySummary: DailySummary | null;
  weeklyTrend: WeeklyTrend[];
  monthlyOverview: MonthlyOverview | null;
  productPerformance: ProductPerformance[];
  loading: boolean;
  error: string | null;
  fetchDailySummary: (date: string) => Promise<void>;
  fetchWeeklyTrend: (weekStart: string, weekEnd: string) => Promise<void>;
  fetchMonthlyOverview: (year: number, month: number) => Promise<void>;
  fetchProductPerformance: (startDate: string, endDate: string, category?: string | null) => Promise<void>;
}

export const useReportsStore = create<ReportsStore>((set) => ({
  dailySummary: null,
  weeklyTrend: [],
  monthlyOverview: null,
  productPerformance: [],
  loading: false,
  error: null,

  fetchDailySummary: async (date) => {
    set({ loading: true, error: null });
    try {
      const summary = await ReportsDB.getDailySummaryReport(date);
      set({ dailySummary: summary, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchWeeklyTrend: async (weekStart, weekEnd) => {
    try {
      const trend = await ReportsDB.getWeeklyTrend(weekStart, weekEnd);
      set({ weeklyTrend: trend });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchMonthlyOverview: async (year, month) => {
    set({ loading: true, error: null });
    try {
      const overview = await ReportsDB.getMonthlyOverview(year, month);
      set({ monthlyOverview: overview, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProductPerformance: async (startDate, endDate, category) => {
    set({ loading: true, error: null });
    try {
      const perf = await ReportsDB.getProductPerformance(startDate, endDate, category);
      set({ productPerformance: perf, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
