import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons, Divider } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { UNITS } from '../../constants/units';

interface AddProductModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (
    name: string,
    category: string,
    unit: string,
    selling_price: number,
    cost_price: number | null,
    initial_shop_qty: number,
    initial_storage_qty: number,
    low_stock_threshold: number
  ) => Promise<void>;
}

export default function AddProductModal({ visible, onDismiss, onSave }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Milk');
  const [unit, setUnit] = useState('litre');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [shopQty, setShopQty] = useState('0');
  const [storageQty, setStorageQty] = useState('0');
  const [threshold, setThreshold] = useState('5');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !sellingPrice) return;
    setLoading(true);
    try {
      await onSave(
        name,
        category,
        unit,
        parseFloat(sellingPrice) || 0,
        costPrice ? parseFloat(costPrice) : null,
        parseFloat(shopQty) || 0,
        parseFloat(storageQty) || 0,
        parseFloat(threshold) || 5
      );
      onDismiss();
      setName('');
      setSellingPrice('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <ScrollView>
          <Text variant="titleLarge" style={styles.title}>Add New Product</Text>
          <Divider style={{ marginVertical: 12 }} />

          <TextInput label="Product Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />

          <Text variant="bodySmall" style={{ marginBottom: 4 }}>Category:</Text>
          <SegmentedButtons
            value={category}
            onValueChange={setCategory}
            buttons={CATEGORIES.filter((c) => c !== 'All').map((c) => ({ value: c, label: c }))}
            style={{ marginBottom: 12 }}
          />

          <Text variant="bodySmall" style={{ marginBottom: 4 }}>Unit:</Text>
          <SegmentedButtons
            value={unit}
            onValueChange={setUnit}
            buttons={UNITS.map((u) => ({ value: u, label: u }))}
            style={{ marginBottom: 12 }}
          />

          <TextInput label="Selling Price (₹)" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" mode="outlined" style={styles.input} />
          <TextInput label="Cost Price (₹) - optional" value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" mode="outlined" style={styles.input} />

          <View style={styles.row}>
            <TextInput label="Shop Qty" value={shopQty} onChangeText={setShopQty} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1, marginRight: 8 }]} />
            <TextInput label="Storage Qty" value={storageQty} onChangeText={setStorageQty} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1, marginLeft: 8 }]} />
          </View>

          <TextInput label="Low Stock Alert At" value={threshold} onChangeText={setThreshold} keyboardType="numeric" mode="outlined" style={styles.input} />

          <View style={styles.buttonRow}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading || !name || !sellingPrice}
            >
              Add Product
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
  input: { marginBottom: 8 },
  row: { flexDirection: 'row' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
