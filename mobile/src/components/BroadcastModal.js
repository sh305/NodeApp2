import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import api from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICONS = {
  broadcast: require('../../assets/icons/Room Icons/tool_broadcast.png'),
  goldCoin: require('../../assets/icons/gold_coin.png'),
};

const DEFAULT_MESSAGE = "Hi friends! Let's go to my room to have fun!";

export default function BroadcastModal({
  visible,
  onClose,
  roomId,
  roomTitle,
  currentUser,
  onBroadcastSent,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [submitting, setSubmitting] = useState(false);
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);

  // Check VIP status
  const isVip = Boolean(currentUser?.isVip || (currentUser?.vipLevel && currentUser?.vipLevel > 0));
  const requiredCoins = isVip ? 750 : 1500;

  // Refresh user coin balance whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      setMessage(DEFAULT_MESSAGE);
      fetchFreshBalance();
    }
  }, [visible]);

  const fetchFreshBalance = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUserCoins(res.data.user.coins || 0);
      }
    } catch {
      setUserCoins(currentUser?.coins || 0);
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      showToast(t('Broadcast message cannot be empty'), 'error');
      return;
    }

    if (userCoins < requiredCoins) {
      showToast(
        isVip
          ? t('Insufficient coins! You need 750 coins to send a broadcast.')
          : t('Insufficient coins! You need 1500 coins to send a broadcast.'),
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/rooms/${roomId}/broadcast`, {
        message: trimmedMessage,
      });

      if (res.data?.success) {
        showToast(t('Broadcast sent successfully to all rooms!'), 'success');
        const remaining = res.data.remainingCoins ?? (userCoins - requiredCoins);
        setUserCoins(remaining);
        if (onBroadcastSent) {
          onBroadcastSent(remaining);
        }
        onClose();
      } else {
        showToast(t(res.data?.message || 'Failed to send broadcast'), 'error');
      }
    } catch (err) {
      console.error('Send broadcast error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to send broadcast';
      showToast(t(errMsg), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={styles.dialogCard}>
              {/* Confetti & Header Decoration */}
              <View style={styles.headerContainer}>
                {/* Decorative confetti elements */}
                <View style={[styles.confettiDot, { top: 0, left: 24, backgroundColor: '#F59E0B' }]} />
                <View style={[styles.confettiDot, { top: 12, right: 36, backgroundColor: '#EC4899', width: 6, height: 6 }]} />
                <View style={[styles.confettiLine, { top: 6, left: 52, backgroundColor: '#3B82F6', transform: [{ rotate: '45deg' }] }]} />
                <View style={[styles.confettiLine, { top: 18, right: 60, backgroundColor: '#10B981', transform: [{ rotate: '-35deg' }] }]} />
                <View style={[styles.confettiDot, { bottom: 10, left: 40, backgroundColor: '#8B5CF6', width: 7, height: 7 }]} />
                <View style={[styles.confettiDot, { bottom: 6, right: 28, backgroundColor: '#F97316' }]} />

                <View style={styles.titleRow}>
                  <Image source={ICONS.broadcast} style={styles.megaphoneIcon} resizeMode="contain" />
                  <Text style={styles.titleText}>
                    <T>Broadcast</T>
                  </Text>
                </View>
              </View>

              {/* Price Row: Coin + 1500 / 750 + VIP badge */}
              <View style={styles.priceRow}>
                <View style={styles.priceLeft}>
                  <Image source={ICONS.goldCoin} style={styles.coinIcon} />
                  <Text style={styles.priceNumber}>
                    {isVip ? '750' : '1500'}
                  </Text>
                  <View style={styles.vipBadge}>
                    <Text style={styles.vipBadgeText}>VIP</Text>
                    <Image source={ICONS.goldCoin} style={styles.miniCoinIcon} />
                    <Text style={styles.vipBadgePrice}>750</Text>
                  </View>
                </View>

                {/* Subtle balance display */}
                <View style={styles.balanceBadge}>
                  <Text style={styles.balanceLabel}><T>Your Balance</T>:</Text>
                  <Text style={[styles.balanceValue, userCoins < requiredCoins && styles.balanceLow]}>
                    {userCoins}
                  </Text>
                </View>
              </View>

              {/* Message Input Box */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  multiline
                  numberOfLines={3}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t("Hi friends! Let's go to my room to have fun!")}
                  placeholderTextColor="#9CA3AF"
                  maxLength={150}
                  returnKeyType="done"
                  blurOnSubmit
                />
                <Text style={styles.charCounter}>{message.length}/150</Text>
              </View>

              {/* Numbered Rules List */}
              <View style={styles.rulesContainer}>
                <View style={styles.ruleItem}>
                  <View style={styles.ruleNumberCircle}>
                    <Text style={styles.ruleNumberText}>1</Text>
                  </View>
                  <Text style={styles.ruleDescription}>
                    <T>The broadcast will show in all rooms. All the users can enter the room by clicking on it.</T>
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <View style={styles.ruleNumberCircle}>
                    <Text style={styles.ruleNumberText}>2</Text>
                  </View>
                  <Text style={styles.ruleDescription}>
                    <T>Offensive content is strictly not allowed. Any violator will be banned forever.</T>
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Cancel | Send */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.75}
                  onPress={onClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>
                    <T>Cancel</T>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
                  activeOpacity={0.75}
                  onPress={handleSend}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <Text style={styles.sendButtonText}>
                      <T>Send</T>
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dialogCard: {
    width: Math.min(SCREEN_WIDTH - 44, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  megaphoneIcon: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  titleText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1F2937',
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confettiLine: {
    position: 'absolute',
    width: 10,
    height: 3,
    borderRadius: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 14,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 28,
    height: 28,
    marginRight: 6,
  },
  priceNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    marginRight: 10,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#372B1A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    marginRight: 4,
  },
  miniCoinIcon: {
    width: 13,
    height: 13,
    marginRight: 3,
  },
  vipBadgePrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE68A',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  balanceLow: {
    color: '#EF4444',
  },
  inputContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 88,
  },
  textInput: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    textAlignVertical: 'top',
    minHeight: 56,
    padding: 0,
  },
  charCounter: {
    fontSize: 11,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  rulesContainer: {
    marginTop: 16,
    gap: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleNumberCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 8,
  },
  ruleNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ruleDescription: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
});
