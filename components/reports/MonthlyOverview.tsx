import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, IconButton, Button } from 'react-native-paper';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import LoadingSpinner from '../common/LoadingSpinner';
import type { MonthlyOverview as MonthlyOverviewType } from '../../types/database';

interface MonthlyOverviewProps {
  year: number;
  month: number;
  data: MonthlyOverviewType | null;
  loading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyOverview = React.memo(({ year, month, data, loading, onPrevMonth, onNextMonth }: MonthlyOverviewProps) => {
  const isCurrentMonth = (() => {
    const now = new Date();
    return now.getMonth() + 1 === month && now.getFullYear() === year;
  })();

  const dailyChartData = useMemo(() => {
    if (!data) return [];
    return data.daily_trend.map((d) => ({
      value: d.amount,
      label: d.date.slice(8),
    }));
  }, [data]);

  const categoryPieData = useMemo(() => {
    if (!data) return [];
    const pieColors = [colors.primary, colors.secondary, colors.info, colors.error, colors.success, colors.warning, colors.primaryLight];
    return data.category_breakdown.map((c, i) => ({
      value: c.total,
      label: c.category,
      color: pieColors[i % pieColors.length],
    }));
  }, [data]);

  if (loading) return <LoadingSpinner message="Loading monthly data..." />;

  return (
    <View>
      <View style={styles.dateNav}>
        <IconButton icon="chevron-left" onPress={onPrevMonth} />
        <View style={{ alignItems: 'center' }}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {monthNames[month - 1]} {year}
          </Text>
        </View>
        <IconButton icon="chevron-right" onPress={onNextMonth} disabled={isCurrentMonth} />
      </View>

      {data ? (
        <>
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
              <Card.Content>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Revenue</Text>
                <Text variant="titleLarge" style={{ color: colors.success, fontWeight: 'bold' }}>
                  {formatCurrency(data.total_revenue)}
                </Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: colors.error + '10' }]}>
              <Card.Content>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Expenses</Text>
                <Text variant="titleLarge" style={{ color: colors.error, fontWeight: 'bold' }}>
                  {formatCurrency(data.total_expenses)}
                </Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
              <Card.Content>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Profit</Text>
                <Text variant="titleLarge" style={{ color: colors.primary, fontWeight: 'bold' }}>
                  {formatCurrency(data.gross_profit)}
                </Text>
              </Card.Content>
            </Card>
          </View>

          {dailyChartData.length > 0 && (
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 12 }}>Daily Sales</Text>
                <BarChart
                  data={dailyChartData}
                  barWidth={8}
                  spacing={4}
                  roundedTop
                  showValuesAsTopLabel={false}
                  yAxisTextStyle={{ fontSize: 8 }}
                  xAxisLabelTextStyle={{ fontSize: 8 }}
                  noOfSections={4}
                  isAnimated
                />
              </Card.Content>
            </Card>
          )}

          {categoryPieData.length > 0 && (
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 16 }}>Category Breakdown</Text>
                <View style={{ alignItems: 'center' }}>
                  <PieChart
                    data={categoryPieData}
                    donut
                    showText
                    textColor={colors.textPrimary}
                    textSize={10}
                    radius={80}
                    innerRadius={50}
                  />
                </View>
                <View style={styles.legendRow}>
                  {categoryPieData.map((d) => (
                    <View key={d.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                      <Text variant="labelSmall">{d.label}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {data.top_products.length > 0 && (
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 12 }}>Top 10 Products</Text>
                {data.top_products.map((p, i) => (
                  <View key={p.product_name} style={styles.productRow}>
                    <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                      {i + 1}. {p.product_name}
                    </Text>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{formatCurrency(p.total)}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
        </>
      ) : (
        <Text variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center', padding: 32 }}>
          No data for this month
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 8 },
  chartCard: { borderRadius: 8, marginBottom: 12 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
});

export default MonthlyOverview;
