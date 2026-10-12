import AsyncStorage from '@react-native-async-storage/async-storage';

export const LUDO_PIECE_SKINS = {
  gc_piece_king: {
    id: 'gc_piece_king',
    name: 'Royal King',
    price: '2800',
    isNew: true,
    image: require('../../assets/Game coins/lUDO PIECSE/King Piecse.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/king_red.png'),
      green: require('../../assets/ludo_tokens/king_green.png'),
      yellow: require('../../assets/ludo_tokens/king_yellow.png'),
      blue: require('../../assets/ludo_tokens/king_blue.png'),
    },
  },
  gc_piece_lion: {
    id: 'gc_piece_lion',
    name: 'Majestic Lion',
    price: '5600',
    isNew: true,
    image: require('../../assets/Game coins/lUDO PIECSE/Lion Pieces.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/lion_red.png'),
      green: require('../../assets/ludo_tokens/lion_green.png'),
      yellow: require('../../assets/ludo_tokens/lion_yellow.png'),
      blue: require('../../assets/ludo_tokens/lion_blue.png'),
    },
  },
  gc_piece_elephant: {
    id: 'gc_piece_elephant',
    name: 'Royal Elephant',
    price: '8800',
    isNew: false,
    image: require('../../assets/Game coins/lUDO PIECSE/Elephant piecse.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/elephant_red.png'),
      green: require('../../assets/ludo_tokens/elephant_green.png'),
      yellow: require('../../assets/ludo_tokens/elephant_yellow.png'),
      blue: require('../../assets/ludo_tokens/elephant_blue.png'),
    },
  },
  gc_piece_peacock: {
    id: 'gc_piece_peacock',
    name: 'Royal Peacock',
    price: '12400',
    isNew: true,
    image: require('../../assets/Game coins/lUDO PIECSE/Peacock pieces.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/peacock_red.png'),
      green: require('../../assets/ludo_tokens/peacock_green.png'),
      yellow: require('../../assets/ludo_tokens/peacock_yellow.png'),
      blue: require('../../assets/ludo_tokens/peacock_blue.png'),
    },
  },
  gc_piece_princess: {
    id: 'gc_piece_princess',
    name: 'Princess Doll',
    price: '16800',
    isNew: false,
    image: require('../../assets/Game coins/lUDO PIECSE/Girls Piecse.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/princess_red.png'),
      green: require('../../assets/ludo_tokens/princess_green.png'),
      yellow: require('../../assets/ludo_tokens/princess_yellow.png'),
      blue: require('../../assets/ludo_tokens/princess_blue.png'),
    },
  },
  gc_piece_bird: {
    id: 'gc_piece_bird',
    name: 'Chintoo Bird',
    price: '21500',
    isNew: false,
    image: require('../../assets/Game coins/lUDO PIECSE/Bird Piecse.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/bird_red.png'),
      green: require('../../assets/ludo_tokens/bird_green.png'),
      yellow: require('../../assets/ludo_tokens/bird_yellow.png'),
      blue: require('../../assets/ludo_tokens/bird_blue.png'),
    },
  },
  gc_piece_dog: {
    id: 'gc_piece_dog',
    name: 'Puppy Dog',
    price: '27200',
    isNew: true,
    image: require('../../assets/Game coins/lUDO PIECSE/Dog Piecse.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/dog_red.png'),
      green: require('../../assets/ludo_tokens/dog_green.png'),
      yellow: require('../../assets/ludo_tokens/dog_yellow.png'),
      blue: require('../../assets/ludo_tokens/dog_blue.png'),
    },
  },
  gc_piece_car: {
    id: 'gc_piece_car',
    name: 'Turbo Car',
    price: '34600',
    isNew: false,
    image: require('../../assets/Game coins/lUDO PIECSE/Car Piecse.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/car_red.png'),
      green: require('../../assets/ludo_tokens/car_green.png'),
      yellow: require('../../assets/ludo_tokens/car_yellow.png'),
      blue: require('../../assets/ludo_tokens/car_blue.png'),
    },
  },
  gc_piece_cartoon: {
    id: 'gc_piece_cartoon',
    name: 'Cartoon Buddy',
    price: '45000',
    isNew: true,
    image: require('../../assets/Game coins/lUDO PIECSE/cartoon piece.png'),
    tokens: {
      red: require('../../assets/ludo_tokens/cartoon_red.png'),
      green: require('../../assets/ludo_tokens/cartoon_green.png'),
      yellow: require('../../assets/ludo_tokens/cartoon_yellow.png'),
      blue: require('../../assets/ludo_tokens/cartoon_blue.png'),
    },
  },
};

// Aliases for backward compatibility with previous ID schemes
const PIECE_ALIASES = {
  gc_piece_gold_king: 'gc_piece_king',
  gc_piece_ruby_crown: 'gc_piece_princess',
  gc_piece_emerald_jade: 'gc_piece_elephant',
  gc_piece_frost_crystal: 'gc_piece_peacock',
  gc_piece_cyber_neon: 'gc_piece_car',
  gc_piece_cosmic_galaxy: 'gc_piece_cartoon',
  gc_piece_shadow_obsidian: 'gc_piece_lion',
  gc_piece_fire_dragon: 'gc_piece_dog',
};

export const LUDO_PIECE_ITEMS_LIST = Object.values(LUDO_PIECE_SKINS);

/**
 * Returns the full piece skin object with local 4-color assets
 */
export const getLudoPieceSkin = (pieceIdOrObj) => {
  if (!pieceIdOrObj) return null;
  const id = typeof pieceIdOrObj === 'string' ? pieceIdOrObj : pieceIdOrObj?.id;
  if (id) {
    if (LUDO_PIECE_SKINS[id]) return LUDO_PIECE_SKINS[id];
    const aliasedId = PIECE_ALIASES[id];
    if (aliasedId && LUDO_PIECE_SKINS[aliasedId]) return LUDO_PIECE_SKINS[aliasedId];
  }
  if (typeof pieceIdOrObj === 'object' && pieceIdOrObj?.tokens) {
    return pieceIdOrObj;
  }
  return null;
};

/**
 * Reads equipped piece from AsyncStorage and returns the full skin object
 */
export const getEquippedLudoPiece = async () => {
  try {
    const raw = await AsyncStorage.getItem('@equipped_piece');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const skin = getLudoPieceSkin(parsed);
    return skin || parsed;
  } catch (err) {
    return null;
  }
};

/**
 * Saves equipped piece to AsyncStorage
 */
export const saveEquippedLudoPiece = async (pieceItem) => {
  if (!pieceItem) return;
  try {
    const data = {
      id: pieceItem.id,
      name: pieceItem.name,
    };
    await AsyncStorage.setItem('@equipped_piece', JSON.stringify(data));
  } catch (err) {
    // silent fallback
  }
};
