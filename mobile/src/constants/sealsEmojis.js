// Dedicated Seals Animated Emojis loaded from assets/icons/Seals emoji pack
export const SEALS_EMOJIS_PAGES = [
  // Page 1: Happy, Cute & Celebratory Seals (8 Emojis)
  [
    {
      id: 'seal_pleading',
      emoji: '🥺',
      label: 'Seal Pleading',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/111624-sappypleading.gif'),
    },
    {
      id: 'seal_uwu',
      emoji: '🥰',
      label: 'Seal UwU',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/25588-sappyuwu.gif'),
    },
    {
      id: 'seal_hearts',
      emoji: '💖',
      label: 'Seal Hearts',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/69397-sappyhearts.gif'),
    },
    {
      id: 'seal_cheer',
      emoji: '🎉',
      label: 'Seal Cheer',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/709156-sappycheer.gif'),
    },
    {
      id: 'seal_dance_1',
      emoji: '💃',
      label: 'Happy Dance',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/69397-sappydance1.gif'),
    },
    {
      id: 'seal_dance_2',
      emoji: '🕺',
      label: 'Wiggle Dance',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/653406-sappydance2.gif'),
    },
    {
      id: 'seal_birthday_drum',
      emoji: '🥁',
      label: 'Birthday Drum',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/200987-sappybirthdaydrum.gif'),
    },
    {
      id: 'seal_squish',
      emoji: '🐾',
      label: 'Squishy Seal',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/568155-sappysquish.gif'),
    },
  ],

  // Page 2: Mood, Expressive & Fun Action Seals (8 Emojis)
  [
    {
      id: 'seal_crying',
      emoji: '😭',
      label: 'Seal Crying',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/653406-sappycrying.gif'),
    },
    {
      id: 'seal_sad_roll',
      emoji: '😢',
      label: 'Sad Roll',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/69397-sappysadrollover.gif'),
    },
    {
      id: 'seal_tired',
      emoji: '🥱',
      label: 'Seal Tired',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/332471-sappytired.gif'),
    },
    {
      id: 'seal_this_is_fine',
      emoji: '☕',
      label: 'This Is Fine',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/332471-sappythisisfine.gif'),
    },
    {
      id: 'seal_look_around',
      emoji: '👀',
      label: 'Looking Around',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/435934-sappylookaround.gif'),
    },
    {
      id: 'seal_gun',
      emoji: '🔫',
      label: 'Finger Gun',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/43375-sappygun.gif'),
    },
    {
      id: 'seal_gunpoint',
      emoji: '🎯',
      label: 'Surrender',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/630455-sappygunpoint.gif'),
    },
    {
      id: 'seal_bang',
      emoji: '💥',
      label: 'Bang Bang',
      category: 'seals',
      localGif: require('../../assets/icons/Seals emoji pack/43375-sappybang.gif'),
    },
  ],
];

export const SEALS_EMOJI_MAP = {
  seal_pleading: require('../../assets/icons/Seals emoji pack/111624-sappypleading.gif'),
  seal_uwu: require('../../assets/icons/Seals emoji pack/25588-sappyuwu.gif'),
  seal_hearts: require('../../assets/icons/Seals emoji pack/69397-sappyhearts.gif'),
  seal_cheer: require('../../assets/icons/Seals emoji pack/709156-sappycheer.gif'),
  seal_dance_1: require('../../assets/icons/Seals emoji pack/69397-sappydance1.gif'),
  seal_dance_2: require('../../assets/icons/Seals emoji pack/653406-sappydance2.gif'),
  seal_birthday_drum: require('../../assets/icons/Seals emoji pack/200987-sappybirthdaydrum.gif'),
  seal_squish: require('../../assets/icons/Seals emoji pack/568155-sappysquish.gif'),
  seal_crying: require('../../assets/icons/Seals emoji pack/653406-sappycrying.gif'),
  seal_sad_roll: require('../../assets/icons/Seals emoji pack/69397-sappysadrollover.gif'),
  seal_tired: require('../../assets/icons/Seals emoji pack/332471-sappytired.gif'),
  seal_this_is_fine: require('../../assets/icons/Seals emoji pack/332471-sappythisisfine.gif'),
  seal_look_around: require('../../assets/icons/Seals emoji pack/435934-sappylookaround.gif'),
  seal_gun: require('../../assets/icons/Seals emoji pack/43375-sappygun.gif'),
  seal_gunpoint: require('../../assets/icons/Seals emoji pack/630455-sappygunpoint.gif'),
  seal_bang: require('../../assets/icons/Seals emoji pack/43375-sappybang.gif'),
};

export const getSealEmojiSource = (id) => {
  if (!id) return null;
  return SEALS_EMOJI_MAP[id] || null;
};
