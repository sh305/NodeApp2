import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICONS = {
  broadcast: require('../../assets/icons/Room Icons/tool_broadcast.png'),
  goldCoin: require('../../assets/icons/gold_coin.png'),
};

export default function FlyingBroadcastBanner({
  broadcast,
  currentRoomId,
  onPressRoom,
  onFinished,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // We use left with useNativeDriver: false so Android touch dispatcher
  // continuously updates hit-testing bounds as the banner moves!
  const leftAnim = useRef(new Animated.Value(SCREEN_WIDTH + 20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for megaphone
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Smooth Danmu fly from right to left across screen
    const flyAnimation = Animated.timing(leftAnim, {
      toValue: -Math.max(SCREEN_WIDTH * 1.5, 600),
      duration: 10000, // 10 seconds continuous flight
      easing: Easing.linear,
      useNativeDriver: false, // MANDATORY for Android touch hit-testing!
    });

    flyAnimation.start(({ finished }) => {
      pulse.stop();
      if (finished && onFinished) {
        onFinished(broadcast.id);
      }
    });

    return () => {
      pulse.stop();
      flyAnimation.stop();
    };
  }, [broadcast.id]);

  const isCurrentRoom = String(broadcast.roomId) === String(currentRoomId);

  const handlePress = () => {
    console.log('📢 [FlyingBroadcastBanner] Clicked broadcast:', broadcast.roomId, 'current:', currentRoomId);
    if (isCurrentRoom) {
      showToast(t('You are already in this room!'), 'info');
      return;
    }
    if (onPressRoom) {
      onPressRoom(broadcast.roomId, broadcast.roomTitle);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: leftAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.touchableCard}
      >
        <LinearGradient
          colors={['rgba(40, 20, 75, 0.96)', 'rgba(25, 15, 50, 0.96)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientCard}
        >
          {/* Animated Megaphone */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Image source={ICONS.broadcast} style={styles.megaphoneIcon} resizeMode="contain" />
          </Animated.View>

          {/* Broadcaster Avatar */}
          <View style={styles.avatarBorder}>
            <Image
              source={{
                uri:
                  broadcast.sender?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
              }}
              style={styles.avatar}
            />
            {broadcast.sender?.isVip && (
              <View style={styles.vipTag}>
                <Text style={styles.vipTagText}>VIP</Text>
              </View>
            )}
          </View>

          {/* Sender Info & Broadcast Message */}
          <View style={styles.contentColumn}>
            <View style={styles.senderHeader}>
              <Text style={styles.senderName} numberOfLines={1}>
                {broadcast.sender?.name || 'User'}
              </Text>
              <Text style={styles.roomTag} numberOfLines={1}>
                📍 {broadcast.roomTitle || 'Room'}
              </Text>
            </View>
            <Text style={styles.messageText} numberOfLines={2}>
              {broadcast.message}
            </Text>
          </View>

          {/* Enter Room CTA Button */}
          {!isCurrentRoom ? (
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.enterButton}
            >
              <Text style={styles.enterButtonText}>
                <T>Join Room</T> 🚀
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.thisRoomBadge}>
              <Text style={styles.thisRoomText}>
                <T>Live Broadcast</T>
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    zIndex: 99999,
    elevation: 99999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchableCard: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.75)',
    maxWidth: SCREEN_WIDTH * 1.3,
  },
  iconWrapper: {
    marginRight: 8,
  },
  megaphoneIcon: {
    width: 26,
    height: 26,
  },
  avatarBorder: {
    position: 'relative',
    marginRight: 9,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  vipTag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  vipTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#1F1A24',
  },
  contentColumn: {
    marginRight: 10,
    maxWidth: 220,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE047',
    marginRight: 6,
    maxWidth: 90,
  },
  roomTag: {
    fontSize: 10,
    color: '#A78BFA',
    maxWidth: 110,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  enterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enterButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  thisRoomBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  thisRoomText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
  },
});
