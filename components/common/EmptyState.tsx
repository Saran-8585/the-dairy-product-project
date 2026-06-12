import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface EmptyStateProps {
  icon: string;
  title: string;
  message?: string;
}

const EmptyState = React.memo(({ icon, title, message }: EmptyStateProps) => (
  <View style={styles.container}>
    <MaterialCommunityIcons name={icon as any} size={64} color={colors.textSecondary} />
    <Text variant="titleMedium" style={styles.title}>{title}</Text>
    {message && <Text variant="bodyMedium" style={styles.message}>{message}</Text>}
  </View>
));

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { color: colors.textSecondary, marginTop: 16, textAlign: 'center' },
  message: { color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
});

export default EmptyState;
