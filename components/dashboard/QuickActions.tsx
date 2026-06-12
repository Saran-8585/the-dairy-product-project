import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';

const QuickActions = React.memo(() => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.row}>
        <Button
          mode="contained"
          icon={() => <MaterialCommunityIcons name="plus-circle" size={24} color="#FFF" />}
          onPress={() => router.push('/(tabs)/sales')}
          style={[styles.button, { backgroundColor: colors.primary }]}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          New Sale
        </Button>
        <Button
          mode="contained"
          icon={() => <MaterialCommunityIcons name="swap-horizontal-bold" size={24} color="#FFF" />}
          onPress={() => router.push('/(tabs)/inventory')}
          style={[styles.button, { backgroundColor: colors.secondary }]}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Transfer
        </Button>
        <Button
          mode="contained"
          icon={() => <MaterialCommunityIcons name="package-variant-closed" size={24} color="#FFF" />}
          onPress={() => router.push('/(tabs)/inventory')}
          style={[styles.button, { backgroundColor: colors.primaryLight }]}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Receive
        </Button>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, borderRadius: 8 },
  buttonLabel: { fontSize: 12, fontWeight: '600' },
  buttonContent: { height: 48, flexDirection: 'column-reverse', alignItems: 'center', gap: 4 },
});

export default QuickActions;
