import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import api from '../api/client';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';

// Back Chevron Icon SVG
const BackChevronIcon = ({ size = 22, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TIERS = [
  { durationMonths: 1, label: '1 month', coins: 100000 },
  { durationMonths: 3, label: '3 months', coins: 240000 },
  { durationMonths: 12, label: '12 months', coins: 720000 },
];

export default function BossSeatModal({
  visible,
  onClose,
  room,
  currentUser,
  socketRef,
  onBossSeatPurchased,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [buyingDuration, setBuyingDuration] = useState(null);

  const roomId = room?._id;
  const bossSeat = room?.bossSeat;
  const isBossActive = Boolean(
    bossSeat &&
      bossSeat.isActive &&
      bossSeat.expiresAt &&
      new Date(bossSeat.expiresAt) > new Date()
  );

  const daysLeft = isBossActive
    ? Math.max(
        1,
        Math.ceil(
          (new Date(bossSeat.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const handleBuy = async (tier) => {
    if (buyingDuration) return;

    // Check user coins
    const userCoins = Number(currentUser?.coins || 0);
    if (userCoins < tier.coins) {
      showToast(t('Not enough coins, please recharge first'), 'error');
      return;
    }

    setBuyingDuration(tier.durationMonths);
    try {
      const res = await api.post(`/rooms/${roomId}/boss-seat/purchase`, {
        durationMonths: tier.durationMonths,
      });

      if (res.data && res.data.success) {
        showToast(t('Boss Seat activated successfully!'), 'success');

        if (socketRef && socketRef.current) {
          socketRef.current.emit('notify_boss_seat_purchased', { roomId });
        }

        if (onBossSeatPurchased) {
          onBossSeatPurchased(res.data.bossSeat, res.data.remainingCoins);
        }
      } else {
        showToast(t(res.data?.message || 'Failed to purchase Boss Seat'), 'error');
      }
    } catch (err) {
      const isNotEnough = err.response?.data?.notEnoughCoins;
      const errMsg =
        err.response?.data?.message || 'Failed to purchase Boss Seat';
      if (isNotEnough) {
        showToast(t('Not enough coins, please recharge first'), 'error');
      } else {
        showToast(t(errMsg), 'error');
      }
    } finally {
      setBuyingDuration(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(14, insets.top) }]}>
        {/* ══ HEADER ══ */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <BackChevronIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            <T>Boss Seat</T>
          </Text>

          <View style={styles.headerRightSpacer} />
        </View>

        {/* ══ CONTENT ══ */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(30, insets.bottom + 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Preview Card (Matching Screenshot) */}
          <View style={styles.previewCard}>
            <View style={styles.circleBgOne} />
            <View style={styles.circleBgTwo} />
            <View style={styles.circleBgCenter}>
              <Image
                source={require('../../assets/icons/Boss Seat.png')}
                style={styles.previewSofaImg}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.previewTitle}>
              <T>Boss Seat</T>
            </Text>
            {isBossActive ? (
              <Text style={styles.previewSubtitleActive}>
                <T>Activated</T> ({daysLeft} <T>days left</T>)
              </Text>
            ) : (
              <Text style={styles.previewSubtitle}>
                <T>Not Activated Yet</T>
              </Text>
            )}
          </View>

          {/* Pricing Tiers (Matching Screenshot) */}
          <View style={styles.tiersContainer}>
            {TIERS.map((tier) => {
              const isBuyingThis = buyingDuration === tier.durationMonths;
              return (
                <View key={`tier_${tier.durationMonths}`} style={styles.tierCard}>
                  {/* Left: Gold Coin + Coins Amount */}
                  <View style={styles.tierLeft}>
                    <Image
                      source={require('../../assets/icons/gold_coin.png')}
                      style={styles.goldCoinIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.tierCoinsText}>{tier.coins}</Text>
                  </View>

                  {/* Center: Duration Label */}
                  <Text style={styles.tierDurationText}>
                    <T>{tier.label}</T>
                  </Text>

                  {/* Right: Buy Button */}
                  <TouchableOpacity
                    style={[
                      styles.buyBtn,
                      isBuyingThis && styles.buyBtnDisabled,
                    ]}
                    activeOpacity={0.8}
                    disabled={isBuyingThis}
                    onPress={() => handleBuy(tier)}
                  >
                    {isBuyingThis ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buyBtnText}>
                        <T>Buy</T>
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Rules / Description List (Matching Screenshot) */}
          <View style={styles.rulesContainer}>
            <Text style={styles.ruleItem}>
              <T>1. After payment, the host seat will be upgraded to the Boss Seat</T>
            </Text>
            <Text style={styles.ruleItem}>
              <T>2. The owner, host, and admin can invite users in the chat room to join the Boss Seat</T>
            </Text>
            <Text style={styles.ruleItem}>
              <T>3. After expiration, it will automatically removed</T>
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2D',
  },
  backBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerRightSpacer: {
    width: 34,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Top Preview Card (Matching Screenshot with soft concentric circles) */
  previewCard: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#1E1E2D',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  circleBgOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    top: -30,
  },
  circleBgTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 5,
  },
  circleBgCenter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  previewSofaImg: {
    width: 44,
    height: 44,
    tintColor: '#FFD700',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  previewSubtitleActive: {
    fontSize: 13,
    color: '#00D293',
    fontWeight: '600',
  },

  /* Pricing Tiers */
  tiersContainer: {
    marginBottom: 24,
    gap: 14,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#171726',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#26263B',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.1,
  },
  goldCoinIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  tierCoinsText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierDurationText: {
    fontSize: 14.5,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'center',
  },
  buyBtn: {
    backgroundColor: '#00D293',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 9,
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnDisabled: {
    opacity: 0.6,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },

  /* Rules List */
  rulesContainer: {
    paddingHorizontal: 4,
    paddingTop: 8,
    gap: 14,
  },
  ruleItem: {
    fontSize: 13,
    lineHeight: 19,
    color: '#9CA3AF',
  },
});
