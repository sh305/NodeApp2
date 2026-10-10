import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

// App Official Coins Assets
const GOLD_COIN_IMG = require('../../assets/icons/gold_coin.png');
const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');

// 1. SVGs & Icons
const CloseIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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

const GoldCoinIcon = ({ size = 16, style }) => (
  <Image
    source={GOLD_COIN_IMG}
    style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
  />
);

const GameCoinIcon = ({ size = 16, style }) => (
  <Image
    source={GREEN_COIN_IMG}
    style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
  />
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

// Gamepad watermark in top-right header background for Game Coins
const GamepadWatermark = ({ size = 135 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={styles.giftWatermark}>
    <Path
      d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
      fill="rgba(255, 255, 255, 0.14)"
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
      id: 'bg_birthday_party',
      name: 'Birthday Party Theme',
      price: '1999/1Days',
      isNew: true,
      image: require('../../assets/Store/backgrounds/Birthday Party Theme.jpg'),
    },
    {
      id: 'bg_blue_moon_valley',
      name: 'Blue Moon Valley',
      price: '1899/1Days',
      isNew: true,
      image: require('../../assets/Store/backgrounds/Blue Moon Valley.jpg'),
    },
    {
      id: 'bg_cyber_neon_beast',
      name: 'Cyber Neon Beast',
      price: '2199/1Days',
      isNew: true,
      image: require('../../assets/Store/backgrounds/Cyber Neon Beast.jpg'),
    },
    {
      id: 'bg_divya_kanha',
      name: 'Divya Kanha',
      price: '1999/1Days',
      isNew: false,
      image: require('../../assets/Store/backgrounds/Divya Kanha.jpg'),
    },
    {
      id: 'bg_dragon_fire',
      name: 'Dragon & Fire Theme',
      price: '2499/1Days',
      isNew: true,
      image: require('../../assets/Store/backgrounds/Dragon & Fire Theme.jpg'),
    },
    {
      id: 'bg_dragon_fury_gt',
      name: 'Dragon Fury GT',
      price: '2299/1Days',
      isNew: false,
      image: require('../../assets/Store/backgrounds/Dragon Fury GT.jpg'),
    },
    {
      id: 'bg_fire_lion',
      name: 'Fire Lion',
      price: '2099/1Days',
      isNew: false,
      image: require('../../assets/Store/backgrounds/Fire Lion.jpg'),
    },
    {
      id: 'bg_peaceful_aesthetic',
      name: 'Peaceful & Aesthetic',
      price: '1699/1Days',
      isNew: false,
      image: require('../../assets/Store/backgrounds/Peaceful & Aesthetic.jpg'),
    },
    {
      id: 'bg_poetic_nature',
      name: 'Poetic & Nature Theme',
      price: '1799/1Days',
      isNew: false,
      image: require('../../assets/Store/backgrounds/Poetic & Nature Theme.jpg'),
    },
    {
      id: 'bg_romantic_poetic',
      name: 'Romantic & Poetic',
      price: '1899/1Days',
      isNew: false,
      image: require('../../assets/Store/backgrounds/Romantic & Poetic.jpg'),
    },
    {
      id: 'bg_shadow_panther',
      name: 'Shadow Panther',
      price: '2399/1Days',
      isNew: true,
      image: require('../../assets/Store/backgrounds/Shadow Panther.jpg'),
    },
    {
      id: 'bg_silver_phoenix',
      name: 'Silver Phoenix',
      price: '2299/1Days',
      isNew: false,
      image: require('../../assets/Store/backgrounds/Silver Phoenix.jpg'),
    },
  ],
};

