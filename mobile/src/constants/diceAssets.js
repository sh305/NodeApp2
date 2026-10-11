import AsyncStorage from '@react-native-async-storage/async-storage';

export const DICE_SKINS = {
  gc_dice_ice: {
    id: 'gc_dice_ice',
    name: 'Ice',
    price: '2820',
    image: require('../../assets/Game coins/differnt types of dice/Royal Blue Dice.png'),
  },
  gc_dice_faith: {
    id: 'gc_dice_faith',
    name: 'Faith',
    price: '5640',
    image: require('../../assets/Game coins/differnt types of dice/Luxury Metallic Gold Dice.png'),
  },
  gc_dice_starry_sky: {
    id: 'gc_dice_starry_sky',
    name: 'Starry Sky',
    price: '15520',
    image: require('../../assets/Game coins/differnt types of dice/Translucent Purple Crystal Dice.png'),
  },
  gc_dice_warrior: {
    id: 'gc_dice_warrior',
    name: 'Warrior',
    price: '29280',
    image: require('../../assets/Game coins/differnt types of dice/Natural Wooden Dice.png'),
  },
  gc_dice_electronic: {
    id: 'gc_dice_electronic',
    name: 'Electronic',
    price: '36500',
    image: require('../../assets/Game coins/differnt types of dice/Matte Black Gaming Dice.png'),
  },
  gc_dice_dragon_ball: {
    id: 'gc_dice_dragon_ball',
    name: 'Dragon Ball',
    price: '48200',
    image: require('../../assets/Game coins/differnt types of dice/Bright Orange Isometric Dice.png'),
  },
};

// Aliases for backward compatibility with previous ID schemes and default fallbacks
const DICE_ALIASES = {
  gc_dice_royal_blue: 'gc_dice_ice',
  gc_dice_luxury_gold: 'gc_dice_faith',
  gc_dice_translucent_purple: 'gc_dice_starry_sky',
  gc_dice_natural_wood: 'gc_dice_warrior',
  gc_dice_matte_black: 'gc_dice_electronic',
  gc_dice_bright_orange: 'gc_dice_dragon_ball',
  gc_dice_classic_white: 'gc_dice_ice',
  gc_dice_glossy_yellow: 'gc_dice_faith',
  gc_dice_glossy_red: 'gc_dice_starry_sky',
  gc_dice_vector_green: 'gc_dice_warrior',
};

export const DICE_ITEMS_LIST = Object.values(DICE_SKINS);

/**
 * Returns the full dice skin object with local image asset
 */
export const getDiceSkin = (diceIdOrObj) => {
  if (!diceIdOrObj) return null;
  const id = typeof diceIdOrObj === 'string' ? diceIdOrObj : diceIdOrObj?.id;
  if (id) {
    if (DICE_SKINS[id]) return DICE_SKINS[id];
    const aliasedId = DICE_ALIASES[id];
    if (aliasedId && DICE_SKINS[aliasedId]) return DICE_SKINS[aliasedId];
  }
  if (typeof diceIdOrObj === 'object' && diceIdOrObj?.image) {
    return diceIdOrObj;
  }
  return null;
};

/**
 * Reads equipped dice from AsyncStorage and returns the full skin object
 */
export const getEquippedDice = async () => {
  try {
    const raw = await AsyncStorage.getItem('@equipped_dice');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const skin = getDiceSkin(parsed);
    return skin || parsed;
  } catch (err) {
    return null;
  }
};

/**
 * Saves equipped dice to AsyncStorage
 */
export const saveEquippedDice = async (diceItem) => {
  if (!diceItem) return;
  try {
    const data = {
      id: diceItem.id,
      name: diceItem.name,
    };
    await AsyncStorage.setItem('@equipped_dice', JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save equipped dice:', err);
  }
};
