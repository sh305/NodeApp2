import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';

export default function PkBattleResultModal({
  visible,
  resultData, // { winnerRoomId, loserRoomId, isDraw, forfeited, room1, room2 }
  currentRoomId,
  onClose,
}) {
  if (!resultData) return null;

  const cleanCurrentId = String(currentRoomId);
  const isWinner = resultData.winnerRoomId && String(resultData.winnerRoomId) === cleanCurrentId;
  const isLoser = resultData.loserRoomId && String(resultData.loserRoomId) === cleanCurrentId;
  const isDraw = resultData.isDraw;
  const forfeited = resultData.forfeited;

  const room1 = resultData.room1 || { name: 'Room 1', score: 0 };
  const room2 = resultData.room2 || { name: 'Room 2', score: 0 };

  let title = 'PK Battle Ended';
  let badgeEmoji = '⚔️';
  let statusText = 'PK Battle Complete!';
  let gradientColors = ['#1E1B4B', '#0F172A'];

  if (isWinner) {
    title = 'Victory!';
    badgeEmoji = '🏆';
    statusText = forfeited
      ? 'Opponent forfeited! You Won!'
      : 'Congratulations! Your room won the PK battle!';
    gradientColors = ['#4338CA', '#065F46'];
  } else if (isLoser) {
    title = 'Defeat';
    badgeEmoji = '💔';
    statusText = forfeited
      ? 'Room PK toggle was turned off. Match forfeited.'
      : 'Better luck next time!';
    gradientColors = ['#7F1D1D', '#1E1B4B'];
  } else if (isDraw) {
    title = 'Draw';
    badgeEmoji = '🤝';
    statusText = "It's a draw! Both rooms fought valiantly!";
    gradientColors = ['#312E81', '#1E1B4B'];
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient colors={gradientColors} style={styles.gradient}>
            {/* Big Victory / Defeat Badge */}
            <Text style={styles.emoji}>{badgeEmoji}</Text>

            <Text style={styles.title}>
              <T>{title}</T>
            </Text>

            <Text style={styles.subtitle}>
              <T>{statusText}</T>
            </Text>

            {/* Score Summary Box */}
            <View style={styles.scoreBox}>
              <View style={styles.teamScore}>
                <Image
                  source={{
                    uri:
                      room1.avatar ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
                  }}
                  style={styles.teamAvatar}
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {room1.name}
                </Text>
                <Text style={styles.teamPoints}>{room1.score} pts</Text>
              </View>

              <View style={styles.vsWrap}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.teamScore}>
                <Image
                  source={{
                    uri:
                      room2.avatar ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
                  }}
                  style={styles.teamAvatar}
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {room2.name}
                </Text>
                <Text style={styles.teamPoints}>{room2.score} pts</Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.closeBtn}
              onPress={onClose}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.closeBtnGradient}
              >
                <Text style={styles.closeBtnText}>
                  <T>OK</T>
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  gradient: {
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  teamScore: {
    flex: 1,
    alignItems: 'center',
  },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  teamName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  teamPoints: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FACC15',
  },
  vsWrap: {
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94A3B8',
  },
  closeBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  closeBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
