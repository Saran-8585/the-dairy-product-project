import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, Searchbar, Divider } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { searchProducts } from '../../db/products';
import type { ProductWithInventory } from '../../types/database';

interface TransferBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onTransfer: (productId: number, quantity: number, notes: string | null) => Promise<void>;
}

export default function TransferBottomSheet({ visible, onDismiss, onTransfer }: TransferBottomSheetProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProducts();
      setSelectedProduct(null);
      setQuantity('1');
      setNotes('');
      setSearch('');
    }
  }, [visible]);

  const loadProducts = async () => {
    const results = await searchProducts(search);
    setProducts(results.filter((p) => p.storage_qty > 0));
  };

  const handleTransfer = async () => {
    if (!selectedProduct) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0 || qty > selectedProduct.storage_qty) return;
    setLoading(true);
    try {
      await onTransfer(selectedProduct.id, qty, notes || null);
      onDismiss();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <Text variant="titleLarge" style={styles.title}>Transfer Stock to Shop</Text>
        <Divider style={{ marginVertical: 12 }} />

        <Searchbar
          placeholder="Search product"
          value={search}
          onChangeText={(t) => { setSearch(t); loadProducts(); }}
          style={styles.searchbar}
        />

        {selectedProduct ? (
          <View style={styles.selectedBox}>
            <Text variant="bodyLarge" style={{ fontWeight: '600' }}>{selectedProduct.name}</Text>
            <Text variant="bodySmall">Available in storage: {selectedProduct.storage_qty} {selectedProduct.unit}</Text>
            <TextInput
              label="Quantity to transfer"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.buttonRow}>
              <Button onPress={() => setSelectedProduct(null)}>Back</Button>
              <Button
                mode="contained"
                onPress={handleTransfer}
                loading={loading}
                disabled={loading || !quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > selectedProduct.storage_qty}
              >
                Transfer
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            {products.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center', padding: 16 }}>
                No products with storage stock
              </Text>
            ) : (
              products.map((p) => (
                <View key={p.id} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{p.name}</Text>
                    <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                      Storage: {p.storage_qty} {p.unit}
                    </Text>
                  </View>
                  <Button mode="outlined" compact onPress={() => setSelectedProduct(p)}>
                    Select
                  </Button>
                </View>
              ))
            )}
          </View>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { backgroundColor: colors.surface, padding: 24, margin: 16, borderRadius: 12, maxHeight: '80%' },
  title: { fontWeight: 'bold' },
  searchbar: { marginBottom: 12, backgroundColor: colors.background },
  selectedBox: { marginTop: 8 },
  input: { marginVertical: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  list: { maxHeight: 400 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
});
