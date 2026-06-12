import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDisplayTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { colors } from '../../constants/colors';
import type { SaleWithItems } from '../../types/database';

interface RecentSalesProps {
  sales: SaleWithItems[];
}

const SaleRow = React.memo(({ sale }: { sale: SaleWithItems }) => (
  <List.Item
    title={`${formatCurrency(sale.total_amount)}`}
    description={`${sale.items.length} item${sale.items.length > 1 ? 's' : ''} • ${formatDisplayTime(sale.created_at)}`}
    left={() => (
      <View style={styles.iconBox}>
        <MaterialCommunityIcons
          name={sale.payment_method === 'cash' ? 'currency-inr' : sale.payment_method === 'upi' ? 'cellphone' : 'bookmark'}
          size={20}
          color={sale.payment_method === 'cash' ? colors.cash : sale.payment_method === 'upi' ? colors.upi : colors.credit}
        />
      </View>
    )}
    style={styles.saleItem}
  />
));

const RecentSales = React.memo(({ sales }: RecentSalesProps) => {
  if (sales.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Recent Sales</Text>
      {sales.map((sale) => (
        <SaleRow key={sale.id} sale={sale} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontWeight: '600', marginBottom: 4 },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  saleItem: { paddingVertical: 2 },
});

export default RecentSales;
