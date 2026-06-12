import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { SegmentedButtons, Text, Button, TextInput, Divider, Snackbar, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatFullDate, formatDisplayDate } from '../../utils/formatDate';
import { useSalesStore } from '../../store/useSalesStore';
import { getMostSoldProducts } from '../../db/products';
import { getSalesByDateRange } from '../../db/sales';
import { generateSalesText, shareText } from '../../utils/exportData';
import ProductSearchSelect from '../../components/sales/ProductSearchSelect';
import QuickProducts from '../../components/sales/QuickProducts';
import CartItemRow from '../../components/sales/CartItem';
import EmptyState from '../../components/common/EmptyState';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import type { SaleWithItems, CartItem } from '../../types/database';

type SaleSubTab = 'new' | 'history';

export default function SalesScreen() {
  const [subTab, setSubTab] = useState<SaleSubTab>('new');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [quickProducts, setQuickProducts] = useState<any[]>([]);
  const [historyGrouped, setHistoryGrouped] = useState<{ date: string; sales: SaleWithItems[] }[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedSale, setSelectedSale] = useState<number | null>(null);

  const { cart, isProcessingSale, addToCart, removeFromCart, clearCart, completeSale } = useSalesStore();

  useEffect(() => {
    loadQuickProducts();
    loadHistory();
  }, [subTab]);

  const loadQuickProducts = async () => {
    try {
      const products = await getMostSoldProducts(8);
      setQuickProducts(products);
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const today = new Date();
      let startDate: string;
      const endDate = formatFullDate(today);

      switch (historyFilter) {
        case 'today':
          startDate = endDate;
          break;
        case 'week': {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          startDate = formatFullDate(weekAgo);
          break;
        }
        case 'month': {
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          startDate = formatFullDate(monthAgo);
          break;
        }
        default:
          startDate = '2000-01-01';
      }

      const sales = await getSalesByDateRange(startDate, endDate);
      const grouped: Record<string, SaleWithItems[]> = {};
      for (const sale of sales) {
        if (!grouped[sale.sale_date]) grouped[sale.sale_date] = [];
        grouped[sale.sale_date]!.push(sale);
      }
      setHistoryGrouped(
        Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, sales]) => ({ date, sales }))
      );
    } catch {}
  };

  const handleAddToCart = useCallback((product: any) => {
    const item: CartItem = {
      product_id: product.product_id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.selling_price,
      subtotal: product.selling_price,
      available_qty: product.available_qty ?? 99,
      unit: product.unit,
    };
    addToCart(item);
  }, [addToCart]);

  const handleQuickSelect = useCallback((product: any) => {
    const item: CartItem = {
      product_id: product.product_id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.selling_price,
      subtotal: product.selling_price,
      available_qty: 99,
      unit: product.unit,
    };
    addToCart(item);
  }, [addToCart]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add items to the cart first');
      return;
    }
    try {
      const saleId = await completeSale(formatFullDate(new Date()), paymentMethod, notes || null);
      setSnackbarMessage(`Sale complete! ₹${cart.reduce((s: number, i) => s + i.subtotal, 0).toFixed(2)}`);
      setSnackbarVisible(true);
      setNotes('');
      loadQuickProducts();
      loadHistory();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete sale');
    }
  };

  const handleExport = async () => {
    const allSales = historyGrouped.flatMap((g) => g.sales);
    const text = generateSalesText(allSales);
    await shareText(text);
  };

  const cartTotal = cart.reduce((sum: number, item) => sum + item.subtotal, 0);

  if (subTab === 'history') {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
          <SegmentedButtons
            value={subTab}
            onValueChange={(v) => setSubTab(v as SaleSubTab)}
            buttons={[
              { value: 'new', label: 'New Sale', icon: 'plus-circle' },
              { value: 'history', label: 'History', icon: 'history' },
            ]}
            style={styles.segment}
          />

          <View style={styles.filterRow}>
            {(['today', 'week', 'month', 'all'] as const).map((f) => (
              <Chip
                key={f}
                selected={historyFilter === f}
                onPress={() => { setHistoryFilter(f); }}
                style={styles.filterChip}
                textStyle={{ fontSize: 11 }}
                mode="outlined"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Chip>
            ))}
            <IconButton icon="export" size={20} iconColor={colors.primary} onPress={handleExport} />
          </View>

          <FlatList
            data={historyGrouped}
            keyExtractor={(item: { date: string; sales: SaleWithItems[] }) => item.date}
            getItemLayout={(_data: any, index: number) => ({ length: 140, offset: 140 * index, index })}
            renderItem={({ item }) => (
              <View style={styles.dateGroup}>
                <Text variant="titleSmall" style={styles.dateHeader}>
                  {formatDisplayDate(item.date)}
                </Text>
                {item.sales.map((sale) => (
                  <View key={sale.id}>
                    <View style={styles.historyRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                          {formatCurrency(sale.total_amount)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                          {sale.items.length} items · {sale.payment_method.toUpperCase()}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={sale.payment_method === 'cash' ? 'currency-inr' : sale.payment_method === 'upi' ? 'cellphone' : 'bookmark'}
                        size={18}
                        color={sale.payment_method === 'cash' ? colors.cash : sale.payment_method === 'upi' ? colors.upi : colors.credit}
                      />
                    </View>
                    <Divider />
                  </View>
                ))}
              </View>
            )}
            ListEmptyComponent={
              <EmptyState icon="receipt" title="No sales yet" message="Complete a sale to see it here" />
            }
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <SegmentedButtons
          value={subTab}
          onValueChange={(v) => setSubTab(v as SaleSubTab)}
          buttons={[
            { value: 'new', label: 'New Sale', icon: 'plus-circle' },
            { value: 'history', label: 'History', icon: 'history' },
          ]}
          style={styles.segment}
        />

        <View style={styles.newSaleContent}>
          <ProductSearchSelect onSelect={handleAddToCart} />

          <QuickProducts products={quickProducts} onSelect={handleQuickSelect} />

          {cart.length > 0 && (
            <View style={styles.cartSection}>
              <Text variant="titleSmall" style={styles.cartTitle}>
                Cart ({cart.length} item{cart.length > 1 ? 's' : ''})
              </Text>
              <FlatList
                data={cart}
                keyExtractor={(item: CartItem) => String(item.product_id)}
                getItemLayout={(_data: any, index: number) => ({ length: 52, offset: 52 * index, index })}
                renderItem={({ item }) => (
                  <CartItemRow item={item} onRemove={removeFromCart} />
                )}
                style={{ maxHeight: 200 }}
                removeClippedSubviews
              />

              <Divider style={{ marginVertical: 8 }} />
              <Text variant="titleLarge" style={styles.cartTotal}>
                Total: {formatCurrency(cartTotal)}
              </Text>

              <View style={styles.paymentRow}>
                {(['cash', 'upi', 'credit'] as const).map((method) => (
                  <Chip
                    key={method}
                    selected={paymentMethod === method}
                    onPress={() => setPaymentMethod(method)}
                    style={[styles.paymentChip, paymentMethod === method && { backgroundColor: colors.primary + '20' }]}
                    textStyle={{ fontSize: 12, fontWeight: paymentMethod === method ? '700' : '400' }}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={method === 'cash' ? 'currency-inr' : method === 'upi' ? 'cellphone' : 'bookmark'}
                        size={14}
                        color={paymentMethod === method ? colors.primary : colors.textSecondary}
                      />
                    )}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Chip>
                ))}
              </View>

              <TextInput
                placeholder="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                style={styles.notesInput}
              />

              <Button
                mode="contained"
                onPress={handleCompleteSale}
                loading={isProcessingSale}
                disabled={isProcessingSale || cart.length === 0}
                style={styles.completeButton}
                contentStyle={{ height: 48 }}
                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
              >
                Complete Sale
              </Button>
            </View>
          )}

          {cart.length === 0 && (
            <EmptyState
              icon="cart-outline"
              title="Start a new sale"
              message="Search or select a product to add to cart"
            />
          )}
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
          style={{ backgroundColor: colors.success }}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  segment: { margin: 8, borderRadius: 8 },
  newSaleContent: { flex: 1, paddingHorizontal: 12 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8, gap: 4 },
  filterChip: { borderRadius: 16, backgroundColor: colors.surface },
  cartSection: { flex: 1 },
  cartTitle: { fontWeight: '600', marginBottom: 8 },
  cartTotal: { fontWeight: 'bold', textAlign: 'right', marginVertical: 8 },
  paymentRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  paymentChip: { flex: 1, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  notesInput: { backgroundColor: colors.surface, marginVertical: 8 },
  completeButton: { backgroundColor: colors.success, borderRadius: 8, marginTop: 8 },
  dateGroup: { marginBottom: 16 },
  dateHeader: { fontWeight: '600', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.background },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
});
