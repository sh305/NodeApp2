import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// Helper to extract clean IP / Hostname from any URI string or host:port string
const extractHost = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string') return null;
  // Strip protocol (exp://, http://, https://)
  const clean = rawUri.replace(/^(?:https?|exp):\/\//i, '');
  // Take the host part before port or trailing slash
  const hostPart = clean.split('/')[0].split(':')[0].trim();
  if (
    hostPart &&
    hostPart !== 'localhost' &&
    hostPart !== '127.0.0.1' &&
    !hostPart.includes('undefined') &&
    !hostPart.includes('null')
  ) {
    return hostPart;
  }
  return null;
};

// Automatic detection of developer machine's IP address across network changes
export const getAutoDetectedHost = () => {
  // 1. Web browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  // 2. Android Emulator (Only true emulators use 127.0.0.1 loopback via adb reverse)
  const model = String(Platform.constants?.Model || '').toLowerCase();
  const fingerprint = String(Platform.constants?.Fingerprint || '').toLowerCase();
  const brand = String(Platform.constants?.Brand || '').toLowerCase();
  const manufacturer = String(Platform.constants?.Manufacturer || '').toLowerCase();
  const hardware = String(Platform.constants?.Hardware || '').toLowerCase();

  const isAndroidEmulator =
    Platform.OS === 'android' &&
    (model.includes('sdk') ||
      model.includes('emulator') ||
      fingerprint.includes('generic') ||
      fingerprint.includes('sdk') ||
      brand.includes('generic') ||
      hardware.includes('goldfish') ||
      hardware.includes('ranchu') ||
      manufacturer.includes('genymotion'));

  if (isAndroidEmulator) {
    return '127.0.0.1';
  }

  // 3. Expo Go debuggerHost (Most reliable across Expo SDK 49 - 52+)
  const expoGoHost =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest?.hostUri;
  const detectedExpoGo = extractHost(expoGoHost);
  if (detectedExpoGo) return detectedExpoGo;

  // 4. React Native bundle scriptURL (Metro bundler URL - native bridge runtime)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  const detectedScript = extractHost(scriptURL);
  if (detectedScript) return detectedScript;

  // 5. Expo Constants experienceUrl / linkingUri
  const experienceUrl = Constants.experienceUrl || Constants.linkingUri;
  const detectedExperience = extractHost(experienceUrl);
  if (detectedExperience) return detectedExperience;

  // 6. Expo Config hostUri (Physical device development build)
  const hostUri = Constants.expoConfig?.hostUri;
  const detectedHostUri = extractHost(hostUri);
  if (detectedHostUri) return detectedHostUri;

  // 7. Default fallback
  return '127.0.0.1';
};

export const getBaseUrl = () => {
  const host = getAutoDetectedHost();
  return `http://${host}:5000`;
};

export let BASE_URL = getBaseUrl();
console.log('📡 [API Client] Connected to backend at:', BASE_URL);

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
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
    if (error.response && error.response.status === 403 && error.response.data?.banned) {
      console.warn('BAN DETECTED:', error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export default api;
