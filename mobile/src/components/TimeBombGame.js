import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Vibration, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARENA_WIDTH = Math.min(SCREEN_WIDTH - 24, 400);

function BombVisual({ isExploding, scale, shakeAnim, glowAnim, isHolder }) {
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.0] });
  const glowScale  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.18] });
  if (isExploding) {
    return (<View style={styles.explosionWrap}><Text style={styles.explosionText}>{'💥'}</Text><Text style={styles.explosionLabel}>BOOM!</Text></View>);
  }
  return (
    <Animated.View style={[styles.bombOuterGlow, { opacity: isHolder ? glowOpacity : 0.28, transform: [{ scale: isHolder ? glowScale : 1 }] }]}>
      <Animated.View style={[styles.bombContainer, { transform: [{ translateX: shakeAnim }, { scale }] }]}>
        <View style={styles.fuseWrap}><View style={styles.fuseRope}/><Text style={styles.fuseSpark}>{'✨'}</Text></View>
        <LinearGradient colors={['#374151', '#1F2937', '#111827']} style={styles.bombBody}>
          <View style={styles.bombShine}/><View style={styles.bombHighlight}/><View style={styles.bombStripe}/>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

function PlayerSeat({ player, isHolder, isEliminated, isMe, passCount }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef(null);
  useEffect(() => {
    if (isHolder) {
      loopRef.current = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.09, duration: 370, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 370, useNativeDriver: true }),
      ]));
      loopRef.current.start();
    } else { loopRef.current?.stop(); pulseAnim.setValue(1); }
    return () => loopRef.current?.stop();
  }, [isHolder]);
  const borderColor = isEliminated ? '#374151' : isHolder ? '#EF4444' : isMe ? '#6366F1' : '#1F2937';
  return (
    <Animated.View style={[styles.playerSeat, { borderColor, transform: [{ scale: isHolder ? pulseAnim : 1 }], opacity: isEliminated ? 0.38 : 1 }]}>
      {isHolder && <View style={styles.holderBomb}><Text style={{ fontSize: 16 }}>{'💣'}</Text></View>}
      <LinearGradient
        colors={isEliminated ? ['#1F2937','#111827'] : isHolder ? ['#7F1D1D','#991B1B','#7F1D1D'] : isMe ? ['#1E1B4B','#312E81','#1E1B4B'] : ['#1E1E2D','#252535','#1E1E2D']}
        style={styles.playerSeatInner}
      >
        {isEliminated ? (
          <Text style={styles.avatarEmoji}>{'💀'}</Text>
        ) : isHolder ? (
          <Text style={styles.avatarEmoji}>{'😱'}</Text>
        ) : player.avatar && (player.avatar.startsWith('http') || player.avatar.startsWith('/')) ? (
          <Image
            source={{ uri: player.avatar }}
            style={styles.avatarImage}
            defaultSource={require('../../assets/icons/green_coin.png')}
          />
        ) : (
          <Text style={styles.avatarEmoji}>{player.avatar || '😐'}</Text>
        )}
        <Text style={styles.playerName} numberOfLines={1}>{isMe && !isEliminated ? (player.name + ' (Me)') : player.name}</Text>
        {isEliminated ? <Text style={styles.eliminatedBadge}>OUT</Text> : <Text style={styles.passCountText}>{passCount} passes</Text>}
      </LinearGradient>
    </Animated.View>
  );
}

