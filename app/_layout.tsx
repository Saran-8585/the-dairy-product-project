import React, { useEffect, useState, useRef } from 'react';
import { Stack, usePathname } from 'expo-router';
import { PaperProvider, Portal, Dialog, Button, Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, BackHandler, Alert } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { theme } from '../constants/theme';
import { useDatabase } from '../hooks/useDatabase';
import { colors } from '../constants/colors';

export default function RootLayout() {
  const { isReady, error } = useDatabase();
  const [splashDone, setSplashDone] = useState(false);
  const [exitVisible, setExitVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isReady || error) {
      setTimeout(() => setSplashDone(true), 300);
    }
  }, [isReady, error]);

  useEffect(() => {
    const onBackPress = () => {
      if (pathname === '/' || pathname === '/(tabs)') {
        setExitVisible(true);
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [pathname]);

  if (!splashDone) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerTitle: 'Settings',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
          }}
        />
      </Stack>
      <Portal>
        <Dialog visible={exitVisible} onDismiss={() => setExitVisible(false)}>
          <Dialog.Title>Exit App?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Are you sure you want to exit?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setExitVisible(false)}>Cancel</Button>
            <Button onPress={() => BackHandler.exitApp()} textColor={colors.error}>Exit</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
});
