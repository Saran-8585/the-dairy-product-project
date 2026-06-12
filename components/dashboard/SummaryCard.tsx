import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  accent?: boolean;
  badge?: number | null;
}

const SummaryCard = React.memo(({ title, value, subtitle, icon, iconColor, accent, badge }: SummaryCardProps) => {
  const theme = useTheme();

  return (
    <Card style={[styles.card, accent && { backgroundColor: theme.colors.primary }]}>
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <View style={[styles.iconContainer, { backgroundColor: accent ? 'rgba(255,255,255,0.2)' : theme.colors.background }]}>
            <MaterialCommunityIcons
              name={icon as any}
              size={24}
              color={accent ? '#FFFFFF' : (iconColor ?? theme.colors.primary)}
            />
          </View>
          {badge != null && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
        </View>
        <Text
          variant="headlineSmall"
          style={[styles.value, { color: accent ? '#FFFFFF' : theme.colors.onSurface }]}
        >
          {value}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.title, { color: accent ? 'rgba(255,255,255,0.8)' : theme.colors.onSurfaceVariant }]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text variant="labelSmall" style={{ color: accent ? 'rgba(255,255,255,0.7)' : theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 8, elevation: 2 },
  content: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconContainer: { borderRadius: 8, padding: 6 },
  badge: {
    backgroundColor: '#D32F2F', borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  value: { marginTop: 8, fontWeight: 'bold' },
  title: { marginTop: 2 },
});

export default SummaryCard;
