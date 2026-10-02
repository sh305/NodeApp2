// Dedicated Couple Emojis loaded from assets/icons/Couple emoji pack
export const COUPLE_EMOJIS = [
  {
    id: 'cp_milk_love',
    emoji: '🐻‍❄️',
    label: 'Love Hug',
    isCp: true,
    category: 'cp',
    localGif: require('../../assets/icons/Couple emoji pack/10241-milkandmochalove.gif'),
  },
  {
    id: 'cp_milk_cuddle',
    emoji: '🤍',
    label: 'Sweet Cuddle',
    isCp: true,
    category: 'cp',
    localGif: require('../../assets/icons/Couple emoji pack/51520-milkandmochalove1.gif'),
  },
  {
    id: 'cp_milk_kiss',
    emoji: '💋',
    label: 'Romantic Kiss',
    isCp: true,
    category: 'cp',
    localGif: require('../../assets/icons/Couple emoji pack/11596-milkandmochalove4.gif'),
  },
  {
    id: 'cp_milk_heart',
    emoji: '💖',
    label: 'Heart Pop',
    isCp: true,
    category: 'cp',
    localGif: require('../../assets/icons/Couple emoji pack/58253-milkandmochalove5.gif'),
  },
  {
    id: 'cp_milk_warmth',
    emoji: '🥰',
    label: 'Pure Warmth',
    isCp: true,
    category: 'cp',
    localGif: require('../../assets/icons/Couple emoji pack/49142-milkandmochalove6.gif'),
  },
  {
    id: 'cp_milk_pat',
    emoji: '🧸',
    label: 'Gentle Care',
    isCp: true,
    category: 'cp',
    localGif: require('../../assets/icons/Couple emoji pack/40651-milkandmochalove7.gif'),
  },
];

export const COUPLE_EMOJI_MAP = {
  cp_milk_love: require('../../assets/icons/Couple emoji pack/10241-milkandmochalove.gif'),
  cp_milk_cuddle: require('../../assets/icons/Couple emoji pack/51520-milkandmochalove1.gif'),
  cp_milk_kiss: require('../../assets/icons/Couple emoji pack/11596-milkandmochalove4.gif'),
  cp_milk_heart: require('../../assets/icons/Couple emoji pack/58253-milkandmochalove5.gif'),
  cp_milk_warmth: require('../../assets/icons/Couple emoji pack/49142-milkandmochalove6.gif'),
  cp_milk_pat: require('../../assets/icons/Couple emoji pack/40651-milkandmochalove7.gif'),

  // Fallback mappings for backwards compatibility with any previous CP emoji IDs
  cp_kiss: require('../../assets/icons/Couple emoji pack/11596-milkandmochalove4.gif'),
  cp_hug: require('../../assets/icons/Couple emoji pack/10241-milkandmochalove.gif'),
  cp_propose: require('../../assets/icons/Couple emoji pack/58253-milkandmochalove5.gif'),
  cp_dance: require('../../assets/icons/Couple emoji pack/49142-milkandmochalove6.gif'),
  cp_holding_hands: require('../../assets/icons/Couple emoji pack/51520-milkandmochalove1.gif'),
  cp_heart_lock: require('../../assets/icons/Couple emoji pack/58253-milkandmochalove5.gif'),
  cp_wedding: require('../../assets/icons/Couple emoji pack/40651-milkandmochalove7.gif'),
  cp_shy_love: require('../../assets/icons/Couple emoji pack/49142-milkandmochalove6.gif'),
};

export const getCoupleEmojiSource = (id) => {
  if (!id) return null;
  return COUPLE_EMOJI_MAP[id] || null;
};
