import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import io from 'socket.io-client';
import api, { BASE_URL } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import DirectChatModal from './DirectChatModal';

// 1. Top Icons
const ContactsIcon = ({ size = 26, color = '#374151' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 8V14M23 11H17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GearIcon = ({ size = 26, color = '#374151' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Path
      d="M19.4 15A1.65 1.65 0 0019 16.7l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.7-.4 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008.4 19.4a1.65 1.65 0 00-1.7.4l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.4-1.7 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.4a1.65 1.65 0 00-.4-1.7l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.7.4 1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001.07 1.51 1.65 1.65 0 001.7-.4l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.4 1.7 1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1.07z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BackChevron = ({ size = 24, color = '#1E293B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRight = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5L16 12L9 19"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Tab 1: Followers Icon (User with +)
const FollowersTabIcon = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="8.5" cy="7" r="4" stroke="#FFFFFF" strokeWidth="2.4" />
    <Path
      d="M20 8V14M23 11H17"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Tab 2: Moment Icon (Saturn / Planet)
const MomentTabIcon = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="6" stroke="#FFFFFF" strokeWidth="2.4" />
    <Path
      d="M4 17C6.5 19.5 12 19 17 14C22 9 21.5 3.5 19 1"
      stroke="#FFFFFF"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <Path
      d="M2.5 15.5C1 14 1.5 11 3.5 8.5C5.5 6 8.5 4.5 11.5 4"
      stroke="#FFFFFF"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </Svg>
);

// Tab 3: Notification Icon (Bell)
const NotificationTabIcon = ({ size = 30 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 006 8C6 15 3 17 3 17H21S18 15 18 8Z"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Official Robot / System Notification Icon
const SystemBellIcon = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="6" width="16" height="13" rx="4" fill="#3B82F6" />
    <Circle cx="9" cy="12.5" r="1.5" fill="#FFFFFF" />
    <Circle cx="15" cy="12.5" r="1.5" fill="#FFFFFF" />
    <Path d="M12 2V6" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
    <Circle cx="12" cy="2" r="1.5" fill="#3B82F6" />
  </Svg>
);

// Family / Shield Icon
const FamilyIcon = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L3 7V12C3 17.5 7 21.5 12 23C17 21.5 21 17.5 21 12V7L12 2Z"
      fill="#EC4899"
    />
    <Path
      d="M12 8C13.1046 8 14 7.10457 14 6C14 4.89543 13.1046 4 12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8Z"
      fill="#FFFFFF"
    />
    <Path
      d="M15.5 17C15.5 14.5 14 13 12 13C10 13 8.5 14.5 8.5 17"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export default function MessageView({ currentUser, navigation, onUnreadCountChange }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Navigation state inside Message View:
  // 'chats' | 'notifications' | 'system_notifications'
  const [activeView, setActiveView] = useState('chats');

  // Chats list state
  const [conversations, setConversations] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Active chat modal
  const [chatPartner, setChatPartner] = useState(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);

  // Notifications state
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [lastViewedNotifTime, setLastViewedNotifTime] = useState(0);

  const storageKey = `@notif_last_opened_${currentUser?._id || 'guest'}`;

  // Load last viewed notification timestamp
  useEffect(() => {
    const loadLastViewed = async () => {
      try {
        const val = await AsyncStorage.getItem(storageKey);
        if (val) {
          setLastViewedNotifTime(Number(val));
        }
      } catch (e) {}
    };
    loadLastViewed();
  }, [storageKey]);

  // Recharge Dispute Modal
  const [selectedDisputeNotification, setSelectedDisputeNotification] = useState(null);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false);
  const [uploadingRefundQr, setUploadingRefundQr] = useState(false);

  // Format timestamp helper (e.g. 10/07 - 13:48)
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${month}/${day} - ${hours}:${mins}`;
    } catch {
      return '';
    }
  };

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.data?.success) {
        setConversations(res.data.conversations || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, []);

  // Fetch system notifications
  // Fetch system notifications & badge counts
  const fetchSystemNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const [res, unreadRes] = await Promise.all([
        api.get('/notifications/system'),
        api.get('/notifications/unread-count'),
      ]);
      if (res.data?.success) {
        setSystemNotifications(res.data.notifications || []);
      }
      if (unreadRes.data?.success) {
        setUnreadNotificationsCount(unreadRes.data.unreadNotificationsCount || 0);
      }
    } catch (err) {
      console.error('Error fetching system notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Handler for user clicking Notification tab
  const handleOpenNotificationMenu = async () => {
    const now = Date.now();
    setLastViewedNotifTime(now);
    setUnreadNotificationsCount(0); // Badge cleared!
    try {
      await AsyncStorage.setItem(storageKey, String(now));
      await api.post('/notifications/mark-seen');
    } catch (e) {}

    // Update bottom tab badge immediately
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success && onUnreadCountChange) {
        onUnreadCountChange(res.data.totalUnread || 0);
      }
    } catch (e) {}

    setActiveView('notifications');
  };

  // Fetch overall badge count and inform parent
  const fetchUnreadBadge = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        const notifCount = res.data.unreadNotificationsCount || 0;
        const total = res.data.totalUnread || 0;
        setUnreadNotificationsCount(notifCount);
        if (onUnreadCountChange) {
          onUnreadCountChange(total);
        }
      }
    } catch (err) {
      // quiet fail
    }
  }, [onUnreadCountChange]);

  // Initial Load & Refresh
  useEffect(() => {
    setLoadingChats(true);
    Promise.all([fetchConversations(), fetchSystemNotifications(), fetchUnreadBadge()]).finally(
      () => setLoadingChats(false)
    );
  }, [fetchConversations, fetchSystemNotifications, fetchUnreadBadge]);

  // Real-time socket listener for incoming DMs & recharge updates
  useEffect(() => {
    let socket = null;
    try {
      socket = io(BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('connect', () => {
        if (currentUser?._id) {
          socket.emit('join_user_room', { userId: currentUser._id });
        }
      });

      socket.on('new_direct_message', () => {
        fetchConversations();
        fetchUnreadBadge();
      });

      socket.on('recharge_status_updated', () => {
        fetchSystemNotifications();
        fetchUnreadBadge();
      });
    } catch (err) {
      console.error('Socket setup error in MessageView:', err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [currentUser?._id, fetchConversations, fetchSystemNotifications, fetchUnreadBadge]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchConversations(),
      fetchSystemNotifications(),
      fetchUnreadBadge(),
    ]);
    setRefreshing(false);
  };

  // Open Direct Chat Modal with selected user
  const handleOpenChat = (partner) => {
    setChatPartner(partner);
    setChatModalVisible(true);
  };

  // Upload Payment Proof (Receipt) with AI OCR verification
  const handlePickPaymentProof = async (rechargeId) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('Permission to access photos is required'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = `data:image/jpeg;base64,${asset.base64}`;

        setUploadingPaymentProof(true);
        const res = await api.post(`/recharge/${rechargeId}/upload-payment-proof`, {
          proofImage: base64Data,
        });

        if (res.data?.success) {
          showToast(
            t('Payment proof verified and submitted to owner successfully!'),
            'success'
          );
          setDisputeModalVisible(false);
          await fetchSystemNotifications();
          await fetchUnreadBadge();
        } else {
          showToast(t(res.data?.message || 'Verification failed'), 'error');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload proof';
      showToast(t(msg), 'error');
    } finally {
      setUploadingPaymentProof(false);
    }
  };

  // Upload Refund QR Code with QR detector validation
  const handlePickRefundQr = async (rechargeId) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('Permission to access photos is required'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = `data:image/jpeg;base64,${asset.base64}`;

        setUploadingRefundQr(true);
        const res = await api.post(`/recharge/${rechargeId}/upload-refund-qr`, {
          qrImage: base64Data,
        });

        if (res.data?.success) {
          showToast(
            t('Refund QR code uploaded successfully! Owner will process refund.'),
            'success'
          );
          setDisputeModalVisible(false);
          await fetchSystemNotifications();
          await fetchUnreadBadge();
        } else {
          showToast(t(res.data?.message || 'QR validation failed'), 'error');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload QR';
      showToast(t(msg), 'error');
    } finally {
      setUploadingRefundQr(false);
    }
  };

  // Open System Notifications and start 5-min auto-expiry timer
  const handleOpenSystemNotifications = async () => {
    setActiveView('system_notifications');
    try {
      await api.post('/notifications/mark-seen');
      fetchSystemNotifications();
      fetchUnreadBadge();
    } catch (e) {}
  };

  // Auto-expire resolved notifications after 5 minutes of viewing
  useEffect(() => {
    if (activeView !== 'system_notifications') return;
    const interval = setInterval(() => {
      setSystemNotifications((prev) => {
        const fiveMinutes = 5 * 60 * 1000;
        const filtered = prev.filter((item) => {
          if (item.type === 'recharge_resolved' && item.resolvedViewedAt) {
            return Date.now() - new Date(item.resolvedViewedAt).getTime() < fiveMinutes;
          }
          return true;
        });
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [activeView]);

  // ====================================================================
  // SUB-VIEW 3: SYSTEM NOTIFICATIONS (Shows Rejections & Disputes)
  // ====================================================================
  if (activeView === 'system_notifications') {
    return (
      <View style={[styles.container, { paddingTop: Math.max(16, insets.top) }]}>
        {/* Header with Back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={() => setActiveView('notifications')}
          >
            <BackChevron size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitleSub}><T>System Notification</T></Text>
          <View style={{ width: 40 }} />
        </View>

        {loadingNotifications ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : systemNotifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png' }}
              style={{ width: 72, height: 72, opacity: 0.6, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}><T>No System Notifications</T></Text>
            <Text style={styles.emptySub}>
              <T>System alerts and wallet recharge updates will appear here.</T>
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 + insets.bottom }}
            showsVerticalScrollIndicator={false}
          >
            {systemNotifications.map((item) => {
              const isRejected = item.type === 'recharge_rejected';
              const isResolved = item.type === 'recharge_resolved';
              const isProofSubmitted = item.type === 'proof_submitted';
              const isApproved = item.type === 'recharge_approved';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notificationCard,
                    isRejected && styles.rejectedNotificationCard,
                    isResolved && styles.resolvedNotificationCard,
                  ]}
                  activeOpacity={isRejected ? 0.8 : 1}
                  onPress={() => {
                    if (isRejected) {
                      setSelectedDisputeNotification(item);
                      setDisputeModalVisible(true);
                    }
                  }}
                >
                  <View style={styles.notifCardHeader}>
                    <View style={styles.notifIconWrap}>
                      {isRejected ? (
                        <View style={[styles.notifBadgeCircle, { backgroundColor: '#FEE2E2' }]}>
                          <Text style={{ fontSize: 18 }}>⚠️</Text>
                        </View>
                      ) : isResolved ? (
                        <View style={[styles.notifBadgeCircle, { backgroundColor: '#DBEAFE' }]}>
                          <Text style={{ fontSize: 18 }}>🎉</Text>
                        </View>
                      ) : isProofSubmitted ? (
                        <View style={[styles.notifBadgeCircle, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={{ fontSize: 18 }}>⏳</Text>
                        </View>
                      ) : (
                        <View style={[styles.notifBadgeCircle, { backgroundColor: '#D1FAE5' }]}>
                          <Text style={{ fontSize: 18 }}>✅</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle} numberOfLines={1}>
                          <T>{item.title}</T>
                        </Text>
                        <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
                      </View>
                      <Text style={[styles.notifSubDetails, isResolved && { color: '#3B82F6' }]}>
                        ₹{item.amount} • {item.coins} <T>Coins</T>
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.notifBody}>{item.body}</Text>

                  {/* Resolved Info Banner (Without Got it button - Auto-clears in 5 mins) */}
                  {isResolved && (
                    <View style={styles.resolvedActionBanner}>
                      <Text style={styles.resolvedBannerPrompt}>
                        ✓ <T>Issue Resolved by Owner</T>
                      </Text>
                      <Text style={styles.resolvedBannerSub}>
                        <T>Auto-clears after 5 minutes</T>
                      </Text>
                    </View>
                  )}

                  {/* Rejection Specific Action Button / Dispute Prompt */}
                  {isRejected && (
                    <View style={styles.rejectedActionBanner}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rejectedBannerPrompt}>
                          <T>Tap to submit payment proof or refund QR</T>
                        </Text>
                        <Text style={styles.rejectedBannerSub}>
                          <T>Rejection Reason</T>: {item.rejectionReason || t('Verification failed')}
                        </Text>
                      </View>
                      <View style={styles.uploadBtnPill}>
                        <Text style={styles.uploadBtnPillText}><T>Submit</T> ➔</Text>
                      </View>
                    </View>
                  )}

                  {isProofSubmitted && (
                    <View style={styles.pendingActionBanner}>
                      <Text style={styles.pendingBannerText}>
                        <T>Proof submitted. Awaiting owner review.</T>
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* RECHARGE DISPUTE MODAL (Upload Proof / Refund QR) */}
        {selectedDisputeNotification && (
          <Modal
            visible={disputeModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setDisputeModalVisible(false)}
          >
            <View style={styles.disputeModalOverlay}>
              <View style={[styles.disputeModalBox, { paddingBottom: Math.max(24, insets.bottom) }]}>
                {/* Header */}
                <View style={styles.disputeModalHeader}>
                  <Text style={styles.disputeModalTitle}><T>Recharge Rejection Dispute</T></Text>
                  <TouchableOpacity
                    style={styles.disputeCloseBtn}
                    onPress={() => setDisputeModalVisible(false)}
                  >
                    <Text style={{ fontSize: 20, color: '#64748B' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Reason Callout */}
                <View style={styles.disputeReasonBox}>
                  <Text style={styles.disputeReasonHeading}>⚠️ <T>Rejection Reason</T>:</Text>
                  <Text style={styles.disputeReasonText}>
                    {selectedDisputeNotification.rejectionReason || t('Payment verification failed')}
                  </Text>
                  <Text style={styles.disputeAmountMeta}>
                    <T>Order</T>: ₹{selectedDisputeNotification.amount} • {selectedDisputeNotification.coins} <T>Gold Coins</T>
                  </Text>
                </View>

                {/* Dispute Actions */}
                <Text style={styles.disputeSectionTitle}>
                  <T>Choose a resolution option</T>:
                </Text>

                {/* Option 1: Upload Payment Proof */}
                <View style={styles.disputeOptionCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.disputeOptionTitle}>
                      📄 <T>Upload Payment Proof (Receipt)</T>
                    </Text>
                    <Text style={styles.disputeOptionDesc}>
                      <T>If you already paid, upload clear screenshot with UTR number for AI re-verification.</T>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.disputeActionBtn}
                    activeOpacity={0.8}
                    disabled={uploadingPaymentProof}
                    onPress={() => handlePickPaymentProof(selectedDisputeNotification.rechargeId)}
                  >
                    {uploadingPaymentProof ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.disputeActionBtnText}><T>Upload Proof</T></Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Option 2: Upload Refund QR Code */}
                <View style={styles.disputeOptionCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.disputeOptionTitle}>
                      📲 <T>Upload Refund QR Code</T>
                    </Text>
                    <Text style={styles.disputeOptionDesc}>
                      <T>Upload your PhonePe/GPay QR code to receive your refund directly to your bank.</T>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.disputeActionBtn, { backgroundColor: '#6366F1' }]}
                    activeOpacity={0.8}
                    disabled={uploadingRefundQr}
                    onPress={() => handlePickRefundQr(selectedDisputeNotification.rechargeId)}
                  >
                    {uploadingRefundQr ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.disputeActionBtnText}><T>Upload QR</T></Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // ====================================================================
  // SUB-VIEW 2: NOTIFICATION (System Notification & Family)
  // ====================================================================
  if (activeView === 'notifications') {
    return (
      <View style={[styles.container, { paddingTop: Math.max(16, insets.top) }]}>
        {/* Header with Back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={() => setActiveView('chats')}
          >
            <BackChevron size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitleSub}><T>Notification</T></Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.notificationMenuWrap}>
          {/* Item 1: System Notification */}
          <TouchableOpacity
            style={styles.notificationMenuItem}
            activeOpacity={0.75}
            onPress={handleOpenSystemNotifications}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <SystemBellIcon size={28} />
              </View>
              <View style={styles.menuItemTextWrap}>
                <Text style={styles.menuItemTitle}><T>System Notification</T></Text>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  {unreadNotificationsCount > 0
                    ? `${unreadNotificationsCount} ${t('Recharge updates pending')}`
                    : t('System messages & wallet alerts')}
                </Text>
              </View>
            </View>

            <View style={styles.menuItemRight}>
              {unreadNotificationsCount > 0 && (
                <View style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountText}>{unreadNotificationsCount}</Text>
                </View>
              )}
              <ChevronRight size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* Item 2: Family */}
          <TouchableOpacity
            style={styles.notificationMenuItem}
            activeOpacity={0.75}
            onPress={() => showToast(t('No new family notifications'), 'info')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIconCircle, { backgroundColor: '#FDF2F8' }]}>
                <FamilyIcon size={28} />
              </View>
              <View style={styles.menuItemTextWrap}>
                <Text style={styles.menuItemTitle}><T>Family</T></Text>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  <T>Clan & family announcements</T>
                </Text>
              </View>
            </View>

            <View style={styles.menuItemRight}>
              <ChevronRight size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ====================================================================
  // SUB-VIEW 1: MAIN MESSAGE SCREEN (Matching User Screenshot)
  // ====================================================================
  return (
    <View style={[styles.container, { paddingTop: Math.max(16, insets.top) }]}>
      {/* 1. TOP HEADER ("Message" in green + 2 right icons) */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}><T>Message</T></Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            onPress={() => {
              if (navigation) navigation.navigate('Search');
            }}
          >
            <ContactsIcon size={25} color="#2D3748" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            onPress={() => showToast(t('Message Settings'), 'info')}
          >
            <GearIcon size={25} color="#2D3748" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. TOP ACTION TABS (Followers, Moment, Notification - Exactly 3) */}
      <View style={styles.topTabsContainer}>
        {/* Tab 1: Followers (Orange) */}
        <TouchableOpacity
          style={styles.topTabItem}
          activeOpacity={0.8}
          onPress={() => {
            if (navigation) {
              navigation.navigate('UserRelations', { initialTab: 'followers' });
            } else {
              showToast(t('Followers'), 'info');
            }
          }}
        >
          <LinearGradient
            colors={['#FFA500', '#FF6D00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.topTabCircle}
          >
            <FollowersTabIcon size={28} />
          </LinearGradient>
          <Text style={styles.topTabLabel}><T>Followers</T></Text>
        </TouchableOpacity>

        {/* Tab 2: Moment (Yellow / Golden) */}
        <TouchableOpacity
          style={styles.topTabItem}
          activeOpacity={0.8}
          onPress={() => showToast(t('Moments coming soon! ✨'), 'info')}
        >
          <LinearGradient
            colors={['#FFD600', '#FFAB00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.topTabCircle}
          >
            <MomentTabIcon size={28} />
          </LinearGradient>
          <Text style={styles.topTabLabel}><T>Moment</T></Text>
        </TouchableOpacity>

        {/* Tab 3: Notification (Sky-Blue) */}
        <TouchableOpacity
          style={styles.topTabItem}
          activeOpacity={0.8}
          onPress={handleOpenNotificationMenu}
        >
          <View style={{ position: 'relative' }}>
            <LinearGradient
              colors={['#38BDF8', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.topTabCircle}
            >
              <NotificationTabIcon size={26} />
            </LinearGradient>

            {/* Unread dot or count badge */}
            {unreadNotificationsCount > 0 && (
              <View style={styles.tabRedDot}>
                <Text style={styles.tabRedDotText}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.topTabLabel}><T>Notification</T></Text>
        </TouchableOpacity>
      </View>

      {/* 3. USER CONVERSATIONS LIST (Real App Users Only) */}
      <View style={styles.conversationsContainer}>
        {loadingChats && conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1041/1041916.png' }}
              style={{ width: 68, height: 68, opacity: 0.5, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}><T>No Messages Yet</T></Text>
            <Text style={styles.emptySub}>
              <T>When you or other users send messages, they will appear here.</T>
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.partner?._id || item._id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
            }
            contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const partner = item.partner || {};
              const unread = item.unreadCount || 0;

              return (
                <TouchableOpacity
                  style={styles.chatRow}
                  activeOpacity={0.75}
                  onPress={() => handleOpenChat(partner)}
                >
                  {/* User Profile Avatar with Online Dot */}
                  <View style={styles.avatarWrap}>
                    <Image
                      source={{
                        uri:
                          partner.avatar ||
                          'https://api.dicebear.com/7.x/bottts/png?seed=' +
                            encodeURIComponent(partner.name || 'User'),
                      }}
                      style={styles.avatarImg}
                    />
                    {/* Active green status indicator */}
                    <View style={styles.onlineDot} />
                  </View>

                  {/* Middle Column: User Name & Last Message */}
                  <View style={styles.chatInfoWrap}>
                    <View style={styles.chatNameRow}>
                      <Text style={styles.partnerName} numberOfLines={1}>
                        {partner.name || t('User')}
                      </Text>
                      <Text style={styles.chatTimestamp}>
                        {formatTime(item.lastMessage?.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.lastMessageRow}>
                      <Text style={styles.lastMessageText} numberOfLines={1}>
                        {item.lastMessage?.text || ''}
                      </Text>

                      {/* Unread badge */}
                      {unread > 0 && (
                        <View style={styles.chatUnreadBadge}>
                          <Text style={styles.chatUnreadText}>
                            {unread > 99 ? '99+' : unread}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* 4. 1-ON-1 DIRECT CHAT MODAL */}
      {chatPartner && (
        <DirectChatModal
          visible={chatModalVisible}
          onClose={() => {
            setChatModalVisible(false);
            setChatPartner(null);
            fetchConversations();
            fetchUnreadBadge();
          }}
          partnerUser={chatPartner}
          currentUser={currentUser}
          onMessageSent={() => {
            fetchConversations();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10B981', // Matching user screenshot green
    letterSpacing: -0.3,
  },
  headerTitleSub: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBtn: {
    padding: 4,
  },

  // Top Tabs
  topTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 8,
  },
  topTabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabRedDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabRedDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  // Conversations List
  conversationsContainer: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  chatNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  chatTimestamp: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: 13.5,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  chatUnreadBadge: {
    backgroundColor: '#10B981',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatUnreadText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },

  // Notification Menu View
  notificationMenuWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  notificationMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemTextWrap: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  menuItemSub: {
    fontSize: 12.5,
    color: '#64748B',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadCountBadge: {
    backgroundColor: '#EF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // System Notifications
  scrollList: {
    flex: 1,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 7,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rejectedNotificationCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  resolvedNotificationCard: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  resolvedActionBanner: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resolvedBannerPrompt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  resolvedBannerSub: {
    fontSize: 11,
    color: '#2563EB',
    marginTop: 2,
  },
  dismissBtnPill: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dismissBtnPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  notifCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notifIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  notifSubDetails: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 2,
  },
  notifBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 2,
  },
  rejectedActionBanner: {
    marginTop: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rejectedBannerPrompt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  rejectedBannerSub: {
    fontSize: 11.5,
    color: '#B91C1C',
    marginTop: 2,
  },
  uploadBtnPill: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  uploadBtnPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  pendingActionBanner: {
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 8,
  },
  pendingBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
  },

  // Dispute Modal
  disputeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  disputeModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  disputeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  disputeModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  disputeCloseBtn: {
    padding: 6,
  },
  disputeReasonBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  disputeReasonHeading: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#991B1B',
    marginBottom: 4,
  },
  disputeReasonText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  disputeAmountMeta: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '700',
    marginTop: 6,
  },
  disputeSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 12,
  },
  disputeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disputeOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  disputeOptionDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  disputeActionBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    marginLeft: 10,
  },
  disputeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
