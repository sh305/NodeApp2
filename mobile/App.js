import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import VoiceRoomScreen from './src/screens/VoiceRoomScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';

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
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!currentUser ? (
            <Stack.Screen name="Auth">
              {(props) => (
                <AuthScreen
                  {...props}
                  onLoginSuccess={(user) => setCurrentUser(user)}
                />
              )}
            </Stack.Screen>
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
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
