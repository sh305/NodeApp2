import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';

export default function LuckyPacketPasswordModal({
  visible,
  onClose,
  onSubmit,
  submitting,
}) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (visible) setPassword('');
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = () => {
    if (onSubmit) onSubmit(password.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <Text style={styles.title}><T>Enter password</T></Text>
          <Text style={styles.hint}>
            <T>Enter the correct password to loot this lucky packet</T>
          </Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t('Enter password')}
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            maxLength={20}
            autoFocus
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.75} onPress={onClose}>
              <Text style={styles.cancelText}><T>Cancel</T></Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleSubmit}
              disabled={submitting || !password.trim()}
            >
              <LinearGradient colors={['#F59E0B', '#EC4899']} style={styles.okBtn}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.okText}><T>Get</T></Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#1E1E2D',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  hint: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 14 },
  input: {
    backgroundColor: '#0F0F1A',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelText: { color: '#9CA3AF', fontWeight: '700', fontSize: 15 },
  okBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 80,
    alignItems: 'center',
  },
  okText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
