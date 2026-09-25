import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

export default function AuthScreen({ navigation, onLoginSuccess }) {
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'google' | 'facebook'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('123456');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneLogin = async () => {
    if (!phoneNumber) {
      Alert.alert('Required', 'Please enter your phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/phone-login', {
        phoneNumber,
        otp,
        name: userName || undefined,
      });

      if (res.data.success) {
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      if (err.response?.data?.banned) {
        Alert.alert('Account Banned 🚫', err.response.data.message);
      } else {
        Alert.alert('Login Failed', err.response?.data?.message || 'Check connection');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      const payload =
        provider === 'google'
          ? {
              googleId: `google_${Date.now()}`,
              email: `user_${Date.now()}@gmail.com`,
              name: 'Google Live User',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }
          : {
              facebookId: `fb_${Date.now()}`,
              name: 'Facebook Live User',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            };

      const res = await api.post(`/auth/${provider}-login`, payload);
      if (res.data.success) {
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      if (err.response?.data?.banned) {
        Alert.alert('Account Banned 🚫', err.response.data.message);
      } else {
        Alert.alert('Login Error', err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* App Logo & Title */}
      <View style={styles.logoSection}>
        <View style={styles.iconCircle}>
          <Text style={styles.logoEmoji}>🎙️</Text>
        </View>
        <Text style={styles.appName}>YoYo Live Voice</Text>
        <Text style={styles.tagline}>Voice Chat Rooms, Gifting & Community</Text>
      </View>

      {/* Auth Method Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, authMethod === 'phone' && styles.tabActive]}
          onPress={() => setAuthMethod('phone')}
        >
          <Text style={[styles.tabText, authMethod === 'phone' && styles.tabTextActive]}>
            📱 Phone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, authMethod === 'google' && styles.tabActive]}
          onPress={() => setAuthMethod('google')}
        >
          <Text style={[styles.tabText, authMethod === 'google' && styles.tabTextActive]}>
            🔴 Google
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, authMethod === 'facebook' && styles.tabActive]}
          onPress={() => setAuthMethod('facebook')}
        >
          <Text style={[styles.tabText, authMethod === 'facebook' && styles.tabTextActive]}>
            🔵 Facebook
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <View style={styles.formCard}>
        {authMethod === 'phone' ? (
          <>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <Text style={styles.inputLabel}>Your Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#6B7280"
              value={userName}
              onChangeText={setUserName}
            />

            <Text style={styles.inputLabel}>OTP Code (Test: 123456)</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handlePhoneLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryBtnText}>Login with Mobile</Text>
              )}
            </TouchableOpacity>
          </>
        ) : authMethod === 'google' ? (
          <View style={styles.socialBox}>
            <Text style={styles.socialDesc}>
              Sign in with your Google Account to access voice rooms and custom profile frames.
            </Text>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.socialBtnText}>Continue with Google ID</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.socialBox}>
            <Text style={styles.socialDesc}>
              Sign in with your Facebook Profile to connect with voice room friends.
            </Text>
            <TouchableOpacity
              style={styles.facebookBtn}
              onPress={() => handleSocialLogin('facebook')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.socialBtnText}>Continue with Facebook ID</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 34,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#2A2A3E',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  socialBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  socialDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  googleBtn: {
    backgroundColor: '#EA4335',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  facebookBtn: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  socialBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
