import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Divider, List, Snackbar } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../constants/colors';
import { exportBackup, restoreBackup, clearAllData } from '../utils/exportData';
import { shareFile } from '../utils/exportData';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function SettingsScreen() {
  const [shopName, setShopName] = useState('Arokya Shop Manager');
  const [ownerName, setOwnerName] = useState('');
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmClear2, setConfirmClear2] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    setLoading(true);
    try {
      const filePath = await exportBackup();
      await shareFile(filePath);
      setSnackbarMsg('Backup created successfully');
      setSnackbarVisible(true);
    } catch (err: any) {
      Alert.alert('Backup Error', err.message);
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!result.canceled && result.assets?.[0]) {
        setLoading(true);
        const uri = result.assets[0].uri;
        await restoreBackup(uri);
        setSnackbarMsg('Data restored successfully. Restart the app.');
        setSnackbarVisible(true);
      }
    } catch (err: any) {
      Alert.alert('Restore Error', err.message);
    }
    setLoading(false);
  };

  const handleClearData = async () => {
    setConfirmClear2(false);
    setLoading(true);
    try {
      await clearAllData();
      setSnackbarMsg('All data cleared. Restart the app.');
      setSnackbarVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Shop Details</Text>
          <TextInput
            label="Shop Name"
            value={shopName}
            onChangeText={setShopName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Owner Name"
            value={ownerName}
            onChangeText={setOwnerName}
            mode="outlined"
            style={styles.input}
          />
        </View>

        <Divider style={{ marginVertical: 8 }} />

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Data Management</Text>
          <List.Item
            title="Export Backup"
            description="Save all data as JSON file"
            left={() => <List.Icon icon="export" color={colors.primary} />}
            onPress={handleBackup}
            disabled={loading}
          />
          <Divider />
          <List.Item
            title="Restore Backup"
            description="Import data from a backup file"
            left={() => <List.Icon icon="import" color={colors.secondary} />}
            onPress={handleRestore}
            disabled={loading}
          />
          <Divider />
          <List.Item
            title="Clear All Data"
            description="Delete all products, sales, and inventory"
            left={() => <List.Icon icon="delete-sweep" color={colors.error} />}
            onPress={() => setConfirmClear(true)}
            disabled={loading}
          />
        </View>

        <Divider style={{ marginVertical: 8 }} />

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>About</Text>
          <List.Item
            title="Version"
            description="1.0.0"
            left={() => <List.Icon icon="information" color={colors.textSecondary} />}
          />
          <List.Item
            title="Arokya Shop Manager"
            description="Offline-first dairy product management"
            left={() => <List.Icon icon="store" color={colors.primary} />}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmClear}
        title="Clear All Data?"
        message="This will permanently delete all products, sales, inventory, and movements. This action cannot be undone."
        confirmLabel="Continue"
        destructive
        onConfirm={() => { setConfirmClear(false); setConfirmClear2(true); }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        visible={confirmClear2}
        title="Are you sure?"
        message="This is your final warning. All data will be permanently deleted."
        confirmLabel="Delete Everything"
        destructive
        onConfirm={handleClearData}
        onCancel={() => setConfirmClear2(false)}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { padding: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 12, color: colors.textSecondary },
  input: { backgroundColor: colors.surface, marginBottom: 8 },
});
