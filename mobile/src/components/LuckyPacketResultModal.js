import React from 'react';
import { View, Text, Modal, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';

const ICONS = {
  goldCoin: require('../../assets/icons/gold_coin.png'),
};

export default function LuckyPacketResultModal({ visible, wonCoins, onClose }) {
  if (!visible) return null;
  const coins = Number(wonCoins || 0);
  const betterLuck = coins <= 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={betterLuck ? ['#312E81', '#1E1B4B'] : ['#F59E0B', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {betterLuck ? (
            <>
              <Text style={styles.emoji}>🍀</Text>
              <Text style={styles.bigText}><T>Better luck next time</T></Text>
              <Text style={styles.subText}>
                <T>You did not receive gold coins this time</T>
              </Text>
            </>
          ) : (
            <>
              <Image source={ICONS.goldCoin} style={styles.coin} />
              <Text style={styles.amount}>{coins}</Text>
              <Text style={styles.bigText}><T>Gold coins from Lucky Packet</T></Text>
              <Text style={styles.subText}>
                <T>Added to your wallet gold coins</T>
              </Text>
            </>
          )}
          <TouchableOpacity style={styles.okBtn} activeOpacity={0.75} onPress={onClose}>
            <Text style={styles.okText}><T>OK</T></Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  coin: { width: 64, height: 64, marginBottom: 8 },
  amount: { color: '#FFF', fontSize: 42, fontWeight: '900', marginBottom: 4 },
  bigText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center' },
  okBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  okText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
