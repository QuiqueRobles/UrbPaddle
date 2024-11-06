import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileImage from './ProfileImage';


type PlayerStats = {
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
  win_streak: number;
};

type MonthlyPlayerStats = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  monthly_matches: number;
  monthly_wins: number;
};

export default function StatisticsScreen() {
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);
  const [monthlyTopPlayers, setMonthlyTopPlayers] = useState<MonthlyPlayerStats[]>([]);
  const [hotStreakPlayers, setHotStreakPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overall');
  const theme = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTopPlayers(),
      fetchMonthlyTopPlayers(),
      fetchHotStreakPlayers(),
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  async function fetchTopPlayers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('wins', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setTopPlayers(data as PlayerStats[]);
    } catch (error) {
      console.error('Error fetching top players:', error);
    }
  }

  async function fetchMonthlyTopPlayers() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      const { data, error } = await supabase
        .from('matches')
        .select(`
          player1_id,
          player2_id,
          player3_id,
          player4_id,
          winner_team,
          match_date
        `)
        .gte('match_date', firstDayOfMonth.toISOString());

      if (error) throw error;

      if (data) {
        const playerStats = new Map<string, { matches: number; wins: number }>();

        data.forEach(match => {
          [match.player1_id, match.player2_id, match.player3_id, match.player4_id]
            .filter(Boolean)
            .forEach((playerId, index) => {
              if (!playerStats.has(playerId)) {
                playerStats.set(playerId, { matches: 0, wins: 0 });
              }
              const stats = playerStats.get(playerId)!;
              stats.matches++;
              if ((index < 2 && match.winner_team === 1) || (index >= 2 && match.winner_team === 2)) {
                stats.wins++;
              }
            });
        });

        const topMonthlyPlayers = await Promise.all(
          Array.from(playerStats.entries())
            .sort(([, a], [, b]) => b.wins - a.wins)
            .slice(0, 5)
            .map(async ([playerId, stats]) => {
              const { data: playerData } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .eq('id', playerId)
                .single();

              return {
                ...playerData,
                monthly_matches: stats.matches,
                monthly_wins: stats.wins,
              } as MonthlyPlayerStats;
            })
        );

        setMonthlyTopPlayers(topMonthlyPlayers);
      }
    } catch (error) {
      console.error('Error fetching monthly top players:', error);
    }
  }

  async function fetchHotStreakPlayers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('win_streak', { ascending: false })
        .limit(3);

      if (error) throw error;
      if (data) setHotStreakPlayers(data as PlayerStats[]);
    } catch (error) {
      console.error('Error fetching hot streak players:', error);
    }
  }

  const navigateToMyStats = () => {
    navigation.navigate('MyStatistics' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderPlayerCard = (player: PlayerStats | MonthlyPlayerStats, index: number, isMonthly: boolean) => {
    const wins = isMonthly ? (player as MonthlyPlayerStats).monthly_wins : (player as PlayerStats).wins;
    const matches = isMonthly ? (player as MonthlyPlayerStats).monthly_matches : (player as PlayerStats).matches_played;
    const winRate = ((wins / (matches || 1)) * 100).toFixed(1);

    return (
      <Card key={player.id} style={styles.playerCard}>
        <LinearGradient
          colors={[theme.colors.primary, "#000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Avatar.Image size={60} source={{ uri: player.avatar_url }} style={styles.avatar} />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.full_name}</Text>
                <Text style={styles.playerUsername}>@{player.username}</Text>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.background} />
                <Text style={styles.statValue}>{wins}</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="tennis" size={24} color={theme.colors.background} />
                <Text style={styles.statValue}>{matches}</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="percent" size={24} color={theme.colors.background} />
                <Text style={styles.statValue}>{winRate}%</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
            </View>
            {!isMonthly && (
              <View style={styles.levelContainer}>
                <Text style={styles.levelLabel}>Level {(player as PlayerStats).level}</Text>
                <View style={styles.levelStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialCommunityIcons
                      key={star}
                      name={star <= Math.floor((player as PlayerStats).level / 20) ? "star" : "star-outline"}
                      size={20}
                      color={star <= Math.floor((player as PlayerStats).level / 20) ? "#FFD700" : "#E0E0E0"}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </Card>
    );
  };

  const renderHotStreakPlayer = (player: PlayerStats, index: number) => (
    <Card key={player.id} style={styles.hotStreakCard}>
      <Card.Content style={styles.hotStreakContent}>
        <Avatar.Image size={48} source={{ uri: player.avatar_url }} style={styles.hotStreakAvatar} />
        <View style={styles.hotStreakInfo}>
          <Text style={styles.hotStreakName}>{player.full_name}</Text>
          <Text style={styles.hotStreakUsername}>@{player.username}</Text>
        </View>
        <View style={styles.hotStreakStreak}>
          <MaterialCommunityIcons name="fire" size={24} color={theme.colors.error} />
          <Text style={styles.hotStreakValue}>{player.win_streak}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[theme.colors.primary,"#000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Player Statistics</Text>
        </LinearGradient>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overall' && styles.activeTab]}
          onPress={() => setActiveTab('overall')}
        >
          <Text style={[styles.tabText, activeTab === 'overall' && styles.activeTabText]}>Overall</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
          onPress={() => setActiveTab('monthly')}
        >
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Players</Text>
        {activeTab === 'overall'
          ? topPlayers.map((player, index) => renderPlayerCard(player, index, false))
          : monthlyTopPlayers.map((player, index) => renderPlayerCard(player, index, true))
        }
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hot Streak 🔥</Text>
        {hotStreakPlayers.map((player, index) => renderHotStreakPlayer(player, index))}
      </View>

      <Button
        mode="contained"
        onPress={navigateToMyStats}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        View My Statistics
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    overflow: 'hidden',
    paddingBottom: 16,
  },
  headerGradient: {
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginVertical: 16,
    borderRadius: 25,
    marginHorizontal: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor:'#144a1e',
  },
  activeTab: {
    backgroundColor: '#33C18C',
  },
  tabText: {
    fontSize: 16,
    color: '#a6aba7',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
    color: '#333',
  },
  playerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatar: {
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerUsername: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  levelStars: {
    flexDirection: 'row',
  },
  hotStreakCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  hotStreakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotStreakAvatar: {
    marginRight: 12,
  },
  hotStreakInfo: {
    flex: 1,
  },
  hotStreakName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  hotStreakUsername: {
    fontSize: 14,
    color: '#757575',
  },
  hotStreakStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 111, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotStreakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#FF6F00',
  },
  button: {
    margin: 16,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});