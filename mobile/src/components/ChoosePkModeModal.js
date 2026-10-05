import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';

export default function ChoosePkModeModal({
  visible,
  onClose,
  onSelectMatch,
  onSelectInvite,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheetCard, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          {/* Top Grabber Handle */}
          <View style={styles.handleBar} />

          {/* Modal Title */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              <T>Choose to PK mode</T>
            </Text>
          </View>

          {/* Mode Options */}
          <View style={styles.buttonList}>
            {/* 1. MATCH BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modeCardWrap}
              onPress={() => {
                onClose();
                if (onSelectMatch) onSelectMatch();
              }}
            >
              <LinearGradient
                colors={['#8B5CF6', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
                style={styles.gradientCard}
              >
                <Text style={styles.cardLabel}>
                  <T>Match</T>
                </Text>
                <View style={styles.iconCircle}>
                  <View style={styles.iconBadgeWrapper}>
                    <Text style={styles.iconEmoji}>🏠</Text>
                    <View style={styles.sparkleBadge}>
                      <Text style={styles.sparkleText}>✨</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* 2. INVITE A ROOM BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modeCardWrap}
              onPress={() => {
                onClose();
                if (onSelectInvite) onSelectInvite();
              }}
            >
              <LinearGradient
                colors={['#3B82F6', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
                style={styles.gradientCard}
              >
                <Text style={styles.cardLabel}>
                  <T>Invite a room</T>
                </Text>
                <View style={styles.iconCircle}>
                  <View style={styles.iconBadgeWrapper}>
                    <Text style={styles.iconEmoji}>✉️</Text>
                    <View style={styles.vsPill}>
                      <Text style={styles.vsPillText}>VS</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  buttonList: {
    gap: 16,
  },
  modeCardWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 18,
  },
  cardLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconBadgeWrapper: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 24,
    textAlign: 'center',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  sparkleText: {
    fontSize: 12,
  },
  vsPill: {
    position: 'absolute',
    bottom: -1,
    right: -2,
    backgroundColor: '#1E3A8A',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  vsPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
