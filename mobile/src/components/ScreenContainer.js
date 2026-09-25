import React, { useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ScreenContainer - Universal Cross-Platform Mobile Screen Layout Wrapper
 * 
 * Automatically handles:
 *  1. Android 3-Button Navigation Bar & iOS Home Bar overlap (SafeAreaView insets)
 *  2. React Native 2-tap button issue (keyboardShouldPersistTaps="handled")
 *  3. Keyboard covering input fields (automaticallyAdjustKeyboardInsets + auto-scroll on focus)
 *  4. Platform-optimized KeyboardAvoidingView for iOS & Android
 */
export default function ScreenContainer({
  children,
  scrollable = true,
  backgroundColor = '#0F0F1A',
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0,
  showsVerticalScrollIndicator = false,
  withKeyboardAvoiding = true,
  autoScrollOnFocus = true,
  scrollRef,
  ...scrollViewProps
}) {
  const insets = useSafeAreaInsets();
  const internalScrollRef = useRef(null);
  const actualScrollRef = scrollRef || internalScrollRef;

  // Auto-scroll to bottom/focused input when software keyboard opens
  useEffect(() => {
    if (!autoScrollOnFocus || !scrollable) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        if (actualScrollRef.current) {
          actualScrollRef.current?.scrollToEnd({ animated: true });
        }
      }, 80);
    });

    return () => {
      sub.remove();
    };
  }, [autoScrollOnFocus, scrollable, actualScrollRef]);

  const content = scrollable ? (
    <ScrollView
      ref={actualScrollRef}
      contentContainerStyle={[
        styles.defaultScrollContent,
        {
          paddingBottom: Platform.OS === 'android' ? Math.max(28, insets.bottom + 16) : Math.max(20, insets.bottom),
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets={true}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex1,
        {
          paddingBottom: Platform.OS === 'android' ? Math.max(16, insets.bottom) : insets.bottom,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}
      edges={edges}
    >
      {withKeyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  flex1: {
    flex: 1,
    width: '100%',
  },
  defaultScrollContent: {
    flexGrow: 1,
    width: '100%',
  },
});
