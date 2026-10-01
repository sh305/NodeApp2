// Official Google Noto Animated Emoji CDN (https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/512.gif)
export const NOTO_EMOJIS = {
  // Page 1
  weary_sigh: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f629/512.gif',
  laugh_cry: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif',
  loud_cry: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.gif',
  heart_wink: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/512.gif',
  heart_blush: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.gif',
  giggle: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92d/512.gif',
  shy_peek: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.gif',
  cool_shades: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif',

  // Page 2
  mask_face: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f637/512.gif',
  shocked_wide: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f632/512.gif',
  screaming_shock: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f631/512.gif',
  praying_hands: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif',
  fire_hype: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif',
  time_bomb: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a3/512.gif',
  hug_warm: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.gif',
  star_eyes: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif',

  // Page 3
  money_face: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f911/512.gif',
  party_popper: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif',
  pleading: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f97a/512.gif',
  rage_red: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.gif',
  snore_sleep: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f634/512.gif',
  sleepy_sigh: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f971/512.gif',
  think_chin: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif',
  vomit_green: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92e/512.gif',

  // Page 4
  wink_smirk: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f609/512.gif',
  smirk_wavy: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92a/512.gif',
  angel_halo: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f607/512.gif',
  lipstick_kiss: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48b/512.gif',
  wave_hand: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif',
  clap_hands: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif',
  hundred_pts: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.gif',
  biceps_flex: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.gif',
};

export const getIconScoutGif = (id, emoji) => {
  if (id && NOTO_EMOJIS[id]) return NOTO_EMOJIS[id];

  // Direct emoji matching fallback
  if (emoji === '😩') return NOTO_EMOJIS.weary_sigh;
  if (emoji === '😂' || emoji === '🤣') return NOTO_EMOJIS.laugh_cry;
  if (emoji === '😭') return NOTO_EMOJIS.loud_cry;
  if (emoji === '😘' || emoji === '😚') return NOTO_EMOJIS.heart_wink;
  if (emoji === '🥰') return NOTO_EMOJIS.heart_blush;
  if (emoji === '🤭') return NOTO_EMOJIS.giggle;
  if (emoji === '🙈') return NOTO_EMOJIS.shy_peek;
  if (emoji === '😎') return NOTO_EMOJIS.cool_shades;
  if (emoji === '😷') return NOTO_EMOJIS.mask_face;
  if (emoji === '😲') return NOTO_EMOJIS.shocked_wide;
  if (emoji === '😱') return NOTO_EMOJIS.screaming_shock;
  if (emoji === '🙏') return NOTO_EMOJIS.praying_hands;
  if (emoji === '🔥') return NOTO_EMOJIS.fire_hype;
  if (emoji === '💣') return NOTO_EMOJIS.time_bomb;
  if (emoji === '🤗') return NOTO_EMOJIS.hug_warm;
  if (emoji === '🤩') return NOTO_EMOJIS.star_eyes;
  if (emoji === '🤑') return NOTO_EMOJIS.money_face;
  if (emoji === '🥳') return NOTO_EMOJIS.party_popper;
  if (emoji === '🥺') return NOTO_EMOJIS.pleading;
  if (emoji === '😡') return NOTO_EMOJIS.rage_red;
  if (emoji === '😴') return NOTO_EMOJIS.snore_sleep;
  if (emoji === '🥱') return NOTO_EMOJIS.sleepy_sigh;
  if (emoji === '🤔') return NOTO_EMOJIS.think_chin;
  if (emoji === '🤮') return NOTO_EMOJIS.vomit_green;
  if (emoji === '😉') return NOTO_EMOJIS.wink_smirk;
  if (emoji === '🥴') return NOTO_EMOJIS.smirk_wavy;
  if (emoji === '😇') return NOTO_EMOJIS.angel_halo;
  if (emoji === '💋') return NOTO_EMOJIS.lipstick_kiss;
  if (emoji === '👋') return NOTO_EMOJIS.wave_hand;
  if (emoji === '👏') return NOTO_EMOJIS.clap_hands;
  if (emoji === '💯') return NOTO_EMOJIS.hundred_pts;
  if (emoji === '💪') return NOTO_EMOJIS.biceps_flex;

  return null;
};
