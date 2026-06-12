import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDisplayTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { colors } from '../../constants/colors';
import type { SaleWithItems } from '../../types/database';

interface SaleHistoryItemProps {
  sale: SaleWithItems;
}

const SaleHistoryItem = React.memo(({ sale }: SaleHistoryItemProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
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
          <Chip style={styles.paymentChip} textStyle={styles.paymentText}>
            {sale.payment_method}
          </Chip>
        </View>
      )}
      right={() => (
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      )}
      onPress={() => setExpanded(!expanded)}
      style={styles.item}
    />
  );
});

const styles = StyleSheet.create({
  item: { paddingVertical: 2 },
  iconBox: { width: 48, justifyContent: 'center', alignItems: 'center', gap: 2 },
  paymentChip: { backgroundColor: colors.background, height: 20 },
  paymentText: { fontSize: 9 },
});

export default SaleHistoryItem;
