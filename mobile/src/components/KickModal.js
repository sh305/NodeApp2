import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';

export default function KickModal({ visible, onClose, onKick, targetUserName = 'User' }) {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState('permanent');
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
          <Text style={styles.title}>
            👢 <T>Kick</T> {targetUserName} <T>from Room</T>
          </Text>
          <Text style={styles.subtitle}>
            <T>Choose kick duration for this user:</T>
          </Text>

          {/* Option 1: Permanent (Valid till forever / until unblocked) */}
          <TouchableOpacity
            style={[styles.optionCard, selectedType === 'permanent' && styles.optionCardSelected]}
            onPress={() => setSelectedType('permanent')}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>🚫 <T>Permanent Kick</T></Text>
              {selectedType === 'permanent' && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text style={styles.optionDesc}>
              <T>User cannot enter this room until you unblock them from Kicked-out Users.</T>
            </Text>
          </TouchableOpacity>

          {/* Option 2: 3 Days */}
          <TouchableOpacity
            style={[styles.optionCard, selectedType === '3days' && styles.optionCardSelected]}
            onPress={() => setSelectedType('3days')}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>⏳ <T>3 Days Kick</T></Text>
              {selectedType === '3days' && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text style={styles.optionDesc}>
              <T>User cannot enter this room for 3 days or until unblocked.</T>
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}><T>Cancel</T></Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.kickBtn} onPress={handleConfirm} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.kickBtnText}><T>Confirm Kick</T></Text>
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
    backgroundColor: '#35222E',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  checkIcon: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  cancelText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  kickBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kickBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
