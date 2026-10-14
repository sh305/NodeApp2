import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';

const BackChevronIcon = ({ size = 24, color = '#1C1C1E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function CommentDisabledScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDisabledUsers = useCallback(async () => {
    try {
      const res = await api.get('/users/comment-disabled');
      if (res.data?.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to fetch comment disabled users'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, showToast]);

  useEffect(() => {
    fetchDisabledUsers();
  }, [fetchDisabledUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDisabledUsers();
  };

  const handleDelete = async (targetUser) => {
    const targetId = targetUser._id || targetUser.id;
    if (!targetId || deletingId) return;

    setDeletingId(targetId);
    try {
      const res = await api.post(`/users/${targetId}/enable-comment`);
      if (res.data?.success) {
        setUsers((prev) => prev.filter((u) => (u._id || u.id) !== targetId));
        showToast(t('Comments enabled for this user'), 'success');
      } else {
        showToast(t(res.data?.message || 'Failed to remove user'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to remove user'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isDeleting = deletingId === (item._id || item.id);
    const avatarUri =
      item.avatar ||
      `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(item.name || 'User')}`;

    return (
      <View style={styles.itemWrapper}>
        <View style={styles.itemRow}>
          <TouchableOpacity
            style={styles.itemLeft}
            activeOpacity={0.8}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate('UserProfile', { userId: item._id || item.id });
              }
            }}
          >
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <Text style={styles.userName} numberOfLines={1}>
              {item.name || 'User'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
            activeOpacity={0.75}
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteBtnText}>
                <T>Delete</T>
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.rowDivider} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ══ HEADER (MATCHING USER SCREENSHOT) ══ */}
      <View style={[styles.header, { paddingTop: Math.max(14, insets.top) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <BackChevronIcon size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          <T>Comment Disabled</T>
        </Text>

        {/* Symmetry placeholder */}
        <View style={styles.headerPlaceholder} />
      </View>

      {/* ══ BODY / LIST ══ */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2C2C2E" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => (item._id || item.id || Math.random().toString())}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            users.length === 0 && styles.emptyListContent,
            { paddingBottom: Math.max(24, insets.bottom + 16) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2C2C2E']}
              tintColor="#2C2C2E"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                <T>No comment disabled users</T>
              </Text>
            </View>
          }
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F2',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 36,
  },
  listContent: {
    paddingTop: 8,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemWrapper: {
    backgroundColor: '#FFFFFF',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F2F2F7',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 14,
    flex: 1,
  },
  deleteBtn: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    minHeight: 32,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F2',
    marginLeft: 76,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
