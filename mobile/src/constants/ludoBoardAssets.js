import AsyncStorage from '@react-native-async-storage/async-storage';

export const LUDO_BOARD_SKINS = {
  gc_bg_traditional: {
    id: 'gc_bg_traditional',
    name: 'Traditional Heritage',
    price: '1800',
    isNew: false,
    image: require('../../assets/Game coins/Ludo bACKGROUND/Traditional Board.png'),
  },
  gc_bg_royal: {
    id: 'gc_bg_royal',
    name: 'Royal Palace',
    price: '4200',
    isNew: true,
    image: require('../../assets/Game coins/Ludo bACKGROUND/Royal Board.png'),
  },
  gc_bg_fantasy: {
    id: 'gc_bg_fantasy',
    name: 'Fantasy Realm',
    price: '7800',
    isNew: true,
    image: require('../../assets/Game coins/Ludo bACKGROUND/Fantansacy Board.png'),
  },
  gc_bg_jungle: {
    id: 'gc_bg_jungle',
    name: 'Wild Jungle',
    price: '12500',
    isNew: false,
    image: require('../../assets/Game coins/Ludo bACKGROUND/Jungle Board.png'),
  },
  gc_bg_neon: {
    id: 'gc_bg_neon',
    name: 'Cyber Neon',
    price: '19800',
    isNew: true,
    image: require('../../assets/Game coins/Ludo bACKGROUND/Neoan Board.png'),
  },
  gc_bg_pirate: {
    id: 'gc_bg_pirate',
    name: 'Pirate Cove',
    price: '26400',
    isNew: false,
    image: require('../../assets/Game coins/Ludo bACKGROUND/Pirate Board.png'),
  },
  gc_bg_space: {
    id: 'gc_bg_space',
    name: 'Cosmic Space',
    price: '38000',
    isNew: false,
    image: require('../../assets/Game coins/Ludo bACKGROUND/Space Board.png'),
  },
};

// Aliases for backward compatibility with previous ID schemes
const BOARD_ALIASES = {
  gc_bg_island: 'gc_bg_pirate',
  gc_bg_castle: 'gc_bg_royal',
};

export const LUDO_BOARD_ITEMS_LIST = Object.values(LUDO_BOARD_SKINS);

/**
 * Returns the full board skin object with local image asset
 */
export const getLudoBoardSkin = (boardIdOrObj) => {
  if (!boardIdOrObj) return null;
  const id = typeof boardIdOrObj === 'string' ? boardIdOrObj : boardIdOrObj?.id;
  if (id) {
    if (LUDO_BOARD_SKINS[id]) return LUDO_BOARD_SKINS[id];
    const aliasedId = BOARD_ALIASES[id];
    if (aliasedId && LUDO_BOARD_SKINS[aliasedId]) return LUDO_BOARD_SKINS[aliasedId];
  }
  if (typeof boardIdOrObj === 'object' && boardIdOrObj?.image) {
    return boardIdOrObj;
  }
  return null;
};

/**
 * Reads equipped board from AsyncStorage and returns the full skin object
 */
export const getEquippedLudoBoard = async () => {
  try {
    const raw = await AsyncStorage.getItem('@equipped_ludo_bg');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const skin = getLudoBoardSkin(parsed);
    return skin || parsed;
  } catch (err) {
    return null;
  }
};

/**
 * Saves equipped board to AsyncStorage
 */
export const saveEquippedLudoBoard = async (boardItem) => {
  if (!boardItem) return;
  try {
    const data = {
      id: boardItem.id,
      name: boardItem.name,
    };
    await AsyncStorage.setItem('@equipped_ludo_bg', JSON.stringify(data));
  } catch (err) {
    // silent fallback
  }
};
