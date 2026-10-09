import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import io from 'socket.io-client';
import api, { BASE_URL } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOLD_COIN_IMG = require('../../assets/icons/gold_coin.png');

const COIN_PACKAGES = [
  { id: 'p1', coins: 200, price: '₹22.20' },
  { id: 'p2', coins: 1000, price: '₹111.00' },
  { id: 'p3', coins: 5000, price: '₹571.00' },
  { id: 'p4', coins: 14000, price: '₹1,576.00' },
  { id: 'p5', coins: 40000, price: '₹4,559.00' },
  { id: 'p6', coins: 160000, price: '₹18,279.00' },
];

// Back Arrow SVG
const BackArrowIcon = ({ size = 24, color = '#FFFFFF' }) => (
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

// Refresh SVG
const RefreshIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 12A8 8 0 0 1 7.2 18.2L4 15M4 12A8 8 0 0 1 16.8 5.8L20 9"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 4V9H15M4 20V15H9"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Search SVG
const SearchIcon = ({ size = 18, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
    <Path d="M20 20L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default function ConfirmMoneyScreen({ navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Processing action state
  const [processingId, setProcessingId] = useState(null);

  // Reject Reason Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetItem, setRejectTargetItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Resolve Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveTargetItem, setResolveTargetItem] = useState(null);
  const [resolveMessage, setResolveMessage] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // Enlarged QR Modal
  const [enlargedQrModalVisible, setEnlargedQrModalVisible] = useState(false);
  const [enlargedQrData, setEnlargedQrData] = useState(null);

  // Enlarged Payment Proof Modal State
  const [enlargedProofModalVisible, setEnlargedProofModalVisible] = useState(false);
  const [enlargedProofData, setEnlargedProofData] = useState(null);

  // Approve Modal State (Select Coin Card & Remarks)
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveTargetItem, setApproveTargetItem] = useState(null);
  const [selectedCoins, setSelectedCoins] = useState(200);
  const [customCoinsInput, setCustomCoinsInput] = useState('');
  const [approveRemarks, setApproveRemarks] = useState('Payment verified & coins added');
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Fetch recharge requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/recharge/admin/list', {
        params: {
          search: searchQuery,
          status: activeTab === 'all' ? undefined : activeTab,
        },
      });
      if (res.data?.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching recharge requests:', err);
      showToast(t('Failed to load recharge list'), 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab, t, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Live Socket Listener for Instant Updates
  useEffect(() => {
    let socket = null;
    try {
      socket = io(BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('recharge_proof_uploaded', () => {
        fetchRequests();
        showToast(t('New payment proof submitted by user!'), 'info');
      });

      socket.on('recharge_status_updated', () => {
        fetchRequests();
      });
    } catch (err) {
      // quiet
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [fetchRequests, showToast, t]);

  // Open Approve Modal
  const handleOpenApproveModal = (item) => {
    setApproveTargetItem(item);
    const initialCoins = item.coins || 200;
    setSelectedCoins(initialCoins);
    setCustomCoinsInput('');
    setApproveRemarks('Payment verified & coins credited successfully');
    setApproveModalVisible(true);
  };

  // Submit Approval with Selected Coins & Remarks
  const handleConfirmApprove = async () => {
    if (!approveTargetItem) return;
    const coinsToCredit = customCoinsInput && parseInt(customCoinsInput, 10) > 0
      ? parseInt(customCoinsInput, 10)
      : selectedCoins;

    if (!coinsToCredit || coinsToCredit <= 0) {
      showToast(t('Please select or enter coins to credit'), 'error');
      return;
    }

    try {
      setSubmittingApprove(true);
      const res = await api.post(`/recharge/admin/${approveTargetItem._id}/approve`, {
        coins: coinsToCredit,
        remarks: approveRemarks.trim() || 'Payment approved & coins added',
      });

      if (res.data?.success) {
        showToast(
          t('Recharge approved! Added') + ` ${coinsToCredit} ` + t('coins to user.'),
          'success'
        );
        setApproveModalVisible(false);
        setApproveTargetItem(null);
        fetchRequests();
      } else {
        showToast(t(res.data?.message || 'Approval failed'), 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Approval failed';
      showToast(t(msg), 'error');
    } finally {
      setSubmittingApprove(false);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (item) => {
    setRejectTargetItem(item);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // Submit Rejection with Reason
  const handleConfirmReject = async () => {
    if (!rejectTargetItem) return;
    const finalReason = rejectReason.trim();
    if (!finalReason) {
      showToast(t('Please enter a rejection reason'), 'error');
      return;
    }
    try {
      setSubmittingReject(true);
      const res = await api.post(`/recharge/admin/${rejectTargetItem._id}/reject`, {
        reason: finalReason,
      });
      if (res.data?.success) {
        showToast(t('Recharge request rejected successfully'), 'info');
        setRejectModalVisible(false);
        setRejectTargetItem(null);
        setRejectReason('');
        fetchRequests();
      } else {
        showToast(t(res.data?.message || 'Rejection failed'), 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Rejection failed';
      showToast(t(msg), 'error');
    } finally {
      setSubmittingReject(false);
    }
  };

  // Open Resolve Modal
  const handleOpenResolveModal = (item) => {
    setResolveTargetItem(item);
    setResolveMessage('');
    setResolveModalVisible(true);
  };

  // Submit Resolution with Message
  const handleConfirmResolve = async () => {
    if (!resolveTargetItem) return;
    const finalMsg = resolveMessage.trim();
    if (!finalMsg) {
      showToast(t('Please enter a resolution message'), 'error');
      return;
    }
    try {
      setSubmittingResolve(true);
      const res = await api.post(`/recharge/admin/${resolveTargetItem._id}/resolve`, {
        message: finalMsg,
      });
      if (res.data?.success) {
        showToast(t('Query marked as resolved successfully'), 'success');
        setResolveModalVisible(false);
        setResolveTargetItem(null);
        setResolveMessage('');
        fetchRequests();
      } else {
        showToast(t(res.data?.message || 'Failed to resolve'), 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to resolve';
      showToast(t(msg), 'error');
    } finally {
      setSubmittingResolve(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const proofSubmittedCount = requests.filter((r) => r.status === 'proof_submitted').length;
  const totalNeedsReview = pendingCount + proofSubmittedCount;

  return (
    <View style={styles.container}>
      {/* ══ HEADER ══ */}
      <LinearGradient
        colors={['#1E1E2D', '#141420']}
        style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <BackArrowIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            <T>Confirm Money</T>
          </Text>
          {totalNeedsReview > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{totalNeedsReview}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={fetchRequests}
          activeOpacity={0.75}
          disabled={loading}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <RefreshIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ══ SEARCH BAR ══ */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <SearchIcon size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search by user name, ID, UTR, or payment mode...')}
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ══ FILTER TABS ══ */}
      <View style={styles.filterTabsRow}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending', count: pendingCount },
          { key: 'proof_submitted', label: 'Proof Submitted', count: proofSubmittedCount },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'resolved', label: 'Resolved' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTabPill, isActive && styles.filterTabPillActive]}
              activeOpacity={0.75}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                <T>{tab.label}</T>
                {tab.count !== undefined && tab.count > 0 ? ` (${tab.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ══ TABLE CONTAINER ══ */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>
            <T>Loading transactions...</T>
          </Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>
            <T>No Recharge Records Found</T>
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.tableScroll}
          contentContainerStyle={[styles.tableContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Scroll Hint */}
          <View style={styles.scrollHintWrap}>
            <Text style={styles.scrollHintText}>
              <T>Swipe horizontally to view full table</T> ➔
            </Text>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            <View style={styles.tableContainerInner}>
              {/* Table Header Row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colUser]}>
                  <T>User</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colId]}>
                  <T>ID</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colMode]}>
                  <T>Mode</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colAmount]}>
                  <T>Amount</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colUtr]}>
                  <T>UTR No.</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colProof, { textAlign: 'center' }]}>
                  <T>Proof</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colAction, { textAlign: 'center' }]}>
                  <T>Action</T>
                </Text>
              </View>

              {/* Table Data Rows */}
              {filteredRequests.map((item) => {
                const isProcessing = processingId === item._id;
                const shortId = item.user?._id
                  ? item.user._id.toString().slice(-8)
                  : '10001';

                return (
                  <View key={item._id} style={styles.tableDataRow}>
                    {/* 1. User Avatar, Name & Levels (Click to Open Profile) */}
                    <TouchableOpacity
                      style={[styles.tableCellWrap, styles.colUser, styles.userCellTouch]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (item.user?._id) {
                          navigation?.navigate('UserProfile', { userId: item.user._id });
                        }
                      }}
                    >
                      <Image
                        source={{
                          uri:
                            item.user?.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                        }}
                        style={styles.userAvatarImg}
                        resizeMode="cover"
                      />
                      <View style={styles.userInfoWrap}>
                        <Text style={styles.userNameText} numberOfLines={1}>
                          {item.user?.name || t('User')}
                        </Text>
                        <View style={styles.levelsRow}>
                          <Text style={styles.wealthLevelTag}>
                            💰 Lv.{item.user?.wealthLevel || 1}
                          </Text>
                          <Text style={styles.charmLevelTag}>
                            ✨ Lv.{item.user?.charmLevel || 1}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* 2. User ID (Click to Open Profile) */}
                    <TouchableOpacity
                      style={[styles.tableCellWrap, styles.colId]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (item.user?._id) {
                          navigation?.navigate('UserProfile', { userId: item.user._id });
                        }
                      }}
                    >
                      <View style={styles.userIdBadge}>
                        <Text style={styles.userIdText} numberOfLines={1}>
                          #{shortId}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* 3. Mode of Payment */}
                    <View style={[styles.tableCellWrap, styles.colMode]}>
                      <View style={styles.paymentModeBadge}>
                        <Text style={styles.paymentModeText} numberOfLines={1}>
                          {item.paymentMethod || 'UPI'}
                        </Text>
                      </View>
                    </View>

                    {/* 4. Amount */}
                    <View style={[styles.tableCellWrap, styles.colAmount]}>
                      <Text style={styles.amountText}>₹{item.amount}</Text>
                      <Text style={styles.coinsSubText}>{item.coins} Coins</Text>
                    </View>

                    {/* 5. UTR Number (12-Digit Reference) */}
                    <View style={[styles.tableCellWrap, styles.colUtr]}>
                      {item.utrNumber ? (
                        <View style={styles.utrBadgeWrap}>
                          <Text style={styles.utrBadgeText} numberOfLines={1} selectable={true}>
                            {item.utrNumber}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.noUtrText}>-</Text>
                      )}
                    </View>

                    {/* 6. Payment Proof Column (Click to Enlarge and Verify) */}
                    <View style={[styles.tableCellWrap, styles.colProof, { alignItems: 'center' }]}>
                      {item.paymentProofImage ? (
                        <TouchableOpacity
                          style={styles.proofThumbTouch}
                          activeOpacity={0.8}
                          onPress={() => {
                            setEnlargedProofData({
                              item,
                              proofImage: item.paymentProofImage,
                              userName: item.user?.name,
                              userId: shortId,
                              amount: item.amount,
                              coins: item.coins,
                              paymentMethod: item.paymentMethod,
                              utrNumber: item.utrNumber,
                              status: item.status,
                              rejectionReason: item.rejectionReason,
                            });
                            setEnlargedProofModalVisible(true);
                          }}
                        >
                          <Image
                            source={{ uri: item.paymentProofImage }}
                            style={styles.proofThumbImg}
                            resizeMode="cover"
                          />
                          <View style={styles.proofEyeBadge}>
                            <Text style={styles.proofEyeBadgeText}>👁️ <T>View</T></Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.noProofText}>-</Text>
                      )}
                    </View>

                    {/* 7. Actions / Status / Refund QR */}
                    <View style={[styles.tableCellWrap, styles.colAction, { alignItems: 'center' }]}>
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#10B981" />
                      ) : item.status === 'pending' || item.status === 'proof_submitted' ? (
                        <View style={styles.actionCellContainer}>
                          {item.status === 'proof_submitted' && (
                            <View style={styles.proofSubmittedBadge}>
                              <Text style={styles.proofSubmittedBadgeText}>⚠️ <T>Proof Review</T></Text>
                            </View>
                          )}
                          <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                              style={styles.confirmBtn}
                              activeOpacity={0.8}
                              onPress={() => handleOpenApproveModal(item)}
                            >
                              <Text style={styles.confirmBtnText}>
                                <T>Confirm</T>
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.rejectBtn}
                              activeOpacity={0.8}
                              onPress={() => handleOpenRejectModal(item)}
                            >
                              <Text style={styles.rejectBtnText}>
                                <T>Reject</T>
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : item.status === 'approved' ? (
                        <View style={styles.approvedBadge}>
                          <Text style={styles.approvedBadgeText}>✓ Approved</Text>
                        </View>
                      ) : item.status === 'resolved' ? (
                        <View style={styles.resolvedBox}>
                          <View style={styles.resolvedBadge}>
                            <Text style={styles.resolvedBadgeText}>✓ Resolved</Text>
                          </View>
                          {item.resolveMessage ? (
                            <View style={styles.resolvedMsgBox}>
                              <Text style={styles.resolvedMsgText} numberOfLines={2}>
                                {item.resolveMessage}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        <View style={styles.rejectedBox}>
                          <View style={styles.rejectedBadgeRow}>
                            <View style={styles.rejectedBadge}>
                              <Text style={styles.rejectedBadgeText}>✗ Rejected</Text>
                            </View>
                          </View>

                          {/* Rejection Reason Display */}
                          {(item.rejectionReason || item.adminNote) ? (
                            <View style={styles.rejectionReasonBadge}>
                              <Text style={styles.rejectionReasonLabel}>
                                <T>Reason:</T>
                              </Text>
                              <Text style={styles.rejectionReasonText} numberOfLines={2}>
                                {item.rejectionReason || item.adminNote}
                              </Text>
                            </View>
                          ) : null}

                          {/* Refund QR Code Image Thumbnail */}
                          {item.refundQrImage ? (
                            <TouchableOpacity
                              style={styles.qrThumbWrap}
                              activeOpacity={0.8}
                              onPress={() => {
                                setEnlargedQrData({
                                  qrImage: item.refundQrImage,
                                  userName: item.user?.name,
                                  amount: item.amount,
                                  userId: shortId,
                                });
                                setEnlargedQrModalVisible(true);
                              }}
                            >
                              <Image
                                source={{ uri: item.refundQrImage }}
                                style={styles.qrThumbImg}
                                resizeMode="cover"
                              />
                              <Text style={styles.tapToEnlargeText}>
                                <T>Tap to enlarge</T>
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.waitingQrText}>
                              <T>Waiting for refund QR</T>
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* ══ REJECT REASON MODAL (Input Textfield for Owner) ══ */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setRejectModalVisible(false)}
          />

          <View style={styles.rejectModalCard}>
            <View style={styles.rejectModalHeader}>
              <Text style={styles.rejectModalTitle}>
                <T>Reject Recharge Request</T>
              </Text>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Target order summary */}
            {rejectTargetItem && (
              <View style={styles.rejectTargetSummary}>
                <Text style={styles.rejectTargetName}>
                  {rejectTargetItem.user?.name || 'User'} (#{rejectTargetItem.user?._id?.toString().slice(-8) || ''})
                </Text>
                <Text style={styles.rejectTargetDetails}>
                  Amount: ₹{rejectTargetItem.amount} ({rejectTargetItem.coins} Coins) • {rejectTargetItem.paymentMethod}
                  {rejectTargetItem.utrNumber ? ` • UTR: ${rejectTargetItem.utrNumber}` : ''}
                </Text>
              </View>
            )}

            {/* Quick Reason Suggestions */}
            <Text style={styles.quickReasonsLabel}>
              <T>Quick Select Reason:</T>
            </Text>
            <View style={styles.quickReasonsRow}>
              {[
                'Payment not received',
                'Incorrect amount transferred',
                'UTR / Reference mismatch',
                'Fake transaction proof',
              ].map((reasonStr) => (
                <TouchableOpacity
                  key={reasonStr}
                  style={[
                    styles.quickReasonChip,
                    rejectReason === reasonStr && styles.quickReasonChipActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setRejectReason(reasonStr)}
                >
                  <Text
                    style={[
                      styles.quickReasonChipText,
                      rejectReason === reasonStr && styles.quickReasonChipTextActive,
                    ]}
                  >
                    <T>{reasonStr}</T>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rejection Reason Textfield */}
            <Text style={styles.inputFieldLabel}>
              <T>Enter Rejection Reason for User:</T>
            </Text>
            <TextInput
              style={styles.rejectTextInput}
              placeholder={t('Enter rejection reason...')}
              placeholderTextColor="#64748B"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline={true}
              numberOfLines={3}
              maxLength={200}
            />

            {/* Actions: Cancel & Submit */}
            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={styles.cancelRejectBtn}
                activeOpacity={0.8}
                onPress={() => setRejectModalVisible(false)}
                disabled={submittingReject}
              >
                <Text style={styles.cancelRejectBtnText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmRejectBtn}
                activeOpacity={0.85}
                onPress={handleConfirmReject}
                disabled={submittingReject}
              >
                {submittingReject ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRejectBtnText}>
                    <T>Confirm Rejection</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ RESOLVE MODAL (Input Textfield for Owner) ══ */}
      <Modal
        visible={resolveModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setResolveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setResolveModalVisible(false)}
          />

          <View style={styles.rejectModalCard}>
            <View style={styles.rejectModalHeader}>
              <Text style={styles.rejectModalTitle}>
                ✓ <T>Resolve Recharge Dispute</T>
              </Text>
              <TouchableOpacity
                onPress={() => setResolveModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Target order summary */}
            {resolveTargetItem && (
              <View style={styles.rejectTargetSummary}>
                <Text style={styles.rejectTargetName}>
                  {resolveTargetItem.user?.name || 'User'} (#{resolveTargetItem.user?._id?.toString().slice(-8) || ''})
                </Text>
                <Text style={styles.rejectTargetDetails}>
                  Amount: ₹{resolveTargetItem.amount} ({resolveTargetItem.coins} Coins) • {resolveTargetItem.paymentMethod}
                  {resolveTargetItem.utrNumber ? ` • UTR: ${resolveTargetItem.utrNumber}` : ''}
                </Text>
                {resolveTargetItem.rejectionReason && (
                  <Text style={[styles.rejectTargetDetails, { color: '#F87171', marginTop: 2 }]}>
                    Previous Rejection: {resolveTargetItem.rejectionReason}
                  </Text>
                )}
              </View>
            )}

            {/* Quick Resolution Suggestions */}
            <Text style={styles.quickReasonsLabel}>
              <T>Quick Select Resolution Message:</T>
            </Text>
            <View style={styles.quickReasonsRow}>
              {[
                'Refund processed to your QR code successfully.',
                'Payment verified! Coins credited to your wallet.',
                'Payment proof verified. Issue resolved.',
                'Dispute resolved. Thank you for your cooperation.',
              ].map((msgStr) => (
                <TouchableOpacity
                  key={msgStr}
                  style={[
                    styles.quickReasonChip,
                    resolveMessage === msgStr && styles.quickReasonChipActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setResolveMessage(msgStr)}
                >
                  <Text
                    style={[
                      styles.quickReasonChipText,
                      resolveMessage === msgStr && styles.quickReasonChipTextActive,
                    ]}
                  >
                    <T>{msgStr}</T>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resolution Message Textfield */}
            <Text style={styles.inputFieldLabel}>
              <T>Enter Resolution Message for User:</T>
            </Text>
            <TextInput
              style={styles.rejectTextInput}
              placeholder={t('Enter resolution message for user...')}
              placeholderTextColor="#64748B"
              value={resolveMessage}
              onChangeText={setResolveMessage}
              multiline={true}
              numberOfLines={3}
              maxLength={250}
            />

            {/* Actions: Cancel & Submit */}
            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={styles.cancelRejectBtn}
                activeOpacity={0.8}
                onPress={() => setResolveModalVisible(false)}
                disabled={submittingResolve}
              >
                <Text style={styles.cancelRejectBtnText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmRejectBtn, { backgroundColor: '#3B82F6' }]}
                activeOpacity={0.85}
                onPress={handleConfirmResolve}
                disabled={submittingResolve}
              >
                {submittingResolve ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRejectBtnText}>
                    <T>Submit Resolution</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ ENLARGED REFUND QR MODAL ══ */}
      <Modal
        visible={enlargedQrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEnlargedQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setEnlargedQrModalVisible(false)}
          />

          <View style={styles.qrCardModal}>
            <View style={styles.qrCardHeader}>
              <Text style={styles.qrCardTitle}>
                <T>Refund QR Code</T>
              </Text>
              <TouchableOpacity
                onPress={() => setEnlargedQrModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.qrCardUserSub}>
              {enlargedQrData?.userName} (ID: {enlargedQrData?.userId})
            </Text>
            <Text style={styles.qrCardAmountSub}>
              Refund Amount: ₹{enlargedQrData?.amount}
            </Text>

            {/* Big QR Image for Easy Scanning */}
            {enlargedQrData?.qrImage && (
              <View style={styles.bigQrImgBox}>
                <Image
                  source={{ uri: enlargedQrData.qrImage }}
                  style={styles.bigQrImg}
                  resizeMode="contain"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.closeQrBtn}
              activeOpacity={0.85}
              onPress={() => setEnlargedQrModalVisible(false)}
            >
              <Text style={styles.closeQrBtnText}>
                <T>Close</T>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ ENLARGED PAYMENT PROOF MODAL (With Review, Approve & Reject) ══ */}
      <Modal
        visible={enlargedProofModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEnlargedProofModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setEnlargedProofModalVisible(false)}
          />

          <View style={styles.proofCardModal}>
            <View style={styles.proofCardHeader}>
              <Text style={styles.proofCardTitle}>
                🧾 <T>Payment Proof Verification</T>
              </Text>
              <TouchableOpacity
                onPress={() => setEnlargedProofModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Summary Details */}
            <View style={styles.proofSummaryBox}>
              <View style={styles.proofSummaryRow}>
                <Text style={styles.proofSummaryUser}>
                  {enlargedProofData?.userName} (#{enlargedProofData?.userId})
                </Text>
                <Text style={styles.proofSummaryAmount}>
                  ₹{enlargedProofData?.amount} ({enlargedProofData?.coins} Coins)
                </Text>
              </View>
              <View style={styles.proofSummaryRow}>
                <Text style={styles.proofSummarySub}>
                  Mode: {enlargedProofData?.paymentMethod}
                </Text>
                {enlargedProofData?.utrNumber ? (
                  <Text style={styles.proofSummaryUtr}>
                    UTR: {enlargedProofData.utrNumber}
                  </Text>
                ) : null}
              </View>
              {enlargedProofData?.rejectionReason ? (
                <View style={styles.proofReasonNotice}>
                  <Text style={styles.proofReasonNoticeText}>
                    ⚠️ <T>Previous Rejection Reason:</T> {enlargedProofData.rejectionReason}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Big Proof Image for Easy Inspection */}
            {enlargedProofData?.proofImage && (
              <View style={styles.bigProofImgBox}>
                <Image
                  source={{ uri: enlargedProofData.proofImage }}
                  style={styles.bigProofImg}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Approve, Reject, and Close Action Buttons */}
            <View style={styles.proofModalActions}>
              <TouchableOpacity
                style={styles.proofApproveBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const target = enlargedProofData?.item;
                  setEnlargedProofModalVisible(false);
                  if (target) {
                    handleOpenApproveModal(target);
                  }
                }}
              >
                <Text style={styles.proofApproveBtnText}>
                  ✓ <T>Approve & Credit Coins</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proofRejectBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const target = enlargedProofData?.item;
                  setEnlargedProofModalVisible(false);
                  if (target) {
                    handleOpenRejectModal(target);
                  }
                }}
              >
                <Text style={styles.proofRejectBtnText}>
                  ✕ <T>Reject</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proofCloseBtn}
                activeOpacity={0.85}
                onPress={() => setEnlargedProofModalVisible(false)}
              >
                <Text style={styles.proofCloseBtnText}>
                  <T>Close</T>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ APPROVE RECHARGE MODAL (Select Coins Card & Enter Remarks) ══ */}
      <Modal
        visible={approveModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setApproveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setApproveModalVisible(false)}
          />

          <View style={styles.approveModalCard}>
            {/* Modal Header */}
            <View style={styles.approveModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>💰</Text>
                <Text style={styles.approveModalTitle}>
                  <T>Approve & Credit Coins</T>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setApproveModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.approveModalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {/* Target Order Summary */}
              {approveTargetItem && (
                <View style={styles.approveTargetCard}>
                  <View style={styles.approveTargetUserRow}>
                    <Image
                      source={{
                        uri:
                          approveTargetItem.user?.avatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                      }}
                      style={styles.approveTargetAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.approveTargetName} numberOfLines={1}>
                        {approveTargetItem.user?.name || 'User'}
                      </Text>
                      <Text style={styles.approveTargetSub}>
                        ID: #{approveTargetItem.user?._id?.toString().slice(-8) || ''} • {approveTargetItem.paymentMethod || 'UPI'}
                      </Text>
                    </View>
                    <View style={styles.approveTargetAmountBadge}>
                      <Text style={styles.approveTargetAmountText}>
                        ₹{approveTargetItem.amount}
                      </Text>
                    </View>
                  </View>

                  {/* Payment Proof Mini-Preview */}
                  {approveTargetItem.paymentProofImage ? (
                    <TouchableOpacity
                      style={styles.approveProofThumbnailWrap}
                      activeOpacity={0.85}
                      onPress={() => {
                        setEnlargedProofData({
                          item: approveTargetItem,
                          proofImage: approveTargetItem.paymentProofImage,
                          userName: approveTargetItem.user?.name,
                          userId: approveTargetItem.user?._id?.toString().slice(-8),
                          amount: approveTargetItem.amount,
                          coins: approveTargetItem.coins,
                          paymentMethod: approveTargetItem.paymentMethod,
                          utrNumber: approveTargetItem.utrNumber,
                          status: approveTargetItem.status,
                          rejectionReason: approveTargetItem.rejectionReason,
                        });
                        setEnlargedProofModalVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: approveTargetItem.paymentProofImage }}
                        style={styles.approveProofThumbnailImg}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.approveProofLabel}>
                          🧾 <T>Payment Receipt Attached</T>
                        </Text>
                        <Text style={styles.approveProofSub}>
                          <T>Tap to view full receipt</T> 👁️
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {/* 1. Coin Cards Grid */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.coinsSectionTitle}>
                  <T>Select Coins Package to Credit:</T>
                </Text>
                <Text style={styles.selectedCoinsBadgeText}>
                  +{(customCoinsInput && parseInt(customCoinsInput, 10) > 0 ? parseInt(customCoinsInput, 10) : selectedCoins).toLocaleString()} <T>Coins</T>
                </Text>
              </View>

              <View style={styles.coinsCardsGrid}>
                {COIN_PACKAGES.map((pkg) => {
                  const isSelected = selectedCoins === pkg.coins && !customCoinsInput;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.coinPackageCard,
                        isSelected && styles.coinPackageCardActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedCoins(pkg.coins);
                        setCustomCoinsInput('');
                      }}
                    >
                      <Image
                        source={GOLD_COIN_IMG}
                        style={styles.coinCardImg}
                        resizeMode="contain"
                      />
                      <Text style={[styles.coinCardAmount, isSelected && styles.coinCardAmountActive]}>
                        {pkg.coins.toLocaleString()}
                      </Text>
                      <Text style={styles.coinCardPrice}>
                        {pkg.price}
                      </Text>
                      {isSelected && (
                        <View style={styles.coinSelectedCheck}>
                          <Text style={styles.coinSelectedCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Coins Input (Optional override) */}
              <View style={styles.customCoinsWrap}>
                <Text style={styles.customCoinsLabel}>
                  <T>Or Custom Coins Amount:</T>
                </Text>
                <TextInput
                  style={styles.customCoinsInput}
                  placeholder={t('Enter custom coins...')}
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={customCoinsInput}
                  onChangeText={(val) => setCustomCoinsInput(val.replace(/[^0-9]/g, ''))}
                  maxLength={7}
                />
              </View>

              {/* 2. Remarks Section */}
              <Text style={styles.remarksSectionTitle}>
                <T>Remarks for User (Sent via System Notification):</T>
              </Text>

              {/* Quick Remarks Chips */}
              <View style={styles.quickRemarksRow}>
                {[
                  'Payment verified & coins added',
                  'Receipt verified successfully',
                  'Bonus coins added',
                  'Payment approved by owner',
                ].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={[
                      styles.quickRemarkChip,
                      approveRemarks === chip && styles.quickRemarkChipActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => setApproveRemarks(chip)}
                  >
                    <Text
                      style={[
                        styles.quickRemarkChipText,
                        approveRemarks === chip && styles.quickRemarkChipTextActive,
                      ]}
                    >
                      <T>{chip}</T>
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.approveRemarksInput}
                placeholder={t('Enter remarks for user notification...')}
                placeholderTextColor="#64748B"
                value={approveRemarks}
                onChangeText={setApproveRemarks}
                multiline={true}
                numberOfLines={3}
                maxLength={200}
              />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.approveModalActions}>
              <TouchableOpacity
                style={styles.cancelApproveBtn}
                activeOpacity={0.8}
                onPress={() => setApproveModalVisible(false)}
                disabled={submittingApprove}
              >
                <Text style={styles.cancelApproveBtnText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmApproveBtn}
                activeOpacity={0.85}
                onPress={handleConfirmApprove}
                disabled={submittingApprove}
              >
                {submittingApprove ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmApproveBtnText}>
                    ✓ <T>Approve & Add Coins</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262638',
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // Search
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2D',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  // Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: '#2E2E42',
  },
  filterTabPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // Table
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  tableScroll: {
    flex: 1,
  },
  tableContent: {
    paddingHorizontal: 12,
  },
  scrollHintWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A42',
  },
  scrollHintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  horizontalScrollContent: {
    paddingRight: 12,
  },
  tableContainerInner: {
    minWidth: 990,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2B',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#26263B',
    alignItems: 'center',
  },
  tableHeaderCell: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171726',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#232338',
  },
  tableCellWrap: {
    justifyContent: 'center',
  },

  // Column Widths (Generous sizing to prevent any collapse or overlap)
  colUser: {
    width: 200,
    paddingRight: 12,
  },
  colId: {
    width: 95,
    paddingRight: 10,
  },
  colMode: {
    width: 120,
    paddingRight: 10,
  },
  colAmount: {
    width: 110,
    paddingRight: 10,
  },
  colUtr: {
    width: 145,
    paddingRight: 10,
  },
  colProof: {
    width: 100,
    paddingRight: 10,
  },
  colAction: {
    width: 170,
  },

  // UTR Badge
  utrBadgeWrap: {
    backgroundColor: '#131C30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#203254',
    alignSelf: 'flex-start',
  },
  utrBadgeText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noUtrText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    paddingLeft: 4,
  },

  // User Avatar & Name Column
  userCellTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    backgroundColor: '#2E2E48',
  },
  userInfoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  levelsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  wealthLevelTag: {
    color: '#FBBF24',
    fontSize: 10.5,
    fontWeight: '700',
  },
  charmLevelTag: {
    color: '#EC4899',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // User ID Badge
  userIdBadge: {
    backgroundColor: '#1E1E32',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A44',
    alignSelf: 'flex-start',
  },
  userIdText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },

  // Payment Mode
  paymentModeBadge: {
    backgroundColor: '#27273E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#38385A',
  },
  paymentModeText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Amount
  amountText: {
    color: '#10B981',
    fontSize: 14.5,
    fontWeight: '800',
  },
  coinsSubText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // Actions
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  rejectBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  approvedBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  approvedBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  rejectedBox: {
    alignItems: 'center',
    gap: 4,
  },
  rejectedBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rejectedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resolveActionBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resolveActionBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  resolvedBox: {
    alignItems: 'center',
    gap: 4,
  },
  resolvedBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resolvedBadgeText: {
    color: '#93C5FD',
    fontSize: 10.5,
    fontWeight: '800',
  },
  resolvedMsgBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    maxWidth: 110,
  },
  resolvedMsgText: {
    color: '#93C5FD',
    fontSize: 9,
    textAlign: 'center',
  },
  rejectedBadgeText: {
    color: '#F87171',
    fontSize: 10.5,
    fontWeight: '800',
  },
  qrThumbWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  qrThumbImg: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  tapToEnlargeText: {
    color: '#38BDF8',
    fontSize: 8.5,
    marginTop: 2,
  },
  waitingQrText: {
    color: '#64748B',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },

  // Payment Proof Column & Thumbnail
  proofThumbTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofThumbImg: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#27273E',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  proofEyeBadge: {
    backgroundColor: '#3730A3',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  proofEyeBadgeText: {
    color: '#E0E7FF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  noProofText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  actionCellContainer: {
    alignItems: 'center',
    gap: 4,
  },
  proofSubmittedBadge: {
    backgroundColor: '#78350F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  proofSubmittedBadgeText: {
    color: '#FDE68A',
    fontSize: 8.5,
    fontWeight: '800',
  },

  // Modal Enlarged QR
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  qrCardModal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#33334D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  qrCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseX: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },
  qrCardUserSub: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  qrCardAmountSub: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 16,
  },
  bigQrImgBox: {
    width: 230,
    height: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  bigQrImg: {
    width: 214,
    height: 214,
  },
  closeQrBtn: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeQrBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // ══ MODAL ENLARGED PAYMENT PROOF ══
  proofCardModal: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#383854',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  proofCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  proofCardTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proofSummaryBox: {
    width: '100%',
    backgroundColor: '#151522',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#26263B',
    gap: 4,
  },
  proofSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proofSummaryUser: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  proofSummaryAmount: {
    color: '#10B981',
    fontSize: 13.5,
    fontWeight: '800',
  },
  proofSummarySub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  proofSummaryUtr: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  proofReasonNotice: {
    backgroundColor: '#3B1818',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 2,
  },
  proofReasonNoticeText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '600',
  },
  bigProofImgBox: {
    width: '100%',
    height: 250,
    backgroundColor: '#0F0F1A',
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D42',
  },
  bigProofImg: {
    width: '100%',
    height: '100%',
  },
  proofModalActions: {
    width: '100%',
    gap: 8,
  },
  proofApproveBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  proofApproveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  proofRejectBtn: {
    width: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  proofRejectBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  proofCloseBtn: {
    width: '100%',
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  proofCloseBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },

  // ══ REJECTION REASON BADGE (Table cell) ══
  rejectionReasonBadge: {
    backgroundColor: '#3B1818',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    marginTop: 4,
    maxWidth: 150,
  },
  rejectionReasonLabel: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '800',
  },
  rejectionReasonText: {
    color: '#FECACA',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },

  // ══ REJECT REASON MODAL STYLES ══
  rejectModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#383852',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  rejectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rejectModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#EF4444',
  },
  rejectTargetSummary: {
    backgroundColor: '#27273A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  rejectTargetName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectTargetDetails: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  quickReasonsLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  quickReasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  quickReasonChip: {
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3D3D58',
  },
  quickReasonChipActive: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  quickReasonChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  quickReasonChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputFieldLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  rejectTextInput: {
    backgroundColor: '#141422',
    borderRadius: 10,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#383852',
    minHeight: 65,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  rejectModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelRejectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2D2D42',
  },
  cancelRejectBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmRejectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRejectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Approve Recharge Modal
  approveModalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: '#1E1E2E',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#383852',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
  approveModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  approveModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10B981',
  },
  approveModalScroll: {
    maxHeight: 460,
  },
  approveTargetCard: {
    backgroundColor: '#27273A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3.5,
    borderLeftColor: '#10B981',
  },
  approveTargetUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approveTargetAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3D3D58',
  },
  approveTargetName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  approveTargetSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  approveTargetAmountBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  approveTargetAmountText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '900',
  },
  approveProofThumbnailWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2D',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3D3D58',
  },
  approveProofThumbnailImg: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#2D2D44',
  },
  approveProofLabel: {
    color: '#E0E7FF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  approveProofSub: {
    color: '#38BDF8',
    fontSize: 10.5,
    marginTop: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  coinsSectionTitle: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '800',
  },
  selectedCoinsBadgeText: {
    color: '#F59E0B',
    fontSize: 12.5,
    fontWeight: '900',
  },
  coinsCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  coinPackageCard: {
    width: '31%',
    backgroundColor: '#27273C',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#383852',
    position: 'relative',
  },
  coinPackageCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#2E2838',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  coinCardImg: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  coinCardAmount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  coinCardAmountActive: {
    color: '#FBBF24',
  },
  coinCardPrice: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  coinSelectedCheck: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinSelectedCheckText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  customCoinsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161626',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2D2D44',
    marginBottom: 14,
    gap: 10,
  },
  customCoinsLabel: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  customCoinsInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    padding: 4,
  },
  remarksSectionTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  quickRemarksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  quickRemarkChip: {
    backgroundColor: '#27273C',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D3D58',
  },
  quickRemarkChipActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  quickRemarkChipText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  quickRemarkChipTextActive: {
    color: '#34D399',
    fontWeight: '700',
  },
  approveRemarksInput: {
    backgroundColor: '#141422',
    borderRadius: 10,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#383852',
    minHeight: 55,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  approveModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelApproveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2D2D42',
  },
  cancelApproveBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmApproveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmApproveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
