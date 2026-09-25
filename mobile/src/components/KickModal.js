import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

export default function KickModal({ visible, onClose, onKick, targetUserName = 'User' }) {
  const [selectedType, setSelectedType] = useState('3days');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onKick(selectedType);
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>👢 Kick {targetUserName} from Room</Text>
          <Text style={styles.subtitle}>
            Choose kick duration for this user:
          </Text>

          {/* Option 1: 3 Days */}
          <TouchableOpacity
            style={[styles.optionCard, selectedType === '3days' && styles.optionCardSelected]}
            onPress={() => setSelectedType('3days')}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>⏳ 3 Days Kick</Text>
              {selectedType === '3days' && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text style={styles.optionDesc}>
              User 3 din tak is room me enter nahi kar sakega. 3 din baad automatically enter kar sakega.
            </Text>
          </TouchableOpacity>

          {/* Option 2: Permanent */}
          <TouchableOpacity
            style={[styles.optionCard, selectedType === 'permanent' && styles.optionCardSelected]}
            onPress={() => setSelectedType('permanent')}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>🚫 Permanent Kick</Text>
              {selectedType === 'permanent' && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text style={styles.optionDesc}>
              Jab tak aap unhe kick list se unblock nahi karenge, tab tak wo is room me kabhi nahi aa sakte.
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.kickBtn} onPress={handleConfirm} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.kickBtnText}>Confirm Kick</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  title: {
    color: '#F87171',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  checkIcon: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '900',
  },
  optionDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  cancelText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  kickBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  kickBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
