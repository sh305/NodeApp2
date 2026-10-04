import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getUserExpProgress, getLevelTierInfo } from '../constants/userLevelSystem';
import { T } from './TranslatedText';

export default function UserLevelProgressBar({
  exp = 0,
  level = 1,
  style,
}) {
  const progress = getUserExpProgress(exp, level);
  const currentTier = getLevelTierInfo(progress.currentLevel);
  const nextTier = getLevelTierInfo(progress.nextLevel);

  return (
    <View style={[styles.card, style]}>
      {/* 1. Header: Current Level Badge & Next Level Badge */}
      <View style={styles.headerRow}>
        <View style={[styles.levelPill, { backgroundColor: currentTier.bg, borderColor: currentTier.border }]}>
          <Text style={styles.levelPillStar}>⭐</Text>
          <Text style={[styles.levelPillText, { color: currentTier.color }]}>
            Lv.{progress.currentLevel} • <T>{currentTier.name}</T>
          </Text>
        </View>

        <View style={styles.targetPill}>
          {progress.isMaxLevel ? (
            <Text style={styles.maxLevelPillText}>👑 <T>MAX LEVEL</T></Text>
          ) : (
            <Text style={styles.nextLevelPillText}>
              <T>Next</T>: <Text style={{ color: nextTier.color, fontWeight: '800' }}>Lv.{progress.nextLevel}</Text>
            </Text>
          )}
        </View>
      </View>

      {/* 2. Progress Bar Track & Fill */}
      <View style={styles.trackContainer}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(3, progress.percent))}%`,
                backgroundColor: currentTier.border,
              },
            ]}
          >
            {/* Glossy inner glow */}
            <View style={styles.barGlow} />
          </View>
        </View>
      </View>

      {/* 3. Numbers: Percent & Current EXP / Target EXP */}
      <View style={styles.metricsRow}>
        <Text style={styles.metricsLeft}>
          <T>Progress</T>: <Text style={styles.metricsValue}>{progress.percent}%</Text>
        </Text>
        <Text style={styles.metricsRight}>
          <Text style={styles.metricsValue}>{Number(progress.currentExp).toLocaleString()}</Text>
          <Text style={styles.metricsSub}> / {Number(progress.targetExp).toLocaleString()} EXP</Text>
        </Text>
      </View>

      {/* 4. EXP Needed Requirement Notice (Directly Requested) */}
      <View style={[styles.noticeCard, progress.isMaxLevel && styles.maxNoticeCard]}>
        <Text style={styles.noticeIcon}>{progress.isMaxLevel ? '👑' : '🎯'}</Text>
        {progress.isMaxLevel ? (
          <Text style={styles.maxNoticeText}>
            <T>Maximum Level Reached! You have attained ultimate prestige!</T>
          </Text>
        ) : (
          <Text style={styles.noticeText}>
            <Text style={styles.highlightNumber}>{Number(progress.expNeeded).toLocaleString()} EXP</Text>{' '}
            <T>needed to reach</T>{' '}
            <Text style={[styles.highlightNumber, { color: nextTier.color }]}>Lv.{progress.nextLevel}</Text>
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#161626',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#25253E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelPillStar: {
    fontSize: 12,
    marginRight: 4,
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  targetPill: {
    backgroundColor: '#1E1E34',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F2F4E',
  },
  nextLevelPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  maxLevelPillText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  trackContainer: {
    marginVertical: 4,
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: '#0F0F1A',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#232338',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
    position: 'relative',
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metricsLeft: {
    color: '#94A3B8',
    fontSize: 12,
  },
  metricsRight: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  metricsValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricsSub: {
    color: '#64748B',
    fontSize: 11,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  maxNoticeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  noticeIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  noticeText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  maxNoticeText: {
    flex: 1,
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  highlightNumber: {
    color: '#38BDF8',
    fontWeight: '800',
  },
});