// 3. GAME COINS STORE DATA MATCHING USER'S SCREENSHOTS
const GAME_COINS_STORE_DATA = {
  Dice: [
    {
      id: 'gc_dice_ruby',
      name: 'Classic Ruby Dice',
      price: '2800',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300',
    },
    {
      id: 'gc_dice_gold',
      name: 'Golden King Dice',
      price: '5600',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    },
    {
      id: 'gc_dice_frost',
      name: 'Frost Crystal Dice',
      price: '8400',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=300',
    },
    {
      id: 'gc_dice_emerald',
      name: 'Emerald Dragon Dice',
      price: '11200',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300',
    },
    {
      id: 'gc_dice_cyber',
      name: 'Neon Cyber Dice',
      price: '16800',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300',
    },
    {
      id: 'gc_dice_cosmic',
      name: 'Cosmic Starry Dice',
      price: '24000',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=300',
    },
    {
      id: 'gc_dice_obsidian',
      name: 'Shadow Obsidian Dice',
      price: '32000',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
    },
    {
      id: 'gc_dice_phoenix',
      name: 'Fire Phoenix Dice',
      price: '45000',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300',
    },
  ],

  Pieces: [
    {
      id: 'gc_piece_gold_king',
      name: 'Royal Gold King',
      price: '2800',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=300',
    },
    {
      id: 'gc_piece_ruby_crown',
      name: 'Ruby Crown Token',
      price: '5600',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300',
    },
    {
      id: 'gc_piece_emerald_jade',
      name: 'Emerald Jade Pawn',
      price: '8800',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    },
    {
      id: 'gc_piece_frost_crystal',
      name: 'Frost Crystal Token',
      price: '11600',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=300',
    },
    {
      id: 'gc_piece_cyber_neon',
      name: 'Cyber Neon Piece',
      price: '17400',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300',
    },
    {
      id: 'gc_piece_cosmic_galaxy',
      name: 'Cosmic Galaxy Pawn',
      price: '24800',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=300',
    },
    {
      id: 'gc_piece_shadow_obsidian',
      name: 'Shadow Obsidian Pawn',
      price: '34000',
      isNew: false,
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
    },
    {
      id: 'gc_piece_fire_dragon',
      name: 'Fire Dragon Token',
      price: '48000',
      isNew: true,
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300',
    },
  ],

  Background: [
    {
      id: 'gc_bg_island',
      name: 'Island',
      price: '5820',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300',
    },
    {
      id: 'gc_bg_castle',
      name: 'Castle',
      price: '29280',
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300',
    },
  ],

  Frame: [
    {
      id: 'gc_frame_ludo',
      name: 'Ludo Frame',
      price: '3500',
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300',
    },
  ],

  'Text Bubble': [
    {
      id: 'gc_bubble_ludo',
      name: 'Ludo Chat',
      price: '2400',
      image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300',
    },
    {
      id: 'gc_bubble_neon',
      name: 'Neon Bubble',
      price: '4800',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300',
    },
  ],
};

// "All" sub-tab combines items matching Screenshot 1
GAME_COINS_STORE_DATA.All = [
  GAME_COINS_STORE_DATA.Pieces[0], // Royal Gold King
  GAME_COINS_STORE_DATA.Frame[0], // Ludo Frame
  GAME_COINS_STORE_DATA.Dice[0], // Classic Ruby Dice
  GAME_COINS_STORE_DATA.Background[0], // Island
  GAME_COINS_STORE_DATA.Dice[1], // Golden King Dice
  GAME_COINS_STORE_DATA.Pieces[1], // Ruby Crown Token
  GAME_COINS_STORE_DATA.Dice[2], // Frost Crystal Dice
  GAME_COINS_STORE_DATA.Dice[3], // Emerald Dragon Dice
  GAME_COINS_STORE_DATA.Pieces[2], // Emerald Jade Pawn
  GAME_COINS_STORE_DATA.Pieces[3], // Frost Crystal Token
  GAME_COINS_STORE_DATA.Background[1], // Castle
  GAME_COINS_STORE_DATA.Dice[4], // Neon Cyber Dice
  GAME_COINS_STORE_DATA.Dice[5], // Cosmic Starry Dice
  GAME_COINS_STORE_DATA.Pieces[4], // Cyber Neon Piece
  GAME_COINS_STORE_DATA.Pieces[5], // Cosmic Galaxy Pawn
];

// Sub-categories list for Coins
const SUB_TABS_COINS = [
  'Frame',
  'Seat Halo',
  'Entrance Effect',
  'Special',
  'Room Bubble',
  'Seat Cover',
  'Seat Emoji',
  'Background',
];

