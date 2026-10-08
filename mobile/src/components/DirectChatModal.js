import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import io from 'socket.io-client';
import api, { BASE_URL } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

// Back Chevron SVG
const BackChevron = ({ size = 24, color = '#FFFFFF' }) => (
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

// Send Arrow SVG
const SendIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function DirectChatModal({
  visible,
  onClose,
  partnerUser,
  currentUser,
  onMessageSent,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);
  const partnerId = partnerUser?._id || partnerUser?.id;
  const currentUserId = currentUser?._id || currentUser?.id;

  // Fetch Message History
  useEffect(() => {
    if (!visible || !partnerId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/messages/${partnerId}`);
        if (res.data?.success) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [visible, partnerId]);

  // Live Socket Listener for incoming direct messages
  useEffect(() => {
    if (!visible || !partnerId) return;

    let socket = null;
    try {
      socket = io(BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('new_direct_message', ({ message, receiverId, senderId }) => {
        if (
          (senderId === partnerId && receiverId === currentUserId) ||
          (senderId === currentUserId && receiverId === partnerId)
        ) {
          setMessages((prev) => [...prev, message]);
        }
      });
    } catch (e) {
      // quiet
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [visible, partnerId, currentUserId]);

  // Send Direct Message
  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || !partnerId || sending) return;

    try {
      setSending(true);
      setInputText('');
      const res = await api.post(`/messages/${partnerId}`, { text: textToSend });
      if (res.data?.success && res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
        if (onMessageSent) onMessageSent();
      }
    } catch (err) {
      showToast(t(err?.response?.data?.message || 'Failed to send message'), 'error');
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.sender === currentUserId || item.sender?._id === currentUserId;
    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <Image
            source={{
              uri:
                partnerUser?.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }}
            style={styles.msgAvatarSmall}
          />
        )}
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
            {item.text}
          </Text>
          <Text style={[styles.msgTimeText, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: Math.max(16, insets.top) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <BackChevron size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.partnerInfoWrap}>
            <Image
              source={{
                uri:
                  partnerUser?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerPartnerName} numberOfLines={1}>
                {partnerUser?.name || t('User')}
              </Text>
              <Text style={styles.headerOnlineText}>
                🟢 <T>Online</T>
              </Text>
            </View>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* Messages List */}
        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerWrap}>
            <Text style={styles.emptyIcon}>👋</Text>
            <Text style={styles.emptyTitle}>
              <T>Say Hello to</T> {partnerUser?.name || t('them')}!
            </Text>
            <Text style={styles.emptySub}>
              <T>Send a message to start chatting</T>
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || String(index)}
            renderItem={renderMessageItem}
            contentContainerStyle={[styles.messagesList, { paddingBottom: 16 }]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <TextInput
            style={styles.inputField}
            placeholder={t('Type a message...')}
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            maxLength={500}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <SendIcon size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222234',
    backgroundColor: '#171726',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2A40',
  },
  headerPartnerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    maxWidth: 180,
  },
  headerOnlineText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  msgAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2A40',
    marginBottom: 2,
  },
  msgBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  msgBubbleMe: {
    backgroundColor: '#10B981',
    borderBottomRightRadius: 3,
  },
  msgBubbleOther: {
    backgroundColor: '#1E1E2E',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  msgText: {
    fontSize: 14,
    lineHeight: 19,
  },
  msgTextMe: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  msgTextOther: {
    color: '#E2E8F0',
    fontWeight: '500',
  },
  msgTimeText: {
    fontSize: 9.5,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  msgTimeOther: {
    color: '#94A3B8',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: '#171726',
    borderTopWidth: 1,
    borderTopColor: '#222234',
    gap: 10,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2E2E44',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#2A2A3E',
  },
});
