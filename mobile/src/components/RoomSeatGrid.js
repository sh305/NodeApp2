import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AvatarWithFrame from './AvatarWithFrame';

const { width } = Dimensions.get('window');

export default function RoomSeatGrid({
  seats = [],
  onSeatPress,
  currentUserId,
  isOwner = false,
}) {
  return (
    <View style={styles.gridContainer}>
      {seats.map((seat, index) => {
        const isOccupied = seat && seat.user;
        const isMe = isOccupied && seat.user._id === currentUserId;

        return (
          <TouchableOpacity
            key={`seat_${index}`}
            style={styles.seatItem}
            activeOpacity={0.7}
            onPress={() => onSeatPress(seat, index)}
          >
            {isOccupied ? (
              <View style={styles.occupiedWrapper}>
                <AvatarWithFrame
                  avatarUri={seat.user.avatar}
                  level={seat.user.wealthLevel || 1}
                  size={46}
                />
                <Text style={styles.userName} numberOfLines={1}>
                  {seat.user.name}
                </Text>
                {/* Mute Indicator */}
                {seat.isMuted && (
                  <View style={styles.muteBadge}>
                    <Text style={styles.muteText}>🔇</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptySeatWrapper}>
                <View style={styles.chairCircle}>
                  <Text style={styles.micIcon}>🎙️</Text>
                  <Text style={styles.seatNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.emptyLabel}>Tap to Sit</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  seatItem: {
    width: (width - 48) / 4,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  occupiedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
    maxWidth: 68,
    textAlign: 'center',
  },
  emptySeatWrapper: {
    alignItems: 'center',
  },
  chairCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 16,
  },
  seatNumberText: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#374151',
    color: '#D1D5DB',
    fontSize: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    fontWeight: '700',
  },
  emptyLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 4,
  },
  muteBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    padding: 2,
  },
  muteText: {
    fontSize: 10,
  },
});
