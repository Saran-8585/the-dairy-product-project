import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDisplayDate, formatFullDate } from '../../utils/formatDate';
import SummaryCard from '../../components/dashboard/SummaryCard';
import QuickActions from '../../components/dashboard/QuickActions';
import LowStockBanner from '../../components/dashboard/LowStockBanner';
import RecentSales from '../../components/dashboard/RecentSales';
import EndOfDaySummary from '../../components/common/EndOfDaySummary';
import { getDashboardStats } from '../../db/reports';
import { getRecentSales } from '../../db/sales';
import { getLowStockItems } from '../../db/inventory';
import type { SaleWithItems } from '../../types/database';

export default function DashboardScreen() {
  const [stats, setStats] = useState({ todaySales: 0, todayTransactions: 0, lowStockCount: 0, shopProductCount: 0, storageProductCount: 0 });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<SaleWithItems[]>([]);
  const [showEOD, setShowEOD] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, l, r] = await Promise.all([
        getDashboardStats(),
        getLowStockItems('shop'),
        getRecentSales(5),
      ]);
      setStats(s);
      setLowStockItems(l);
      setRecentSales(r);
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {formatDisplayDate(formatFullDate(new Date()))}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              icon="calculator"
              size={20}
              iconColor={colors.primary}
              onPress={() => setShowEOD(true)}
            />
            <IconButton
              icon="cog"
              size={20}
              iconColor={colors.textSecondary}
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>

        <View style={styles.cardsRow}>
          <SummaryCard
            title="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            subtitle={`${stats.todayTransactions} transaction${stats.todayTransactions !== 1 ? 's' : ''}`}
            icon="currency-inr"
            iconColor={colors.success}
          />
          <SummaryCard
            title="Low Stock Alerts"
            value={String(stats.lowStockCount)}
            icon="alert-circle"
            iconColor={colors.error}
            badge={stats.lowStockCount}
          />
        </View>

        <View style={styles.cardsRow}>
          <SummaryCard
            title="Shop Stock"
            value={String(stats.shopProductCount)}
            subtitle="products available"
            icon="store"
            iconColor={colors.info}
          />
          <SummaryCard
            title="Storage Stock"
            value={String(stats.storageProductCount)}
            subtitle="products in storage"
            icon="warehouse"
            iconColor={colors.secondary}
          />
        </View>

        <QuickActions />

        {lowStockItems.length > 0 && <LowStockBanner items={lowStockItems} />}

        <RecentSales sales={recentSales} />

        <View style={{ height: 32 }} />
      </ScrollView>

      <EndOfDaySummary visible={showEOD} onDismiss={() => setShowEOD(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  cardsRow: { flexDirection: 'row', padding: 8, gap: 8 },
});
