import React from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Portal, Text, Button } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

const ConfirmDialog = React.memo(({
  visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, destructive = false,
}: ConfirmDialogProps) => (
  <Portal>
    <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyMedium">{message}</Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onCancel}>{cancelLabel}</Button>
        <Button onPress={onConfirm} textColor={destructive ? colors.error : colors.primary}>
          {confirmLabel}
        </Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
));

const styles = StyleSheet.create({
  dialog: { borderRadius: 8 },
});

export default ConfirmDialog;
