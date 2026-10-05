import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';

export default function SetRoomPasswordModal({
  visible,
  onClose,
  onConfirm,
}) {
  const { t } = useLanguage();
  const [pin, setPin] = useState('');
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (visible) {
      setPin('');
      const t1 = setTimeout(focusInput, 50);
      const t2 = setTimeout(focusInput, 200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [visible]);

  if (!visible) return null;

  const handleConfirm = () => {
    if (pin.length === 4) {
      onConfirm(pin);
      setPin('');
    }
  };

  const handleCancel = () => {
    setPin('');
    onClose();
  };

  const isComplete = pin.length === 4;

  return (
    <View style={styles.overlay}>
      {/* Backdrop touchable to cancel when tapping outside the card */}
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
          {/* Title Matching Screenshot */}
          <Text style={styles.title}>
            <T>Set Room Password</T>
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
                    key={`pin_box_${index}`}
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
            >
              <Text style={styles.cancelText}>
                <T>Cancel</T>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={handleConfirm}
              disabled={!isComplete}
            >
              <Text
                style={[
                  styles.okayText,
                  !isComplete && styles.okayTextDisabled,
                ]}
              >
                <T>Okay</T>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100000,
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
    marginBottom: 22,
    textAlign: 'center',
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
