import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/**
 * LanguageSelectorButton - Universal Language Selector UI Component
 * 
 * Variants:
 *  - 'pill' (default): Sleek rounded pill displaying [ 🌐 Flag NativeName ▾ ]
 *  - 'icon': Compact round button with globe icon (ideal for navigation headers)
 *  - 'card': Full-width settings/profile row with description and current language preview
 */
export default function LanguageSelectorButton({
  variant = 'pill',
  style,
  textStyle,
  showLabel = true,
  onPress,
}) {
  const { openLanguageModal, activeLanguageName, languagesList, currentLanguage } = useLanguage();
  const currentLangObj = languagesList.find((l) => l.code === currentLanguage) || languagesList[0];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      openLanguageModal();
    }
  };

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        style={[styles.iconButton, style]}
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <Text style={styles.iconGlobe}>🌐</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'card') {
    return (
      <TouchableOpacity
        style={[styles.cardContainer, style]}
        activeOpacity={0.75}
        onPress={handlePress}
      >
        <View style={styles.cardLeft}>
          <View style={styles.cardIconBox}>
            <Text style={styles.cardIcon}>🌐</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>App Language / भाषा</Text>
            <Text style={styles.cardSubtitle}>
              {currentLangObj.flag} {currentLangObj.nativeName} ({currentLangObj.name})
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardChangeText}>Change</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Default: 'pill'
  return (
    <TouchableOpacity
      style={[styles.pillContainer, style]}
      activeOpacity={0.75}
      onPress={handlePress}
    >
      <Text style={styles.pillFlag}>{currentLangObj.flag || '🌐'}</Text>
      {showLabel && (
        <Text style={[styles.pillText, textStyle]} numberOfLines={1}>
          {currentLangObj.nativeName || 'English'}
        </Text>
      )}
      <Text style={styles.pillArrow}>▾</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pillFlag: {
    fontSize: 16,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pillArrow: {
    color: '#9CA3AF',
    fontSize: 10,
    marginLeft: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlobe: {
    fontSize: 18,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E2D',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 6,
    width: '100%',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardChangeText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: '600',
  },
});
