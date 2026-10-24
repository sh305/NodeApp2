import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenContainer from '../components/ScreenContainer';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';
import { T } from '../components/TranslatedText';
import api from '../api/client';

// SVG Icons
const BackArrowIcon = ({ size = 22, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShieldIcon = ({ size = 24, color = '#6366F1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12L11 14L15 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AlertTriangleIcon = ({ size = 18, color = '#EF4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18A2 2 0 0 0 3.55 21H20.45A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 9V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="17" r="1" fill={color} />
  </Svg>
);

const RefreshIcon = ({ size = 20, color = '#CBD5E1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 4V10H17M1 20V14H7M3.51 9A9 9 0 0 1 18.36 5.64L23 10M1 14L5.64 18.36A9 9 0 0 0 20.49 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function ModerationCenterScreen({ navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [stats, setStats] = useState({ totalReports: 0, pendingCount: 0, highPriorityCount: 0 });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'highPriority' | 'pending' | 'banned'

  // Proof Preview Modal State
  const [previewMedia, setPreviewMedia] = useState(null);

  // Warning Modal State
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [targetUserForWarning, setTargetUserForWarning] = useState(null);
  const [warningReason, setWarningReason] = useState('Harassment & Abusive behavior');
  const [warningMessage, setWarningMessage] = useState('');
  const [submittingWarning, setSubmittingWarning] = useState(false);

  // Ban Modal State
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [targetUserForBan, setTargetUserForBan] = useState(null);
  const [selectedBanDuration, setSelectedBanDuration] = useState('3days');
  const [banReason, setBanReason] = useState('Violating community guidelines and harassment policy');
  const [submittingBan, setSubmittingBan] = useState(false);

  // Expanded report cards
  const [expandedUsers, setExpandedUsers] = useState({});

  const isOwner =
    currentUser?.role === 'owner' ||
    currentUser?.email?.toLowerCase().trim() === 'shivamraie09@gmail.com';

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/admin/all');
      if (res.data?.success) {
        setGroupedUsers(res.data.groupedUsers || []);
        setStats({
          totalReports: res.data.totalReports || 0,
          pendingCount: res.data.pendingCount || 0,
          highPriorityCount: res.data.highPriorityCount || 0,
        });
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Failed to load reports';
      showToast(t(errMsg), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const toggleExpand = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // 1. Issue Official Warning
  const handleOpenWarning = (user) => {
    setTargetUserForWarning(user);
    setWarningReason('Community Guidelines Violation');
    setWarningMessage(
      `Official Warning #${(user.warningCount || 0) + 1}: Multiple reports have been filed against your profile for abusive behavior. Please adhere to YoYo community rules. Subsequent violations will lead to an immediate ban.`
    );
    setWarningModalVisible(true);
  };

  const handleConfirmWarning = async () => {
    if (!targetUserForWarning) return;
    try {
      setSubmittingWarning(true);
      const res = await api.post(`/reports/admin/warn/${targetUserForWarning._id}`, {
        warningReason,
        warningMessage,
      });
      if (res.data?.success) {
        showToast(t(res.data.message || 'Warning sent successfully'), 'success');
        setWarningModalVisible(false);
        fetchReports();
      }
    } catch (e) {
      showToast(t(e.response?.data?.message || 'Failed to send warning'), 'error');
    } finally {
      setSubmittingWarning(false);
    }
  };

  // 2. Ban User
  const handleOpenBan = (user) => {
    setTargetUserForBan(user);
    setSelectedBanDuration('3days');
    setBanReason('Violating community guidelines and harassment policy');
    setBanModalVisible(true);
  };

  const handleConfirmBan = async () => {
    if (!targetUserForBan) return;
    try {
      setSubmittingBan(true);
      const res = await api.post(`/reports/admin/ban/${targetUserForBan._id}`, {
        banDuration: selectedBanDuration,
        banReason,
      });
      if (res.data?.success) {
        showToast(t(res.data.message || 'User banned successfully'), 'success');
        setBanModalVisible(false);
        fetchReports();
      }
    } catch (e) {
      showToast(t(e.response?.data?.message || 'Failed to ban user'), 'error');
    } finally {
      setSubmittingBan(false);
    }
  };

  // 3. Unban User
  const handleUnban = async (userId) => {
    try {
      const res = await api.post(`/reports/admin/unban/${userId}`);
      if (res.data?.success) {
        showToast(t(res.data.message || 'User unbanned successfully'), 'success');
        fetchReports();
      }
    } catch (e) {
      showToast(t(e.response?.data?.message || 'Failed to unban user'), 'error');
    }
  };

  // 4. Dismiss Report (Strike reporter if fake)
  const handleDismissReport = async (reportId, isFake = false) => {
    try {
      const res = await api.post(`/reports/admin/dismiss/${reportId}`, {
        isFake,
        adminNote: isFake ? 'Flagged as intentional false report by Owner' : 'Dismissed by Owner',
      });
      if (res.data?.success) {
        showToast(t(res.data.message || 'Report dismissed'), 'success');
        fetchReports();
      }
    } catch (e) {
      showToast(t(e.response?.data?.message || 'Failed to dismiss report'), 'error');
    }
  };

  // Filter Users
  const filteredUsers = groupedUsers.filter((item) => {
    if (activeTab === 'highPriority') return item.isHighPriority;
    if (activeTab === 'pending') return item.pendingReports > 0;
    if (activeTab === 'banned') return item.isBanned;
    return true;
  });

  if (!isOwner) {
    return (
      <ScreenContainer style={styles.accessDeniedContainer}>
        <View style={styles.deniedCard}>
          <ShieldIcon size={44} color="#EF4444" />
          <Text style={styles.deniedTitle}>
            <T>Access Restricted</T>
          </Text>
          <Text style={styles.deniedSubtitle}>
            <T>Only the App Owner (shivamraie09@gmail.com) can view moderation reports.</T>
          </Text>
          <TouchableOpacity style={styles.backBtnAction} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnActionText}>
              <T>Go Back</T>
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity
          style={styles.backIconBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <BackArrowIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={styles.titleWithShield}>
            <ShieldIcon size={20} color="#6366F1" />
            <Text style={styles.headerTitle}>
              <T>Moderation Center</T>
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            <T>Owner Safety & User Reports Hub</T>
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.7} onPress={onRefresh}>
          <RefreshIcon size={18} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      {/* Stats Summary Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.totalReports}</Text>
          <Text style={styles.statLbl}>
            <T>Total Reports</T>
          </Text>
        </View>

        <View style={[styles.statBox, styles.statBoxPriority]}>
          <View style={styles.statPriorityRow}>
            {stats.highPriorityCount > 0 && <AlertTriangleIcon size={14} color="#EF4444" />}
            <Text style={[styles.statVal, { color: '#EF4444' }]}>{stats.highPriorityCount}</Text>
          </View>
          <Text style={[styles.statLbl, { color: '#F87171' }]}>
            <T>3+ Reports</T>
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>{stats.pendingCount}</Text>
          <Text style={styles.statLbl}>
            <T>Pending Review</T>
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {[
          { key: 'all', label: 'All Users' },
          { key: 'highPriority', label: '⚠️ 3+ Reports' },
          { key: 'pending', label: 'Pending' },
          { key: 'banned', label: 'Banned' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            activeOpacity={0.75}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              <T>{tab.label}</T>
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User Reports List */}
      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>
              <T>Loading reports...</T>
            </Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🛡️</Text>
            <Text style={styles.emptyTitle}>
              <T>No Reports Found</T>
            </Text>
            <Text style={styles.emptySubtitle}>
              <T>All community reports are clear or currently resolved.</T>
            </Text>
          </View>
        ) : (
          filteredUsers.map((item) => {
            const user = item.reportedUser;
            const uId = user._id.toString();
            const isExpanded = Boolean(expandedUsers[uId]);

            return (
              <View
                key={uId}
                style={[styles.userCard, item.isHighPriority && styles.userCardHighPriority]}
              >
                {/* User Top Row */}
                <View style={styles.userTopRow}>
                  <Image
                    source={{
                      uri:
                        user.avatar ||
                        'https://api.dicebear.com/7.x/bottts/png?seed=' +
                          encodeURIComponent(user.name || 'User'),
                    }}
                    style={styles.userAvatar}
                  />

                  <View style={styles.userInfoWrap}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.name}
                      </Text>
                      {item.isHighPriority && (
                        <View style={styles.highPriorityBadge}>
                          <AlertTriangleIcon size={12} color="#FFFFFF" />
                          <Text style={styles.highPriorityBadgeText}>
                            <T>3+ Reports</T>
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.userSubDetails}>
                      ID: {user.customId || user._id.slice(-6)} • {item.totalReports}{' '}
                      <T>Report(s)</T>
                    </Text>

                    {/* Status Pills */}
                    <View style={styles.pillsRow}>
                      {user.isBanned ? (
                        <View style={styles.bannedPill}>
                          <Text style={styles.bannedPillText}>
                            🚫 <T>Banned</T> ({user.banType})
                          </Text>
                        </View>
                      ) : null}

                      {item.warningCount > 0 && (
                        <View style={styles.warnPill}>
                          <Text style={styles.warnPillText}>
                            📩 <T>Warnings</T>: {item.warningCount}
                          </Text>
                        </View>
                      )}

                      {item.pendingReports > 0 && (
                        <View style={styles.pendingPill}>
                          <Text style={styles.pendingPillText}>
                            ⏳ {item.pendingReports} <T>Pending</T>
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Action Buttons for this user */}
                <View style={styles.actionBtnRow}>
                  {/* Warning Button */}
                  <TouchableOpacity
                    style={styles.warnBtn}
                    activeOpacity={0.75}
                    onPress={() => handleOpenWarning(user)}
                  >
                    <Text style={styles.warnBtnText}>
                      📩 <T>Send Warning</T>
                    </Text>
                  </TouchableOpacity>

                  {/* Ban or Unban Button */}
                  {user.isBanned ? (
                    <TouchableOpacity
                      style={styles.unbanBtn}
                      activeOpacity={0.75}
                      onPress={() => handleUnban(uId)}
                    >
                      <Text style={styles.unbanBtnText}>
                        ✅ <T>Unban User</T>
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.banBtn}
                      activeOpacity={0.75}
                      onPress={() => handleOpenBan(user)}
                    >
                      <Text style={styles.banBtnText}>
                        🚫 <T>Ban User</T>
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Expand / Collapse Details Button */}
                  <TouchableOpacity
                    style={styles.expandBtn}
                    activeOpacity={0.75}
                    onPress={() => toggleExpand(uId)}
                  >
                    <Text style={styles.expandBtnText}>
                      {isExpanded ? t('Hide Reports') : `${t('View Reports')} (${item.reports.length})`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Collapsible Individual Reports */}
                {isExpanded && (
                  <View style={styles.expandedReportsWrap}>
                    <Text style={styles.expandedTitle}>
                      <T>Evidence & Submitted Reports</T>:
                    </Text>

                    {item.reports.map((rep, idx) => (
                      <View key={rep._id || idx} style={styles.singleReportCard}>
                        {/* Reporter details */}
                        <View style={styles.singleReportHeader}>
                          <Text style={styles.singleReportReason}>
                            🚩 <T>{rep.reason}</T>
                          </Text>
                          <Text style={styles.singleReportDate}>
                            {new Date(rep.createdAt).toLocaleDateString()}
                          </Text>
                        </View>

                        <Text style={styles.reporterDetails}>
                          <T>Reported by</T>: {rep.reporter?.name || 'User'} (ID:{' '}
                          {rep.reporter?.customId || 'N/A'})
                          {rep.reporter?.falseReportStrikes > 0
                            ? ` • [Strikes: ${rep.reporter.falseReportStrikes}]`
                            : ''}
                        </Text>

                        {rep.description ? (
                          <Text style={styles.singleReportDesc}>"{rep.description}"</Text>
                        ) : null}

                        {/* Proof media thumbnail */}
                        {rep.proofUrl ? (
                          <TouchableOpacity
                            style={styles.proofThumbWrap}
                            activeOpacity={0.8}
                            onPress={() =>
                              setPreviewMedia({
                                url: rep.proofUrl,
                                type: rep.proofType,
                              })
                            }
                          >
                            {rep.proofType === 'image' ? (
                              <Image
                                source={{ uri: rep.proofUrl }}
                                style={styles.proofThumb}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.videoThumbBox}>
                                <Text style={styles.videoThumbEmoji}>📹</Text>
                                <Text style={styles.videoThumbLabel}>
                                  <T>View Video Proof</T>
                                </Text>
                              </View>
                            )}
                            <View style={styles.tapToViewBadge}>
                              <Text style={styles.tapToViewText}>
                                <T>Tap to View Proof</T>
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ) : null}

                        {/* Dismiss & Fake Report Action */}
                        {rep.status === 'pending' && (
                          <View style={styles.reportDismissRow}>
                            <TouchableOpacity
                              style={styles.dismissBtn}
                              activeOpacity={0.7}
                              onPress={() => handleDismissReport(rep._id, false)}
                            >
                              <Text style={styles.dismissBtnText}>
                                <T>Dismiss</T>
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.dismissFakeBtn}
                              activeOpacity={0.7}
                              onPress={() => handleDismissReport(rep._id, true)}
                            >
                              <Text style={styles.dismissFakeBtnText}>
                                ⚠️ <T>Flag as Fake Report</T>
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 1. Full Proof Media Viewer Modal */}
      <Modal
        visible={Boolean(previewMedia)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewMedia(null)}
      >
        <View style={styles.previewModalOverlay}>
          <TouchableOpacity
            style={styles.closePreviewBtn}
            onPress={() => setPreviewMedia(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.closePreviewText}>✕ <T>Close</T></Text>
          </TouchableOpacity>

          <View style={styles.previewContentBox}>
            {previewMedia?.url && (
              <Image
                source={{ uri: previewMedia.url }}
                style={styles.previewFullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* 2. Send Official Warning Modal */}
      <Modal
        visible={warningModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWarningModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              📩 <T>Send Official Warning</T>
            </Text>
            <Text style={styles.modalSubtitle}>
              <T>To User</T>: {targetUserForWarning?.name} (Current Warnings:{' '}
              {targetUserForWarning?.warningCount || 0})
            </Text>

            <Text style={styles.inputLabel}>
              <T>Warning Reason</T>:
            </Text>
            <TextInput
              style={styles.inputBox}
              value={warningReason}
              onChangeText={setWarningReason}
              placeholder={t('Enter violation category')}
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>
              <T>Official Message Content</T>:
            </Text>
            <TextInput
              style={[styles.inputBox, { minHeight: 90, textAlignVertical: 'top' }]}
              value={warningMessage}
              onChangeText={setWarningMessage}
              multiline
              placeholder={t('Enter warning details')}
              placeholderTextColor="#64748B"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                onPress={() => setWarningModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                activeOpacity={0.8}
                onPress={handleConfirmWarning}
                disabled={submittingWarning}
              >
                {submittingWarning ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    <T>Send Warning</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Ban User Modal */}
      <Modal
        visible={banModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: '#EF4444' }]}>
              🚫 <T>Ban User Account</T>
            </Text>
            <Text style={styles.modalSubtitle}>
              <T>Target</T>: {targetUserForBan?.name}
            </Text>

            {/* Ban Duration Selectors */}
            <Text style={styles.inputLabel}>
              <T>Select Ban Duration</T>:
            </Text>
            <View style={styles.durationsRow}>
              {[
                { id: '3days', label: '3 Days' },
                { id: '7days', label: '7 Days' },
                { id: 'permanent', label: 'Permanent' },
              ].map((dur) => (
                <TouchableOpacity
                  key={dur.id}
                  style={[
                    styles.durationItem,
                    selectedBanDuration === dur.id && styles.durationItemActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedBanDuration(dur.id)}
                >
                  <Text
                    style={[
                      styles.durationItemText,
                      selectedBanDuration === dur.id && styles.durationItemTextActive,
                    ]}
                  >
                    <T>{dur.label}</T>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>
              <T>Ban Reason (Displayed to user upon login)</T>:
            </Text>
            <TextInput
              style={styles.inputBox}
              value={banReason}
              onChangeText={setBanReason}
              placeholder={t('Enter reason for suspension')}
              placeholderTextColor="#64748B"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                onPress={() => setBanModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#EF4444' }]}
                activeOpacity={0.8}
                onPress={handleConfirmBan}
                disabled={submittingBan}
              >
                {submittingBan ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    <T>Confirm Ban</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#1E1E2D',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  backIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  titleWithShield: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#161626',
    borderBottomWidth: 1,
    borderBottomColor: '#252538',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E1E2D',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  statBoxPriority: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  statPriorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  statLbl: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1E1E2D',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  tabItemActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  emptyWrap: {
    paddingVertical: 70,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  userCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  userCardHighPriority: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: '#201A24',
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A3E',
  },
  userInfoWrap: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  highPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  highPriorityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  userSubDetails: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  bannedPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bannedPillText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  warnPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  warnPillText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingPillText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  warnBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  warnBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  banBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  banBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  unbanBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  unbanBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  expandBtn: {
    marginLeft: 'auto',
    backgroundColor: '#2A2A3E',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  expandBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  expandedReportsWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
    gap: 10,
  },
  expandedTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  singleReportCard: {
    backgroundColor: '#161624',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  singleReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  singleReportReason: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  singleReportDate: {
    color: '#64748B',
    fontSize: 10,
  },
  reporterDetails: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 4,
  },
  singleReportDesc: {
    color: '#E2E8F0',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  proofThumbWrap: {
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#374151',
    position: 'relative',
    marginBottom: 8,
  },
  proofThumb: {
    width: '100%',
    height: '100%',
  },
  videoThumbBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  videoThumbEmoji: {
    fontSize: 26,
  },
  videoThumbLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  tapToViewBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tapToViewText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  reportDismissRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  dismissBtn: {
    backgroundColor: '#374151',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  dismissBtnText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  dismissFakeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dismissFakeBtnText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
  },
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  closePreviewBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    zIndex: 10,
  },
  closePreviewText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  previewContentBox: {
    width: '100%',
    height: '75%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewFullImage: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: '#2A2A3E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 14,
  },
  durationsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  durationItem: {
    flex: 1,
    backgroundColor: '#2A2A3E',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  durationItemActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  durationItemText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  durationItemTextActive: {
    color: '#EF4444',
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  modalCancelText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 13,
  },
  modalConfirmBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    minWidth: 100,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  accessDeniedContainer: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deniedCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  deniedTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '800',
  },
  deniedSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  backBtnAction: {
    marginTop: 10,
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backBtnActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
