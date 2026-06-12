import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, Text, Divider } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { searchProductsForSale } from '../../db/products';
import { formatCurrency } from '../../utils/formatCurrency';

interface ProductSearchSelectProps {
  onSelect: (product: { product_id: number; name: string; selling_price: number; unit: string; available_qty: number }) => void;
}

export default function ProductSearchSelect({ onSelect }: ProductSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const data = await searchProductsForSale(q);
    setResults(data);
    setShowDropdown(data.length > 0);
  }, []);

  const handleSelect = (item: any) => {
    onSelect(item);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search product by name..."
        value={query}
        onChangeText={search}
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon="magnify" />}
      />
      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.product_id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={styles.productName}>{item.name}</Text>
                  <Text variant="labelSmall" style={styles.productMeta}>
                    {formatCurrency(item.selling_price)}/{item.unit} · Qty: {item.available_qty}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.price}>{formatCurrency(item.selling_price)}</Text>
              </TouchableOpacity>
            )}
            style={{ maxHeight: 200 }}
            ItemSeparatorComponent={() => <Divider />}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 100, marginBottom: 8 },
  input: { backgroundColor: colors.surface, fontSize: 14 },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    marginTop: 2,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  productName: { fontWeight: '500' },
  productMeta: { color: colors.textSecondary, marginTop: 2 },
  price: { fontWeight: '600', color: colors.primary, marginLeft: 8 },
});
