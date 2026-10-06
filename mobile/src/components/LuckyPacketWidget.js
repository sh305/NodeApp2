import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';

const ICONS = {
  luckyPacket: require('../../assets/icons/Room Icons/tool_lucky_packet.png'),
};

const formatRemain = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function LuckyPacketWidget({ packet, onGetPress }) {
  const [now, setNow] = useState(Date.now());

  const opensAt = packet?.opensAt ? new Date(packet.opensAt).getTime() : 0;
  const isCountdown = packet?.packetType === 'countdown';
  const locked = isCountdown && opensAt > now;
  const remainingMs = locked ? opensAt - now : 0;

  useEffect(() => {
    if (!isCountdown || !locked) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isCountdown, locked, packet?.id]);

  if (!packet || packet.status === 'exhausted') return null;

  const claimed = Boolean(packet.claimedByMe);
  const showGreenGet = isCountdown && !locked && !claimed;

  return (
    <View style={styles.wrap}>
      <Image source={ICONS.luckyPacket} style={styles.icon} resizeMode="contain" />
      {claimed ? (
        <View style={styles.openedBadge}>
          <Text style={styles.openedText}><T>Opened</T></Text>
        </View>
      ) : locked ? (
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatRemain(remainingMs)}</Text>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onGetPress && onGetPress(packet)}
        >
          <LinearGradient
            colors={showGreenGet ? ['#22C55E', '#16A34A'] : ['#FACC15', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.getBtn, showGreenGet && styles.getBtnGreen]}
          >
            <Text style={[styles.getText, showGreenGet && styles.getTextGreen]}>
              <T>Get</T>
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 58,
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: 4,
  },
  getBtn: {
    minWidth: 46,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  getBtnGreen: {
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  getText: {
    color: '#7C2D12',
    fontWeight: '900',
    fontSize: 12,
  },
  getTextGreen: {
    color: '#FFFFFF',
  },
  timerBadge: {
    backgroundColor: 'rgba(15, 15, 26, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  timerText: {
    color: '#FDE047',
    fontWeight: '800',
    fontSize: 10,
  },
  openedBadge: {
    backgroundColor: 'rgba(15, 15, 26, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  openedText: {
    color: '#D1D5DB',
    fontWeight: '700',
    fontSize: 10,
  },
});
