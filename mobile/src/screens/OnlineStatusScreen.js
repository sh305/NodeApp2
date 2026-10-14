import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';

// Back Chevron Icon
const ChevronLeft = ({ size = 22, color = '#1C1C1E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Green Checkmark Icon matching Screenshot
const GreenCheckmark = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 13L9.5 17.5L19 7"
      stroke="#22C55E"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function OnlineStatusScreen({ navigation, route, currentUser }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [onlineStatus, setOnlineStatus] = useState('online'); // 'online' | 'invisible'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem('@user_info');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.onlineStatus) {
          setOnlineStatus(user.onlineStatus);
        }
      }
      // Also fetch from backend
      const uid = currentUser?._id || currentUser?.id;
      if (uid) {
        const res = await api.get(`/users/${uid}/profile`);
        if (res.data?.success && res.data.user?.onlineStatus) {
          setOnlineStatus(res.data.user.onlineStatus);
        }
      }
    } catch (e) {
      console.warn('Error loading online status:', e);
    }
  };

  const handleSelectStatus = async (status) => {
    if (onlineStatus === status || loading) return;

    setOnlineStatus(status);
    setLoading(true);

    try {
      // 1. Update on backend
      const res = await api.put('/users/profile', { onlineStatus: status });

      // 2. Sync local storage
      const stored = await AsyncStorage.getItem('@user_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.onlineStatus = status;
        await AsyncStorage.setItem('@user_info', JSON.stringify(parsed));
      }

      showToast(t('Online status updated successfully'), 'success');
    } catch (err) {
      console.error('Error updating online status:', err);
      showToast(t('Failed to update online status'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

      {/* ══ TOP NAVIGATION HEADER ══ */}
      <View style={[styles.header, { paddingTop: Math.max(12, insets.top) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.75}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}><T>Online Status</T></Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {/* ══ MAIN WHITE CARD ══ */}
      <View style={styles.cardContainer}>
        {/* Row 1: Online */}
        <TouchableOpacity
          style={styles.statusRow}
          activeOpacity={0.75}
          onPress={() => handleSelectStatus('online')}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.statusTitle}><T>Online</T></Text>
          </View>
          {onlineStatus === 'online' && <GreenCheckmark size={22} />}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Row 2: Invisible (Super King) */}
        <TouchableOpacity
          style={styles.statusRow}
          activeOpacity={0.75}
          onPress={() => handleSelectStatus('invisible')}
        >
          <View style={styles.rowLeft}>
            <View style={styles.invisibleTitleRow}>
              <Text style={styles.statusTitle}><T>Invisible</T></Text>
              <View style={styles.superKingBadge}>
                <Text style={styles.superKingBadgeText}>Super King</Text>
              </View>
            </View>
            <Text style={styles.statusSubtitle}>
              <T>Other users will see you as offline</T>
            </Text>
          </View>
          {onlineStatus === 'invisible' && <GreenCheckmark size={22} />}
        </TouchableOpacity>
      </View>

      {/* ══ BOTTOM NOTE ══ */}
      <Text style={styles.footerNote}>
        <T>Available exclusively to Super King</T>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#F5F6FA',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  backBtnPlaceholder: {
    width: 40,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  rowLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  invisibleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  superKingBadge: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  superKingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B3200',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F3',
    marginHorizontal: 18,
  },
  footerNote: {
    fontSize: 13,
    color: '#8E8E93',
    marginHorizontal: 20,
    marginTop: 12,
  },
});
