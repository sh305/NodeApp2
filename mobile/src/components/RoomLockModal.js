import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';

export default function RoomLockModal({
  visible,
  onClose,
  onVerifyPassword,
  roomTitle = 'Locked Voice Room',
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Kripya password enter karein');
      return;
    }
    setLoading(true);
    try {
      await onVerifyPassword(password);
      setPassword('');
      onClose();
    } catch (e) {
      Alert.alert('Galat Password', e.response?.data?.message || 'Password galat hai, dobara try karein.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Password Protected Room</Text>
          <Text style={styles.subtitle}>
            "{roomTitle}" me enter karne ke liye password enter karein:
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Room Password / PIN"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoFocus
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Enter Room</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#2A2A3E',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#000000',
    fontWeight: '700',
  },
});
