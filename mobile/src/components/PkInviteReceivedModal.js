import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';

export default function PkInviteReceivedModal({
  visible,
  invitation, // { fromRoomId, fromRoomName, fromRoomAvatar }
  onAccept,
  onReject,
}) {
  if (!invitation) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#1E1B4B', '#0F172A']}
            style={styles.cardGradient}
          >
            {/* Header Badge */}
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>⚔️ <T>PK Battle Challenge!</T></Text>
            </View>

            {/* Challenger Avatar */}
            <View style={styles.avatarBorder}>
              <Image
                source={{
                  uri:
                    invitation.fromRoomAvatar ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
                }}
                style={styles.avatar}
              />
            </View>

            {/* Room Name & Message */}
            <Text style={styles.roomName} numberOfLines={2}>
              {invitation.fromRoomName}
            </Text>
            <Text style={styles.subText}>
              <T>has challenged your room to a PK Battle!</T>
            </Text>

            {/* Action Buttons: Accept & Reject */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.rejectBtn}
                onPress={onReject}
              >
                <Text style={styles.rejectBtnText}>
                  <T>Reject</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.acceptBtn}
                onPress={onAccept}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.acceptBtnGradient}
                >
                  <Text style={styles.acceptBtnText}>
                    <T>Accept</T>
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.3)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A5B4FC',
  },
  avatarBorder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#F59E0B',
    padding: 2,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: '#334155',
  },
  roomName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  acceptBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  acceptBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
