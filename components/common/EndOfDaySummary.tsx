import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Divider, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { getDailySummaryReport, getDashboardStats } from '../../db/reports';
import { getLowStockItems } from '../../db/inventory';
import { getSalesByDate } from '../../db/sales';
import { generateSalesText, shareText } from '../../utils/exportData';
import { formatFullDate } from '../../utils/formatDate';
import LoadingSpinner from './LoadingSpinner';

interface EndOfDaySummaryProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function EndOfDaySummary({ visible, onDismiss }: EndOfDaySummaryProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [dailyNote, setDailyNote] = useState('');
  const [todaySales, setTodaySales] = useState<any[]>([]);

  useEffect(() => {
    if (visible) loadData();
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = formatFullDate(new Date());
      const [stats, lowItems, sales] = await Promise.all([
        getDailySummaryReport(today),
        getLowStockItems('shop'),
        getSalesByDate(today),
      ]);
      setSummary(stats);
      setLowStock(lowItems);
      setTodaySales(sales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const today = formatFullDate(new Date());
    let text = `=== End of Day Summary - ${today} ===\n\n`;
    text += `Total Sales: ${formatCurrency(summary?.total_sales ?? 0)}\n`;
    text += `Transactions: ${summary?.transaction_count ?? 0}\n`;
    text += `Cash: ${formatCurrency(summary?.cash_total ?? 0)}\n`;
    text += `UPI: ${formatCurrency(summary?.upi_total ?? 0)}\n`;
    text += `Credit: ${formatCurrency(summary?.credit_total ?? 0)}\n`;
    text += `Expenses: ${formatCurrency(summary?.expense_total ?? 0)}\n`;
    text += `Low Stock Items: ${lowStock.length}\n`;
    if (dailyNote) text += `\nNote: ${dailyNote}\n`;
    text += `\n---\n${generateSalesText(todaySales)}`;
    await shareText(text);
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <ScrollView>
          <Text variant="titleLarge" style={styles.title}>End of Day Summary</Text>
          <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 16 }}>
            {formatFullDate(new Date())}
          </Text>
          <Divider />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <View style={styles.statsGrid}>
                <Card style={[styles.statItem, { backgroundColor: colors.success + '15' }]}>
                  <Card.Content style={{ alignItems: 'center', padding: 12 }}>
                    <MaterialCommunityIcons name="currency-inr" size={24} color={colors.success} />
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: colors.success }}>
                      {formatCurrency(summary?.total_sales ?? 0)}
                    </Text>
                    <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Total Sales</Text>
                  </Card.Content>
                </Card>
                <Card style={[styles.statItem, { backgroundColor: colors.info + '15' }]}>
                  <Card.Content style={{ alignItems: 'center', padding: 12 }}>
                    <MaterialCommunityIcons name="receipt" size={24} color={colors.info} />
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: colors.info }}>
                      {summary?.transaction_count ?? 0}
                    </Text>
                    <Text variant="labelSmall" style={{ color: colors.textSecondary }}>Transactions</Text>
                  </Card.Content>
                </Card>
              </View>

              <View style={styles.breakdown}>
                <View style={styles.breakdownRow}>
                  <MaterialCommunityIcons name="currency-inr" size={18} color={colors.cash} />
                  <Text style={{ flex: 1 }}>Cash</Text>
                  <Text style={{ fontWeight: '600' }}>{formatCurrency(summary?.cash_total ?? 0)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <MaterialCommunityIcons name="cellphone" size={18} color={colors.upi} />
                  <Text style={{ flex: 1 }}>UPI</Text>
                  <Text style={{ fontWeight: '600' }}>{formatCurrency(summary?.upi_total ?? 0)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <MaterialCommunityIcons name="bookmark" size={18} color={colors.credit} />
                  <Text style={{ flex: 1 }}>Credit</Text>
                  <Text style={{ fontWeight: '600' }}>{formatCurrency(summary?.credit_total ?? 0)}</Text>
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.breakdownRow}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
                  <Text style={{ flex: 1 }}>Low Stock Items</Text>
                  <Text style={{ fontWeight: '600', color: colors.error }}>{lowStock.length}</Text>
                </View>
              </View>

              {lowStock.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text variant="labelLarge" style={{ fontWeight: '600' }}>Low Stock Alerts:</Text>
                  {lowStock.map((item) => (
                    <Text key={item.product_id} variant="bodySmall" style={{ color: colors.error }}>
                      • {item.product_name} ({item.quantity} left)
                    </Text>
                  ))}
                </View>
              )}

              <TextInput
                label="Daily Note (optional)"
                value={dailyNote}
                onChangeText={setDailyNote}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ marginTop: 16, backgroundColor: colors.surface }}
              />

              <Button
                mode="contained"
                icon="share-variant"
                onPress={handleShare}
                style={styles.shareButton}
              >
                Share Summary
              </Button>
            </>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { backgroundColor: colors.surface, padding: 24, margin: 16, borderRadius: 12, maxHeight: '90%' },
  title: { fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  statItem: { flex: 1, borderRadius: 8 },
  breakdown: { backgroundColor: colors.background, borderRadius: 8, padding: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  shareButton: { marginTop: 16, backgroundColor: colors.primary },
});
