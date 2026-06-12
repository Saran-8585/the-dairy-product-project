import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SegmentedButtons, FAB, Searchbar, Chip, Text } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { getProductsByLocation, searchProducts } from '../../db/products';
import { transferStock, receiveStock } from '../../db/inventory';
import { useProductStore } from '../../store/useProductStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import ProductListItem from '../../components/inventory/ProductListItem';
import ProductDetailModal from '../../components/inventory/ProductDetailModal';
import TransferBottomSheet from '../../components/inventory/TransferBottomSheet';
import ReceiveStockModal from '../../components/inventory/ReceiveStockModal';
import AddProductModal from '../../components/inventory/AddProductModal';
import EmptyState from '../../components/common/EmptyState';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { CATEGORIES } from '../../constants/categories';
import type { ProductWithInventory } from '../../types/database';

export default function InventoryScreen() {
  const [subTab, setSubTab] = useState<'shop' | 'storage'>('shop');
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [transferTarget, setTransferTarget] = useState<ProductWithInventory | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let data: ProductWithInventory[];
      if (searchQuery) {
        const all = await searchProducts(searchQuery);
        data = all.filter((p: ProductWithInventory) =>
          subTab === 'shop' ? true : true
        );
      } else {
        data = await getProductsByLocation(subTab);
      }
      if (categoryFilter !== 'All') {
        data = data.filter((p) => p.category === categoryFilter);
      }
      setProducts(data);
    } catch {}
    setLoading(false);
  }, [subTab, searchQuery, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductPress = (product: ProductWithInventory) => {
    setSelectedProduct(product);
    setShowDetail(true);
  };

  const handleTransfer = (product: ProductWithInventory) => {
    setTransferTarget(product);
    setShowTransfer(true);
  };

  const handleTransferStock = async (productId: number, quantity: number, notes: string | null) => {
    await transferStock(productId, quantity, notes);
    fetchProducts();
  };

  const handleReceiveStock = async (productId: number, quantity: number, destination: 'storage' | 'shop', notes: string | null) => {
    await receiveStock(productId, quantity, destination, notes);
    fetchProducts();
  };

  const getQty = (product: ProductWithInventory) =>
    subTab === 'shop' ? product.shop_qty : product.storage_qty;

  const getThreshold = (product: ProductWithInventory) => product.low_stock_threshold;

  const renderItem = ({ item }: { item: ProductWithInventory }) => (
    <ProductListItem
      product={item}
      quantity={getQty(item)}
      threshold={getThreshold(item)}
      location={subTab}
      onPress={handleProductPress}
      onTransfer={subTab === 'storage' ? handleTransfer : undefined}
    />
  );

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <SegmentedButtons
          value={subTab}
          onValueChange={(v) => setSubTab(v as 'shop' | 'storage')}
          buttons={[
            { value: 'shop', label: 'Shop Stock', icon: 'store' },
            { value: 'storage', label: 'Storage', icon: 'warehouse' },
          ]}
          style={styles.segment}
        />

        <Searchbar
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          elevation={0}
        />

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              selected={categoryFilter === item}
              onPress={() => setCategoryFilter(item)}
              style={styles.categoryChip}
              textStyle={styles.categoryChipText}
              mode="outlined"
            >
              {item}
            </Chip>
          )}
          style={styles.categoryList}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        />

        <FlatList
          data={products}
          keyExtractor={(item: ProductWithInventory) => String(item.id)}
          renderItem={renderItem}
          getItemLayout={(_data: any, index: number) => ({ length: 76, offset: 76 * index, index })}
          ListEmptyComponent={
            <EmptyState
              icon="package-variant-closed"
              title={searchQuery ? 'No products found' : 'No stock in this location'}
              message={searchQuery ? 'Try a different search term' : 'Add products or receive stock'}
            />
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={{ paddingBottom: 80 }}
        />

        <FAB
          icon="plus"
          label="Add"
          style={styles.fab}
          onPress={() => setShowAdd(true)}
          color="#FFFFFF"
        />

        {showTransfer && transferTarget && (
          <TransferBottomSheet
            visible={showTransfer}
            onDismiss={() => { setShowTransfer(false); setTransferTarget(null); }}
            onTransfer={handleTransferStock}
          />
        )}

        <ReceiveStockModal
          visible={showReceive}
          onDismiss={() => setShowReceive(false)}
          onReceive={handleReceiveStock}
        />

        <AddProductModal
          visible={showAdd}
          onDismiss={() => setShowAdd(false)}
          onSave={async (name: string, category: string, unit: string, sp: number, cp: number | null, sq: number, stq: number, thr: number) => {
            await useProductStore.getState().addProduct(name, category, unit, sp, cp, sq, stq, thr);
            fetchProducts();
          }}
        />

        {selectedProduct && (
          <ProductDetailModal
            visible={showDetail}
            product={selectedProduct}
            onDismiss={() => { setShowDetail(false); setSelectedProduct(null); }}
            onSaved={fetchProducts}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  segment: { margin: 8, borderRadius: 8 },
  searchbar: { marginHorizontal: 8, marginVertical: 4, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  categoryList: { maxHeight: 40, marginVertical: 4 },
  categoryChip: { marginRight: 6, borderRadius: 16, backgroundColor: colors.surface },
  categoryChipText: { fontSize: 11 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: colors.primary, borderRadius: 16 },
});
