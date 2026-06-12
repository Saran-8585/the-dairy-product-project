import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, SegmentedButtons, TextInput, IconButton } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { CATEGORIES } from '../../constants/categories';
import type { ProductPerformance as ProductPerformanceType } from '../../types/database';
import LoadingSpinner from '../common/LoadingSpinner';

type SortKey = 'product_name' | 'units_sold' | 'revenue' | 'avg_daily_sales';

interface ProductPerformanceProps {
  data: ProductPerformanceType[];
  loading: boolean;
  category: string;
  onCategoryChange: (cat: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
}

const ProductPerformance = React.memo(({ data, loading, category, onCategoryChange, onDateRangeChange }: ProductPerformanceProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0] ?? '';
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0] ?? '';
  });

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [data, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  if (loading) return <LoadingSpinner message="Loading product data..." />;

  return (
    <View>
      <View style={styles.filterRow}>
        <TextInput
          label="From"
          value={startDate}
          onChangeText={(t) => { setStartDate(t); onDateRangeChange(t, endDate); }}
          mode="outlined"
          style={styles.dateInput}
        />
        <TextInput
          label="To"
          value={endDate}
          onChangeText={(t) => { setEndDate(t); onDateRangeChange(startDate, t); }}
          mode="outlined"
          style={styles.dateInput}
        />
      </View>

      <SegmentedButtons
        value={category}
        onValueChange={(v) => onCategoryChange(v)}
        buttons={CATEGORIES.map((c) => ({ value: c, label: c }))}
        style={{ marginBottom: 12 }}
      />

      <Card style={styles.tableCard}>
        <Card.Content style={{ padding: 0 }}>
          <View style={styles.tableHeader}>
            <Text
              style={[styles.headerCell, { flex: 2 }]}
              onPress={() => toggleSort('product_name')}
            >
              Product {sortKey === 'product_name' ? (sortAsc ? '↑' : '↓') : ''}
            </Text>
            <Text
              style={[styles.headerCell, { flex: 1 }]}
              onPress={() => toggleSort('units_sold')}
            >
              Sold {sortKey === 'units_sold' ? (sortAsc ? '↑' : '↓') : ''}
            </Text>
            <Text
              style={[styles.headerCell, { flex: 1 }]}
              onPress={() => toggleSort('revenue')}
            >
              Revenue {sortKey === 'revenue' ? (sortAsc ? '↑' : '↓') : ''}
            </Text>
            <Text
              style={[styles.headerCell, { flex: 1 }]}
              onPress={() => toggleSort('avg_daily_sales')}
            >
              Avg/Day {sortKey === 'avg_daily_sales' ? (sortAsc ? '↑' : '↓') : ''}
            </Text>
          </View>
          {sorted.length === 0 ? (
            <Text style={{ padding: 16, color: colors.textSecondary, textAlign: 'center' }}>
              No products found
            </Text>
          ) : (
            sorted.map((p, i) => (
              <View key={p.product_id} style={[styles.tableRow, i % 2 === 0 && { backgroundColor: colors.background }]}>
                <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>{p.product_name}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{p.units_sold}</Text>
                <Text style={[styles.cell, { flex: 1, fontWeight: '600' }]}>{formatCurrency(p.revenue)}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{formatCurrency(p.avg_daily_sales)}</Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dateInput: { flex: 1, backgroundColor: colors.surface },
  tableCard: { borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.primary + '15', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerCell: { fontWeight: '600', fontSize: 12, color: colors.textPrimary },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  cell: { fontSize: 12, color: colors.textPrimary },
});

export default ProductPerformance;
