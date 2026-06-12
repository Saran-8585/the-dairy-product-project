import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Divider, List, Chip } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDisplayDate } from '../../utils/formatDate';
import { getInventoryByProduct, getMovements, adjustStock } from '../../db/inventory';
import { updateProduct } from '../../db/products';
import type { ProductWithInventory, Inventory, InventoryMovement } from '../../types/database';

interface ProductDetailModalProps {
  visible: boolean;
  product: ProductWithInventory | null;
  onDismiss: () => void;
  onSaved: () => void;
}

export default function ProductDetailModal({ visible, product, onDismiss, onSaved }: ProductDetailModalProps) {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [adjustMode, setAdjustMode] = useState<'shop' | 'storage' | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setUnit(product.unit);
      setSellingPrice(String(product.selling_price));
      setCostPrice(product.cost_price ? String(product.cost_price) : '');
      loadInventory(product.id);
      loadMovements(product.id);
    }
  }, [product]);

  const loadInventory = async (productId: number) => {
    const data = await getInventoryByProduct(productId);
    setInventory(data);
  };

  const loadMovements = async (productId: number) => {
    const data = await getMovements(productId, 20);
    setMovements(data);
  };

  const handleSaveEdit = async () => {
    if (!product) return;
    await updateProduct(
      product.id,
      name,
      category,
      unit,
      parseFloat(sellingPrice) || 0,
      costPrice ? parseFloat(costPrice) : null
    );
    setEditMode(false);
    onSaved();
  };

  const handleAdjust = async () => {
    if (!product || !adjustMode) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty < 0) return;
    await adjustStock(product.id, adjustMode, qty, adjustReason || 'Manual adjustment');
    setAdjustMode(null);
    setAdjustQty('');
    setAdjustReason('');
    await loadInventory(product.id);
    onSaved();
  };

  if (!product) return null;

  const shopInv = inventory.find((i) => i.location === 'shop');
  const storageInv = inventory.find((i) => i.location === 'storage');

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <ScrollView>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.name}>{product.name}</Text>
            <Chip style={styles.categoryChip}>{product.category}</Chip>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          {editMode ? (
            <View>
              <TextInput label="Name" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
              <TextInput label="Category" value={category} onChangeText={setCategory} style={styles.input} mode="outlined" />
              <TextInput label="Unit" value={unit} onChangeText={setUnit} style={styles.input} mode="outlined" />
              <TextInput label="Selling Price" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" style={styles.input} mode="outlined" />
              <TextInput label="Cost Price" value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" style={styles.input} mode="outlined" />
              <View style={styles.buttonRow}>
                <Button onPress={() => setEditMode(false)}>Cancel</Button>
                <Button mode="contained" onPress={handleSaveEdit}>Save</Button>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.stockRow}>
                <View style={[styles.stockBox, { backgroundColor: colors.highStock + '20' }]}>
                  <Text variant="labelSmall">Shop</Text>
                  <Text variant="headlineSmall" style={styles.stockQty}>{shopInv?.quantity ?? 0}</Text>
                  <Text variant="labelSmall">{product.unit}</Text>
                  <Button mode="text" compact onPress={() => { setAdjustMode('shop'); setAdjustQty(String(shopInv?.quantity ?? 0)); }}>
                    Adjust
                  </Button>
                </View>
                <View style={[styles.stockBox, { backgroundColor: colors.info + '20' }]}>
                  <Text variant="labelSmall">Storage</Text>
                  <Text variant="headlineSmall" style={styles.stockQty}>{storageInv?.quantity ?? 0}</Text>
                  <Text variant="labelSmall">{product.unit}</Text>
                  <Button mode="text" compact onPress={() => { setAdjustMode('storage'); setAdjustQty(String(storageInv?.quantity ?? 0)); }}>
                    Adjust
                  </Button>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text variant="bodyMedium">Price:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{formatCurrency(product.selling_price)}/{product.unit}</Text>
              </View>
              {product.cost_price != null && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium">Cost:</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>{formatCurrency(product.cost_price)}/{product.unit}</Text>
                </View>
              )}

              <Button icon="pencil" onPress={() => setEditMode(true)} style={{ marginTop: 8 }}>Edit Details</Button>

              <Divider style={{ marginVertical: 12 }} />
              <Text variant="titleSmall" style={{ marginBottom: 8, fontWeight: '600' }}>Movement History</Text>
              {movements.length === 0 ? (
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>No movements recorded</Text>
              ) : (
                movements.slice(0, 10).map((m) => (
                  <View key={m.id} style={styles.movementRow}>
                    <View style={styles.movementLeft}>
                      <Chip style={styles.typeChip} textStyle={{ fontSize: 10 }}>{m.movement_type}</Chip>
                      <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                        {formatDisplayDate(m.created_at)}
                      </Text>
                    </View>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                      {m.quantity} {product.unit}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {adjustMode && (
            <Portal>
              <Modal visible={true} onDismiss={() => setAdjustMode(null)} contentContainerStyle={styles.adjustModal}>
                <Text variant="titleMedium" style={{ marginBottom: 16 }}>Adjust {adjustMode} stock</Text>
                <TextInput
                  label={`New quantity in ${adjustMode}`}
                  value={adjustQty}
                  onChangeText={setAdjustQty}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Reason"
                  value={adjustReason}
                  onChangeText={setAdjustReason}
                  mode="outlined"
                  style={styles.input}
                />
                <View style={styles.buttonRow}>
                  <Button onPress={() => setAdjustMode(null)}>Cancel</Button>
                  <Button mode="contained" onPress={handleAdjust}>Save</Button>
                </View>
              </Modal>
            </Portal>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { backgroundColor: colors.surface, padding: 24, margin: 16, borderRadius: 12, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontWeight: 'bold', flex: 1 },
  categoryChip: { backgroundColor: colors.background },
  input: { marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  stockRow: { flexDirection: 'row', gap: 16, marginVertical: 12 },
  stockBox: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8 },
  stockQty: { fontWeight: 'bold', marginVertical: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailValue: { fontWeight: '500' },
  movementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  movementLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeChip: { height: 24, backgroundColor: colors.background },
  adjustModal: { backgroundColor: colors.surface, padding: 24, margin: 16, borderRadius: 12 },
});
