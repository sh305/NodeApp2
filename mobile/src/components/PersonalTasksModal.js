import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import api from '../api/client';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── SVG ICONS FOR TASKS (Exact mint style matching screenshot) ──
const TaskIcon = ({ type, size = 24, color = '#10B981' }) => {
  switch (type) {
    case 'calendar': // Daily Sign in
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="4"
            stroke={color}
            strokeWidth="2"
          />
          <Path
            d="M16 2V6M8 2V6"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path d="M3 10H21" stroke={color} strokeWidth="2" />
          <Path
            d="M9 15L11 17L15 13"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'chatbubble': // Send comments in room
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 20.0004 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C3.9996 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="8.5" cy="11.5" r="1" fill={color} />
          <Circle cx="12.5" cy="11.5" r="1" fill={color} />
          <Circle cx="16.5" cy="11.5" r="1" fill={color} />
        </Svg>
      );
    case 'chair': // Seated for 5 minutes
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 10V6C6 4.89543 6.89543 4 8 4H16C17.1046 4 18 4.89543 18 6V10"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Rect
            x="4"
            y="10"
            width="16"
            height="5"
            rx="2.5"
            stroke={color}
            strokeWidth="2"
          />
          <Path
            d="M4 11V14C4 15.1046 4.89543 16 6 16M20 11V14C20 15.1046 19.1046 16 18 16"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M7 16V20M17 16V20"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'person-add': // Follow 1 people
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 19C15 16.7909 12.3137 15 9 15C5.68629 15 3 16.7909 3 19"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="9" cy="8" r="4" stroke={color} strokeWidth="2" />
          <Path
            d="M19 8V14M16 11H22"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'share-social': // Share 1 chatroom
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 12V14C4 16.2091 5.79086 18 8 18H16"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M13 7L18 12L13 17"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M18 12H9C6.23858 12 4 9.76142 4 7"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'wallet': // Finished recharge
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="6"
            width="18"
            height="14"
            rx="3"
            stroke={color}
            strokeWidth="2"
          />
          <Path
            d="M3 10H21"
            stroke={color}
            strokeWidth="2"
          />
          <Circle cx="16" cy="14" r="1.5" fill={color} />
        </Svg>
      );
    case 'time': // Stay in room 5 mins
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
          <Path
            d="M12 7V12L15.5 14"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'heart': // Like 5 posts
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        </Svg>
      );
  }
};

// ── CUTE MASCOT ILLUSTRATION (Header Right Mascot with sparkles) ──
const CuteHeaderMascot = () => (
  <View style={styles.mascotWrapper}>
    <Svg width={64} height={50} viewBox="0 0 64 50" fill="none">
      {/* Sparkles */}
      <Path d="M4 12L5 8L6 12L10 13L6 14L5 18L4 14L0 13L4 12Z" fill="#FBBF24" />
      <Path d="M58 8L59 5L60 8L63 9L60 10L59 13L58 10L55 9L58 8Z" fill="#FBBF24" />
      {/* Pink Backpack / Camera Head */}
      <Rect x="12" y="10" width="40" height="34" rx="12" fill="#FF758F" />
      {/* White face panel */}
      <Rect x="16" y="16" width="32" height="22" rx="8" fill="#FFF0F5" />
      {/* Big Anime Eyes */}
      <Circle cx="26" cy="26" r="4.5" fill="#1F2937" />
      <Circle cx="25" cy="24.5" r="1.8" fill="#FFFFFF" />
      <Circle cx="38" cy="26" r="4.5" fill="#1F2937" />
      <Circle cx="37" cy="24.5" r="1.8" fill="#FFFFFF" />
      {/* Rosy Cheeks */}
      <Circle cx="21" cy="30" r="2" fill="#FF8DA1" opacity={0.8} />
      <Circle cx="43" cy="30" r="2" fill="#FF8DA1" opacity={0.8} />
      {/* Smile */}
      <Path
        d="M30 30C31 31.5 33 31.5 34 30"
        stroke="#1F2937"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Antenna / Star Headband */}
      <Path d="M32 10V4" stroke="#FF758F" strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="32" cy="3" r="3" fill="#FBBF24" />
    </Svg>
  </View>
);

