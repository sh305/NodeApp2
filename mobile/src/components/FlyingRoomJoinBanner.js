import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FlyingRoomJoinBanner({ user, onFinished }) {
  const leftAnim = useRef(new Animated.Value(SCREEN_WIDTH + 20)).current;
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    const animation = Animated.timing(leftAnim, {
      toValue: -Math.max(SCREEN_WIDTH * 1.2, 500),
      duration: 9000,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished && onFinishedRef.current) onFinishedRef.current();
    });

    return () => animation.stop();
  }, [leftAnim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { left: leftAnim }]}
    >
      <LinearGradient
        colors={['rgba(40, 20, 75, 0.96)', 'rgba(25, 15, 50, 0.96)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.message} numberOfLines={1}>
          <Text style={styles.userName}>{user?.name || 'User'} </Text>
          <T>entered the room</T>
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  banner: {
    maxWidth: SCREEN_WIDTH * 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.8)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#A5B4FC',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  userName: {
    color: '#FDE047',
    fontWeight: '800',
  },
});
