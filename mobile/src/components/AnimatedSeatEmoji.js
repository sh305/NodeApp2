import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import VipLionSticker from './VipLionSticker';
import CpCoupleSticker from './CpCoupleSticker';
import { getIconScoutGif } from '../constants/iconScoutEmojis';
import { getCoupleEmojiSource } from '../constants/coupleEmojis';
import { getSealEmojiSource } from '../constants/sealsEmojis';

// Precise action mapper for every emoji
const getEmojiAction = (emoji, id) => {
  if (id === 'lucky_dice' || id === 'lucky_dice_2' || emoji === '🎲') return 'dice';
  if (id === 'slot_machine' || id === 'slot_777' || emoji === '🎰' || emoji === '777') return 'slot';
  if (id === 'cp_cheers' || emoji === '🥂') return 'cheers';
  if (id === 'target_bullseye' || emoji === '🎯') return 'target';
  if (id === 'rocket_launch' || emoji === '🚀') return 'rocket';
  if (id === 'gold_cup' || emoji === '🏆') return 'trophy';

  // Laughter & Fun
  if (id === 'laugh_cry' || emoji === '😂' || emoji === '🤣' || emoji === '😆') return 'laugh';
  if (id === 'giggle' || emoji === '🤭') return 'giggle';
  if (id === 'shy_peek' || emoji === '🙈') return 'shy';
  if (id === 'party_popper' || emoji === '🥳') return 'party';
  if (id === 'star_eyes' || emoji === '🤩') return 'star';

  // Love & Kiss
  if (id === 'kiss_whistle' || id === 'sweet_kiss' || id === 'heart_wink' || id === 'cp_kiss' || emoji === '😘' || emoji === '😚') return 'kiss';
  if (id === 'lipstick_kiss' || emoji === '💋') return 'lipstick';
  if (id === 'heart_blush' || id === 'cp_heart' || id === 'lion_heart' || emoji === '🥰' || emoji === '💖') return 'heart';
  if (id === 'cp_rose' || emoji === '🌹') return 'rose';
  if (id === 'cp_ring' || emoji === '💍') return 'ring';
  if (id === 'cp_teddy' || emoji === '🧸') return 'teddy';
  if (id === 'hug_warm' || emoji === '🤗') return 'hug';

  // Sadness & Crying
  if (id === 'loud_cry' || emoji === '😭') return 'cry';
  if (id === 'sad_down' || emoji === '😔' || emoji === '😢') return 'sad';
  if (id === 'pleading' || emoji === '🥺') return 'plead';

  // Anger & Shock
  if (id === 'rage_red' || emoji === '😡' || emoji === '👿') return 'angry';
  if (id === 'shocked_wide' || emoji === '😲') return 'shock';
  if (id === 'sparkle_eyes' || emoji === '😳') return 'blush';
  if (id === 'roll_eyes' || emoji === '🙄') return 'roll_eyes';

  // Sleep & Rest
  if (id === 'snore_sleep' || emoji === '😴') return 'sleep';
  if (id === 'sleepy_sigh' || emoji === '🥱') return 'yawn';

  // Actions & Gestures
  if (id === 'wave_hand' || id === 'lion_bye' || emoji === '👋') return 'wave';
  if (id === 'praying_hands' || id === 'pray_dua' || emoji === '🙏' || emoji === '🤲') return 'pray';
  if (id === 'think_chin' || emoji === '🤔') return 'think';
  if (id === 'wink_smirk' || emoji === '😉') return 'wink';
  if (id === 'smirk_wavy' || emoji === '🥴') return 'wavy';
  if (id === 'wash_hands' || emoji === '🚰') return 'clean';
  if (id === 'angel_halo' || emoji === '😇') return 'angel';
  if (id === 'vomit_green' || emoji === '🤮') return 'vomit';
  if (id === 'money_face' || id === 'lion_rich' || emoji === '🤑') return 'rich';
  if (id === 'cool_shades' || id === 'lion_cool' || emoji === '😎') return 'cool';

  // Elements & Power
  if (id === 'comic_boom' || id === 'time_bomb' || id === 'game_bomb' || emoji === '💣' || emoji === '💥') return 'boom';
  if (id === 'fire_hype' || id === 'lion_roar' || emoji === '🔥') return 'fire';
  if (id === 'royal_crown' || emoji === '👑') return 'crown';
  if (id === 'giant_gem' || emoji === '💎') return 'gem';
  if (id === 'lightning_zap' || emoji === '⚡') return 'zap';

  return 'bounce';
};

