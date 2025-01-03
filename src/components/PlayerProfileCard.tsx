import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, useTheme, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileImage from './ProfileImage';
import LevelIndicator from './LevelIndicator';
import { gradients } from '../theme/gradients';
import { useTranslation } from 'react-i18next';

type PlayerProfile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  matches_played: number;
  wins: number;
  losses: number;
  level: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  motivational_speech?: string;
  hot_streak: number;
  max_hot_streak: number;
};

type PlayerProfileCardProps = {
  player: PlayerProfile;
};

const { width } = Dimensions.get('window');
const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

export default function PlayerProfileCard({ player }: PlayerProfileCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const winRate = ((player.wins / (player.matches_played || 1)) * 100).toFixed(1);
  const setWinRate = ((player.sets_won / (player.sets_won + player.sets_lost || 1)) * 100).toFixed(1);
  const gameWinRate = ((player.games_won / (player.games_won + player.games_lost || 1)) * 100).toFixed(1);

  return (
    <Card style={styles.playerCard}>
      <LinearGradient
        colors={gradients.obsidian}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <ProfileImage avatarUrl={player.avatar_url} size={80} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.full_name}</Text>
              <Text style={styles.playerUsername}>@{player.username}</Text>
            </View>
          </View>
          
          <View style={styles.levelIndicatorContainer}>
            <LevelIndicator level={player.level} />
          </View>

          {player.motivational_speech && (
            <View style={styles.quoteContainer}>
              <Text style={styles.motivationalSpeech}>
                <MaterialCommunityIcons name="format-quote-open" size={15} color="rgba(255, 255, 255, 0.6)" />
                {player.motivational_speech}
                <MaterialCommunityIcons name="format-quote-close" size={15} color="rgba(255, 255, 255, 0.6)" style={styles.quoteClose} />
              </Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <StatItem icon="trophy" value={player.wins} label={t('wins')} />
            <StatItem icon="close-circle-outline" value={player.losses} label={t('losses')} />
            <StatItem icon="tennis" value={player.matches_played} label={t('matches')} />
          </View>

          <View style={styles.progressContainer}>
            <ProgressItem label={t('winRate')} value={parseFloat(winRate)} color={theme.colors.primary} />
            <ProgressItem label={t('setWinRate')} value={parseFloat(setWinRate)} color={theme.colors.secondary} />
            <ProgressItem label={t('gameWinRate')} value={parseFloat(gameWinRate)} color={theme.colors.tertiary} />
          </View>

          <View style={styles.additionalStats}>
            <Text style={styles.additionalStatsText}>{t('sets')}: {player.sets_won} {t('w')} / {player.sets_lost} {t('l')}</Text>
            <Text style={styles.additionalStatsText}>{t('games')}: {player.games_won} {t('w')} / {player.games_lost} {t('l')}</Text>
          </View>

          <View style={styles.hotStreakContainer}>
            <View style={styles.hotStreakItem}>
              <MaterialCommunityIcons name="fire" size={24} color="#DC3545" />
              <Text style={styles.hotStreakLabel}>{t('currentHotStreak')}</Text>
              <Text style={styles.hotStreakValue}>{player.hot_streak}</Text>
            </View>
            <View style={styles.hotStreakItem}>
              <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
              <Text style={styles.hotStreakLabel}>{t('maxHotStreak')}</Text>
              <Text style={styles.hotStreakValue}>{player.max_hot_streak}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Card>
  );
}

interface StatItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number | string;
  label: string;
}

const StatItem = ({ icon, value, label }: StatItemProps) => (
  <View style={styles.statItem}>
    <MaterialCommunityIcons name={icon} size={28} color="#fff" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface ProgressItemProps {
  label: string;
  value: number;
  color: string;
}

const ProgressItem = ({ label, value, color }: ProgressItemProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressLabelContainer}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value.toFixed(1)}%</Text>
      </View>
      <ProgressBar progress={roundToTwoDecimals(value / 100)} color={color} style={styles.progressBar} />
    </View>
  );
};

const styles = StyleSheet.create({
  playerCard: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerUsername: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  levelIndicatorContainer: {
    marginBottom: 16,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  motivationalSpeech: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  quoteClose: {
    alignSelf: 'flex-end',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  additionalStatsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  hotStreakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  hotStreakItem: {
    alignItems: 'center',
  },
  hotStreakLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  hotStreakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
});