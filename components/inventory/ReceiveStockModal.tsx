import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons, Searchbar, Divider } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { searchProducts, createProduct } from '../../db/products';
import { CATEGORIES } from '../../constants/categories';
import { UNITS } from '../../constants/units';
import type { ProductWithInventory } from '../../types/database';

interface ReceiveStockModalProps {
  visible: boolean;
  onDismiss: () => void;
  onReceive: (productId: number, quantity: number, destination: 'storage' | 'shop', notes: string | null) => Promise<void>;
}

export default function ReceiveStockModal({ visible, onDismiss, onReceive }: ReceiveStockModalProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [destination, setDestination] = useState<'storage' | 'shop'>('storage');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Milk');
  const [newUnit, setNewUnit] = useState('litre');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedProduct(null);
      setQuantity('1');
      setNotes('');
      setSearch('');
      setMode('existing');
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    const results = await searchProducts(search);
    setProducts(results);
  };

  const handleReceive = async () => {
    setLoading(true);
    try {
      let productId = selectedProduct?.id;

      if (mode === 'new') {
        productId = await createProduct(
          newName,
          newCategory,
          newUnit,
          parseFloat(newPrice) || 0,
          newCost ? parseFloat(newCost) : null,
          0,
          0,
          5
        );
      }

      if (!productId) return;
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) return;

      await onReceive(productId, qty, destination, notes || null);
      onDismiss();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <ScrollView>
          <Text variant="titleLarge" style={styles.title}>Receive Stock</Text>
          <Divider style={{ marginVertical: 12 }} />

          <SegmentedButtons
            value={mode}
            onValueChange={(v) => setMode(v as 'existing' | 'new')}
            buttons={[
              { value: 'existing', label: 'Existing Product' },
              { value: 'new', label: 'New Product' },
            ]}
            style={{ marginBottom: 16 }}
          />

          {mode === 'existing' ? (
            <>
              <Searchbar
                placeholder="Search product"
                value={search}
                onChangeText={(t) => { setSearch(t); loadProducts(); }}
                style={styles.searchbar}
              />
              {selectedProduct ? (
                <View style={styles.selectedBox}>
                  <Text variant="bodyLarge" style={{ fontWeight: '600' }}>{selectedProduct.name}</Text>
                  <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Price: ₹{selectedProduct.selling_price}/{selectedProduct.unit}</Text>
                  <Button onPress={() => setSelectedProduct(null)} compact>Change</Button>
                </View>
              ) : (
                <View style={styles.list}>
                  {products.map((p) => (
                    <View key={p.id} style={styles.productRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium">{p.name}</Text>
                        <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                          Shop: {p.shop_qty} | Storage: {p.storage_qty}
                        </Text>
                      </View>
                      <Button mode="outlined" compact onPress={() => setSelectedProduct(p)}>Select</Button>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View>
              <TextInput label="Product Name" value={newName} onChangeText={setNewName} mode="outlined" style={styles.input} />
              <SegmentedButtons
                value={newCategory}
                onValueChange={setNewCategory}
                buttons={CATEGORIES.filter((c) => c !== 'All').map((c) => ({ value: c, label: c }))}
                style={{ marginBottom: 12 }}
              />
              <SegmentedButtons
                value={newUnit}
                onValueChange={setNewUnit}
                buttons={UNITS.map((u) => ({ value: u, label: u }))}
                style={{ marginBottom: 12 }}
              />
              <TextInput label="Selling Price" value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" mode="outlined" style={styles.input} />
              <TextInput label="Cost Price (optional)" value={newCost} onChangeText={setNewCost} keyboardType="numeric" mode="outlined" style={styles.input} />
            </View>
          )}

          <Divider style={{ marginVertical: 12 }} />
          <TextInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <Text variant="bodySmall" style={{ marginBottom: 8 }}>Destination:</Text>
          <SegmentedButtons
            value={destination}
            onValueChange={(v) => setDestination(v as 'storage' | 'shop')}
            buttons={[
              { value: 'storage', label: 'Storage' },
              { value: 'shop', label: 'Shop Floor' },
            ]}
            style={{ marginBottom: 16 }}
          />
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleReceive}
              loading={loading}
              disabled={loading || !quantity || parseFloat(quantity) <= 0 || (mode === 'existing' && !selectedProduct) || (mode === 'new' && !newName)}
            >
              Receive Stock
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { backgroundColor: colors.surface, padding: 24, margin: 16, borderRadius: 12, maxHeight: '90%' },
  title: { fontWeight: 'bold' },
  searchbar: { marginBottom: 12, backgroundColor: colors.background },
  selectedBox: { padding: 12, backgroundColor: colors.background, borderRadius: 8, marginBottom: 12 },
  input: { marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  list: { maxHeight: 200 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
});
