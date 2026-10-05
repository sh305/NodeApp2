import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';

export default function RoomLockModal({
  visible,
  onClose,
  onVerifyPassword,
  roomTitle = 'Locked Voice Room',
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (visible) {
      setPin('');
      const timer = setTimeout(() => {
        focusInput();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      await onVerifyPassword(pin);
      setPin('');
    } catch (e) {
      setPin('');
      showToast(t('You have entered wrong password'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    onClose();
  };

  const isComplete = pin.length === 4;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      onShow={() => {
        setPin('');
        setTimeout(focusInput, 80);
      }}
    >
      <View style={styles.overlay}>
        {/* Backdrop touchable to cancel when tapping outside */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleCancel}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
          pointerEvents="box-none"
        >
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>
              <T>Enter Room Password</T>
            </Text>

            {/* Subtitle with Room Title */}
            <Text style={styles.subtitle} numberOfLines={1}>
              {roomTitle}
            </Text>

            {/* PIN Wrapper: Contains visual boxes underneath & real TextInput directly on top */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={focusInput}
              style={styles.pinWrapper}
            >
              {/* 4 PIN Digit Visual Input Boxes */}
              <View style={styles.pinRow} pointerEvents="none">
                {[0, 1, 2, 3].map((index) => {
                  const digit = pin[index] || '';
                  const isCurrent = pin.length === index;

                  return (
                    <View
                      key={`lock_pin_${index}`}
                      style={[
                        styles.pinBox,
                        isCurrent && styles.pinBoxCurrent,
                      ]}
                    >
                      {digit ? (
                        <Text style={styles.pinDigit}>{digit}</Text>
                      ) : isCurrent ? (
                        <View style={styles.cursorUnderline} />
                      ) : null}
                    </View>
                  );
                })}
              </View>

              {/* Real TextInput directly over PIN area to reliably trigger Native Keyboard */}
              <TextInput
                ref={inputRef}
                value={pin}
                onChangeText={(text) => {
                  const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
                  setPin(clean);
                }}
                keyboardType="number-pad"
                maxLength={4}
                style={styles.realInput}
                caretHidden={true}
                autoFocus={true}
                contextMenuHidden={true}
                selectTextOnFocus={false}
              />
            </TouchableOpacity>

            {/* Bottom Actions: Cancel & Okay */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.7}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.7}
                onPress={handleSubmit}
                disabled={!isComplete || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#00D293" />
                ) : (
                  <Text
                    style={[
                      styles.okayText,
                      !isComplete && styles.okayTextDisabled,
                    ]}
                  >
                    <T>Okay</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '84%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: 240,
  },
  pinWrapper: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  pinBox: {
    width: 50,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pinBoxCurrent: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  pinDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  cursorUnderline: {
    position: 'absolute',
    bottom: 12,
    width: 18,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: '#9CA3AF',
  },
  realInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.015,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#374151',
  },
  okayText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#00D293',
  },
  okayTextDisabled: {
    color: '#A7F3D0',
  },
});
