import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, Divider } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CartItem } from '../../types/database';

interface CartItemProps {
  item: CartItem;
  onRemove: (productId: number) => void;
}

const CartItemRow = React.memo(({ item, onRemove }: CartItemProps) => (
  <>
    <View style={styles.container}>
      <View style={styles.info}>
        <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>{item.product_name}</Text>
        <Text variant="bodySmall" style={styles.detail}>
          {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.subtotal)}
        </Text>
      </View>
      <Text variant="bodyLarge" style={styles.unit}>{item.unit}</Text>
      <IconButton
        icon="delete-outline"
        size={20}
        iconColor={colors.error}
        onPress={() => onRemove(item.product_id)}
      />
    </View>
    <Divider />
  </>
));

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  info: { flex: 1 },
  name: { fontWeight: '500' },
  detail: { color: colors.textSecondary, marginTop: 2 },
  unit: { color: colors.textSecondary, marginRight: 8, minWidth: 30, textAlign: 'right' },
});

export default CartItemRow;
