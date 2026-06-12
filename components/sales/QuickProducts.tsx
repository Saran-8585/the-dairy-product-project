import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface QuickProductsProps {
  products: { product_id: number; name: string; selling_price: number; unit: string }[];
  onSelect: (product: { product_id: number; name: string; selling_price: number; unit: string }) => void;
}

const QuickProducts = React.memo(({ products, onSelect }: QuickProductsProps) => {
  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>Quick Select</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {products.map((p) => (
          <Chip
            key={p.product_id}
            style={styles.chip}
            textStyle={styles.chipText}
            onPress={() => onSelect(p)}
            mode="outlined"
          >
            {p.name}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  label: { marginBottom: 6, color: colors.textSecondary, fontWeight: '600' },
  scroll: { flexDirection: 'row' },
  chip: { marginRight: 8, backgroundColor: colors.surface, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.primary },
});

export default QuickProducts;
