import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface LowStockBannerProps {
  items: { product_name: string; quantity: number; threshold: number }[];
}

const LowStockBanner = React.memo(({ items }: LowStockBannerProps) => {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
        <Text variant="labelLarge" style={styles.title}>
          {items.length} product{items.length > 1 ? 's' : ''} low in stock
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {items.map((item) => (
          <Chip
            key={item.product_name}
            style={styles.chip}
            textStyle={styles.chipText}
            icon={() => <MaterialCommunityIcons name="alert" size={14} color={colors.error} />}
          >
            {item.product_name} ({item.quantity})
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF3E0', marginHorizontal: 16, borderRadius: 8, padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  title: { color: colors.error, fontWeight: '600' },
  scroll: { flexDirection: 'row' },
  chip: { backgroundColor: '#FFEBEE', marginRight: 8, borderRadius: 16 },
  chipText: { fontSize: 12, color: colors.error },
});

export default LowStockBanner;
