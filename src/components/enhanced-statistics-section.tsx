import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Title, Text, ProgressBar, IconButton, Portal, Modal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Level data (shared between mobile and web)
const levelData = [
  { name: "novice", color: ["#4CAF50", "#8BC34A"], description: "noviceDesc" },
  { name: "apprentice", color: ["#2196F3", "#03A9F4"], description: "apprenticeDesc" },
  { name: "intermediate", color: ["#9C27B0", "#E91E63"], description: "intermediateDesc" },
  { name: "advanced", color: ["#FF9800", "#FF5722"], description: "advancedDesc" },
  { name: "expert", color: ["#F44336", "#E91E63"], description: "expertDesc" },
  { name: "master", color: ["#9C27B0", "#673AB7"], description: "masterDesc" },
  { name: "elite", color: ["#3F51B5", "#2196F3"], description: "eliteDesc" },
  { name: "legend", color: ["#FFC107", "#FF9800"], description: "legendDesc" },
  { name: "champion", color: ["#FF5722", "#F44336"], description: "championDesc" },
  { name: "immortal", color: ["#607D8B", "#455A64"], description: "immortalDesc" },
];

const getLevelInfo = (level: number) => {
  const index = Math.min(Math.floor(level / 5), levelData.length - 1);
  return levelData[index];
};

interface EnhancedStatisticsSectionProps {
  profile: any;
  onRefresh: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export default function EnhancedStatisticsSection({ 
  profile, 
  onRefresh, 
  expanded, 
  onToggleExpanded 
}: EnhancedStatisticsSectionProps) {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [realStats, setRealStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    recentMatches: [],
  });

  useEffect(() => {
    fetchRealStatistics();
  }, []);

