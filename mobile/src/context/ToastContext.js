import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useLanguage } from './LanguageContext';

const ToastContext = createContext();

// Global ref for non-hook usage (e.g. inside API error handlers)
let globalShowToastRef = null;

export const showGlobalToast = (message, type = 'success') => {
  if (globalShowToastRef) {
    globalShowToastRef(message, type);
  }
};

/**
 * Universal Center Pop-up Toast Provider
 * 
 * Features:
 *  1. 100% Guaranteed Center Viewport positioning (Native transparent Modal)
 *  2. Auto-translates ANY message through the active LanguageContext (Hindi, English, etc.)
 *  3. Rich Dark Glassmorphic card styling with Spring Scale & Fade animation
 *  4. Works globally across all screens with simple: const { showToast } = useToast();
 */
export const ToastProvider = ({ children }) => {
  const { t } = useLanguage();
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success', // 'success' | 'error' | 'info'
  });

  const toastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setToast({ visible: false, message: '', type: 'success' });
    });
  }, [toastAnim]);

  const showToast = useCallback(
    (message, type = 'success', duration = 2800) => {
      if (!message) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      const rawMsg = typeof message === 'string' ? message : '';
      const translated = t(rawMsg);

      setToast({
        visible: true,
        message: translated,
        type,
      });

      toastAnim.setValue(0);
      Animated.spring(toastAnim, {
        toValue: 1,
        friction: 6,
        tension: 65,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [t, toastAnim, hideToast]
  );

  // Assign global ref
  globalShowToastRef = showToast;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Global Center Pop-up Modal */}
      <Modal
        visible={toast.visible}
        transparent={true}
        animationType="none"
        onRequestClose={hideToast}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideToast}
        >
          <Animated.View
            style={[
              styles.card,
              toast.type === 'success' && styles.cardSuccess,
              toast.type === 'error' && styles.cardError,
              toast.type === 'info' && styles.cardInfo,
              {
                opacity: toastAnim,
                transform: [
                  {
                    scale: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.75, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.contentRow}>
              <Text style={styles.icon}>
                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
              </Text>
              <Text style={styles.messageText}>{toast.message}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Focus backdrop
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    borderRadius: 22,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 24,
    maxWidth: 360,
    width: '100%',
    overflow: 'hidden',
  },
  cardSuccess: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
  },
  cardError: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  cardInfo: {
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  icon: {
    fontSize: 22,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
});
