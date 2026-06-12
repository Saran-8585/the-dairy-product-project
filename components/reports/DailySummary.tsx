import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, IconButton, Button } from 'react-native-paper';
import { PieChart } from 'react-native-gifted-charts';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDisplayDate } from '../../utils/formatDate';
import { formatFullDate } from '../../utils/formatDate';
import LoadingSpinner from '../common/LoadingSpinner';
import type { DailySummary as DailySummaryType } from '../../types/database';

interface DailySummaryProps {
  date: Date;
  summary: DailySummaryType | null;
  topProducts: { product_name: string; total: number }[];
  loading: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
}

const DailySummary = React.memo(({ date, summary, topProducts, loading, onPrevDay, onNextDay }: DailySummaryProps) => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { value: summary.cash_total, color: colors.cash, label: 'Cash' },
      { value: summary.upi_total, color: colors.upi, label: 'UPI' },
      { value: summary.credit_total, color: colors.credit, label: 'Credit' },
    ].filter((d) => d.value > 0);
  }, [summary]);

  if (loading) return <LoadingSpinner message="Loading summary..." />;

  return (
    <View>
      <View style={styles.dateNav}>
        <IconButton icon="chevron-left" onPress={onPrevDay} />
        <View style={{ alignItems: 'center' }}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {isToday ? 'Today' : formatDisplayDate(formatFullDate(date))}
          </Text>
          <Text variant="labelSmall" style={{ color: colors.textSecondary }}>{formatFullDate(date)}</Text>
        </View>
        <IconButton icon="chevron-right" onPress={onNextDay} disabled={isToday} />
      </View>

      {summary ? (
        <>
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
              <Card.Content style={styles.statContent}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Total Sales</Text>
                <Text variant="headlineSmall" style={{ color: colors.primary, fontWeight: 'bold' }}>
                  {formatCurrency(summary.total_sales)}
                </Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: colors.info + '15' }]}>
              <Card.Content style={styles.statContent}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Transactions</Text>
                <Text variant="headlineSmall" style={{ color: colors.info, fontWeight: 'bold' }}>
                  {summary.transaction_count}
                </Text>
              </Card.Content>
            </Card>
          </View>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Average Transaction</Text>
              <Text variant="titleLarge" style={{ fontWeight: '600' }}>
                {formatCurrency(summary.average_transaction)}
              </Text>
            </Card.Content>
          </Card>

          {pieData.length > 0 && (
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 16 }}>Payment Methods</Text>
                <View style={{ alignItems: 'center' }}>
                  <PieChart
                    data={pieData}
                    donut
                    showText
                    textColor={colors.textPrimary}
                    textSize={12}
                    radius={80}
                    innerRadius={40}
                    centerLabelComponent={() => (
                      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                        {formatCurrency(summary.total_sales)}
                      </Text>
                    )}
                  />
                </View>
                <View style={styles.legendRow}>
                  {pieData.map((d) => (
                    <View key={d.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                      <Text variant="labelSmall">{d.label}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {topProducts.length > 0 && (
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 12 }}>Top Products</Text>
                {topProducts.map((p, i) => (
                  <View key={p.product_name} style={styles.productRow}>
                    <Text variant="bodyMedium" style={{ flex: 1 }}>{i + 1}. {p.product_name}</Text>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{formatCurrency(p.total)}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          <Card style={[styles.statCard, { backgroundColor: colors.error + '10' }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Total Expenses</Text>
              <Text variant="titleLarge" style={{ color: colors.error, fontWeight: '600' }}>
                {formatCurrency(summary.expense_total)}
              </Text>
            </Card.Content>
          </Card>
        </>
      ) : (
        <Text variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center', padding: 32 }}>
          No data for this date
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 8, marginBottom: 12 },
  statContent: { padding: 8 },
  chartCard: { borderRadius: 8, marginBottom: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
});

export default DailySummary;
