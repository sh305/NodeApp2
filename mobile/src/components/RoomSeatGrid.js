import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarWithFrame from './AvatarWithFrame';
import StylishSofaIcon from './StylishSofaIcon';

const { width } = Dimensions.get('window');

export default function RoomSeatGrid({
  seats = [],
  owner = null,
  onSeatPress,
  onHostPress,
  currentUserId,
  isOwner = false,
}) {
  // Always guarantee 8 seats displayed in 4x2 grid
  const displaySeats = Array.from({ length: 8 }, (_, i) => seats[i] || { seatIndex: i, user: null });

  return (
    <View style={styles.container}>
      {/* 👑 TOP HOST SEAT (Screenshot matching) */}
      <View style={styles.hostSection}>
        <TouchableOpacity
          style={styles.hostSeatWrapper}
          activeOpacity={0.8}
          onPress={() => onHostPress && onHostPress(owner)}
        >
          {/* Host Circular Glowing Avatar */}
          <View style={styles.hostGlowRing}>
            <LinearGradient
              colors={['#818CF8', '#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hostGradientBorder}
            >
              <View style={styles.hostInnerCircle}>
                {owner?.avatar ? (
                  <Image source={{ uri: owner.avatar }} style={styles.hostAvatar} />
                ) : (
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }}
                    style={styles.hostAvatar}
                  />
                )}
              </View>
            </LinearGradient>

            {/* Speaking Wave Pulse */}
            <View style={styles.hostSpeakingPulse} />
          </View>

          {/* Host Name with Fancy Wings */}
          <View style={styles.hostInfoBox}>
            <Text style={styles.hostName} numberOfLines={1}>
              {owner?.name ? `༺𓊈𒆜 ${owner.name} 😎 𒆜𓊉༻` : '༺𓊈𒆜 Raftar 😎😎 𒆜𓊉༻'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 🛋️ 8 SOFA SEATS (4x2 Grid: No.1 to No.8) */}
      <View style={styles.gridContainer}>
        {displaySeats.map((seat, index) => {
          const isOccupied = seat && seat.user;
          const isMe = isOccupied && seat.user._id === currentUserId;
          const isLocked = seat?.isLockedByOwner;
          const seatNumber = index + 1;

          return (
            <TouchableOpacity
              key={`sofa_seat_${index}`}
              style={styles.seatItem}
              activeOpacity={0.7}
              onPress={() => onSeatPress(seat, index)}
            >
              {isOccupied ? (
                /* Occupied User Seat */
                <View style={styles.occupiedWrapper}>
                  <AvatarWithFrame
                    avatarUri={seat.user.avatar}
                    level={seat.user.wealthLevel || 1}
                    size={52}
                  />
                  <Text style={styles.userName} numberOfLines={1}>
                    {seat.user.name}
                  </Text>
                  <Text style={styles.seatNumberText}>No.{seatNumber}</Text>

                  {/* Mute Indicator */}
                  {seat.isMuted && (
                    <View style={styles.muteBadge}>
                      <Text style={styles.muteText}>🔇</Text>
                    </View>
                  )}
                </View>
              ) : (
                /* Empty Sofa Seat (Screenshot Match) */
                <View style={styles.emptySeatWrapper}>
                  <LinearGradient
                    colors={['rgba(110, 95, 175, 0.45)', 'rgba(75, 55, 145, 0.35)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sofaCircle}
                  >
                    {isLocked ? (
                      <Text style={styles.lockedIcon}>🔒</Text>
                    ) : (
                      <StylishSofaIcon width={34} height={34} color="#FFFFFF" tint="#E0E7FF" />
                    )}
                  </LinearGradient>

                  {/* Clean No.1, No.2 ... No.8 Text */}
                  <Text style={styles.seatNumberText}>No.{seatNumber}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
  /* Top Host Section */
  hostSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  hostSeatWrapper: {
    alignItems: 'center',
  },
  hostGlowRing: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostGradientBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  hostInnerCircle: {
    width: 61,
    height: 61,
    borderRadius: 30.5,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
  },
  hostAvatar: {
    width: '100%',
    height: '100%',
  },
  hostSpeakingPulse: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  hostInfoBox: {
    alignItems: 'center',
    marginTop: 6,
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: width * 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* 4x2 Sofa Grid */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  seatItem: {
    width: (width - 64) / 4,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },

  /* Empty Sofa Seat */
  emptySeatWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sofaCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  seatNumberText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  lockedIcon: {
    fontSize: 20,
  },

  /* Occupied Seat */
  occupiedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    maxWidth: 68,
    textAlign: 'center',
  },
  muteBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  muteText: {
    fontSize: 9,
  },
});
