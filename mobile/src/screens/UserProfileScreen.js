import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import AvatarWithFrame from '../components/AvatarWithFrame';
import ReportModal from '../components/ReportModal';

export default function UserProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { userId } = route.params;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${userId}/profile`);
      if (res.data.success) {
        setProfile(res.data.user);
        setIsBlocked(res.data.user.isBlockedByYou || false);
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isBlocked) {
        Alert.alert(
          'Profile Inaccessible 🚷',
          'Aap is user ki ID visit nahi kar sakte kyunki unhone aapko block kiya hua hai.',
          [{ text: 'Back', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleToggleBlock = async () => {
    try {
      if (isBlocked) {
        const res = await api.post(`/users/${userId}/unblock`);
        if (res.data.success) {
          setIsBlocked(false);
          Alert.alert('Unblocked', 'User ko unblock kar diya gaya hai.');
        }
      } else {
        const res = await api.post(`/users/${userId}/block`);
        if (res.data.success) {
          setIsBlocked(true);
          Alert.alert('Blocked', 'User ko block kar diya gaya hai. Ab wo aapki profile nahi dekh sakenge.');
        }
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Block/Unblock action failed');
    }
  };

  const handleSubmitReport = async ({ requestedBanDuration, reason, description }) => {
    await api.post('/reports', {
      reportedUserId: userId,
      requestedBanDuration,
      reason,
      description,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Profile Card */}
      <View style={styles.card}>
        <AvatarWithFrame
          avatarUri={profile.avatar}
          level={profile.wealthLevel || 1}
          size={90}
        />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.idText}>ID: {profile._id.slice(-8)}</Text>

        {/* Level & Frame Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.wealthBadge}>
            <Text style={styles.badgeText}>💰 Wealth Lv.{profile.wealthLevel || 1}</Text>
          </View>
          <View style={styles.charmBadge}>
            <Text style={styles.badgeText}>💖 Charm Lv.{profile.charmLevel || 1}</Text>
          </View>
        </View>

        <View style={styles.frameBadge}>
          <Text style={styles.frameBadgeText}>
            🎖️ Active Frame: {profile.activeFrame?.name || 'Novice Glow'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.blockBtn, isBlocked && styles.unblockBtn]}
            onPress={handleToggleBlock}
          >
            <Text style={styles.blockBtnText}>
              {isBlocked ? '🔓 Unblock User' : '🚷 Block User'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setReportModalVisible(true)}
          >
            <Text style={styles.reportBtnText}>🚩 Report Profile (3d/7d/Perm)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmitReport={handleSubmitReport}
        targetUserName={profile.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  center: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E1E2E',
  },
  backBtn: {
    padding: 6,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    margin: 20,
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },
  idText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  wealthBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  charmBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EC4899',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  frameBadge: {
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
  },
  frameBadgeText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    width: '100%',
    marginTop: 30,
    gap: 12,
  },
  blockBtn: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  unblockBtn: {
    backgroundColor: '#059669',
  },
  blockBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  reportBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
});
