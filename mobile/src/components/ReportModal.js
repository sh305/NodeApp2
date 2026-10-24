import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import { T } from './TranslatedText';

const REASONS = [
  'Harassment / Abusive behavior',
  'Inappropriate content / Voice',
  'Spamming & Advertisements',
  'Scam & Fraud',
  'Underage user',
  'Other',
];

// Radio Button Icon
const RadioButtonIcon = ({ selected, size = 20, color = '#6366F1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={selected ? color : '#64748B'} strokeWidth="2" />
    {selected && <Circle cx="12" cy="12" r="5.5" fill={color} />}
  </Svg>
);

// Upload Camera / Media Icon
const UploadMediaIcon = ({ size = 22, color = '#6366F1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V8C1 6.89543 1.89543 6 3 6H7L9 3H15L17 6H21C22.1046 6 23 6.89543 23 8V19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

// Shield Alert Icon
const ShieldAlertIcon = ({ size = 18, color = '#EF4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 8V12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="16" r="1" fill={color} />
  </Svg>
);

export default function ReportModal({
  visible,
  onClose,
  onSubmitReport,
  targetUserName = 'User',
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [proofUri, setProofUri] = useState(null);
  const [proofType, setProofType] = useState('image');
  const [loading, setLoading] = useState(false);

  const handlePickMedia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('Permission to access photos/videos is required to attach proof'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        setProofType(isVideo ? 'video' : 'image');

        if (asset.base64) {
          const prefix = isVideo ? 'data:video/mp4;base64,' : 'data:image/jpeg;base64,';
          setProofUri(`${prefix}${asset.base64}`);
        } else {
          setProofUri(asset.uri);
        }
        showToast(t('Proof attached successfully'), 'success');
      }
    } catch (e) {
      showToast(t('Failed to attach proof media: ') + (e.message || ''), 'error');
    }
  };

  const handleRemoveProof = () => {
    setProofUri(null);
    setProofType('image');
  };

  const handleConfirm = async () => {
    if (!proofUri) {
      showToast(t('Please attach proof photo or video to submit report'), 'error');
      return;
    }

    setLoading(true);
    try {
      await onSubmitReport({
        reason: selectedReason,
        description: details,
        proofUrl: proofUri,
        proofType,
      });
      showToast(t('Report submitted successfully. Our safety moderation team will review it.'), 'success');
      handleReset();
      onClose();
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Report submission failed';
      showToast(t(errMsg), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedReason(REASONS[0]);
    setDetails('');
    setProofUri(null);
    setProofType('image');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title} numberOfLines={1}>
                🚩 <T>Report User</T>: {targetUserName}
              </Text>
              <Text style={styles.subtitle}>
                <T>Select the violation reason and provide proof for moderator review</T>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                handleReset();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Section 1: Radio Buttons for Misbehavior Reason */}
            <Text style={styles.sectionLabel}>
              <T>Why are you reporting this user?</T> *
            </Text>
            <View style={styles.reasonsList}>
              {REASONS.map((reasonKey) => {
                const isSelected = selectedReason === reasonKey;
                return (
                  <TouchableOpacity
                    key={reasonKey}
                    style={[styles.reasonItem, isSelected && styles.reasonItemActive]}
                    activeOpacity={0.75}
                    onPress={() => setSelectedReason(reasonKey)}
                  >
                    <RadioButtonIcon selected={isSelected} size={20} color="#6366F1" />
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                      <T>{reasonKey}</T>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Proof Upload (Mandatory for Play Store Safety) */}
            <Text style={styles.sectionLabel}>
              <T>Upload Proof (Screenshot / Video)</T> *
            </Text>

            {proofUri ? (
              <View style={styles.proofPreviewCard}>
                {proofType === 'image' ? (
                  <Image source={{ uri: proofUri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoEmoji}>📹</Text>
                    <Text style={styles.videoText}>
                      <T>Video Proof Attached</T>
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.removeProofBtn}
                  activeOpacity={0.8}
                  onPress={handleRemoveProof}
                >
                  <Text style={styles.removeProofText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBox}
                activeOpacity={0.75}
                onPress={handlePickMedia}
              >
                <UploadMediaIcon size={26} color="#6366F1" />
                <Text style={styles.uploadBoxTitle}>
                  <T>Tap to attach Screenshot or Video</T>
                </Text>
                <Text style={styles.uploadBoxSubtitle}>
                  <T>Photo or short video proof is required</T>
                </Text>
              </TouchableOpacity>
            )}

            {/* Section 3: Description (Optional) */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
              <T>Additional Details</T> (<T>Optional</T>)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('Add extra context or describe what happened...')}
              placeholderTextColor="#64748B"
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={400}
            />

            {/* Strict Anti-Fake Reporting Warning Notice */}
            <View style={styles.warningCard}>
              <ShieldAlertIcon size={20} color="#EF4444" />
              <View style={styles.warningTextWrap}>
                <Text style={styles.warningTitle}>
                  <T>Community Safety Notice</T>
                </Text>
                <Text style={styles.warningDesc}>
                  <T>
                    Submitting false or malicious reports against innocent users violates our
                    Community Guidelines and will result in your own account getting banned for 30
                    days.
                  </T>
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.75}
              onPress={() => {
                handleReset();
                onClose();
              }}
            >
              <Text style={styles.cancelText}>
                <T>Cancel</T>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, (!proofUri || loading) && styles.submitBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleConfirm}
              disabled={loading || !proofUri}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  <T>Submit Report</T>
                </Text>
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
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1E1E2D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1,
    borderColor: '#374151',
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: '#F87171',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollArea: {
    maxHeight: 460,
  },
  sectionLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 14,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#2A2A3E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 12,
  },
  reasonItemActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  reasonText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  reasonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  uploadBox: {
    backgroundColor: '#2A2A3E',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadBoxTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadBoxSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  proofPreviewCard: {
    position: 'relative',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  videoEmoji: {
    fontSize: 34,
  },
  videoText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  removeProofBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeProofText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  textInput: {
    backgroundColor: '#2A2A3E',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#374151',
    textAlignVertical: 'top',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    marginBottom: 10,
    gap: 10,
  },
  warningTextWrap: {
    flex: 1,
  },
  warningTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  warningDesc: {
    color: '#FCA5A5',
    fontSize: 11,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  cancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 13,
  },
  submitBtn: {
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
