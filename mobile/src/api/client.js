import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// Automatic detection of developer machine's IP address
const getAutoDetectedHost = () => {
  // 1. Web browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  // 2. Expo Constants hostUri (Expo Go / Development build - e.g. 192.168.1.4:8081)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') return ip;
  }

  // 3. Expo Constants linkingUri (e.g. exp://192.168.1.4:8081)
  const linkingUri = Constants.linkingUri;
  if (linkingUri) {
    const match = linkingUri.match(/:\/\/(?:www\.)?([^/:]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return match[1];
    }
  }

  // 4. React Native bundle scriptURL (Metro bundler URL)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/https?:\/\/([^/:]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return match[1];
    }
  }

  // 5. Android Emulator loopback
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  // 6. Default fallback
  return 'localhost';
};

const detectedHost = getAutoDetectedHost();
export const BASE_URL = `http://${detectedHost}:5000`;
console.log('📡 [API Client] Connected to backend at:', BASE_URL);

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Error fetching auth token:', e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data?.banned) {
      console.warn('BAN DETECTED:', error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export default api;
