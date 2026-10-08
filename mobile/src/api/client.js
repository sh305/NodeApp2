import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// Helper to extract clean IP / Hostname from any URI string or host:port string
const extractHost = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string') return null;

  // 1. Priority: Find clean IPv4 address (e.g. 192.168.1.4)
  const ipMatch = rawUri.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (ipMatch) {
    const ip = ipMatch[0];
    if (ip !== '127.0.0.1' && ip !== '0.0.0.0') {
      return ip;
    }
  }

  // 2. Fallback: Check if it's a valid hostname/domain (e.g. ngrok-free.app, my-domain.com)
  try {
    // Strip any URI scheme (e.g. yoyo-voice-mobile://, exp://, https://)
    const clean = rawUri.replace(/^[a-zA-Z0-9+.-]+:\/\//i, '');
    const candidate = clean.split('/')[0].split(':')[0].trim().toLowerCase();

    // Must have at least one dot to be a valid domain name (not a raw scheme like 'yoyo-voice-mobile')
    if (
      candidate &&
      candidate.includes('.') &&
      candidate !== 'localhost' &&
      candidate !== '127.0.0.1' &&
      !candidate.includes('undefined') &&
      !candidate.includes('null')
    ) {
      return candidate;
    }
  } catch (err) {
    // ignore
  }

  return null;
};

// Automatic detection of developer machine's IP address across network changes
export const getAutoDetectedHost = () => {
  // 1. Web browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  // 2. Explicit Environment Variable (if provided)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const fromEnv = extractHost(process.env.EXPO_PUBLIC_API_URL);
    if (fromEnv) return fromEnv;
  }

  // 3. Expo Go debuggerHost (Most reliable in Expo Go)
  const expoGoHost =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest?.hostUri;
  const detectedExpoGo = extractHost(expoGoHost);
  if (detectedExpoGo) return detectedExpoGo;

  // 4. Expo Config hostUri (Physical device development build & Expo Go)
  const hostUri = Constants.expoConfig?.hostUri;
  const detectedHostUri = extractHost(hostUri);
  if (detectedHostUri) return detectedHostUri;

  // 5. React Native bundle scriptURL (Metro bundler URL - native bridge runtime)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  const detectedScript = extractHost(scriptURL);
  if (detectedScript) return detectedScript;

  // 6. Expo Constants experienceUrl / linkingUri
  const experienceUrl = Constants.experienceUrl || Constants.linkingUri;
  const detectedExperience = extractHost(experienceUrl);
  if (detectedExperience) return detectedExperience;

  // 7. Android Emulator detection (Uses 10.0.2.2 loopback to access host machine)
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
    return '10.0.2.2';
  }

  // 8. Default fallback for physical devices connected over Wi-Fi
  return '192.168.1.4';
};

export const getBaseUrl = () => {
  const host = getAutoDetectedHost();
  if (host.startsWith('http://') || host.startsWith('https://')) {
    return host;
  }
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
    const target = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    console.warn(`🚨 [API Error] ${error.message} -> Target: ${target}`);
    if (error.response && error.response.status === 403 && error.response.data?.banned) {
      console.warn('BAN DETECTED:', error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export default api;