export default function TimeBombGame({ playersCount = 2, currentUser, betAmount = 100, totalPot: propTotalPot, playMode = 'online', lobbyPlayers = [], socket, roomCode, onWin, onLoss, onPhaseChange, gameMode = 'classic' }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const PLAYER_AVATARS = ['😎','🤖','👻','🦊'];
  const PLAYER_COLORS  = ['#EF4444','#3B82F6','#10B981','#F59E0B'];
  const actualCount   = Math.max(2, Math.min(4, playersCount || lobbyPlayers?.length || 2));
  const isMultiplayer = playMode === 'local' && !!socket;
  const myPlayer = (lobbyPlayers || []).find((p) => String(p.userId) === String(currentUser?._id)) || (lobbyPlayers || []).find((p) => p.slot === 1) || { slot: 1, name: currentUser?.name || 'You', avatar: currentUser?.avatar || '😎', userId: currentUser?._id };
  const playersList = Array.from({ length: actualCount }, (_, i) => {
    const slot = i + 1;
    const found = (lobbyPlayers || []).find((p) => p.slot === slot);
    if (found) return { ...found, color: found.color || PLAYER_COLORS[i], avatar: found.avatar || PLAYER_AVATARS[i] };
    if (slot === 1) return { slot: 1, name: currentUser?.name || 'You', avatar: currentUser?.avatar || PLAYER_AVATARS[0], userId: currentUser?._id, color: PLAYER_COLORS[0] };
    return { slot, name: isMultiplayer ? ('Player ' + slot) : ('AI ' + (slot-1)), avatar: PLAYER_AVATARS[i % 4], userId: 'bot_' + slot, color: PLAYER_COLORS[i % 4] };
  });
  const totalPot = propTotalPot || betAmount * actualCount;
  const [phase,           setPhase]           = useState('waiting');
  const [holderSlot,      setHolderSlot]      = useState(1);
  const [eliminatedSlots, setEliminatedSlots] = useState([]);
  const [passCounts,      setPassCounts]      = useState({});
  const [bombTick,        setBombTick]        = useState(0);
  const [winnerSlot,      setWinnerSlot]      = useState(null);
  const [roundNum,        setRoundNum]        = useState(1);
  const [statusMsg,       setStatusMsg]       = useState('');
  const [isPassing,       setIsPassing]       = useState(false);
  const hiddenTimerRef = useRef(null);
  const holderSlotRef  = useRef(1);
  const eliminatedRef  = useRef([]);
  const phaseRef       = useRef('waiting');
  const matchOverRef   = useRef(false);
  const passingRef     = useRef(false);
  const glowLoopRef    = useRef(null);
  useEffect(() => { holderSlotRef.current  = holderSlot;      }, [holderSlot]);
  useEffect(() => { eliminatedRef.current  = eliminatedSlots; }, [eliminatedSlots]);
  useEffect(() => { phaseRef.current       = phase;           }, [phase]);
  // Notify parent whenever phase changes so it knows if game actually started
  useEffect(() => { onPhaseChange?.(phase); }, [phase]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bombScale = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const startGlow = () => { glowLoopRef.current = Animated.loop(Animated.sequence([Animated.timing(glowAnim, { toValue: 1, duration: 580, useNativeDriver: true }), Animated.timing(glowAnim, { toValue: 0, duration: 580, useNativeDriver: true })])); glowLoopRef.current.start(); };
  const stopGlow  = () => { glowLoopRef.current?.stop(); glowAnim.setValue(0); };
  const triggerShake = () => { Animated.sequence([Animated.timing(shakeAnim,{toValue:9,duration:55,useNativeDriver:true}),Animated.timing(shakeAnim,{toValue:-9,duration:55,useNativeDriver:true}),Animated.timing(shakeAnim,{toValue:6,duration:55,useNativeDriver:true}),Animated.timing(shakeAnim,{toValue:-6,duration:55,useNativeDriver:true}),Animated.timing(shakeAnim,{toValue:0,duration:55,useNativeDriver:true})]).start(); };
  const triggerExplosion = () => { Vibration.vibrate(Platform.OS === 'android' ? [0,180,80,400] : 500); Animated.sequence([Animated.timing(bombScale,{toValue:2.4,duration:160,useNativeDriver:true}),Animated.timing(bombScale,{toValue:0,duration:120,useNativeDriver:true})]).start(); };
  const isTurbo = gameMode === 'turbo';
  useEffect(() => { if (phase !== 'playing') return; const iv = setInterval(() => setBombTick((n) => n + 1), isTurbo ? 700 : 1100); return () => clearInterval(iv); }, [phase, isTurbo]);
  useEffect(() => { if (phase === 'playing' && bombTick % 3 === 0) triggerShake(); }, [bombTick]);
  useEffect(() => {
    if (!isMultiplayer || !socket) return;
    const onPassed   = ({ nextSlot, passedBy }) => { if (phaseRef.current !== 'playing') return; setHolderSlot(nextSlot); setPassCounts((p) => ({ ...p, [passedBy]: (p[passedBy] || 0) + 1 })); triggerShake(); };
    const onExploded = ({ explodedSlot }) => handleExplosion(explodedSlot, false);
    socket.on('time_bomb_passed', onPassed); socket.on('time_bomb_exploded', onExploded);
    return () => { socket.off('time_bomb_passed', onPassed); socket.off('time_bomb_exploded', onExploded); };
  }, [isMultiplayer, socket]);
  const scheduleHiddenBomb = useCallback(() => {
    clearTimeout(hiddenTimerRef.current);
    // Turbo: 5-9s, Classic: 8-20s
    const delay = isTurbo
      ? Math.floor(Math.random() * 4000) + 5000
      : Math.floor(Math.random() * 12000) + 8000;
    hiddenTimerRef.current = setTimeout(() => { if (phaseRef.current !== 'playing' || matchOverRef.current) return; handleExplosion(holderSlotRef.current, true); }, delay);
  }, [isTurbo]);
  const startGame = useCallback(() => {
    if (phaseRef.current === 'playing') return;
    matchOverRef.current = false;
    setPhase('playing'); setHolderSlot(1); setEliminatedSlots([]); setPassCounts({}); setRoundNum(1); setWinnerSlot(null); setStatusMsg(t('Game started! Pass the bomb fast!')); setBombTick(0); bombScale.setValue(1); startGlow(); scheduleHiddenBomb();
  }, [scheduleHiddenBomb, t]);
  const handleExplosion = useCallback((slot, isLocal) => {
    if (phaseRef.current === 'gameover' || matchOverRef.current) return;
    clearTimeout(hiddenTimerRef.current); stopGlow(); phaseRef.current = 'exploded'; setPhase('exploded'); triggerExplosion(); setStatusMsg(t('Player') + ' ' + slot + ' ' + t('got blown up!') + ' 💥');
    if (isMultiplayer && isLocal && socket) socket.emit('time_bomb_exploded', { roomCode, explodedSlot: slot });
    const newElim = [...eliminatedRef.current, slot]; setEliminatedSlots(newElim); eliminatedRef.current = newElim;
    const survivors = playersList.filter((p) => !newElim.includes(p.slot));
    setTimeout(() => { if (matchOverRef.current) return; if (survivors.length <= 1) { finishGame(survivors[0]?.slot || playersList[0].slot); } else { const next = survivors[0].slot; setHolderSlot(next); phaseRef.current = 'playing'; setPhase('playing'); setRoundNum((r) => r + 1); setStatusMsg(t('Next round! Keep passing!')); startGlow(); scheduleHiddenBomb(); } }, 2400);
  }, [playersList, isMultiplayer, socket, roomCode, scheduleHiddenBomb, t]);
  const finishGame = (survivorSlot) => {
    clearTimeout(hiddenTimerRef.current); stopGlow(); matchOverRef.current = true; setWinnerSlot(survivorSlot); phaseRef.current = 'gameover'; setPhase('gameover');
    if (survivorSlot === myPlayer.slot) { setStatusMsg('🏆 ' + t('You survived!') + ' +' + totalPot + ' ' + t('coins')); onWin?.('Time Bomb'); }
    else { const w = playersList.find((p) => p.slot === survivorSlot); setStatusMsg((w?.name || t('Opponent')) + ' ' + t('survived the bomb!')); onLoss?.('Time Bomb'); }
  };
  const passBomb = useCallback(() => {
    if (phaseRef.current !== 'playing') return; if (isMultiplayer && holderSlot !== myPlayer.slot) return; if (passingRef.current) return;
    passingRef.current = true; setIsPassing(true);
    const active = playersList.filter((p) => !eliminatedRef.current.includes(p.slot)); if (active.length < 2) { passingRef.current = false; setIsPassing(false); return; }
    const idx = active.findIndex((p) => p.slot === holderSlotRef.current); const nextSlot = active[(idx + 1) % active.length].slot;
    setPassCounts((prev) => ({ ...prev, [holderSlotRef.current]: (prev[holderSlotRef.current] || 0) + 1 })); setHolderSlot(nextSlot); triggerShake(); setStatusMsg(t('Bomb passed!'));
    if (isMultiplayer && socket) socket.emit('time_bomb_pass', { roomCode, passedBy: holderSlotRef.current, nextSlot });
    setTimeout(() => { passingRef.current = false; setIsPassing(false); }, 500);
  }, [holderSlot, myPlayer, playersList, isMultiplayer, socket, roomCode, t]);
  useEffect(() => {
    if (phase !== 'playing' || isMultiplayer) return; if (holderSlot === myPlayer.slot) return;
    // Turbo: AI passes in 400-900ms, Classic: 900-2200ms
    const delay = isTurbo
      ? Math.floor(Math.random() * 500) + 400
      : Math.floor(Math.random() * 1300) + 900;
    const timeout = setTimeout(() => {
      if (phaseRef.current !== 'playing') return;
      const active = playersList.filter((p) => !eliminatedRef.current.includes(p.slot)); const idx = active.findIndex((p) => p.slot === holderSlotRef.current); if (idx < 0 || active.length < 2) return;
      const nextSlot = active[(idx + 1) % active.length].slot; setPassCounts((prev) => ({ ...prev, [holderSlotRef.current]: (prev[holderSlotRef.current] || 0) + 1 })); setHolderSlot(nextSlot); triggerShake(); setStatusMsg(t('Bomb passed!'));
    }, delay);
    return () => clearTimeout(timeout);
  }, [holderSlot, phase, eliminatedSlots, isTurbo]);
  useEffect(() => () => { clearTimeout(hiddenTimerRef.current); glowLoopRef.current?.stop(); }, []);
  const getPositionStyle = (idx, count) => {
    if (count === 2) return idx === 0 ? { bottom: 0, left: '50%', transform: [{ translateX: -52 }] } : { top: 0, left: '50%', transform: [{ translateX: -52 }] };
    if (count === 3) { const p=[{ bottom:0,left:'50%',transform:[{translateX:-52}]},{top:8,left:8},{top:8,right:8}]; return p[idx]||{}; }
    if (count === 4) { const p=[{bottom:0,left:'50%',transform:[{translateX:-52}]},{left:0,top:'50%',transform:[{translateY:-52}]},{top:0,left:'50%',transform:[{translateX:-52}]},{right:0,top:'50%',transform:[{translateY:-52}]}]; return p[idx]||{}; }
    return {};
  };
  const isMyTurn = holderSlot === myPlayer.slot && phase === 'playing';
  const gameOver = phase === 'gameover';
  return (
    <LinearGradient colors={['#060610','#0F0F1A','#130018']} style={styles.root}>
      {/* Pot badge row — header is shown by GamingView above */}
      <View style={styles.potRow}>
        <View style={styles.potBadge}>
          <Image source={GREEN_COIN_IMG} style={styles.potCoinImg} />
          <Text style={styles.potText}>{totalPot}</Text>
        </View>
      </View>
      {phase === 'playing' && (<View style={styles.roundBadge}><Text style={styles.roundText}><T>Round</T> {roundNum}  •  {actualCount - eliminatedSlots.length} <T>Alive</T></Text></View>)}
      {!!statusMsg && (<View style={styles.statusWrap}><Text style={styles.statusText}>{statusMsg}</Text></View>)}
      <View style={styles.arena}>
        {playersList.map((pl, idx) => (
          <View key={pl.slot} style={[styles.playerPosition, getPositionStyle(idx, actualCount)]}>
            <PlayerSeat player={pl} isHolder={holderSlot === pl.slot} isEliminated={eliminatedSlots.includes(pl.slot)} isMe={pl.slot === myPlayer.slot} passCount={passCounts[pl.slot] || 0} />
          </View>
        ))}
        <View style={styles.bombCenterWrap}>
          <BombVisual isExploding={phase==='exploded'} scale={bombScale} shakeAnim={shakeAnim} glowAnim={glowAnim} isHolder={isMyTurn}/>
          {phase === 'playing' && (<View style={styles.tickRow}>{Array.from({length:5}).map((_,i) => (<View key={i} style={[styles.tickDot, {backgroundColor: i<=(bombTick%5)?'#EF4444':'#374151'}]}/>))}</View>)}
        </View>
      </View>
      {phase === 'playing' && (
        <View style={styles.actionArea}>
          {isMyTurn ? (
            <TouchableOpacity activeOpacity={0.75} onPress={passBomb} disabled={isPassing} style={styles.passBtn}>
              <LinearGradient colors={['#EF4444','#B91C1C','#7F1D1D']} style={styles.passBtnGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Text style={styles.passBtnText}>{isPassing ? '💨 ...' : ('🤲 ' + t('PASS THE BOMB!'))}</Text>
                <Text style={styles.passBtnSub}><T>Quick! Pass it before it explodes!</T></Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <LinearGradient colors={['#1F2937','#111827']} style={styles.waitingBox}>
              <Text style={{fontSize:28,marginBottom:4}}>{'⏳'}</Text>
              <Text style={styles.waitingText}><T>Waiting for</T>{' '}{playersList.find((p)=>p.slot===holderSlot)?.name||t('Player')}...</Text>
              <Text style={styles.waitingHint}><T>Pray they pass it your way!</T></Text>
            </LinearGradient>
          )}
        </View>
      )}
      {phase === 'waiting' && (
        <View style={styles.actionArea}>
          <TouchableOpacity activeOpacity={0.75} onPress={startGame} style={styles.startBtn}>
            <LinearGradient colors={['#6366F1','#4F46E5','#3730A3']} style={styles.passBtnGrad}>
              <Text style={styles.passBtnText}>{'💣'} <T>START GAME</T></Text>
              <Text style={styles.passBtnSub}>{actualCount} <T>players</T>  •  {totalPot} <T>coin pot</T></Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <LinearGradient colors={['rgba(0,0,0,0.94)','rgba(15,10,30,0.97)']} style={styles.gameOverBox}>
            {winnerSlot === myPlayer.slot ? (
              <><Text style={styles.goEmoji}>{'🏆'}</Text><Text style={styles.goTitle}><T>YOU SURVIVED!</T></Text><Text style={styles.goSubtitle}><T>The bomb never got you!</T></Text><View style={styles.goPot}><Text style={styles.goPotText}>+{totalPot} {'🪙'}</Text></View></>
            ) : (
              <><Text style={styles.goEmoji}>{'💥'}</Text><Text style={[styles.goTitle,{color:'#EF4444'}]}><T>BOOM!</T></Text><Text style={styles.goSubtitle}>{playersList.find((p)=>p.slot===winnerSlot)?.name||t('Opponent')} <T>survived!</T></Text><View style={[styles.goPot,{backgroundColor:'rgba(239,68,68,0.12)',borderColor:'#EF4444'}]}><Text style={[styles.goPotText,{color:'#EF4444'}]}>-{betAmount} {'🪙'}</Text></View></>
            )}
            <View style={styles.summaryBox}>
              {playersList.map((pl)=>(<View key={pl.slot} style={styles.summaryRow}><Text style={styles.summaryEmoji}>{eliminatedSlots.includes(pl.slot)?'💀':winnerSlot===pl.slot?'🏆':'😐'}</Text><Text style={styles.summaryName} numberOfLines={1}>{pl.name}</Text><Text style={styles.summaryPasses}>{passCounts[pl.slot]||0} passes</Text></View>))}
            </View>
            <TouchableOpacity activeOpacity={0.75} onPress={() => { matchOverRef.current=false; setPhase('waiting'); setHolderSlot(1); setEliminatedSlots([]); setPassCounts({}); setWinnerSlot(null); setStatusMsg(''); bombScale.setValue(1); stopGlow(); }} style={styles.replayBtn}>
              <Text style={styles.replayBtnText}>{'🔄'} <T>Play Again</T></Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#060610' },
  potRow:         { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  potBadge:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#10B981', gap: 6 },
  potCoinImg:     { width: 18, height: 18 },
  potText:        { color: '#10B981', fontWeight: '800', fontSize: 14 },
  roundBadge:     { alignSelf: 'center', backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(99,102,241,0.32)', marginBottom: 2 },
  roundText:      { color: '#A5B4FC', fontSize: 12, fontWeight: '700' },
  statusWrap:     { alignSelf: 'center', marginVertical: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 5, maxWidth: ARENA_WIDTH - 32 },
  statusText:     { color: '#E5E7EB', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  arena:          { width: ARENA_WIDTH, height: ARENA_WIDTH * 0.86, alignSelf: 'center', position: 'relative', marginTop: 4 },
  bombCenterWrap: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -60 }, { translateY: -72 }], alignItems: 'center' },
  bombOuterGlow:  { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' },
  bombContainer:  { alignItems: 'center', justifyContent: 'center' },
  fuseWrap:       { alignItems: 'center' },
  fuseRope:       { width: 3, height: 20, backgroundColor: '#92400E', borderRadius: 2, transform: [{ rotate: '10deg' }] },
  fuseSpark:      { fontSize: 14, marginTop: -8 },
  bombBody: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 16 }, android: { elevation: 12 } }) },
  bombShine:       { position: 'absolute', top: 10, left: 14, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.13)' },
  bombHighlight:   { position: 'absolute', top: 18, left: 20, width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)' },
  bombStripe:      { position: 'absolute', bottom: 16, width: 52, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 },
  explosionWrap:   { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  explosionText:   { fontSize: 72 },
  explosionLabel:  { color: '#EF4444', fontWeight: '900', fontSize: 18, letterSpacing: 2, marginTop: -8 },
  tickRow:         { flexDirection: 'row', gap: 6, marginTop: 10 },
  tickDot:         { width: 10, height: 10, borderRadius: 5 },
  playerPosition:  { position: 'absolute', width: 104 },
  playerSeat: { width: 104, borderRadius: 14, borderWidth: 2, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }, android: { elevation: 5 } }) },
  playerSeatInner: { padding: 8, alignItems: 'center' },
  avatarImage:     { width: 36, height: 36, borderRadius: 18, marginBottom: 4 },
  holderBomb:      { position: 'absolute', top: -10, right: -6, zIndex: 10, backgroundColor: '#060610', borderRadius: 12, padding: 2 },
  avatarEmoji:     { fontSize: 28, marginBottom: 4 },
  playerName:      { color: '#E5E7EB', fontSize: 11, fontWeight: '700', textAlign: 'center', maxWidth: 85 },
  eliminatedBadge: { marginTop: 3, color: '#EF4444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  passCountText:   { marginTop: 3, color: '#6B7280', fontSize: 10, fontWeight: '600' },
  actionArea:      { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  passBtn: { borderRadius: 18, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.55, shadowRadius: 12 }, android: { elevation: 10 } }) },
  startBtn: { borderRadius: 18, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.55, shadowRadius: 12 }, android: { elevation: 10 } }) },
  passBtnGrad:   { paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', borderRadius: 18 },
  passBtnText:   { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  passBtnSub:    { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 3, fontWeight: '600' },
  waitingBox:    { paddingVertical: 16, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  waitingText:   { color: '#D1D5DB', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  waitingHint:   { color: '#6B7280', fontSize: 11, marginTop: 4, fontWeight: '600' },
  gameOverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  gameOverBox:   { width: ARENA_WIDTH - 24, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  goEmoji:       { fontSize: 64, marginBottom: 8 },
  goTitle:       { color: '#F59E0B', fontSize: 28, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  goSubtitle:    { color: '#9CA3AF', fontSize: 14, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  goPot:         { marginTop: 14, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1.5, borderColor: '#F59E0B' },
  goPotText:     { color: '#F59E0B', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  summaryBox:    { width: '100%', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 10, gap: 6 },
  summaryRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryEmoji:  { fontSize: 18, width: 26, textAlign: 'center' },
  summaryName:   { flex: 1, color: '#E5E7EB', fontSize: 13, fontWeight: '700' },
  summaryPasses: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  replayBtn:     { marginTop: 18, backgroundColor: 'rgba(99,102,241,0.18)', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 11, borderWidth: 1, borderColor: '#6366F1' },
  replayBtnText: { color: '#818CF8', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
});