export default function PersonalTasksModal({
  visible,
  onClose,
  onDiamondsClaimed,
  roomStaySeconds = 0,
  seatedSeconds = 0,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [userDiamonds, setUserDiamonds] = useState(0);
  const [claimingTaskId, setClaimingTaskId] = useState(null);

  // Celebration Modal State
  const [rewardCelebration, setRewardCelebration] = useState({
    visible: false,
    reward: 0,
    newBalance: 0,
  });

  // Fetch task status
  const fetchTasks = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await api.get('/tasks/status');
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
        setUserDiamonds(res.data.diamonds || 0);
      }
    } catch (err) {
      console.warn('Failed to load tasks status:', err?.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchTasks(true);

      // Sync active progress (e.g. room stay time or seated time)
      if (roomStaySeconds >= 300) {
        api.post('/tasks/progress', { taskId: 'stay_room_5_mins', progress: 300 }).catch(() => {});
      }
      if (seatedSeconds >= 300) {
        api.post('/tasks/progress', { taskId: 'seated_5_mins', progress: 300 }).catch(() => {});
      }

      // Auto-poll every 12s while open to catch completed criteria live
      const interval = setInterval(() => {
        fetchTasks(false);
      }, 12000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  // Claim Task Reward
  const handleClaimReward = async (task) => {
    if (task.claimed || claimingTaskId) return;

    try {
      setClaimingTaskId(task.id);
      const res = await api.post('/tasks/claim', { taskId: task.id });

      if (res.data?.success) {
        const reward = res.data.reward;
        const newBalance = res.data.diamonds;

        // Update local state
        setUserDiamonds(newBalance);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, claimed: true, completed: true } : t))
        );

        // Notify parent / update profile
        onDiamondsClaimed?.(newBalance);

        // Show Center Toast
        showToast(t(`+${reward} Diamonds Claimed! 🎉`), 'success');

        // Show Celebratory Card
        setRewardCelebration({
          visible: true,
          reward,
          newBalance,
        });
      } else {
        showToast(t(res.data?.message || 'Failed to claim reward'), 'error');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Error claiming task reward';
      showToast(t(errMsg), 'error');
    } finally {
      setClaimingTaskId(null);
    }
  };

  // Helper to get matching icon type
  const getIconType = (taskId) => {
    switch (taskId) {
      case 'daily_sign_in':
        return 'calendar';
      case 'send_comments':
        return 'chatbubble';
      case 'seated_5_mins':
        return 'chair';
      case 'follow_1_person':
        return 'person-add';
      case 'share_chatroom':
        return 'share-social';
      case 'finish_recharge':
        return 'wallet';
      case 'stay_room_5_mins':
        return 'time';
      case 'like_5_posts':
        return 'heart';
      default:
        return 'calendar';
    }
  };

  // Format progress label (NO Go! button, shows progress cleanly)
  const formatProgress = (task) => {
    if (task.unit === 'sec') {
      const currentMin = Math.floor((task.progress || 0) / 60);
      const targetMin = Math.floor((task.target || 300) / 60);
      return `${currentMin}/${targetMin}m`;
    }
    return `${task.progress || 0}/${task.target || 1}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* ══ HEADER WITH MINT GRADIENT & CUTE MASCOT ══ */}
          <LinearGradient
            colors={['#7DF9C7', '#5EEAD4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Top Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>
                <T>Personal Tasks</T>
              </Text>
              <View style={styles.diamondsPill}>
                <Text style={styles.diamondPillIcon}>💎</Text>
                <Text style={styles.diamondPillValue}>{userDiamonds}</Text>
              </View>
            </View>

            {/* Mascot */}
            <CuteHeaderMascot />
          </LinearGradient>

          {/* ══ WHITE CONTENT CARD WITH TASK LIST ══ */}
          <View style={styles.contentCard}>
            {/* Top Right Refresh Notice (Immediately visible without scrolling) */}
            <View style={styles.topResetRow}>
              <View style={styles.topResetBadge}>
                <Text style={styles.topResetText}>
                  ⏰ <T>Refreshes every day at 00:00</T>
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>
                  <T>Loading tasks...</T>
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.taskList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.taskListContent}
              >
                {tasks.map((task) => {
                  const iconType = getIconType(task.id);
                  const isClaiming = claimingTaskId === task.id;

                  return (
                    <View key={task.id} style={styles.taskRow}>
                      {/* Left Circular Mint Icon */}
                      <View style={styles.iconCircle}>
                        <TaskIcon type={iconType} size={24} color="#10B981" />
                      </View>

                      {/* Middle Details (Title & 💎 Diamonds Reward) */}
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskTitle} numberOfLines={1}>
                          <T>{task.title}</T>
                        </Text>
                        <View style={styles.rewardRow}>
                          <Text style={styles.diamondIcon}>💎</Text>
                          <Text style={styles.rewardAmount}>{task.reward}</Text>
                        </View>
                      </View>

                      {/* Right Action: NO "Go!" button. Shows "Get" / "Check-in" when completed, "Claimed" when claimed, or progress tag when in progress */}
                      <View style={styles.actionWrap}>
                        {task.claimed ? (
                          // Claimed state
                          <View style={styles.claimedButton}>
                            <Text style={styles.claimedText}>
                              <T>Claimed</T>
                            </Text>
                          </View>
                        ) : task.completed ? (
                          // Criteria completed: Show Bright Green GET / CHECK-IN button
                          <TouchableOpacity
                            style={styles.getButton}
                            onPress={() => handleClaimReward(task)}
                            activeOpacity={0.8}
                            disabled={isClaiming}
                          >
                            <LinearGradient
                              colors={['#10B981', '#059669']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.getGradient}
                            >
                              {isClaiming ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text style={styles.getText}>
                                  <T>{task.id === 'daily_sign_in' ? 'Check-in' : 'Get'}</T>
                                </Text>
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        ) : (
                          // In Progress: Criteria not met yet. NO "Go!" button as requested!
                          <View style={styles.inProgressBadge}>
                            <Text style={styles.inProgressText}>
                              {formatProgress(task)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>

        {/* ══ CELEBRATION REWARD POPUP ══ */}
        <Modal
          visible={rewardCelebration.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRewardCelebration({ visible: false, reward: 0, newBalance: 0 })}
        >
          <View style={styles.celebrationOverlay}>
            <View style={styles.celebrationCard}>
              <LinearGradient
                colors={['#10B981', '#047857']}
                style={styles.celebrationHeader}
              >
                <Text style={styles.celebrationSparkle}>✨ 💎 ✨</Text>
                <Text style={styles.celebrationTitle}>
                  <T>Congratulations!</T>
                </Text>
              </LinearGradient>

              <View style={styles.celebrationBody}>
                <Text style={styles.celebrationRewardText}>
                  +{rewardCelebration.reward} 💎
                </Text>
                <Text style={styles.celebrationSubText}>
                  <T>Diamonds added to your wallet</T>
                </Text>

                <View style={styles.walletBalanceBox}>
                  <Text style={styles.walletBalanceLabel}>
                    <T>Current Diamonds Balance:</T>
                  </Text>
                  <Text style={styles.walletBalanceValue}>
                    💎 {rewardCelebration.newBalance}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.celebrationOkBtn}
                  onPress={() =>
                    setRewardCelebration({ visible: false, reward: 0, newBalance: 0 })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.celebrationOkText}>
                    <T>Awesome!</T>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  headerGradient: {
    height: 80,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#065F46',
    fontWeight: '800',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065F46',
  },
  diamondsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    gap: 4,
  },
  diamondPillIcon: {
    fontSize: 13,
  },
  diamondPillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  mascotWrapper: {
    width: 64,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    flexShrink: 1,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  taskList: {
    width: '100%',
  },
  taskListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 36,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  taskInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  diamondIcon: {
    fontSize: 15,
  },
  rewardAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  actionWrap: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  getButton: {
    width: 88,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  getGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  claimedButton: {
    width: 88,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  inProgressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Celebration Dialog Styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  celebrationCard: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
  },
  celebrationHeader: {
    width: '100%',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationSparkle: {
    fontSize: 32,
    marginBottom: 6,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  celebrationBody: {
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  celebrationRewardText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 6,
  },
  celebrationSubText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  walletBalanceBox: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  walletBalanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
  },
  walletBalanceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  celebrationOkBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationOkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topResetRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topResetBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  topResetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
});