// Sub-categories list for Game Coins (Matching Screenshots)
const SUB_TABS_GAME_COINS = [
  'All',
  'Dice',
  'Pieces',
  'Background',
  'Frame',
  'Text Bubble',
];

const CURRENCY_TABS = ['Coins', 'Point', 'Game Coins', 'Tools'];

export default function StoreScreen({ navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [activeCurrencyTab, setActiveCurrencyTab] = useState('Coins');
  const [activeSubTab, setActiveSubTab] = useState('Frame');
  const [previewItem, setPreviewItem] = useState(null);

  // Live User Coins & Game Coins Balance
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);
  const [userGameCoins, setUserGameCoins] = useState(currentUser?.gameCoins || 0);

  // Coins Purchase Bottom Sheet Modal State
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedBuyItem, setSelectedBuyItem] = useState(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [buyCurrency, setBuyCurrency] = useState('coins'); // 'coins' | 'gameCoins'

  // Owned Items, Equipped Dice & Equipped Piece Persistence State
  const [ownedItemIds, setOwnedItemIds] = useState([]);
  const [equippedDiceId, setEquippedDiceId] = useState(null);
  const [equippedPieceId, setEquippedPieceId] = useState(null);

  // Apply / Equip Confirmation Modal State
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [pendingApplyItem, setPendingApplyItem] = useState(null);

  useEffect(() => {
    fetchUserBalance();
    loadEquippedAndOwned();
  }, []);

  const loadEquippedAndOwned = async () => {
    try {
      const storedOwned = await AsyncStorage.getItem('@owned_items');
      if (storedOwned) {
        setOwnedItemIds(JSON.parse(storedOwned));
      }
      const storedDice = await AsyncStorage.getItem('@equipped_dice');
      if (storedDice) {
        const parsed = JSON.parse(storedDice);
        if (parsed?.id) setEquippedDiceId(parsed.id);
      }
      const storedPiece = await AsyncStorage.getItem('@equipped_piece');
      if (storedPiece) {
        const parsed = JSON.parse(storedPiece);
        if (parsed?.id) setEquippedPieceId(parsed.id);
      }
    } catch (_) {}
  };

  const fetchUserBalance = async () => {
    try {
      const res = await api.get('/users/wallet/balance');
      if (res.data?.success) {
        if (res.data.coins !== undefined) setUserCoins(res.data.coins);
        if (res.data.gameCoins !== undefined) setUserGameCoins(res.data.gameCoins);
      }
    } catch (e) {
      if (currentUser?.coins !== undefined) setUserCoins(currentUser.coins);
      if (currentUser?.gameCoins !== undefined) setUserGameCoins(currentUser.gameCoins);
    }
  };

  // Switch between currency tabs (Coins vs Game Coins)
  const handleSelectCurrencyTab = (tab) => {
    setActiveCurrencyTab(tab);
    if (tab === 'Game Coins') {
      setActiveSubTab('All');
    } else if (tab === 'Coins') {
      setActiveSubTab('Frame');
    }
  };

  // Helper to extract numeric base price from string (e.g. '1799/1Days' -> 1799)
  const parseBasePrice = (priceStr) => {
    if (typeof priceStr === 'number') return priceStr;
    const match = String(priceStr).replace(/,/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 1000;
  };

  // Compute pricing tiers according to user's specification
  const getTiersForItem = (item) => {
    if (!item) return [];
    const day1 = parseBasePrice(item.price);
    const day3 = day1 + 5000;
    const day7 = day3 + 8000;
    const day30 = day7 + 15000;

    return [
      { days: 1, label: '1 Days', coins: day1 },
      { days: 3, label: '3 Days', coins: day3 },
      { days: 7, label: '7 Days', coins: day7 },
      { days: 30, label: '30 Days', coins: day30 },
    ];
  };

  // Handle Play Button click / Preview
  const handlePlayPress = (item) => {
    setPreviewItem(item);
  };

  // Handle Price Pill Button click -> Opens Bottom Sheet Purchase Modal
  const handleBuyPress = (
    item,
    currency = activeCurrencyTab === 'Game Coins' ? 'gameCoins' : 'coins'
  ) => {
    setSelectedBuyItem(item);
    setBuyCurrency(currency);
    setSelectedTierIndex(0);
    setBuyModalVisible(true);
  };

  // Equip item directly (from "Use it" button)
  const handleEquipItem = async (targetItem) => {
    const isPiece = activeSubTab === 'Pieces' || targetItem.id.startsWith('gc_piece_');
    if (isPiece) {
      setEquippedPieceId(targetItem.id);
      try {
        await AsyncStorage.setItem(
          '@equipped_piece',
          JSON.stringify({
            id: targetItem.id,
            name: targetItem.name,
            image: targetItem.image,
          })
        );
      } catch (_) {}
      showToast(t('Piece equipped successfully!'), 'success');
    } else {
      setEquippedDiceId(targetItem.id);
      try {
        await AsyncStorage.setItem(
          '@equipped_dice',
          JSON.stringify({
            id: targetItem.id,
            name: targetItem.name,
            image: targetItem.image,
          })
        );
      } catch (_) {}
      showToast(t('Dice equipped successfully!'), 'success');
    }
  };

  // Helper to handle post-purchase state & show Apply prompt if it's a dice or piece
  const onPurchaseSuccess = async (purchasedItem) => {
    setBuyModalVisible(false);
    const newOwned = Array.from(new Set([...ownedItemIds, purchasedItem.id]));
    setOwnedItemIds(newOwned);
    try {
      await AsyncStorage.setItem('@owned_items', JSON.stringify(newOwned));
    } catch (_) {}

    const isDice = activeSubTab === 'Dice' || purchasedItem.id.startsWith('gc_dice_');
    const isPiece = activeSubTab === 'Pieces' || purchasedItem.id.startsWith('gc_piece_');

    if (isDice || isPiece) {
      setPendingApplyItem(purchasedItem);
      setApplyModalVisible(true);
    } else {
      showToast(t('Purchased successfully!'), 'success');
    }
  };

  // Apply Modal - "Yes" handler
  const handleApplyYes = async () => {
    if (!pendingApplyItem) return;
    const isPiece = activeSubTab === 'Pieces' || pendingApplyItem.id.startsWith('gc_piece_');

    if (isPiece) {
      setEquippedPieceId(pendingApplyItem.id);
      try {
        await AsyncStorage.setItem(
          '@equipped_piece',
          JSON.stringify({
            id: pendingApplyItem.id,
            name: pendingApplyItem.name,
            image: pendingApplyItem.image,
          })
        );
      } catch (_) {}
      setApplyModalVisible(false);
      setPendingApplyItem(null);
      showToast(t('Piece equipped successfully!'), 'success');
    } else {
      setEquippedDiceId(pendingApplyItem.id);
      try {
        await AsyncStorage.setItem(
          '@equipped_dice',
          JSON.stringify({
            id: pendingApplyItem.id,
            name: pendingApplyItem.name,
            image: pendingApplyItem.image,
          })
        );
      } catch (_) {}
      setApplyModalVisible(false);
      setPendingApplyItem(null);
      showToast(t('Dice equipped successfully!'), 'success');
    }
  };

  // Apply Modal - "No" handler
  const handleApplyNo = () => {
    const isPiece =
      pendingApplyItem &&
      (activeSubTab === 'Pieces' || pendingApplyItem.id.startsWith('gc_piece_'));
    setApplyModalVisible(false);
    setPendingApplyItem(null);
    showToast(
      t(isPiece ? 'Piece added to your collection!' : 'Dice added to your collection!'),
      'info'
    );
  };

  // Handle Confirm Purchase with wallet check and redirection
  const handleConfirmPurchase = async () => {
    if (!selectedBuyItem) return;
    const tiers = getTiersForItem(selectedBuyItem);
    const selectedTier = tiers[selectedTierIndex] || tiers[0];
    const cost = selectedTier.coins;
    const isGameCoins = buyCurrency === 'gameCoins';

    // 1. Balance verification
    if (isGameCoins) {
      if (userGameCoins < cost) {
        showToast(t('Insufficient game coins, please recharge first'), 'error');
        setBuyModalVisible(false);
        navigation.navigate('Wallet', { initialTab: 'gameCoins' });
        return;
      }
    } else {
      if (userCoins < cost) {
        showToast(t('Insufficient coins, please recharge first'), 'error');
        setBuyModalVisible(false);
        navigation.navigate('Wallet', { initialTab: 'coins' });
        return;
      }
    }

    // 2. Perform purchase
    try {
      const res = await api.post('/users/store/purchase', {
        itemId: selectedBuyItem.id,
        itemName: selectedBuyItem.name,
        durationDays: selectedTier.days,
        coinsCost: cost,
        currencyType: isGameCoins ? 'gameCoins' : 'coins',
      });

      if (res.data?.success) {
        if (isGameCoins) {
          const updated =
            res.data.gameCoins !== undefined
              ? res.data.gameCoins
              : Math.max(0, userGameCoins - cost);
          setUserGameCoins(updated);
        } else {
          const updated =
            res.data.coins !== undefined ? res.data.coins : Math.max(0, userCoins - cost);
          setUserCoins(updated);
        }

        try {
          const stored = await AsyncStorage.getItem('@user_info');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (isGameCoins) parsed.gameCoins = res.data.gameCoins;
            else parsed.coins = res.data.coins;
            await AsyncStorage.setItem('@user_info', JSON.stringify(parsed));
          }
        } catch (_) {}

        await onPurchaseSuccess(selectedBuyItem);
      } else if (res.data?.insufficient) {
        const msg = isGameCoins
          ? 'Insufficient game coins, please recharge first'
          : 'Insufficient coins, please recharge first';
        showToast(t(msg), 'error');
        setBuyModalVisible(false);
        navigation.navigate('Wallet', { initialTab: isGameCoins ? 'gameCoins' : 'coins' });
      } else {
        showToast(t(res.data?.message || 'Purchase failed'), 'error');
      }
    } catch (err) {
      if (err?.response?.data?.insufficient) {
        const msg = isGameCoins
          ? 'Insufficient game coins, please recharge first'
          : 'Insufficient coins, please recharge first';
        showToast(t(msg), 'error');
        setBuyModalVisible(false);
        navigation.navigate('Wallet', { initialTab: isGameCoins ? 'gameCoins' : 'coins' });
      } else {
        // Fallback local balance deduction
        if (isGameCoins) {
          setUserGameCoins((prev) => Math.max(0, prev - cost));
        } else {
          setUserCoins((prev) => Math.max(0, prev - cost));
        }
        await onPurchaseSuccess(selectedBuyItem);
      }
    }
  };

  const currentSubTabs =
    activeCurrencyTab === 'Game Coins' ? SUB_TABS_GAME_COINS : SUB_TABS_COINS;

  const currentItems =
    activeCurrencyTab === 'Game Coins'
      ? GAME_COINS_STORE_DATA[activeSubTab] || []
      : STORE_DATA[activeSubTab] || [];

  const renderStoreItem = ({ item }) => {
    const imageSource =
      typeof item.image === 'string' ? { uri: item.image } : item.image;
    const isGameCoins = activeCurrencyTab === 'Game Coins';

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
        <TouchableOpacity
          style={styles.imageWrap}
          activeOpacity={0.85}
          onPress={() => handlePlayPress(item)}
        >
          <Image
            source={imageSource}
            style={styles.itemImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Item Title */}
        <Text style={styles.itemName} numberOfLines={1}>
          <T>{item.name}</T>
        </Text>

        {/* Button Pill: "In Use" | "Use it" | Price Pill */}
        {isGameCoins && (equippedDiceId === item.id || equippedPieceId === item.id || item.status === 'in_use') ? (
          <View style={styles.inUsePill}>
            <Text style={styles.inUseText}>
              <T>In Use</T>
            </Text>
          </View>
        ) : isGameCoins && (ownedItemIds.includes(item.id) || item.status === 'owned') ? (
          <TouchableOpacity
            style={styles.useItPill}
            activeOpacity={0.8}
            onPress={() => handleEquipItem(item)}
          >
            <Text style={styles.useItText}>
              <T>Use it</T>
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.pricePill, isGameCoins && styles.gameCoinPricePill]}
            activeOpacity={0.8}
            onPress={() => handleBuyPress(item, isGameCoins ? 'gameCoins' : 'coins')}
          >
            {isGameCoins ? (
              <GameCoinIcon size={17} />
            ) : (
              <GoldCoinIcon size={16} />
            )}
            <Text style={styles.priceText}>{item.price}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER IN VIBRANT EMERALD GREEN */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(12, insets.top) }]}>
        {activeCurrencyTab === 'Game Coins' ? (
          <GamepadWatermark size={135} />
        ) : (
          <GiftWatermark size={130} />
        )}

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
                  onPress={() => handleSelectCurrencyTab(tab)}
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

        {/* Sub-Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabsScroll}
        >
          {currentSubTabs.map((tab) => {
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

      {/* 3. ITEM PREVIEW MODAL */}
      <Modal
        visible={!!previewItem}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewItem(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPreviewItem(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.previewCard}
          >
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.75}
              onPress={() => setPreviewItem(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.previewImageContainer}>
              {previewItem && (
                <Image
                  source={
                    typeof previewItem.image === 'string'
                      ? { uri: previewItem.image }
                      : previewItem.image
                  }
                  style={styles.previewLargeImage}
                  resizeMode={activeSubTab === 'Background' ? 'cover' : 'contain'}
                />
              )}
            </View>

            <Text style={styles.previewTitle} numberOfLines={1}>
              <T>{previewItem?.name || ''}</T>
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 4. COINS PURCHASE BOTTOM SHEET MODAL (MATCHING SCREENSHOT) */}
      <Modal
        visible={buyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBuyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.buyModalBackdrop}
          activeOpacity={1}
          onPress={() => setBuyModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[styles.buyModalSheet, { paddingBottom: Math.max(24, insets.bottom + 12) }]}
          >
            {/* Top Preview Image floating above header */}
            {selectedBuyItem && (
              <View style={styles.buyModalImageWrapper}>
                <Image
                  source={
                    typeof selectedBuyItem.image === 'string'
                      ? { uri: selectedBuyItem.image }
                      : selectedBuyItem.image
                  }
                  style={styles.buyModalImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Item Title */}
            <Text style={styles.buyModalItemName} numberOfLines={1}>
              <T>{selectedBuyItem?.name || ''}</T>
            </Text>

            {/* 2x2 Grid of Duration Options */}
            <View style={styles.buyModalGrid}>
              {selectedBuyItem &&
                getTiersForItem(selectedBuyItem).map((tier, idx) => {
                  const isSelected = selectedTierIndex === idx;
                  return (
                    <TouchableOpacity
                      key={tier.label}
                      style={[
                        styles.buyTierCard,
                        isSelected && styles.buyTierCardSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedTierIndex(idx)}
                    >
                      {buyCurrency === 'gameCoins' ? (
                        <GameCoinIcon size={19} />
                      ) : (
                        <GoldCoinIcon size={19} />
                      )}
                      <Text
                        style={[
                          styles.buyTierText,
                          isSelected && styles.buyTierTextSelected,
                        ]}
                      >
                        {tier.coins}/{tier.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* Big Green Coin Purchase Button at Bottom */}
            {selectedBuyItem && (() => {
              const tiers = getTiersForItem(selectedBuyItem);
              const selectedTier = tiers[selectedTierIndex] || tiers[0];
              return (
                <TouchableOpacity
                  style={styles.bottomBuyPillBtn}
                  activeOpacity={0.85}
                  onPress={handleConfirmPurchase}
                >
                  <LinearGradient
                    colors={['#00E676', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bottomBuyGradient}
                  >
                    {buyCurrency === 'gameCoins' ? (
                      <GameCoinIcon size={24} />
                    ) : (
                      <GoldCoinIcon size={24} />
                    )}
                    <Text style={styles.bottomBuyAmountText}>
                      {selectedTier?.coins}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 5. APPLY DICE CONFIRMATION MODAL */}
      <Modal
        visible={applyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleApplyNo}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleApplyNo}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.applyPromptCard}
          >
            <View style={styles.applyBadge}>
              <Text style={styles.applyBadgeText}>
                ✨{' '}
                <T>
                  {pendingApplyItem?.id?.startsWith('gc_piece_') || activeSubTab === 'Pieces'
                    ? 'Apply Piece?'
                    : 'Apply Dice?'}
                </T>
              </Text>
            </View>

            {pendingApplyItem && (
              <View style={styles.applyImageContainer}>
                <Image
                  source={
                    typeof pendingApplyItem.image === 'string'
                      ? { uri: pendingApplyItem.image }
                      : pendingApplyItem.image
                  }
                  style={styles.applyDiceImage}
                  resizeMode="cover"
                />
              </View>
            )}

            <Text style={styles.applyItemTitle} numberOfLines={1}>
              <T>{pendingApplyItem?.name || ''}</T>
            </Text>

            <Text style={styles.applyPromptDesc}>
              <T>
                {pendingApplyItem?.id?.startsWith('gc_piece_') || activeSubTab === 'Pieces'
                  ? 'Do you want to use this piece now?'
                  : 'Do you want to use this dice now?'}
              </T>
            </Text>

            <View style={styles.applyBtnRow}>
              <TouchableOpacity
                style={styles.applyNoBtn}
                activeOpacity={0.8}
                onPress={handleApplyNo}
              >
                <Text style={styles.applyNoBtnText}>
                  <T>No</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyYesBtn}
                activeOpacity={0.85}
                onPress={handleApplyYes}
              >
                <LinearGradient
                  colors={['#00E676', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyYesGradient}
                >
                  <Text style={styles.applyYesBtnText}>
                    <T>Yes</T>
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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

  // 3. Preview Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  previewCard: {
    width: Math.min(width - 48, 330),
    backgroundColor: '#1E1E2D',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewImageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  previewLargeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  previewTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 6,
    textAlign: 'center',
  },

  // 4. Coins Purchase Bottom Sheet Modal Styles (Matching Screenshot)
  buyModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    justifyContent: 'flex-end',
  },
  buyModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 20,
  },
  buyModalImageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 18,
    marginTop: -56,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  buyModalImage: {
    width: '100%',
    height: '100%',
  },
  buyModalItemName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  buyModalGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  buyTierCard: {
    width: (width - 40 - 12) / 2,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  buyTierCardSelected: {
    borderColor: '#00E676',
    backgroundColor: '#F0FDF4',
  },
  buyTierText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  buyTierTextSelected: {
    color: '#0F172A',
    fontWeight: '800',
  },
  bottomBuyPillBtn: {
    width: '100%',
    marginTop: 26,
    borderRadius: 28,
    overflow: 'hidden',
  },
  bottomBuyGradient: {
    width: '100%',
    height: 52,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  bottomBuyAmountText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // 5. Game Coins Card Specific Styles

  inUsePill: {
    backgroundColor: '#52525B',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 92,
  },
  inUseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  useItPill: {
    backgroundColor: '#00E676',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 92,
  },
  useItText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  gameCoinPricePill: {
    backgroundColor: '#00E676',
    minWidth: 92,
    justifyContent: 'center',
  },

  // 6. Apply Confirmation Modal Styles
  applyPromptCard: {
    width: Math.min(width - 48, 320),
    backgroundColor: '#1E1E2D',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  applyBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  applyBadgeText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '800',
  },
  applyImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: '#0F0F1A',
    borderWidth: 2,
    borderColor: '#00E676',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  applyDiceImage: {
    width: '100%',
    height: '100%',
  },
  applyItemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  applyPromptDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  applyBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  applyNoBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  applyNoBtnText: {
    color: '#E2E8F0',
    fontSize: 14.5,
    fontWeight: '700',
  },
  applyYesBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  applyYesGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyYesBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
