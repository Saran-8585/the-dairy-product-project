import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { formatFullDate, getCurrentWeekRange, getPreviousWeekRange } from '../../utils/formatDate';
import { useReportsStore } from '../../store/useReportsStore';
import { getDailySummaryReport, getTopProducts, getWeeklyTrend, getWeekComparison, getMonthlyOverview, getProductPerformance } from '../../db/reports';
import DailySummary from '../../components/reports/DailySummary';
import WeeklyChart from '../../components/reports/WeeklyChart';
import MonthlyOverview from '../../components/reports/MonthlyOverview';
import ProductPerformance from '../../components/reports/ProductPerformance';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const sections = [
  { key: 'daily', label: 'Daily', icon: 'calendar-today' },
  { key: 'weekly', label: 'Weekly', icon: 'calendar-week' },
  { key: 'monthly', label: 'Monthly', icon: 'calendar-month' },
  { key: 'products', label: 'Products', icon: 'chart-box' },
];

export default function ReportsScreen() {
  const [activeSection, setActiveSection] = useState('daily');

  const [dailyDate, setDailyDate] = useState(new Date());
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [weekComparison, setWeekComparison] = useState({ thisWeek: 0, lastWeek: 0, changePercent: 0 });
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const [perfData, setPerfData] = useState<any[]>([]);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfCategory, setPerfCategory] = useState('All');

  useEffect(() => {
    if (activeSection === 'daily') loadDaily();
    else if (activeSection === 'weekly') loadWeekly();
    else if (activeSection === 'monthly') loadMonthly();
    else if (activeSection === 'products') loadPerf();
  }, [activeSection, dailyDate]);

  const loadDaily = async () => {
    setDailyLoading(true);
    try {
      const date = formatFullDate(dailyDate);
      const [summary, top] = await Promise.all([
        getDailySummaryReport(date),
        getTopProducts(date),
      ]);
      setDailySummary(summary);
      setTopProducts(top);
    } catch {}
    setDailyLoading(false);
  };

  const loadWeekly = async () => {
    setWeeklyLoading(true);
    try {
      const { start, end } = getCurrentWeekRange();
      const prev = getPreviousWeekRange();
      const [trend, comparison] = await Promise.all([
        getWeeklyTrend(start, end),
        getWeekComparison(start, end, prev.start, prev.end),
      ]);
      setWeeklyTrend(trend);
      setWeekComparison(comparison);
    } catch {}
    setWeeklyLoading(false);
  };

  const loadMonthly = async () => {
    setMonthlyLoading(true);
    try {
      const data = await getMonthlyOverview(monthlyYear, monthlyMonth);
      setMonthlyData(data);
    } catch {}
    setMonthlyLoading(false);
  };

  const loadPerf = async (cat: string = 'All') => {
    setPerfLoading(true);
    try {
      const end = formatFullDate(new Date());
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const startStr = formatFullDate(start);
      const data = await getProductPerformance(startStr, end, cat ?? perfCategory);
      setPerfData(data);
    } catch {}
    setPerfLoading(false);
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sectionNav}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {sections.map((s) => (
            <Chip
              key={s.key}
              selected={activeSection === s.key}
              onPress={() => setActiveSection(s.key)}
              style={[styles.sectionChip, activeSection === s.key && { backgroundColor: colors.primary + '20' }]}
              textStyle={{ fontSize: 12, fontWeight: activeSection === s.key ? '700' : '400' }}
              icon={() => (
                <MaterialCommunityIcons
                  name={s.icon as any}
                  size={16}
                  color={activeSection === s.key ? colors.primary : colors.textSecondary}
                />
              )}
            >
              {s.label}
            </Chip>
          ))}
        </ScrollView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeSection === 'daily' && (
            <DailySummary
              date={dailyDate}
              summary={dailySummary}
              topProducts={topProducts}
              loading={dailyLoading}
              onPrevDay={() => {
                const d = new Date(dailyDate);
                d.setDate(d.getDate() - 1);
                setDailyDate(d);
              }}
              onNextDay={() => {
                const d = new Date(dailyDate);
                d.setDate(d.getDate() + 1);
                if (d <= new Date()) setDailyDate(d);
              }}
            />
          )}

          {activeSection === 'weekly' && (
            <WeeklyChart
              trend={weeklyTrend}
              weekTotal={weekComparison.thisWeek}
              lastWeekTotal={weekComparison.lastWeek}
              changePercent={weekComparison.changePercent}
              loading={weeklyLoading}
            />
          )}

          {activeSection === 'monthly' && (
            <MonthlyOverview
              year={monthlyYear}
              month={monthlyMonth}
              data={monthlyData}
              loading={monthlyLoading}
              onPrevMonth={() => {
                if (monthlyMonth === 1) {
                  setMonthlyMonth(12);
                  setMonthlyYear(monthlyYear - 1);
                } else {
                  setMonthlyMonth(monthlyMonth - 1);
                }
              }}
              onNextMonth={() => {
                const now = new Date();
                const nextMonth = monthlyMonth === 12 ? 1 : monthlyMonth + 1;
                const nextYear = monthlyMonth === 12 ? monthlyYear + 1 : monthlyYear;
                if (nextYear < now.getFullYear() || (nextYear === now.getFullYear() && nextMonth <= now.getMonth() + 1)) {
                  setMonthlyMonth(nextMonth);
                  setMonthlyYear(nextYear);
                }
              }}
            />
          )}

          {activeSection === 'products' && (
            <ProductPerformance
              data={perfData}
              loading={perfLoading}
              category={perfCategory}
              onCategoryChange={(cat: string) => { setPerfCategory(cat); loadPerf(cat); }}
              onDateRangeChange={() => loadPerf()}
            />
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionNav: { maxHeight: 48, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionChip: { marginRight: 8, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  content: { flex: 1, padding: 12 },
});
