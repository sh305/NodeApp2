import React, { useEffect, useMemo, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import api from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICONS = {
  goldCoin: require('../../assets/icons/gold_coin.png'),
};

const TABS = [
  { id: 'common', label: 'Common' },
  { id: 'password', label: 'Password' },
  { id: 'countdown', label: 'Countdown' },
];

export default function LuckyPacketModal({
  visible,
  onClose,
  roomId,
  currentUser,
  onPacketSent,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [tab, setTab] = useState('common');
  const [recipientCount, setRecipientCount] = useState('');
  const [coins, setCoins] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);

  useEffect(() => {
    if (visible) {
      setTab('common');
      setRecipientCount('');
      setCoins('');
      setPassword('');
      setRulesVisible(false);
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

  const parsedCount = Number(recipientCount);
  const parsedCoins = Number(coins);
  const canSend = useMemo(() => {
    const countOk = Number.isInteger(parsedCount) && parsedCount >= 20 && parsedCount <= 100;
    const coinsOk = Number.isFinite(parsedCoins) && parsedCoins >= 300 && parsedCoins <= userCoins;
    const passwordOk = tab !== 'password' || String(password).trim().length >= 4;
    return countOk && coinsOk && passwordOk && !submitting;
  }, [parsedCount, parsedCoins, userCoins, tab, password, submitting]);

  const handleSend = async () => {
    if (!Number.isInteger(parsedCount) || parsedCount < 20 || parsedCount > 100) {
      showToast(t('For each Packet, the number of recipients must be greater than or equal to 20'), 'error');
      return;
    }
    if (!Number.isFinite(parsedCoins) || parsedCoins < 300) {
      showToast(t('When putting in coins, a minimum of 300 coins must be put in'), 'error');
      return;
    }
    if (parsedCoins > userCoins) {
      showToast(t('Insufficient gold coins to send this lucky packet'), 'error');
      return;
    }
    if (tab === 'password' && String(password).trim().length < 4) {
      showToast(t('Please enter a password between 4 and 20 characters'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/rooms/${roomId}/lucky-packets`, {
        packetType: tab,
        recipientCount: parsedCount,
        coins: parsedCoins,
        password: tab === 'password' ? String(password).trim() : undefined,
      });
      if (res.data?.success) {
        showToast(t('Lucky Packet sent successfully!'), 'success');
        const remaining = res.data.remainingCoins ?? (userCoins - parsedCoins);
        setUserCoins(remaining);
        if (onPacketSent) onPacketSent(remaining, res.data.packet);
        onClose();
      } else {
        showToast(t(res.data?.message || 'Failed to send lucky packet'), 'error');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to send lucky packet';
      showToast(t(errMsg), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.cardWrap}>
              <LinearGradient
                colors={['#FF6B9D', '#C026D3', '#7C3AED']}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.card}
              >
                <View style={styles.topRow}>
                  <View style={styles.balanceChip}>
                    <Image source={ICONS.goldCoin} style={styles.balanceCoin} />
                    <Text style={styles.balanceText}>{userCoins}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.rulesBtn}
                    activeOpacity={0.75}
                    onPress={() => setRulesVisible(true)}
                  >
                    <Text style={styles.rulesBtnText}>?  <T>Rules</T></Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.hero}>
                  <View style={styles.heroEnvelopes}>
                    <View style={[styles.envelope, styles.envelopeLeft]}>
                      <Image source={ICONS.goldCoin} style={styles.sideHeroIcon} resizeMode="contain" />
                    </View>
                    <View style={[styles.envelope, styles.envelopeCenter]}>
                      <Image source={ICONS.goldCoin} style={styles.heroIcon} resizeMode="contain" />
                    </View>
                    <View style={[styles.envelope, styles.envelopeRight]}>
                      <Image source={ICONS.goldCoin} style={styles.sideHeroIcon} resizeMode="contain" />
                    </View>
                  </View>
                  <LinearGradient
                    colors={['#F59E0B', '#F97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.titleBadge}
                  >
                    <Text style={styles.titleBadgeText}><T>Lucky Packet</T></Text>
                  </LinearGradient>
                </View>

                <View style={styles.tabBar}>
                  {TABS.map((item) => {
                    const active = tab === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.tabItem, active && styles.tabItemActive]}
                        activeOpacity={0.75}
                        onPress={() => setTab(item.id)}
                      >
                        <Text style={[styles.tabText, active && styles.tabTextActive]}>
                          <T>{item.label}</T>
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.form}
                >
                  <View style={styles.inputPill}>
                    <Text style={styles.inputLabel}><T>Number</T></Text>
                    <TextInput
                      style={styles.input}
                      value={recipientCount}
                      onChangeText={(v) => setRecipientCount(v.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder={t('(20≤Numbers≤100)')}
                      placeholderTextColor="rgba(255,255,255,0.55)"
                      maxLength={3}
                    />
                  </View>

                  <View style={styles.inputPill}>
                    <Text style={styles.inputLabel}><T>Coins</T></Text>
                    <TextInput
                      style={styles.input}
                      value={coins}
                      onChangeText={(v) => setCoins(v.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder={t('(≥ 300 Coins)')}
                      placeholderTextColor="rgba(255,255,255,0.55)"
                    />
                  </View>

                  {tab === 'password' && (
                    <View style={styles.inputPill}>
                      <Text style={styles.inputLabel}><T>Enter password</T></Text>
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder={t('Enter password')}
                        placeholderTextColor="rgba(255,255,255,0.55)"
                        secureTextEntry
                        maxLength={20}
                      />
                    </View>
                  )}

                  {tab === 'countdown' && (
                    <Text style={styles.countdownHint}>
                      ⏱  <T>Lucky package will open in 5 minutes</T>
                    </Text>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                  activeOpacity={0.75}
                  onPress={handleSend}
                  disabled={!canSend}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendBtnText}><T>Send</T></Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </TouchableWithoutFeedback>

          <TouchableOpacity style={styles.closeOutside} activeOpacity={0.75} onPress={onClose}>
            <Text style={styles.closeOutsideText}>✕</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={rulesVisible} transparent animationType="fade" onRequestClose={() => setRulesVisible(false)}>
        <View style={styles.rulesOverlay}>
          <View style={styles.rulesCard}>
            <LinearGradient colors={['#F43F7C', '#FB7185']} style={styles.rulesHeader}>
              <Text style={styles.rulesTitle}><T>Rules</T></Text>
              <TouchableOpacity
                style={styles.rulesCloseBtn}
                activeOpacity={0.75}
                onPress={() => setRulesVisible(false)}
              >
                <Text style={styles.rulesClose}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>
            <View style={styles.rulesBody}>
              <Text style={styles.ruleLine}>
                1. <T>For each Packet, the number of recipients must be greater than or equal to 20</T>
              </Text>
              <Text style={styles.ruleLine}>
                2. <T>Lucky package can be put in gold coins. When putting in coins, a minimum of 300 coins must be put in</T>
              </Text>
              <Text style={styles.ruleLine}>
                3. <T>When a Packet pack is more than 3000 coins, a chatroom broadcast will be sent</T>
              </Text>

              <LinearGradient
                colors={['#7C3AED', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.previewBanner}
              >
                <Image
                  source={{
                    uri:
                      currentUser?.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                  }}
                  style={styles.previewAvatar}
                />
                <View style={styles.previewTextCol}>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {currentUser?.name || 'User'}
                  </Text>
                  <Text style={styles.previewMsg} numberOfLines={1}>
                    <T>I sent a Lucky Packet</T>
                  </Text>
                </View>
                <View style={styles.previewGet}>
                  <Text style={styles.previewGetText}><T>Get</T></Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 4, 20, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardWrap: {
    width: Math.min(SCREEN_WIDTH - 28, 400),
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  balanceCoin: { width: 16, height: 16, marginRight: 4 },
  balanceText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  rulesBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rulesBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 14 },
  heroEnvelopes: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 92,
  },
  envelope: {
    width: 64,
    height: 78,
    borderRadius: 10,
    backgroundColor: '#EC4899',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  envelopeLeft: { transform: [{ rotate: '-18deg' }, { translateY: 10 }], opacity: 0.9 },
  envelopeRight: { transform: [{ rotate: '18deg' }, { translateY: 10 }], opacity: 0.9 },
  envelopeCenter: {
    width: 78,
    height: 90,
    marginHorizontal: -10,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F472B6',
  },
  heroIcon: { width: 50, height: 50 },
  sideHeroIcon: { width: 34, height: 34 },
  titleBadge: {
    marginTop: -10,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 3,
  },
  titleBadgeText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 29, 110, 0.55)',
    borderRadius: 22,
    padding: 4,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: { backgroundColor: '#FACC15' },
  tabText: { color: '#E5E7EB', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#3F3F46' },
  form: { paddingBottom: 8, gap: 10 },
  inputPill: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputLabel: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
    width: 92,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  countdownHint: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 4,
  },
  sendBtn: {
    marginTop: 10,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sendBtnText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  closeOutside: {
    marginTop: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  closeOutsideText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  rulesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  rulesCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  rulesHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  rulesTitle: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  rulesCloseBtn: {
    position: 'absolute',
    right: 14,
    top: 12,
  },
  rulesClose: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  rulesBody: { padding: 16, paddingBottom: 20 },
  ruleLine: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  previewBanner: {
    marginTop: 8,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  previewTextCol: { flex: 1 },
  previewName: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  previewMsg: { color: '#FEF3C7', fontSize: 12, fontWeight: '600' },
  previewGet: {
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  previewGetText: { color: '#7C2D12', fontWeight: '900', fontSize: 13 },
});