  const fetchRealStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch total bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id);

      if (bookingsError) throw bookingsError;

      // Fetch upcoming bookings
      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today);

      if (upcomingError) throw upcomingError;

      // Fetch recent matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
        .eq('is_validated', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (matchesError) throw matchesError;

      setRealStats({
        totalBookings: bookingsData?.length || 0,
        upcomingBookings: upcomingData?.length || 0,
        recentMatches: matchesData || [],
      });
    } catch (error) {
      console.error('Error fetching real statistics:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      await fetchRealStatistics();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;
  const winRate = profile.matches_played > 0 ? (profile.wins / profile.matches_played) * 100 : 0;
  const setWinRate = profile.sets_won + profile.sets_lost > 0 ? (profile.sets_won / (profile.sets_won + profile.sets_lost)) * 100 : 0;
  const gameWinRate = profile.games_won + profile.games_lost > 0 ? (profile.games_won / (profile.games_won + profile.games_lost)) * 100 : 0;

  const StatItem: React.FC<{ icon: keyof typeof MaterialCommunityIcons.glyphMap; value: number; label: string; color?: string }> = ({ 
    icon, 
    value, 
    label, 
    color = 'white' 
  }) => (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon} size={32} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const PerformanceCard: React.FC<{ 
    title: string; 
    won: number; 
    lost: number; 
    winRate: number; 
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    gradientColors: string[];
  }> = ({ title, won, lost, winRate, icon, gradientColors }) => (
    <Card style={styles.performanceCard}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.performanceCardGradient}
      >
        <View style={styles.performanceCardHeader}>
          <MaterialCommunityIcons name={icon} size={24} color="white" />
          <Text style={styles.performanceCardTitle}>{title}</Text>
        </View>
        <View style={styles.performanceStats}>
          <View style={styles.performanceStatItem}>
            <Text style={styles.performanceStatValue}>{won}</Text>
            <Text style={styles.performanceStatLabel}>Won</Text>
          </View>
          <View style={styles.performanceStatItem}>
            <Text style={styles.performanceStatValue}>{lost}</Text>
            <Text style={styles.performanceStatLabel}>Lost</Text>
          </View>
        </View>
        <View style={styles.winRateContainer}>
          <Text style={styles.winRateLabel}>Win Rate</Text>
          <ProgressBar 
            progress={roundToTwoDecimals(winRate / 100)} 
            color="rgba(255,255,255,0.9)" 
            style={styles.winRateBar} 
          />
          <Text style={styles.winRateValue}>{winRate.toFixed(1)}%</Text>
        </View>
      </LinearGradient>
    </Card>
  );

  return (
    <>
      {/* Main Statistics Card */}
      <Card style={styles.mainStatsCard}>
        <Card.Content>
          <View style={styles.statsHeader}>
            <View style={styles.statsHeaderLeft}>
              <MaterialCommunityIcons name="chart-line" size={24} color="white" />
              <Title style={styles.statsTitle}>{t('detailedStatistics')}</Title>
            </View>
            <View style={styles.statsHeaderRight} >
              <IconButton
                icon="information"
                size={20}
                iconColor="rgba(255,255,255,0.8)"
                onPress={() => setIsInfoDialogOpen(true)}
              />
              <IconButton
                icon="refresh"
                size={20}
                iconColor="rgba(255,255,255,0.8)"
                onPress={handleRefresh}
                style={{ transform: [{ rotate: isRefreshing ? '360deg' : '0deg' }] }}
              />
              <IconButton
                icon={expanded ? "chevron-up" : "chevron-down"}
                size={20}
                iconColor="rgba(255,255,255,0.8)"
                

                onPress={onToggleExpanded}
              />
            </View>
          </View>

          {/* Quick Overview Stats */}
          <View style={styles.overviewStatsContainer}>
            <View style={styles.overviewStatItem}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#4CAF50" />
              <Text style={styles.overviewStatValue}>{realStats.totalBookings}</Text>
              <Text style={styles.overviewStatLabel}>Total Bookings</Text>
            </View>
            <View style={styles.overviewStatItem}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#2196F3" />
              <Text style={styles.overviewStatValue}>{realStats.upcomingBookings}</Text>
              <Text style={styles.overviewStatLabel}>Upcoming</Text>
            </View>
            <View style={styles.overviewStatItem}>
              <MaterialCommunityIcons name="trophy" size={20} color="#FF9800" />
              <Text style={styles.overviewStatValue}>{profile.matches_played || 0}</Text>
              <Text style={styles.overviewStatLabel}>Matches</Text>
            </View>
            <View style={styles.overviewStatItem}>
              <MaterialCommunityIcons name="percent" size={20} color="#9C27B0" />
              <Text style={styles.overviewStatValue}>{winRate.toFixed(1)}%</Text>
              <Text style={styles.overviewStatLabel}>Win Rate</Text>
            </View>
          </View>

          {/* Streak Information */}
          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.streakBadge}
              >
                <MaterialCommunityIcons name="fire" size={24} color="white" />
                <Text style={styles.streakValue}>{profile.hot_streak || 0}</Text>
              </LinearGradient>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
            <View style={styles.streakItem}>
              <LinearGradient
                colors={['#FFD700', '#FFA000']}
                style={styles.streakBadge}
              >
                <MaterialCommunityIcons name="star" size={24} color="white" />
                <Text style={styles.streakValue}>{profile.max_hot_streak || 0}</Text>
              </LinearGradient>
              <Text style={styles.streakLabel}>Best Streak</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Expanded Statistics */}
      {expanded && (
        <>
          {/* Match Statistics */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="tennis" size={24} color="white" />
                <Title style={styles.cardTitle}>{t('matchStatistics')}</Title>
              </View>
              <View style={styles.statsRow}>
                <StatItem icon="tennis" value={profile.matches_played} label={t('matches')} />
                <StatItem icon="trophy" value={profile.wins} label={t('wins')} color="#4CAF50" />
                <StatItem icon="close-circle" value={profile.losses} label={t('losses')} color="#F44336" />
              </View>
              <View style={styles.winRateContainer}>
                <Text style={styles.winRateLabel}>{t('matchWinRate')}</Text>
                <ProgressBar 
                  progress={roundToTwoDecimals(winRate / 100)} 
                  color="#4CAF50" 
                  style={styles.winRateBar} 
                />
                <Text style={styles.winRateValue}>{winRate.toFixed(1)}%</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Performance Cards Grid */}
          <View style={styles.performanceGrid}>
            <PerformanceCard
              title="Sets Performance"
              won={profile.sets_won || 0}
              lost={profile.sets_lost || 0}
              winRate={setWinRate}
              icon="table-tennis"
              gradientColors={['#3bb018ff', '#03A9F4']}
            />
            <PerformanceCard
              title="Games Performance"
              won={profile.games_won || 0}
              lost={profile.games_lost || 0}
              winRate={gameWinRate}
              icon="tennis-ball"
              gradientColors={['#3bb018ff', '#1e21e9ff']}
            />
          </View>

          {/* Advanced Analytics */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="chart-bar" size={24} color="white" />
                <Title style={styles.cardTitle}>Advanced Analytics</Title>
              </View>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>
                    {profile.matches_played > 0 
                      ? (((profile.sets_won || 0) + (profile.sets_lost || 0)) / profile.matches_played).toFixed(1)
                      : "0.0"
                    }
                  </Text>
                  <Text style={styles.analyticsLabel}>Avg Sets/Match</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>
                    {((profile.sets_won || 0) + (profile.sets_lost || 0)) > 0 
                      ? (((profile.games_won || 0) + (profile.games_lost || 0)) / ((profile.sets_won || 0) + (profile.sets_lost || 0))).toFixed(1)
                      : "0.0"
                    }
                  </Text>
                  <Text style={styles.analyticsLabel}>Avg Games/Set</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{profile.level || 0}</Text>
                  <Text style={styles.analyticsLabel}>Current Level</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{profile.xp || 0}</Text>
                  <Text style={styles.analyticsLabel}>Total XP</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </>
      )}

      {/* XP Information Modal */}
      <Portal>
        <Modal visible={isInfoDialogOpen} onDismiss={() => setIsInfoDialogOpen(false)} contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>XP Calculation System</Title>
            <View style={styles.xpInfoSection}>
              <Text style={styles.xpInfoTitle}>Base Rewards</Text>
              <Text style={styles.xpInfoText}>• 1000 XP - Playing a match</Text>
              <Text style={styles.xpInfoText}>• 500 XP - Winning a match</Text>
            </View>
            <View style={styles.xpInfoSection}>
              <Text style={styles.xpInfoTitle}>Performance Bonuses</Text>
              <Text style={styles.xpInfoText}>• Sets Bonus: 50 × (setsWon ÷ (1 + setsLost))</Text>
              <Text style={styles.xpInfoText}>• Games Bonus: 20 × (gamesWon ÷ (1 + gamesLost))</Text>
            </View>
            <View style={styles.xpInfoSection}>
              <Text style={styles.xpInfoTitle}>Level Up System</Text>
              <Text style={styles.xpInfoText}>You need 5000 XP to advance to the next level. XP above this amount carries over to your new level.</Text>
            </View>
            <Button mode="contained" onPress={() => setIsInfoDialogOpen(false)} style={styles.modalButton}>
              Close
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  mainStatsCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  overviewStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewStatItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 2,
  },
  overviewStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  overviewStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  streakValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  winRateContainer: {
    marginTop: 16,
  },
  winRateLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: 'white',
  },
  winRateBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  winRateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
    color: 'white',
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: 10,
  },
  performanceCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  performanceCardGradient: {
    padding: 16,
  },
  performanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceCardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  performanceStatItem: {
    alignItems: 'center',
  },
  performanceStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  performanceStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  analyticsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  xpInfoSection: {
    marginBottom: 16,
    width: '100%',
  },
  xpInfoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  xpInfoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
  },
});
