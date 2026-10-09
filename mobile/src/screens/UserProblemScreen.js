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
  Switch,
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

export default function UserProblemScreen({ navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'resolved' | 'all'

  // Resolve Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveTargetItem, setResolveTargetItem] = useState(null);
  const [resolveMessage, setResolveMessage] = useState('Payment proof verified. Issue resolved.');
  const [creditCoinsEnabled, setCreditCoinsEnabled] = useState(false);
  const [creditCoinsAmount, setCreditCoinsAmount] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // Enlarged Proof Modal
  const [enlargedProofVisible, setEnlargedProofVisible] = useState(false);
  const [enlargedProofData, setEnlargedProofData] = useState(null);

  // Fetch problems list
  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/recharge/admin/problems', {
        params: {
          search: searchQuery,
          status: activeTab,
        },
      });
      if (res.data?.success) {
        setProblems(res.data.problems || []);
      }
    } catch (err) {
      console.error('Error fetching user problems:', err);
      showToast(t('Failed to load user problems'), 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab, t, showToast]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Real-time socket updates
  useEffect(() => {
    let socket = null;
    try {
      socket = io(BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('user_problem_submitted', () => {
        fetchProblems();
        showToast(t('New user query submitted!'), 'info');
      });

      socket.on('user_problem_resolved', () => {
        fetchProblems();
      });
    } catch (err) {
      // quiet
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [fetchProblems, showToast, t]);

  // Open resolve modal
  const handleOpenResolveModal = (item) => {
    setResolveTargetItem(item);
    setResolveMessage('Payment proof verified. Dispute resolved successfully.');
    setCreditCoinsEnabled(false);
    setCreditCoinsAmount(String(item.coins || 200));
    setResolveModalVisible(true);
  };

  // Submit resolution
  const handleConfirmResolve = async () => {
    if (!resolveTargetItem) return;
    const finalMsg = resolveMessage.trim();
    if (!finalMsg) {
      showToast(t('Please enter a resolution message'), 'error');
      return;
    }

    const coinsToCredit = creditCoinsEnabled ? parseInt(creditCoinsAmount, 10) || 0 : 0;

    try {
      setSubmittingResolve(true);
      const res = await api.post(`/recharge/admin/${resolveTargetItem._id}/resolve-problem`, {
        message: finalMsg,
        coins: coinsToCredit,
        remarks: creditCoinsEnabled ? 'Dispute resolved & coins credited' : '',
      });

      if (res.data?.success) {
        showToast(t('Dispute marked as resolved successfully'), 'success');
        setResolveModalVisible(false);
        setResolveTargetItem(null);
        fetchProblems();
      } else {
        showToast(t(res.data?.message || 'Failed to resolve problem'), 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to resolve';
      showToast(t(msg), 'error');
    } finally {
      setSubmittingResolve(false);
    }
  };

  const activeProblemCount = problems.filter((p) => p.status === 'problem').length;

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
            <T>User Problems</T>
          </Text>
          {activeProblemCount > 0 && (
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{activeProblemCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={fetchProblems}
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
            placeholder={t('Search by user, ID, reason, or rejection note...')}
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
          { key: 'problem', label: 'Active Problems', count: activeProblemCount },
          { key: 'resolved', label: 'Resolved' },
          { key: 'all', label: 'All' },
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

      {/* ══ LIST / TABLE ══ */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>
            <T>Loading user problems...</T>
          </Text>
        </View>
      ) : problems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🛡️</Text>
          <Text style={styles.emptyTitle}>
            <T>No User Problems Found</T>
          </Text>
          <Text style={styles.emptySub}>
            <T>When users submit a query for rejected recharges, they will appear here.</T>
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.tableScroll}
          contentContainerStyle={[styles.tableContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Horizontal scrollable table */}
          <View style={styles.scrollHintWrap}>
            <Text style={styles.scrollHintText}>
              <T>Swipe horizontally to view full dispute details</T> ➔
            </Text>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            <View style={styles.tableContainerInner}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colUser]}>
                  <T>User</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colId]}>
                  <T>User ID</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colAmount]}>
                  <T>Amount</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colQuery]}>
                  <T>User Query / Reason</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colPrevReject]}>
                  <T>Rejection Note</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colProof, { textAlign: 'center' }]}>
                  <T>Proof</T>
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colAction, { textAlign: 'center' }]}>
                  <T>Action</T>
                </Text>
              </View>

              {/* Table Rows */}
              {problems.map((item) => {
                const shortId = item.user?._id
                  ? item.user._id.toString().slice(-8)
                  : '10001';
                const isResolved = item.status === 'resolved';

                return (
                  <View key={item._id} style={styles.tableDataRow}>
                    {/* User */}
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

                    {/* ID */}
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

                    {/* Amount */}
                    <View style={[styles.tableCellWrap, styles.colAmount]}>
                      <Text style={styles.amountText}>₹{item.amount}</Text>
                      <Text style={styles.coinsSubText}>{item.coins} Coins</Text>
                    </View>

                    {/* User Query / Reason */}
                    <View style={[styles.tableCellWrap, styles.colQuery]}>
                      <View style={styles.reasonCardBox}>
                        <Text style={styles.reasonCardText} numberOfLines={3}>
                          "{item.disputeReason || 'No reason provided'}"
                        </Text>
                      </View>
                    </View>

                    {/* Previous Rejection */}
                    <View style={[styles.tableCellWrap, styles.colPrevReject]}>
                      <View style={styles.rejectionNoticeBox}>
                        <Text style={styles.rejectionNoticeText} numberOfLines={2}>
                          {item.rejectionReason || item.adminNote || 'Payment verification failed'}
                        </Text>
                      </View>
                    </View>

                    {/* Payment Proof */}
                    <View style={[styles.tableCellWrap, styles.colProof, { alignItems: 'center' }]}>
                      {item.disputeProofImage || item.paymentProofImage ? (
                        <TouchableOpacity
                          style={styles.proofThumbTouch}
                          activeOpacity={0.8}
                          onPress={() => {
                            setEnlargedProofData({
                              item,
                              proofImage: item.disputeProofImage || item.paymentProofImage,
                              userName: item.user?.name,
                              userId: shortId,
                              reason: item.disputeReason,
                              amount: item.amount,
                              coins: item.coins,
                            });
                            setEnlargedProofVisible(true);
                          }}
                        >
                          <Image
                            source={{ uri: item.disputeProofImage || item.paymentProofImage }}
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

                    {/* Action */}
                    <View style={[styles.tableCellWrap, styles.colAction, { alignItems: 'center' }]}>
                      {isResolved ? (
                        <View style={styles.resolvedBadgeWrap}>
                          <View style={styles.resolvedBadge}>
                            <Text style={styles.resolvedBadgeText}>✓ Resolved</Text>
                          </View>
                          {item.resolveMessage ? (
                            <Text style={styles.resolvedSubMessage} numberOfLines={2}>
                              {item.resolveMessage}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.resolveBtn}
                          activeOpacity={0.8}
                          onPress={() => handleOpenResolveModal(item)}
                        >
                          <Text style={styles.resolveBtnText}>
                            ✓ <T>Resolve</T>
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* ══ RESOLVE MODAL (With Message & Optional Coin Credit) ══ */}
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

          <View style={styles.resolveModalCard}>
            <View style={styles.resolveModalHeader}>
              <Text style={styles.resolveModalTitle}>
                ✓ <T>Resolve User Dispute</T>
              </Text>
              <TouchableOpacity
                onPress={() => setResolveModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Target Order Summary */}
            {resolveTargetItem && (
              <View style={styles.targetSummaryBox}>
                <Text style={styles.targetUserName}>
                  {resolveTargetItem.user?.name || 'User'} (#{resolveTargetItem.user?._id?.toString().slice(-8) || ''})
                </Text>
                <Text style={styles.targetOrderMeta}>
                  ₹{resolveTargetItem.amount} ({resolveTargetItem.coins} Coins) • {resolveTargetItem.paymentMethod}
                </Text>
                {resolveTargetItem.disputeReason ? (
                  <Text style={styles.targetUserQuery}>
                    💬 User Query: "{resolveTargetItem.disputeReason}"
                  </Text>
                ) : null}
              </View>
            )}

            {/* Quick Resolution Suggestions */}
            <Text style={styles.quickSelectLabel}>
              <T>Quick Select Resolution Message:</T>
            </Text>
            <View style={styles.quickChipsWrap}>
              {[
                'Payment verified! Coins credited to your wallet.',
                'Payment proof verified. Issue resolved.',
                'Dispute resolved. Thank you for your patience.',
              ].map((msgStr) => (
                <TouchableOpacity
                  key={msgStr}
                  style={[
                    styles.quickChip,
                    resolveMessage === msgStr && styles.quickChipActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setResolveMessage(msgStr)}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      resolveMessage === msgStr && styles.quickChipTextActive,
                    ]}
                  >
                    <T>{msgStr}</T>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resolution Message Input */}
            <Text style={styles.fieldLabel}>
              <T>Resolution Message for User:</T>
            </Text>
            <TextInput
              style={styles.messageTextInput}
              placeholder={t('Enter resolution message for user...')}
              placeholderTextColor="#64748B"
              value={resolveMessage}
              onChangeText={setResolveMessage}
              multiline={true}
              numberOfLines={3}
              maxLength={250}
            />

            {/* Toggle: Also Credit Coins? */}
            <View style={styles.coinToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.coinToggleLabel}>
                  💰 <T>Credit Coins to User Wallet?</T>
                </Text>
                <Text style={styles.coinToggleSub}>
                  <T>Turn on if the user payment was verified and genuine</T>
                </Text>
              </View>
              <Switch
                value={creditCoinsEnabled}
                onValueChange={setCreditCoinsEnabled}
                trackColor={{ false: '#334155', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {creditCoinsEnabled && (
              <View style={styles.coinsInputBox}>
                <Text style={styles.fieldLabel}>
                  <T>Coins to credit:</T>
                </Text>
                <TextInput
                  style={styles.coinsTextInput}
                  keyboardType="numeric"
                  value={creditCoinsAmount}
                  onChangeText={setCreditCoinsAmount}
                  placeholder={t('Enter coins...')}
                  placeholderTextColor="#64748B"
                />
              </View>
            )}

            {/* Actions: Cancel & Submit */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.8}
                onPress={() => setResolveModalVisible(false)}
                disabled={submittingResolve}
              >
                <Text style={styles.cancelBtnText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmResolveBtn}
                activeOpacity={0.85}
                onPress={handleConfirmResolve}
                disabled={submittingResolve}
              >
                {submittingResolve ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmResolveBtnText}>
                    <T>Submit Resolution</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ ENLARGED PROOF MODAL ══ */}
      <Modal
        visible={enlargedProofVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEnlargedProofVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setEnlargedProofVisible(false)}
          />

          <View style={styles.proofCardModal}>
            <View style={styles.proofCardHeader}>
              <Text style={styles.proofCardTitle}>
                🧾 <T>Dispute Payment Proof</T>
              </Text>
              <TouchableOpacity
                onPress={() => setEnlargedProofVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.proofMetaText}>
              {enlargedProofData?.userName} (#{enlargedProofData?.userId}) • ₹{enlargedProofData?.amount} ({enlargedProofData?.coins} Coins)
            </Text>
            {enlargedProofData?.reason ? (
              <Text style={styles.proofReasonCallout}>
                Query: "{enlargedProofData.reason}"
              </Text>
            ) : null}

            {enlargedProofData?.proofImage && (
              <View style={styles.bigProofImgBox}>
                <Image
                  source={{ uri: enlargedProofData.proofImage }}
                  style={styles.bigProofImg}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={styles.proofActionsRow}>
              <TouchableOpacity
                style={styles.proofResolveActionBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const target = enlargedProofData?.item;
                  setEnlargedProofVisible(false);
                  if (target) {
                    handleOpenResolveModal(target);
                  }
                }}
              >
                <Text style={styles.proofResolveActionBtnText}>
                  ✓ <T>Resolve Dispute</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proofCloseBtn}
                activeOpacity={0.85}
                onPress={() => setEnlargedProofVisible(false)}
              >
                <Text style={styles.proofCloseBtnText}>
                  <T>Close</T>
                </Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  badgePill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A28',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2D2D42',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1A1A28',
    borderWidth: 1,
    borderColor: '#2D2D42',
  },
  filterTabPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  tableScroll: {
    flex: 1,
  },
  tableContent: {
    paddingHorizontal: 16,
  },
  scrollHintWrap: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  scrollHintText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '600',
  },
  horizontalScrollContent: {
    minWidth: SCREEN_WIDTH - 32,
  },
  tableContainerInner: {
    backgroundColor: '#161622',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262638',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2D',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D42',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  colUser: {
    width: 150,
  },
  colId: {
    width: 85,
  },
  colAmount: {
    width: 90,
  },
  colQuery: {
    width: 200,
  },
  colPrevReject: {
    width: 160,
  },
  colProof: {
    width: 80,
  },
  colAction: {
    width: 130,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F30',
  },
  tableCellWrap: {
    justifyContent: 'center',
  },
  userCellTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  userInfoWrap: {
    marginLeft: 8,
    flex: 1,
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  levelsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  wealthLevelTag: {
    fontSize: 9,
    color: '#FBBF24',
    backgroundColor: '#2D2311',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  charmLevelTag: {
    fontSize: 9,
    color: '#EC4899',
    backgroundColor: '#301826',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  userIdBadge: {
    backgroundColor: '#262638',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  userIdText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  amountText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  coinsSubText: {
    color: '#94A3B8',
    fontSize: 10,
  },
  reasonCardBox: {
    backgroundColor: '#23203A',
    borderRadius: 8,
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#818CF8',
    marginRight: 8,
  },
  reasonCardText: {
    color: '#E0E7FF',
    fontSize: 11,
    lineHeight: 15,
  },
  rejectionNoticeBox: {
    backgroundColor: '#2B1B20',
    borderRadius: 8,
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F87171',
    marginRight: 8,
  },
  rejectionNoticeText: {
    color: '#FCA5A5',
    fontSize: 11,
    lineHeight: 14,
  },
  proofThumbTouch: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E2D',
  },
  proofThumbImg: {
    width: '100%',
    height: '100%',
  },
  proofEyeBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 1,
    alignItems: 'center',
  },
  proofEyeBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  noProofText: {
    color: '#64748B',
    fontSize: 12,
  },
  resolveBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  resolvedBadgeWrap: {
    alignItems: 'center',
  },
  resolvedBadge: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resolvedBadgeText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  resolvedSubMessage: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  resolveModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#383852',
  },
  resolveModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resolveModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseX: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  targetSummaryBox: {
    backgroundColor: '#141420',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  targetUserName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  targetOrderMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  targetUserQuery: {
    color: '#A5B4FC',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  quickSelectLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  quickChip: {
    backgroundColor: '#262638',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#3A3A52',
  },
  quickChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  quickChipText: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  messageTextInput: {
    backgroundColor: '#141420',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2E2E44',
    textAlignVertical: 'top',
    height: 70,
    marginBottom: 12,
  },
  coinToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161626',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  coinToggleLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  coinToggleSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  coinsInputBox: {
    marginBottom: 12,
  },
  coinsTextInput: {
    backgroundColor: '#141420',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2E2E44',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2B2B3D',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmResolveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6366F1',
  },
  confirmResolveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  proofCardModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#383852',
  },
  proofCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proofCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  proofMetaText: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 4,
  },
  proofReasonCallout: {
    color: '#FBBF24',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  bigProofImgBox: {
    width: '100%',
    height: 320,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F0F1A',
    marginBottom: 14,
  },
  bigProofImg: {
    width: '100%',
    height: '100%',
  },
  proofActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  proofResolveActionBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  proofResolveActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  proofCloseBtn: {
    backgroundColor: '#2E2E44',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  proofCloseBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
