import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { Text, Card, Title, Avatar, Button, ActivityIndicator, useTheme, Searchbar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { VictoryPie, VictoryLabel } from 'victory-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const { colors } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    fetchTopPlayers();
    fetchMonthlyTopPlayers();
  }, []);

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
    } finally {
      setLoading(false);
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
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <Avatar.Image size={80} source={{ uri: player.avatar_url }} style={styles.avatar} />
          <Text style={styles.playerName}>{player.full_name}</Text>
          <Text style={styles.playerUsername}>@{player.username}</Text>
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
              <Text style={styles.levelText}>Level {(player as PlayerStats).level}</Text>
            </View>
          )}
        </LinearGradient>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Player Statistics</Text>
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

      {activeTab === 'overall' ? (
        topPlayers.map((player, index) => renderPlayerCard(player, index, false))
      ) : (
        monthlyTopPlayers.map((player, index) => renderPlayerCard(player, index, true))
      )}

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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#757575',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  playerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avatar: {
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerUsername: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 12,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
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