/* ══════════════════════════════════════════════════════════
   1. REAL CHEERS (🥂): TWO GLASSES CLINKING & SPARKLES
   ══════════════════════════════════════════════════════════ */
function CheersClinkVisual({ size = 50 }) {
  const leftX = useRef(new Animated.Value(-16)).current;
  const rightX = useRef(new Animated.Value(16)).current;
  const leftRotate = useRef(new Animated.Value(-24)).current;
  const rightRotate = useRef(new Animated.Value(24)).current;
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Clinking loop: glasses start apart, swing inward, collide with *CLINK*, and spray bubbles!
    const clinkLoop = Animated.loop(
      Animated.sequence([
        // Swing inward to clink
        Animated.parallel([
          Animated.timing(leftX, { toValue: -3, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(rightX, { toValue: 3, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(leftRotate, { toValue: 6, duration: 240, useNativeDriver: true }),
          Animated.timing(rightRotate, { toValue: -6, duration: 240, useNativeDriver: true }),
        ]),
        // Clink impact explosion of sparks
        Animated.parallel([
          Animated.timing(sparkleScale, { toValue: 1.6, duration: 150, useNativeDriver: true }),
          Animated.timing(sparkleOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]),
        Animated.timing(sparkleOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        // Recoil back slightly
        Animated.parallel([
          Animated.timing(leftX, { toValue: -14, duration: 250, useNativeDriver: true }),
          Animated.timing(rightX, { toValue: 14, duration: 250, useNativeDriver: true }),
          Animated.timing(leftRotate, { toValue: -22, duration: 250, useNativeDriver: true }),
          Animated.timing(rightRotate, { toValue: 22, duration: 250, useNativeDriver: true }),
          Animated.timing(sparkleScale, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]),
      ])
    );
    clinkLoop.start();
    return () => clinkLoop.stop();
  }, []);

  const glassSize = Math.round(size * 0.58);

  const leftRotation = leftRotate.interpolate({
    inputRange: [-30, 30],
    outputRange: ['-30deg', '30deg'],
  });
  const rightRotation = rightRotate.interpolate({
    inputRange: [-30, 30],
    outputRange: ['-30deg', '30deg'],
  });

  return (
    <View style={styles.cheersBox}>
      {/* Sparkles / Champagne Bubbles from clink */}
      <Animated.Text
        style={[
          styles.cheersSparks,
          {
            transform: [{ scale: sparkleScale }, { translateY: -14 }],
            opacity: sparkleOpacity,
          },
        ]}
      >
        ✨ 🍾 ✨
      </Animated.Text>

      {/* Left Glass */}
      <Animated.View
        style={[
          styles.glassWrapper,
          {
            transform: [{ translateX: leftX }, { rotate: leftRotation }],
          },
        ]}
      >
        <Text style={{ fontSize: glassSize }}>🥂</Text>
      </Animated.View>

      {/* Right Glass */}
      <Animated.View
        style={[
          styles.glassWrapper,
          {
            transform: [{ translateX: rightX }, { rotate: rightRotation }],
          },
        ]}
      >
        <Text style={{ fontSize: glassSize, transform: [{ scaleX: -1 }] }}>🥂</Text>
      </Animated.View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════
   2. 3D CASINO ROLLING DICE (NO BLACK GLYPHS!)
   ══════════════════════════════════════════════════════════ */
function RollingCasinoDiceVisual({ targetNumber = 6, size = 50 }) {
  const rollRotate = useRef(new Animated.Value(0)).current;
  const rollBounce = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  const [currentNum, setCurrentNum] = useState(1);
  const [isRolling, setIsRolling] = useState(true);

  useEffect(() => {
    // 3D Tumbling & Bouncing Animation
    const rollAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rollRotate, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(rollBounce, { toValue: -14, duration: 180, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(rollRotate, { toValue: -1, duration: 180, useNativeDriver: true }),
          Animated.timing(rollBounce, { toValue: 4, duration: 180, useNativeDriver: true }),
        ]),
      ])
    );
    rollAnim.start();

    // Number ticker
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setCurrentNum(Math.floor(Math.random() * 6) + 1);
      if (count > 9) {
        clearInterval(interval);
        rollAnim.stop();
        setIsRolling(false);
        setCurrentNum(targetNumber);
        // Stamp victory number
        Animated.spring(resultScale, {
          toValue: 1,
          friction: 3,
          tension: 80,
          useNativeDriver: true,
        }).start();
      }
    }, 90);

    return () => {
      rollAnim.stop();
      clearInterval(interval);
    };
  }, []);

  const diceSpin = rollRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-45deg', '0deg', '45deg'],
  });

  const diceSize = Math.round(size * 0.72);

  // Render Real Colorful Casino Dice Dots (White cube + Red/Navy dots, NO black font glyphs)
  const renderDiceFace = (num) => {
    return (
      <View style={[styles.diceCube, { width: diceSize, height: diceSize, borderRadius: 10 }]}>
        {num === 1 && <View style={[styles.pip, styles.pipCenter, styles.pipRed]} />}
        {num === 2 && (
          <>
            <View style={[styles.pip, styles.pipTopLeft]} />
            <View style={[styles.pip, styles.pipBottomRight]} />
          </>
        )}
        {num === 3 && (
          <>
            <View style={[styles.pip, styles.pipTopLeft]} />
            <View style={[styles.pip, styles.pipCenter]} />
            <View style={[styles.pip, styles.pipBottomRight]} />
          </>
        )}
        {num === 4 && (
          <>
            <View style={[styles.pip, styles.pipTopLeft]} />
            <View style={[styles.pip, styles.pipTopRight]} />
            <View style={[styles.pip, styles.pipBottomLeft]} />
            <View style={[styles.pip, styles.pipBottomRight]} />
          </>
        )}
        {num === 5 && (
          <>
            <View style={[styles.pip, styles.pipTopLeft]} />
            <View style={[styles.pip, styles.pipTopRight]} />
            <View style={[styles.pip, styles.pipCenter, styles.pipRed]} />
            <View style={[styles.pip, styles.pipBottomLeft]} />
            <View style={[styles.pip, styles.pipBottomRight]} />
          </>
        )}
        {num === 6 && (
          <>
            <View style={[styles.pip, styles.pipTopLeft]} />
            <View style={[styles.pip, styles.pipTopRight]} />
            <View style={[styles.pip, styles.pipMidLeft]} />
            <View style={[styles.pip, styles.pipMidRight]} />
            <View style={[styles.pip, styles.pipBottomLeft]} />
            <View style={[styles.pip, styles.pipBottomRight]} />
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.diceContainer}>
      <Animated.View
        style={[
          styles.diceMotionWrapper,
          {
            transform: isRolling
              ? [{ translateY: rollBounce }, { rotate: diceSpin }]
              : [{ scale: 1 }],
          },
        ]}
      >
        {renderDiceFace(currentNum)}
      </Animated.View>

      {/* Lucky Result Number Stamp */}
      {!isRolling && (
        <Animated.View
          style={[
            styles.diceWinnerBadge,
            { transform: [{ scale: resultScale }] },
          ]}
        >
          <Text style={styles.diceWinnerText}>🎲 {targetNumber}</Text>
        </Animated.View>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════
   3. BINGO CASINO 777 REELS WITH JACKPOT EXPLOSION
   ══════════════════════════════════════════════════════════ */
function SlotBingoReelsVisual({ size = 50 }) {
  const [reel1, setReel1] = useState('7');
  const [reel2, setReel2] = useState('7');
  const [reel3, setReel3] = useState('7');
  const [isJackpot, setIsJackpot] = useState(false);

  const jackpotPulse = useRef(new Animated.Value(1)).current;
  const coinsY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const symbols = ['7', '💎', '🍒', '7', '🔔', '7', 'BAR'];
    let count = 0;

    const interval = setInterval(() => {
      count++;
      setReel1(symbols[Math.floor(Math.random() * symbols.length)]);
      setReel2(symbols[Math.floor(Math.random() * symbols.length)]);
      setReel3(symbols[Math.floor(Math.random() * symbols.length)]);

      // Reel 1 locks
      if (count === 6) setReel1('7');
      // Reel 2 locks
      if (count === 9) setReel2('7');
      // Reel 3 locks: 777 JACKPOT!
      if (count > 11) {
        clearInterval(interval);
        setReel1('7');
        setReel2('7');
        setReel3('7');
        setIsJackpot(true);

        // Jackpot pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(jackpotPulse, { toValue: 1.25, duration: 180, useNativeDriver: true }),
            Animated.timing(jackpotPulse, { toValue: 0.95, duration: 180, useNativeDriver: true }),
          ])
        ).start();
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const slotW = Math.round(size * 1.15);
  const slotH = Math.round(size * 0.72);

  return (
    <Animated.View style={[styles.slotMachineBox, { width: slotW, height: slotH, transform: [{ scale: jackpotPulse }] }]}>
      <LinearGradient
        colors={isJackpot ? ['#F59E0B', '#EF4444', '#F59E0B'] : ['#475569', '#1E293B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.slotHeaderGrad}
      >
        <Text style={styles.slotHeaderText}>{isJackpot ? '🔥 JACKPOT 🔥' : '🎰 777 BINGO'}</Text>
      </LinearGradient>

      {/* 3 Reels Display */}
      <View style={styles.reelsRow}>
        <View style={styles.reelWindow}>
          <Text style={[styles.reelNum, reel1 === '7' && styles.reelSeven]}>{reel1}</Text>
        </View>
        <View style={styles.reelWindow}>
          <Text style={[styles.reelNum, reel2 === '7' && styles.reelSeven]}>{reel2}</Text>
        </View>
        <View style={styles.reelWindow}>
          <Text style={[styles.reelNum, reel3 === '7' && styles.reelSeven]}>{reel3}</Text>
        </View>
      </View>

      {/* Flying Gold Coins on Jackpot */}
      {isJackpot && (
        <View style={styles.jackpotCoinsWrap}>
          <Text style={styles.jackpotCoinsText}>💰 🪙 💰</Text>
        </View>
      )}
    </Animated.View>
  );
}

/* ══════════════════════════════════════════════════════════
   4. WATER TAP WASH HANDS FLOWING (🚰 💧 👐 🧼 🫧)
   ══════════════════════════════════════════════════════════ */
function WashHandsFlowVisual({ size = 50 }) {
  const waterY = useRef(new Animated.Value(0)).current;
  const waterOpacity = useRef(new Animated.Value(0.4)).current;
  const handsRubX = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0.7)).current;
  const bubbleY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Water flowing continuously from tap
    const waterFlow = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(waterY, { toValue: size * 0.28, duration: 240, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(waterOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(waterY, { toValue: size * 0.44, duration: 140, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(waterOpacity, { toValue: 0.2, duration: 140, useNativeDriver: true }),
        ]),
        Animated.timing(waterY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    waterFlow.start();

    // 2. Hands rubbing together under running water
    const rubHands = Animated.loop(
      Animated.sequence([
        Animated.timing(handsRubX, { toValue: 4, duration: 180, useNativeDriver: true }),
        Animated.timing(handsRubX, { toValue: -4, duration: 180, useNativeDriver: true }),
        Animated.timing(handsRubX, { toValue: 3, duration: 180, useNativeDriver: true }),
        Animated.timing(handsRubX, { toValue: -3, duration: 180, useNativeDriver: true }),
      ])
    );
    rubHands.start();

    // 3. Soap bubbles & water splash
    const bubblesAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(splashScale, { toValue: 1.25, duration: 300, useNativeDriver: true }),
          Animated.timing(bubbleY, { toValue: -10, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(splashScale, { toValue: 0.6, duration: 300, useNativeDriver: true }),
          Animated.timing(bubbleY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ])
    );
    bubblesAnim.start();

    return () => {
      waterFlow.stop();
      rubHands.stop();
      bubblesAnim.stop();
    };
  }, [size]);

  const tapSize = Math.max(22, Math.round(size * 0.48));
  const waterSize = Math.max(14, Math.round(size * 0.32));
  const handsSize = Math.max(20, Math.round(size * 0.45));
  const bubblesSize = Math.max(13, Math.round(size * 0.28));

  return (
    <View style={[styles.washHandsContainer, { width: size * 1.15, height: size * 1.15 }]}>
      {/* 1. Water Tap / Faucet at Top */}
      <View style={[styles.tapWrapper, { top: -Math.round(size * 0.12) }]}>
        <Text style={[styles.tapEmoji, { fontSize: tapSize }]}>🚰</Text>
      </View>

      {/* 2. Pouring Water Droplets Stream */}
      <Animated.View
        style={[
          styles.waterStreamWrap,
          {
            top: Math.round(size * 0.22),
            transform: [{ translateY: waterY }],
            opacity: waterOpacity,
          },
        ]}
      >
        <Text style={[styles.waterDroplets, { fontSize: waterSize }]}>💧 💧</Text>
      </Animated.View>

      {/* 3. Hands Rubbing Together Under Water */}
      <Animated.View
        style={[
          styles.washingHandsWrap,
          {
            bottom: Math.round(size * 0.05),
            transform: [{ translateX: handsRubX }],
          },
        ]}
      >
        <Text style={[styles.handsEmoji, { fontSize: handsSize }]}>👐</Text>
      </Animated.View>

      {/* 4. Soap Foam & Water Splash Splattering */}
      <Animated.View
        style={[
          styles.soapSplashWrap,
          {
            bottom: -Math.round(size * 0.05),
            transform: [{ scale: splashScale }, { translateY: bubbleY }],
          },
        ]}
      >
        <Text style={[styles.soapBubbles, { fontSize: bubblesSize }]}>🫧🧼🫧</Text>
      </Animated.View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT: ANIMATED SEAT EMOJI
   ══════════════════════════════════════════════════════════ */
export default function AnimatedSeatEmoji({
  emoji = '😊',
  emojiData = null,
  onComplete,
  size = 50,
  isHost = false,
}) {
  const emojiId = emojiData?.id || '';
  const action = getEmojiAction(emoji, emojiId);
  const isVipLion = emojiData?.category === 'vip';
  const isCpCouple = emojiData?.category === 'cp' || emojiId?.startsWith('cp_');
  const localAnimatedGif = emojiData?.localGif || getCoupleEmojiSource(emojiId) || getSealEmojiSource(emojiId);
  const gifUrl = emojiData?.iconScoutGif || getIconScoutGif(emojiId, emoji);

  // Core Animated Values
  const mainScale = useRef(new Animated.Value(0.2)).current;
  const moveY = useRef(new Animated.Value(0)).current;
  const moveX = useRef(new Animated.Value(0)).current;
  const rotateVal = useRef(new Animated.Value(0)).current;
  const mainOpacity = useRef(new Animated.Value(1)).current;

  // Particle / Accessory Animated Values
  const particleY = useRef(new Animated.Value(0)).current;
  const particleScale = useRef(new Animated.Value(0)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const tearLeftY = useRef(new Animated.Value(0)).current;
  const tearRightY = useRef(new Animated.Value(0)).current;

  // Shy Peekaboo toggle
  const [peekState, setPeekState] = useState('🙈');

  useEffect(() => {
    // Initial Pop In
    Animated.spring(mainScale, {
      toValue: 1,
      friction: 6,
      tension: 70,
      useNativeDriver: true,
    }).start();

    let loopAnim = null;
    let particleLoop = null;
    let customTimer = null;

    if (localAnimatedGif || isCpCouple || gifUrl) {
      // ══ Google Noto Animated Emoji / CP Couple / Seals Animation ══
      // The GIF/Sticker is already a handcrafted 60fps moving animation.
      // We run a gentle, silky-smooth float wave with useNativeDriver
      // without aggressive 100ms jitter or rapid rotation loops that cause frame drops!
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(moveY, {
            toValue: -6,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(moveY, {
            toValue: 2,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loopAnim.start();
    } else {
      switch (action) {
        case 'cheers':
        case 'dice':
        case 'slot':
          // These have their own dedicated multi-element component logic below!
          break;

        case 'laugh': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(moveY, { toValue: -8, duration: 110, useNativeDriver: true }),
              Animated.timing(rotateVal, { toValue: 1, duration: 110, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(moveY, { toValue: 4, duration: 110, useNativeDriver: true }),
              Animated.timing(rotateVal, { toValue: -1, duration: 110, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(moveY, { toValue: -6, duration: 110, useNativeDriver: true }),
              Animated.timing(rotateVal, { toValue: 1, duration: 110, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(moveY, { toValue: 0, duration: 110, useNativeDriver: true }),
              Animated.timing(rotateVal, { toValue: 0, duration: 110, useNativeDriver: true }),
            ]),
          ])
        );
        loopAnim.start();

        particleLoop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(particleScale, { toValue: 1.3, duration: 240, useNativeDriver: true }),
              Animated.timing(particleOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
              Animated.timing(particleY, { toValue: -14, duration: 240, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(particleScale, { toValue: 0.4, duration: 200, useNativeDriver: true }),
              Animated.timing(particleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ])
        );
        particleLoop.start();
        break;
      }

      case 'giggle': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(moveY, { toValue: -5, duration: 120, useNativeDriver: true }),
            Animated.timing(moveY, { toValue: 2, duration: 120, useNativeDriver: true }),
            Animated.timing(rotateVal, { toValue: 0.6, duration: 150, useNativeDriver: true }),
            Animated.timing(rotateVal, { toValue: -0.6, duration: 150, useNativeDriver: true }),
          ])
        );
        loopAnim.start();
        break;
      }

      case 'kiss':
      case 'lipstick': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(mainScale, { toValue: 0.88, duration: 320, useNativeDriver: true }),
            Animated.timing(mainScale, { toValue: 1.25, duration: 320, useNativeDriver: true }),
            Animated.timing(moveY, { toValue: -6, duration: 200, useNativeDriver: true }),
            Animated.timing(moveY, { toValue: 0, duration: 300, useNativeDriver: true }),
          ])
        );
        loopAnim.start();

        particleLoop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(particleY, { toValue: 0, duration: 0, useNativeDriver: true }),
              Animated.timing(particleScale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
              Animated.timing(particleOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(particleY, { toValue: -36, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(particleScale, { toValue: 1.5, duration: 650, useNativeDriver: true }),
            ]),
            Animated.timing(particleOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          ])
        );
        particleLoop.start();
        break;
      }

      case 'cry': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(moveX, { toValue: -3, duration: 90, useNativeDriver: true }),
            Animated.timing(moveX, { toValue: 3, duration: 90, useNativeDriver: true }),
            Animated.timing(moveY, { toValue: 3, duration: 150, useNativeDriver: true }),
            Animated.timing(moveY, { toValue: -2, duration: 150, useNativeDriver: true }),
          ])
        );
        loopAnim.start();

        particleLoop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(tearLeftY, { toValue: 0, duration: 0, useNativeDriver: true }),
              Animated.timing(tearRightY, { toValue: 0, duration: 0, useNativeDriver: true }),
              Animated.timing(particleOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(tearLeftY, { toValue: 20, duration: 380, useNativeDriver: true }),
              Animated.timing(tearRightY, { toValue: 20, duration: 380, useNativeDriver: true }),
            ]),
            Animated.timing(particleOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
          ])
        );
        particleLoop.start();
        break;
      }

      case 'angry': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(moveX, { toValue: -5, duration: 50, useNativeDriver: true }),
            Animated.timing(moveX, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(moveX, { toValue: -3, duration: 50, useNativeDriver: true }),
            Animated.timing(moveX, { toValue: 3, duration: 50, useNativeDriver: true }),
            Animated.timing(mainScale, { toValue: 1.25, duration: 200, useNativeDriver: true }),
            Animated.timing(mainScale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
          ])
        );
        loopAnim.start();
        break;
      }

      case 'wave': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(rotateVal, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(rotateVal, { toValue: -1, duration: 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(rotateVal, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(rotateVal, { toValue: -1, duration: 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        loopAnim.start();
        break;
      }

      case 'sleep': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(mainScale, { toValue: 1.18, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(mainScale, { toValue: 0.94, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        loopAnim.start();
        break;
      }

      case 'rich': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(moveY, { toValue: -10, duration: 250, useNativeDriver: true }),
            Animated.timing(moveY, { toValue: 2, duration: 250, useNativeDriver: true }),
            Animated.timing(rotateVal, { toValue: 0.8, duration: 200, useNativeDriver: true }),
            Animated.timing(rotateVal, { toValue: -0.8, duration: 200, useNativeDriver: true }),
          ])
        );
        loopAnim.start();
        break;
      }

      case 'shy': {
        let isCovered = true;
        customTimer = setInterval(() => {
          isCovered = !isCovered;
          setPeekState(isCovered ? '🙈' : '🐵');
        }, 450);

        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(moveY, { toValue: -6, duration: 220, useNativeDriver: true }),
            Animated.timing(moveY, { toValue: 2, duration: 220, useNativeDriver: true }),
          ])
        );
        loopAnim.start();
        break;
      }

      case 'heart': {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(mainScale, { toValue: 1.35, duration: 140, useNativeDriver: true }),
            Animated.timing(mainScale, { toValue: 1.05, duration: 120, useNativeDriver: true }),
            Animated.timing(mainScale, { toValue: 1.45, duration: 140, useNativeDriver: true }),
            Animated.timing(mainScale, { toValue: 1.0, duration: 350, useNativeDriver: true }),
          ])
        );
        loopAnim.start();
        break;
      }

      default: {
        loopAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(moveY, { toValue: -10, duration: 320, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(moveY, { toValue: 3, duration: 320, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        loopAnim.start();
        break;
      }
    }
  }

    // Graceful Exit after 3.3s
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(mainOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(moveY, { toValue: -22, duration: 350, useNativeDriver: true }),
        Animated.timing(mainScale, { toValue: 0.3, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }, 3300);

    return () => {
      if (loopAnim) loopAnim.stop();
      if (particleLoop) particleLoop.stop();
      if (customTimer) clearInterval(customTimer);
      clearTimeout(exitTimer);
    };
  }, [action, gifUrl]);

  const rotation = rotateVal.interpolate({
    inputRange: [-1, 0, 1],
    outputRange:
      action === 'wave'
        ? ['-28deg', '0deg', '28deg']
        : action === 'laugh'
        ? ['-14deg', '0deg', '14deg']
        : ['-12deg', '0deg', '12deg'],
  });

  const fontSize = Math.round(size * 0.72);
  const targetDiceNum = emojiData?.diceValue || Math.floor(Math.random() * 6) + 1;

  return (
    <View
      style={[
        styles.circleContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      pointerEvents="none"
    >
      {/* ══ 1. CHEERS CLINKING GLASSES ══ */}
      {action === 'cheers' && <CheersClinkVisual size={size} />}

      {/* ══ 2. 3D CASINO ROLLING DICE ══ */}
      {action === 'dice' && <RollingCasinoDiceVisual targetNumber={targetDiceNum} size={size} />}

      {/* ══ 3. CASINO 777 BINGO REELS ══ */}
      {action === 'slot' && <SlotBingoReelsVisual size={size} />}

      {/* ══ 4. WATER TAP WASH HANDS FLOWING ══ */}
      {action === 'clean' && <WashHandsFlowVisual size={size} />}

      {/* ══ 5. STANDARD & VIP EXPRESSIVE EMOJIS ══ */}
      {action !== 'cheers' && action !== 'dice' && action !== 'slot' && action !== 'clean' && (
        <Animated.View
          style={[
            styles.emojiCenterWrapper,
            {
              transform: [
                { translateY: moveY },
                { translateX: moveX },
                { scale: mainScale },
                ...(localAnimatedGif || gifUrl ? [] : [{ rotate: rotation }]),
              ],
              opacity: mainOpacity,
            },
          ]}
        >
          {localAnimatedGif ? (
            <Image
              source={localAnimatedGif}
              style={{ width: Math.round(size * 1.3), height: Math.round(size * 1.3) }}
              resizeMode="contain"
            />
          ) : isCpCouple ? (
            <CpCoupleSticker id={emojiData?.id || emojiId} size={Math.round(size * 1.15)} />
          ) : gifUrl ? (
            <Image
              source={{ uri: gifUrl }}
              style={{ width: Math.round(size * 1.1), height: Math.round(size * 1.1) }}
              resizeMode="contain"
            />
          ) : isVipLion ? (
            <VipLionSticker id={emojiData.id} size={size * 0.95} />
          ) : (
            <Text style={[styles.emojiChar, { fontSize }]}>
              {action === 'shy' ? peekState : emoji}
            </Text>
          )}
        </Animated.View>
      )}

      {/* ══ ACTION PARTICLES (Tears, Hearts, Steam) ══ */}
      {!localAnimatedGif && !gifUrl && action === 'laugh' && (
        <>
          <Animated.Text style={[styles.laughTearLeft, { transform: [{ translateY: particleY }, { scale: particleScale }], opacity: particleOpacity }]}>💧</Animated.Text>
          <Animated.Text style={[styles.laughTearRight, { transform: [{ translateY: particleY }, { scale: particleScale }], opacity: particleOpacity }]}>💧</Animated.Text>
        </>
      )}

      {!gifUrl && (action === 'kiss' || action === 'lipstick') && (
        <Animated.Text style={[styles.flyingHeartParticle, { transform: [{ translateY: particleY }, { scale: particleScale }], opacity: particleOpacity }]}>💖</Animated.Text>
      )}

      {!gifUrl && action === 'cry' && (
        <>
          <Animated.Text style={[styles.cryTearLeft, { transform: [{ translateY: tearLeftY }], opacity: particleOpacity }]}>💧</Animated.Text>
          <Animated.Text style={[styles.cryTearRight, { transform: [{ translateY: tearRightY }], opacity: particleOpacity }]}>💧</Animated.Text>
        </>
      )}

      {!gifUrl && action === 'angry' && (
        <Animated.Text style={[styles.steamPuffParticle, { transform: [{ translateY: particleY }, { scale: particleScale }], opacity: particleOpacity }]}>💨</Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 99999,
    elevation: 99999,
  },
  emojiCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChar: {
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  /* ── 1. CHEERS CLINK STYLES ── */
  cheersBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glassWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheersSparks: {
    position: 'absolute',
    top: -2,
    fontSize: 16,
    zIndex: 100000,
  },

  /* ── 2. 3D CASINO DICE STYLES (No Black Glyphs!) ── */
  diceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  diceMotionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceCube: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
    position: 'relative',
    padding: 3,
  },
  pip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    position: 'absolute',
  },
  pipRed: {
    backgroundColor: '#EF4444',
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  pipCenter: {
    top: '50%',
    left: '50%',
    marginTop: -3,
    marginLeft: -3,
  },
  pipTopLeft: {
    top: 5,
    left: 5,
  },
  pipTopRight: {
    top: 5,
    right: 5,
  },
  pipMidLeft: {
    top: '50%',
    left: 5,
    marginTop: -3,
  },
  pipMidRight: {
    top: '50%',
    right: 5,
    marginTop: -3,
  },
  pipBottomLeft: {
    bottom: 5,
    left: 5,
  },
  pipBottomRight: {
    bottom: 5,
    right: 5,
  },
  diceWinnerBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  diceWinnerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  /* ── 3. BINGO 777 REELS STYLES ── */
  slotMachineBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F59E0B',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  slotHeaderGrad: {
    width: '100%',
    paddingVertical: 1,
    alignItems: 'center',
  },
  slotHeaderText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  reelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 2,
    paddingVertical: 2,
    backgroundColor: '#000000',
  },
  reelWindow: {
    backgroundColor: '#1E293B',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
    width: '30%',
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelNum: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
  },
  reelSeven: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    textShadowColor: '#F59E0B',
    textShadowRadius: 3,
  },
  jackpotCoinsWrap: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
  },
  jackpotCoinsText: {
    fontSize: 10,
  },

  /* ── Expressive Particles ── */
  laughTearLeft: {
    position: 'absolute',
    top: 4,
    left: 2,
    fontSize: 16,
    zIndex: 100000,
  },
  laughTearRight: {
    position: 'absolute',
    top: 4,
    right: 2,
    fontSize: 16,
    zIndex: 100000,
  },
  flyingHeartParticle: {
    position: 'absolute',
    top: 6,
    fontSize: 22,
    zIndex: 100000,
  },
  cryTearLeft: {
    position: 'absolute',
    top: 14,
    left: 4,
    fontSize: 15,
    zIndex: 100000,
  },
  cryTearRight: {
    position: 'absolute',
    top: 14,
    right: 4,
    fontSize: 15,
    zIndex: 100000,
  },
  steamPuffParticle: {
    position: 'absolute',
    top: -6,
    fontSize: 18,
    zIndex: 100000,
  },

  /* ── Water Tap Wash Hands ── */
  washHandsContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  tapWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },
  tapEmoji: {
    textAlign: 'center',
  },
  waterStreamWrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 5,
  },
  waterDroplets: {
    textAlign: 'center',
  },
  washingHandsWrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 8,
  },
  handsEmoji: {
    textAlign: 'center',
  },
  soapSplashWrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 9,
  },
  soapBubbles: {
    textAlign: 'center',
  },
});
