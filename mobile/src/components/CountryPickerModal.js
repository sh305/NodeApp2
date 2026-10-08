import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { COUNTRIES, getCountryFlagUrl } from '../constants/countries';
import { useLanguage } from '../context/LanguageContext';

const BackIcon = ({ size = 26, color = '#1F2937' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchIcon = ({ size = 18, color = '#9CA3AF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
    <Path d="M16 16L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ClearIcon = ({ size = 16, color = '#9CA3AF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#E5E7EB" />
    <Path d="M15 9L9 15M9 9L15 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export default function CountryPickerModal({
  visible,
  onClose,
  onSelectCountry,
  selectedCountry = '',
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImages, setFailedImages] = useState({});

  // Filter countries according to search query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (item) => {
    if (onSelectCountry) {
      onSelectCountry(item.name, item);
    }
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderCountryItem = ({ item }) => {
    const isSelected =
      selectedCountry &&
      selectedCountry.toLowerCase() === item.name.toLowerCase();
    const hasImageFailed = failedImages[item.code];

    return (
      <TouchableOpacity
        style={[styles.countryItem, isSelected && styles.countryItemSelected]}
        activeOpacity={0.75}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.flagContainer}>
          {!hasImageFailed ? (
            <Image
              source={{ uri: getCountryFlagUrl(item.code, 'w80') }}
              style={styles.flagImage}
              resizeMode="cover"
              onError={() => {
                setFailedImages((prev) => ({ ...prev, [item.code]: true }));
              }}
            />
          ) : (
            <Text style={styles.flagEmoji}>{item.flag}</Text>
          )}
        </View>

        <Text
          style={[styles.countryName, isSelected && styles.countryNameSelected]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* Note: As explicitly requested, the right '>' chevron arrow has been removed! */}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Top Navigation & Search Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <BackIcon size={26} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <SearchIcon size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('Search')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                activeOpacity={0.75}
                onPress={() => setSearchQuery('')}
              >
                <ClearIcon size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Countries List */}
        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          renderItem={renderCountryItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('No countries found')}</Text>
            </View>
          }
          showsVerticalScrollIndicator
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    paddingTop: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  countryItemSelected: {
    backgroundColor: '#F9FAFB',
  },
  flagContainer: {
    width: 32,
    height: 22,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    marginRight: 14,
  },
  flagImage: {
    width: '100%',
    height: '100%',
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  countryNameSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#F3F4F6',
    marginLeft: 62,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
});
