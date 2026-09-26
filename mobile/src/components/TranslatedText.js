import React from 'react';
import { Text } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/**
 * TranslatedText (<T> or <TranslatedText>)
 * 
 * Automatically translates the text string passed inside children or text prop.
 * 
 * Usage:
 *   <TranslatedText style={styles.title}>Welcome to App</TranslatedText>
 *   or
 *   <T style={styles.sub}>Start Voice Room</T>
 */
export function TranslatedText({
  children,
  text,
  style,
  numberOfLines,
  ellipsizeMode,
  ...props
}) {
  const { t } = useLanguage();
  const rawText = typeof children === 'string' ? children : (text || '');
  const translated = t(rawText);

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      {...props}
    >
      {translated}
    </Text>
  );
}

export const T = TranslatedText;
export default TranslatedText;
