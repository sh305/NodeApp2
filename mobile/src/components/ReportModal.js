import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';

const REASONS = [
  'Harassment / Abusive behavior',
  'Inappropriate content / Voice',
  'Spamming & Advertisements',
  'Scam & Fraud',
  'Underage user',
];

export default function ReportModal({ visible, onClose, onSubmitReport, targetUserName = 'User' }) {
  const [selectedDuration, setSelectedDuration] = useState('3days');
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onSubmitReport({
        requestedBanDuration: selectedDuration,
        reason: selectedReason,
        description: details,
      });
      Alert.alert('Report Submitted', 'Aapki report safalta se submit ho gayi hai aur karwayi kar di gayi hai.');
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message || 'Report submit karne me error aaya');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>🚩 Report User ID: {targetUserName}</Text>
          <Text style={styles.subtitle}>Select ban penalty duration for this ID:</Text>

          {/* Duration Options */}
          <View style={styles.durationRow}>
            {[
              { id: '3days', label: '3 Days' },
              { id: '7days', label: '7 Days' },
              { id: 'permanent', label: 'Permanent' },
            ].map((dur) => (
              <TouchableOpacity
                key={dur.id}
                style={[
                  styles.durationTab,
                  selectedDuration === dur.id && styles.durationTabActive,
                ]}
                onPress={() => setSelectedDuration(dur.id)}
              >
                <Text
                  style={[
                    styles.durationTabText,
                    selectedDuration === dur.id && styles.durationTabTextActive,
                  ]}
                >
                  {dur.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reasons List */}
          <Text style={styles.sectionLabel}>Select Reason:</Text>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonItem, selectedReason === r && styles.reasonItemActive]}
              onPress={() => setSelectedReason(r)}
            >
              <Text style={styles.reasonText}>{r}</Text>
              {selectedReason === r && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}

          {/* Description */}
          <TextInput
            style={styles.textInput}
            placeholder="Add additional details (optional)..."
            placeholderTextColor="#6B7280"
            value={details}
            onChangeText={setDetails}
            multiline
          />

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleConfirm} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit & Ban</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  title: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 14,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  durationTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#2A2A3E',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  durationTabActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  durationTabText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 13,
  },
  durationTabTextActive: {
    color: '#EF4444',
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#2A2A3E',
    borderRadius: 8,
    marginBottom: 6,
  },
  reasonItemActive: {
    borderColor: '#F87171',
    borderWidth: 1,
  },
  reasonText: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  check: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#2A2A3E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 14,
    minHeight: 50,
    fontSize: 13,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
