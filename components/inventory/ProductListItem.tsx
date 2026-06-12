import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, TouchableRipple, IconButton } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import type { ProductWithInventory } from '../../types/database';

interface ProductListItemProps {
  product: ProductWithInventory;
  quantity: number;
  threshold: number;
  location: 'shop' | 'storage';
  onPress: (product: ProductWithInventory) => void;
  onTransfer?: (product: ProductWithInventory) => void;
}

function getStockColor(qty: number, threshold: number): string {
  if (qty <= 0) return colors.error;
  if (qty < threshold) return colors.lowStock;
  if (qty <= threshold * 2) return colors.mediumStock;
  return colors.highStock;
}

const ProductListItem = React.memo(({ product, quantity, threshold, location, onPress, onTransfer }: ProductListItemProps) => {
  const stockColor = getStockColor(quantity, threshold);

  return (
    <Card style={styles.card} elevation={1}>
      <TouchableRipple onPress={() => onPress(product)}>
        <Card.Content style={styles.content}>
          <View style={styles.leftSection}>
            <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
            <View style={styles.info}>
              <Text variant="bodyLarge" style={styles.name} numberOfLines={1}>
                {product.name}
              </Text>
              <View style={styles.metaRow}>
                <Chip style={styles.categoryChip} textStyle={styles.categoryText}>
                  {product.category}
                </Chip>
                <Text variant="bodySmall" style={styles.price}>
                  {formatCurrency(product.selling_price)}/{product.unit}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.rightSection}>
            <Text variant="headlineSmall" style={[styles.qty, { color: stockColor }]}>
              {quantity}
            </Text>
            <Text variant="labelSmall" style={styles.unit}>{product.unit}</Text>
          </View>
          {location === 'storage' && onTransfer && (
            <IconButton
              icon="transfer"
              size={20}
              iconColor={colors.primary}
              onPress={() => onTransfer(product)}
            />
          )}
        </Card.Content>
      </TouchableRipple>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { marginHorizontal: 8, marginVertical: 3, borderRadius: 8, backgroundColor: colors.surface },
  content: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  leftSection: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stockDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  info: { flex: 1 },
  name: { fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  categoryChip: { backgroundColor: colors.background, height: 22 },
  categoryText: { fontSize: 10 },
  price: { color: colors.textSecondary },
  rightSection: { alignItems: 'center', marginLeft: 12, minWidth: 60 },
  qty: { fontWeight: 'bold' },
  unit: { color: colors.textSecondary },
});

export default ProductListItem;
