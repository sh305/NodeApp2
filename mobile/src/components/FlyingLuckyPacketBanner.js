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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICONS = {
  luckyPacket: require('../../assets/icons/Room Icons/tool_lucky_packet.png'),
};

export default function FlyingLuckyPacketBanner({
  broadcast,
  currentRoomId,
  onPressRoom,
  onPressPacket,
  onFinished,
}) {
  const leftAnim = useRef(new Animated.Value(SCREEN_WIDTH + 20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

    const flyAnimation = Animated.timing(leftAnim, {
      toValue: -Math.max(SCREEN_WIDTH * 1.5, 600),
      duration: 10000,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    flyAnimation.start(({ finished }) => {
      pulse.stop();
      if (finished && onFinished) onFinished(broadcast.id);
    });

    return () => {
      pulse.stop();
      flyAnimation.stop();
    };
  }, [broadcast.id]);

  const isCurrentRoom = String(broadcast.roomId) === String(currentRoomId);

  const handlePress = () => {
    if (isCurrentRoom) {
      if (onPressPacket) onPressPacket(broadcast.packetId);
      return;
    }
    if (onPressRoom) {
      onPressRoom(broadcast.roomId, broadcast.roomTitle);
    }
  };

  return (
    <Animated.View style={[styles.container, { left: leftAnim }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.touchableCard}>
        <LinearGradient
          colors={['#7C3AED', '#EC4899', '#F59E0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientCard}
        >
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <Image source={ICONS.luckyPacket} style={styles.packetIcon} resizeMode="contain" />
          </Animated.View>

          <View style={styles.avatarBorder}>
            <Image
              source={{
                uri:
                  broadcast.sender?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
              }}
              style={styles.avatar}
            />
          </View>

          <View style={styles.contentColumn}>
            <Text style={styles.senderName} numberOfLines={1}>
              {broadcast.sender?.name || 'User'}
            </Text>
            <Text style={styles.messageText} numberOfLines={1}>
              <T>I sent a Lucky Packet</T>
            </Text>
          </View>

          <LinearGradient
            colors={['#FACC15', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.getButton}
          >
            <Text style={styles.getButtonText}><T>Get</T></Text>
          </LinearGradient>
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
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(253, 224, 71, 0.8)',
    maxWidth: SCREEN_WIDTH * 1.3,
  },
  iconWrapper: { marginRight: 8 },
  packetIcon: { width: 26, height: 26 },
  avatarBorder: { marginRight: 8 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#FDE047',
  },
  contentColumn: { marginRight: 10, maxWidth: 170 },
  senderName: { fontSize: 12, fontWeight: '800', color: '#FDE047' },
  messageText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginTop: 1 },
  getButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getButtonText: { fontSize: 13, fontWeight: '900', color: '#7C2D12' },
});
