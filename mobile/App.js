import React, { useState, useEffect, Component } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// Disable native fragment restoration crashes on Android 15 Release APK
enableScreens(false);

class GlobalErrorBoundary extends Component {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: String(error?.message || error) };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured Global Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#EF4444', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
            App Notice
          </Text>
          <Text style={{ color: '#E2E8F0', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            {this.state.errorMessage || 'Something unexpected happened.'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import VoiceRoomScreen from './src/screens/VoiceRoomScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import UserRelationsScreen from './src/screens/UserRelationsScreen';
import WalletScreen from './src/screens/WalletScreen';
import ConfirmMoneyScreen from './src/screens/ConfirmMoneyScreen';
import ModerationCenterScreen from './src/screens/ModerationCenterScreen';
import UserProblemScreen from './src/screens/UserProblemScreen';
import StoreScreen from './src/screens/StoreScreen';
import LevelScreen from './src/screens/LevelScreen';
import SettingScreen from './src/screens/SettingScreen';
import AccountBindingScreen from './src/screens/AccountBindingScreen';
import VerificationCenterScreen from './src/screens/VerificationCenterScreen';
import RealPersonIntroScreen from './src/screens/RealPersonIntroScreen';
import FaceCaptureScreen from './src/screens/FaceCaptureScreen';
import OnlineStatusScreen from './src/screens/OnlineStatusScreen';
import CommentDisabledScreen from './src/screens/CommentDisabledScreen';
import BlacklistScreen from './src/screens/BlacklistScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import RefundPolicyScreen from './src/screens/RefundPolicyScreen';
import AboutUsScreen from './src/screens/AboutUsScreen';
import IntellectualPropertyScreen from './src/screens/IntellectualPropertyScreen';
import { LanguageProvider } from './src/context/LanguageContext';
import { ToastProvider } from './src/context/ToastContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@user_info');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Error loading stored user:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@user_info');
      setCurrentUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <LanguageProvider>
          <ToastProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0F0F1A' },
              }}
            >
              {!currentUser ? (
                <>
                  <Stack.Screen name="Auth">
                    {(props) => (
                      <AuthScreen
                        {...props}
                        onLoginSuccess={(user) => setCurrentUser(user)}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Terms">
                    {(props) => <TermsScreen {...props} />}
                  </Stack.Screen>
                  <Stack.Screen name="Privacy">
                    {(props) => <PrivacyScreen {...props} />}
                  </Stack.Screen>
                  <Stack.Screen name="Refund">
                    {(props) => <RefundPolicyScreen {...props} />}
                  </Stack.Screen>
                  <Stack.Screen name="About">
                    {(props) => <AboutUsScreen {...props} />}
                  </Stack.Screen>
                  <Stack.Screen name="IpRights">
                    {(props) => <IntellectualPropertyScreen {...props} />}
                  </Stack.Screen>
                </>
              ) : (
                <>
                  <Stack.Screen name="Home">
                    {(props) => (
                      <HomeScreen
                        {...props}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="VoiceRoom">
                    {(props) => (
                      <VoiceRoomScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="UserProfile">
                    {(props) => (
                      <UserProfileScreen
                        {...props}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Search">
                    {(props) => (
                      <SearchScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="UserRelations">
                    {(props) => (
                      <UserRelationsScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Wallet">
                    {(props) => (
                      <WalletScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="ConfirmMoney">
                    {(props) => (
                      <ConfirmMoneyScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="ModerationCenter">
                    {(props) => (
                      <ModerationCenterScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="UserProblem">
                    {(props) => (
                      <UserProblemScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Store">
                    {(props) => (
                      <StoreScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Level">
                    {(props) => (
                      <LevelScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Setting">
                    {(props) => (
                      <SettingScreen
                        {...props}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="AccountBinding">
                    {(props) => (
                      <AccountBindingScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="VerificationCenter">
                    {(props) => (
                      <VerificationCenterScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="RealPersonIntro">
                    {(props) => (
                      <RealPersonIntroScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="FaceCapture">
                    {(props) => (
                      <FaceCaptureScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="OnlineStatus">
                    {(props) => (
                      <OnlineStatusScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="CommentDisabled">
                    {(props) => (
                      <CommentDisabledScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Blacklist">
                    {(props) => (
                      <BlacklistScreen
                        {...props}
                        currentUser={currentUser}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Terms">
                    {(props) => <TermsScreen {...props} />}
                  </Stack.Screen>
                  <Stack.Screen name="Privacy">
                    {(props) => <PrivacyScreen {...props} />}
                  </Stack.Screen>
                  <Stack.Screen name="Refund">
                    {(props) => <RefundPolicyScreen {...props} />}
                  </Stack.Screen>
                  <Stack.Screen name="About">
                    {(props) => <AboutUsScreen {...props} />}
                  </Stack.Screen>
                  <Stack.Screen name="IpRights">
                    {(props) => <IntellectualPropertyScreen {...props} />}
                  </Stack.Screen>
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  </GlobalErrorBoundary>
  );
}
