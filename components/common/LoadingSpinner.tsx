import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner = React.memo(({ message }: LoadingSpinnerProps) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.primary} />
    {message && <Text variant="bodyMedium" style={styles.message}>{message}</Text>}
  </View>
));

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  message: { color: colors.textSecondary, marginTop: 16 },
});

export default LoadingSpinner;
