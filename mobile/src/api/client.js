import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE_URL = 'https://nodeapp2-yl8c.onrender.com';

export const getBaseUrl = () => {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;
  return configuredBaseUrl.replace(/\/+$/, '');
};

export let BASE_URL = getBaseUrl();
console.log('📡 [API Client] Connected to backend at:', BASE_URL);

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  try {
    // Keep host synchronized dynamically if network / Wi-Fi changes
    const currentBase = getBaseUrl();
    if (BASE_URL !== currentBase) {
      BASE_URL = currentBase;
      console.log('🔄 [API Client] Auto-switched backend host to:', BASE_URL);
    }
    config.baseURL = `${BASE_URL}/api`;

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
    const isHandledBlock = error.response?.status === 403 && error.response?.data?.isBlocked;
    const isHandledBan = error.response?.status === 403 && error.response?.data?.banned;
    const isHandledComment =
      error.response?.status === 403 &&
      (error.response?.data?.isCommentDisabled ||
        error.response?.data?.message?.includes?.('disabled your ability to comment'));

    // Suppress noisy console warnings for handled normal business logic flows
    if (!isHandledBlock && !isHandledBan && !isHandledComment) {
      const target = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
      const errMsg = error.response?.data?.message ? ` (${error.response.data.message})` : '';
      console.warn(`🚨 [API Error] ${error.message}${errMsg} -> Target: ${target}`);
    }

    return Promise.reject(error);
  }
);

export default api;
