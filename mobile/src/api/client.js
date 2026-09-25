import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Computer Local Wi-Fi IP address for real device testing
export const BASE_URL = 'http://192.168.0.14:5000';

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
