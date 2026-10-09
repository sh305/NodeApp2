import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

// 1. SVGs & Icons
const BackArrowIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlayIcon = ({ size = 11, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M8 5v14l11-7z" />
  </Svg>
);

const GoldCoinIcon = ({ size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#FFA000" strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="7.5" fill="#FFC107" />
    <Path
      d="M12 6.5v11M9.5 9h5M9.5 15h5"
      stroke="#FF8F00"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </Svg>
);

// Gift watermark in top-right header background matching screenshots
const GiftWatermark = ({ size = 140 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={styles.giftWatermark}>
    <Path
      d="M20 40h60v48a4 4 0 01-4 4H24a4 4 0 01-4-4V40z"
      fill="rgba(255,255,255,0.12)"
    />
    <Path
      d="M15 30h70v12a2 2 0 01-2 2H17a2 2 0 01-2-2V30z"
      fill="rgba(255,255,255,0.15)"
    />
    <Rect x="46" y="30" width="8" height="62" fill="rgba(255,255,255,0.2)" />
    <Path
      d="M50 30c-10-15-28 0-10 10C50 40 50 30 50 30zm0 0c10-15 28 0 10 10C50 40 50 30 50 30z"
      fill="rgba(255,255,255,0.2)"
    />
  </Svg>
);

// 2. STORE ITEMS DATA MATCHING USER'S SCREENSHOTS
const STORE_DATA = {
  // Screenshot 1: Frame
  Frame: [
    {
      id: 'frame_phoenix',
      name: 'Phoenix',
      price: '1799/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300',
    },
    {
      id: 'frame_pink_rose',
      name: 'Pink rose',
      price: '1499/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
    },
    {
      id: 'frame_romantic_blue',
      name: 'Romantic couples',
      price: '1399/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300',
    },
    {
      id: 'frame_romantic_red',
      name: 'Romantic couples',
      price: '1399/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300',
    },
    {
      id: 'frame_falcon',
      name: 'Falcon of Glory',
      price: '1599/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    },
    {
      id: 'frame_twin_lions',
      name: 'Twin Lions',
      price: '1699/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300',
    },
  ],

  // Screenshot 2: Seat Halo
  'Seat Halo': [
    {
      id: 'halo_heartbeat_blue',
      name: 'Heartbeat',
      price: '999/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300',
    },
    {
      id: 'halo_heartbeat_pink',
      name: 'Heartbeat',
      price: '999/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300',
    },
    {
      id: 'halo_lion',
      name: 'Lion',
      price: '1099/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=300',
    },
    {
      id: 'halo_electric',
      name: 'Electric Spark',
      price: '899/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300',
    },
    {
      id: 'halo_angel',
      name: 'Angel',
      price: '999/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
    },
    {
      id: 'halo_golden_stage',
      name: 'Golden Stage',
      price: '899/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300',
    },
  ],

  // Screenshot 3: Entrance Effect
  'Entrance Effect': [
    {
      id: 'entrance_elephant',
      name: 'Elephant',
      price: '3799/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=300',
    },
    {
      id: 'entrance_carriage',
      name: 'Carriage',
      price: '3599/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300',
    },
    {
      id: 'entrance_lion_mount',
      name: 'lion Mount',
      price: '4099/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    },
    {
      id: 'entrance_eagle_mount',
      name: 'Eagle Mount',
      price: '3599/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300',
    },
    {
      id: 'entrance_flying_tiger',
      name: 'Flying Tiger',
      price: '3999/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=300',
    },
    {
      id: 'entrance_golden_jet',
      name: 'Golden Jet',
      price: '4599/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300',
    },
  ],

  // Screenshot 4: Special
  Special: [
    {
      id: 'special_vip_card',
      name: 'VIP Card',
      price: '2000/30Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
    },
    {
      id: 'special_lover_card',
      name: 'Lover Card',
      price: '29999',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300',
    },
    {
      id: 'special_soulmate_card',
      name: 'Soulmate Card',
      price: '19999',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=300',
    },
    {
      id: 'special_bestie_card',
      name: 'Bestie Card',
      price: '9999',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300',
    },
    {
      id: 'special_cp_capacity',
      name: 'CP capacity +1',
      price: '15000',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300',
    },
    {
      id: 'special_separation_card',
      name: 'Separation Card',
      price: '5000',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
    },
  ],

  // Screenshot 5: Room Bubble
  'Room Bubble': [
    {
      id: 'bubble_lion_crown',
      name: 'Lion crown',
      price: '799/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300',
    },
    {
      id: 'bubble_sword_crown',
      name: 'Sword Crown',
      price: '899/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300',
    },
    {
      id: 'bubble_crown_rose',
      name: 'Crown Rose Bubble',
      price: '899/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
    },
    {
      id: 'bubble_heart_wing',
      name: 'Heart Wing Bubble',
      price: '899/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300',
    },
    {
      id: 'bubble_tiger_forest',
      name: 'Tiger Forest',
      price: '899/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=300',
    },
    {
      id: 'bubble_imperial',
      name: 'Imperial Bubble',
      price: '999/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    },
  ],

  // User requested remaining tabs (Placeholders ready for user's assets)
  'Seat Cover': [
    {
      id: 'seat_royal_velvet',
      name: 'Royal Velvet',
      price: '1199/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300',
    },
    {
      id: 'seat_cyber_glow',
      name: 'Cyber Glow',
      price: '999/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300',
    },
    {
      id: 'seat_golden_throne',
      name: 'Golden Throne',
      price: '1499/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300',
    },
    {
      id: 'seat_galaxy_star',
      name: 'Galaxy Star',
      price: '1299/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=300',
    },
  ],

  'Seat Emoji': [
    {
      id: 'emoji_party_poppers',
      name: 'Party Poppers',
      price: '499/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
    },
    {
      id: 'emoji_fire_flame',
      name: 'Fire Flame',
      price: '499/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300',
    },
    {
      id: 'emoji_heart_wave',
      name: 'Heart Wave',
      price: '599/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300',
    },
    {
      id: 'emoji_star_sparkle',
      name: 'Star Sparkle',
      price: '599/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300',
    },
  ],

  Background: [
    {
      id: 'bg_crystal_palace',
      name: 'Crystal Palace',
      price: '1999/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300',
    },
    {
      id: 'bg_neon_cyber_city',
      name: 'Neon Cyber City',
      price: '1899/1Days',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300',
    },
    {
      id: 'bg_sunset_beach',
      name: 'Sunset Beach',
      price: '1799/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300',
    },
    {
      id: 'bg_cherry_blossom',
      name: 'Cherry Blossom',
      price: '1799/1Days',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=300',
    },
  ],
};

// Sub-categories list matching user's exact specification
// (Gifting Effect, CP Token, Flying Msg, Ribbon explicitly removed)
const SUB_TABS = [
  'Frame',
  'Seat Halo',
  'Entrance Effect',
  'Special',
  'Room Bubble',
  'Seat Cover',
  'Seat Emoji',
  'Background',
];

const CURRENCY_TABS = ['Coins', 'Point', 'Game Coins', 'Tools'];

export default function StoreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [activeCurrencyTab, setActiveCurrencyTab] = useState('Coins');
  const [activeSubTab, setActiveSubTab] = useState('Frame');

  // Handle Play Button click (placeholder ready for user's action specification)
  const handlePlayPress = (item) => {
    showToast(t('Preview coming soon for ') + item.name, 'info');
  };

  // Handle Price Pill Button click
  const handleBuyPress = (item) => {
    showToast(t('Purchase ') + item.name + t(' coming soon!'), 'info');
  };

  const currentItems = STORE_DATA[activeSubTab] || [];

  const renderStoreItem = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Top Badges Row */}
        <View style={styles.cardHeaderRow}>
          {item.isNew ? (
            <LinearGradient
              colors={['#FFA000', '#FF6F00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.newBadge}
            >
              <Text style={styles.newBadgeText}>NEW</Text>
            </LinearGradient>
          ) : (
            <View style={{ width: 44 }} />
          )}

          {/* Circular Play Button */}
          <TouchableOpacity
            style={styles.playBtn}
            activeOpacity={0.75}
            onPress={() => handlePlayPress(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <PlayIcon size={10} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Center Preview Image */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: item.image }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        </View>

        {/* Item Title */}
        <Text style={styles.itemName} numberOfLines={1}>
          <T>{item.name}</T>
        </Text>

        {/* Price Button Pill */}
        <TouchableOpacity
          style={styles.pricePill}
          activeOpacity={0.8}
          onPress={() => handleBuyPress(item)}
        >
          <GoldCoinIcon size={16} />
          <Text style={styles.priceText}>{item.price}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER IN VIBRANT EMERALD GREEN */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(12, insets.top) }]}>
        <GiftWatermark size={130} />

        {/* Currency Tabs Row */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <BackArrowIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.currencyTabsWrap}>
            {CURRENCY_TABS.map((tab) => {
              const isActive = activeCurrencyTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.currencyTabItem}
                  activeOpacity={0.8}
                  onPress={() => setActiveCurrencyTab(tab)}
                >
                  <Text
                    style={[
                      styles.currencyTabText,
                      isActive && styles.currencyTabTextActive,
                    ]}
                  >
                    <T>{tab}</T>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sub-Category Tabs (Frame, Seat Halo, Entrance Effect, etc.) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabsScroll}
        >
          {SUB_TABS.map((tab) => {
            const isActive = activeSubTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.subTabItem}
                activeOpacity={0.8}
                onPress={() => setActiveSubTab(tab)}
              >
                <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                  <T>{tab}</T>
                </Text>
                {isActive && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. STORE ITEMS 2-COLUMN GRID */}
      <FlatList
        data={currentItems}
        keyExtractor={(item) => item.id}
        renderItem={renderStoreItem}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(24, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Header Styles
  headerContainer: {
    backgroundColor: '#00C853',
    paddingBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  giftWatermark: {
    position: 'absolute',
    right: -15,
    top: -5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    paddingRight: 12,
  },
  currencyTabsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flex: 1,
    marginLeft: 6,
  },
  currencyTabItem: {
    paddingVertical: 4,
  },
  currencyTabText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '700',
  },
  currencyTabTextActive: {
    color: '#FFFFFF',
    fontSize: 17.5,
    fontWeight: '900',
  },

  // Sub-Category Tabs Row
  subTabsScroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 22,
  },
  subTabItem: {
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 6,
  },
  subTabText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '700',
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15.5,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  // 2. Grid & Card Styles
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#B71C1C',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  playBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrap: {
    width: 108,
    height: 108,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E676',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    gap: 5,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
});
