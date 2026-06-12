import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { BarChart } from 'react-native-gifted-charts';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import type { WeeklyTrend } from '../../types/database';
import LoadingSpinner from '../common/LoadingSpinner';

interface WeeklyChartProps {
  trend: WeeklyTrend[];
  weekTotal: number;
  lastWeekTotal: number;
  changePercent: number;
  loading: boolean;
}

const dayLabels: Record<string, string> = {
  '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat',
};

const WeeklyChart = React.memo(({ trend, weekTotal, lastWeekTotal, changePercent, loading }: WeeklyChartProps) => {
  if (loading) return <LoadingSpinner message="Loading weekly data..." />;

  const chartData = ['1', '2', '3', '4', '5', '6', '0'].map((dayNum) => {
    const day = trend.find((t) => {
      const d = new Date(t.day_date);
      return String(d.getDay()) === dayNum;
    });
    return {
      value: day?.total ?? 0,
      label: dayLabels[dayNum],
      frontColor: day?.total ? colors.primary : colors.border,
    };
  });

  const bestDay = trend.length > 0 ? trend.reduce((max, t) => t.total > max.total ? t : max) : null;

  return (
    <View>
      <View style={styles.comparisonRow}>
        <Card style={[styles.compCard, { backgroundColor: colors.primary + '15' }]}>
          <Card.Content>
            <Text variant="labelSmall" style={{ color: colors.textSecondary }}>This Week</Text>
            <Text variant="titleLarge" style={{ color: colors.primary, fontWeight: 'bold' }}>
              {formatCurrency(weekTotal)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={[styles.compCard, { backgroundColor: colors.secondary + '15' }]}>
          <Card.Content>
            <Text variant="labelSmall" style={{ color: colors.textSecondary }}>vs Last Week</Text>
            <Text variant="titleLarge" style={{ color: changePercent >= 0 ? colors.success : colors.error, fontWeight: 'bold' }}>
              {changePercent >= 0 ? '+' : ''}{changePercent}%
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 16 }}>Daily Sales Trend</Text>
          <BarChart
            data={chartData}
            barWidth={32}
            spacing={12}
            roundedTop
            showValuesAsTopLabel
            topLabelTextStyle={{ fontSize: 10, color: colors.textSecondary }}
            yAxisTextStyle={{ fontSize: 10 }}
            xAxisLabelTextStyle={{ fontSize: 10 }}
            noOfSections={4}
            isAnimated
          />
        </Card.Content>
      </Card>

      {bestDay && (
        <Card style={styles.bestDayCard}>
          <Card.Content>
            <Text variant="bodyMedium">
              Best day: <Text style={{ fontWeight: 'bold' }}>{dayLabels[String(new Date(bestDay.day_date).getDay())]}</Text> — {formatCurrency(bestDay.total)}
            </Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  comparisonRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  compCard: { flex: 1, borderRadius: 8 },
  chartCard: { borderRadius: 8, marginBottom: 12 },
  bestDayCard: { borderRadius: 8, backgroundColor: colors.success + '15', marginBottom: 12 },
});

export default WeeklyChart;
