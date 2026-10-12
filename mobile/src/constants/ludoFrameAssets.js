import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

export const LUDO_FRAME_SKINS = {
  gc_frame_champion: {
    id: 'gc_frame_champion',
    name: 'Ludo Champion',
    price: '3200',
    isNew: true,
    image: require('../../assets/Store/frames/ludo_champion_frame.png'),
    description: 'Golden crown with gems & 3D dice',
  },
  gc_frame_neon: {
    id: 'gc_frame_neon',
    name: 'Cyber Neon Ludo',
    price: '6800',
    isNew: true,
    image: require('../../assets/Store/frames/ludo_neon_frame.png'),
    description: 'Glowing cyberpunk neon tracks & holographic dice',
  },
  gc_frame_emperor: {
    id: 'gc_frame_emperor',
    name: 'Royal Emperor',
    price: '14500',
    isNew: false,
    image: require('../../assets/Store/frames/ludo_emperor_frame.png'),
    description: 'Imperial royal velvet, golden wings & jewel dice',
  },
  gc_frame_star: {
    id: 'gc_frame_star',
    name: 'Victory Star',
    price: '22000',
    isNew: true,
    image: require('../../assets/Store/frames/ludo_star_frame.png'),
    description: 'Golden safe stars & 3D floating victory dice',
  },
  gc_frame_fantasy: {
    id: 'gc_frame_fantasy',
    name: 'Fantasy Rainbow',
    price: '35000',
    isNew: false,
    image: require('../../assets/Store/frames/ludo_fantasy_frame.png'),
    description: 'Crystal rainbow wings & pastel floating dice',
  },
};

// Aliases for compatibility
const FRAME_ALIASES = {
  gc_frame_ludo: 'gc_frame_champion',
};

export const LUDO_FRAME_ITEMS_LIST = Object.values(LUDO_FRAME_SKINS);

/**
 * Returns the full frame skin object with local assets
 */
export const getLudoFrameSkin = (frameIdOrObj) => {
  if (!frameIdOrObj) return null;
  const id = typeof frameIdOrObj === 'string' ? frameIdOrObj : frameIdOrObj?.id;
  if (id) {
    if (LUDO_FRAME_SKINS[id]) return LUDO_FRAME_SKINS[id];
    const aliasedId = FRAME_ALIASES[id];
    if (aliasedId && LUDO_FRAME_SKINS[aliasedId]) return LUDO_FRAME_SKINS[aliasedId];
  }
  if (typeof frameIdOrObj === 'object' && frameIdOrObj?.image) {
    return frameIdOrObj;
  }
  return null;
};

/**
 * Reads equipped frame from AsyncStorage and returns the full skin object
 */
export const getEquippedLudoFrame = async () => {
  try {
    const raw = await AsyncStorage.getItem('@equipped_frame');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const skin = getLudoFrameSkin(parsed);
    return skin || parsed;
  } catch (err) {
    return null;
  }
};

/**
 * Saves equipped frame to AsyncStorage and optionally syncs with backend profile
 */
export const saveEquippedLudoFrame = async (frameItem) => {
  if (!frameItem) return;
  try {
    const data = {
      id: frameItem.id,
      name: frameItem.name,
    };
    await AsyncStorage.setItem('@equipped_frame', JSON.stringify(data));

    // Best-effort sync to backend user profile
    try {
      await api.put('/users/profile', {
        activeFrame: {
          id: frameItem.id,
          name: frameItem.name,
        },
      });
    } catch (_) {
      // offline / fallback
    }
  } catch (err) {
    // silent fallback
  }
};
