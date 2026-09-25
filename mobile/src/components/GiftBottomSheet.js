import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, StyleSheet, FlatList, ActivityIndicator } from 'react-native';

const GIFTS = [
  { _id: '1', name: 'Rose', coinPrice: 10, expReward: 10, iconUrl: 'https://cdn-icons-png.flaticon.com/512/765/765611.png' },
  { _id: '2', name: 'Heart Ring', coinPrice: 50, expReward: 50, iconUrl: 'https://cdn-icons-png.flaticon.com/512/2856/2856860.png' },
  { _id: '3', name: 'Sports Car', coinPrice: 500, expReward: 500, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' },
  { _id: '4', name: 'Luxury Yacht', coinPrice: 2000, expReward: 2000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933890.png' },
  { _id: '5', name: 'Dragon Castle', coinPrice: 5000, expReward: 5000, iconUrl: 'https://cdn-icons-png.flaticon.com/512/1497/1497573.png' },
];

export default function GiftBottomSheet({
  visible,
  onClose,
  onSendGift,
  receiverName = 'Room',
  userCoins = 1000,
}) {
  const [selectedGift, setSelectedGift] = useState(GIFTS[0]);
  const [quantity, setQuantity] = useState(1);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selectedGift) return;
    setSending(true);
    await onSendGift(selectedGift, quantity);
    setSending(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🎁 Send Gift to {receiverName}</Text>
              <Text style={styles.coinsText}>🪙 Your Coins: {userCoins}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Gifts Grid */}
          <FlatList
            data={GIFTS}
            keyExtractor={(item) => item._id}
            numColumns={3}
            contentContainerStyle={styles.giftList}
            renderItem={({ item }) => {
              const isSelected = selectedGift?._id === item._id;
              return (
                <TouchableOpacity
                  style={[styles.giftCard, isSelected && styles.giftCardSelected]}
                  onPress={() => setSelectedGift(item)}
                >
                  <Image source={{ uri: item.iconUrl }} style={styles.giftIcon} />
                  <Text style={styles.giftName}>{item.name}</Text>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceCoin}>🪙 {item.coinPrice}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Multiplier & Send Bar */}
          <View style={styles.footer}>
            <View style={styles.qtyRow}>
              {[1, 10, 66, 99].map((qty) => (
                <TouchableOpacity
                  key={qty}
                  style={[styles.qtyBadge, quantity === qty && styles.qtyBadgeActive]}
                  onPress={() => setQuantity(qty)}
                >
                  <Text style={[styles.qtyText, quantity === qty && styles.qtyTextActive]}>
                    x{qty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
              {sending ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>
                  Send (🪙 {selectedGift ? selectedGift.coinPrice * quantity : 0})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#374151',
    maxHeight: '65%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  coinsText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  giftList: {
    paddingVertical: 6,
  },
  giftCard: {
    flex: 1,
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    padding: 10,
    margin: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  giftCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  giftIcon: {
    width: 48,
    height: 48,
    marginBottom: 6,
  },
  giftName: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '600',
  },
  priceTag: {
    marginTop: 4,
  },
  priceCoin: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#2A2A3E',
  },
  qtyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  qtyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#2A2A3E',
    borderRadius: 8,
  },
  qtyBadgeActive: {
    backgroundColor: '#F59E0B',
  },
  qtyText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  qtyTextActive: {
    color: '#000000',
  },
  sendBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  sendBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
});
