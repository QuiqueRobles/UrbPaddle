import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import TopPlayers from '../components/TopPlayers';
import HotStreaks from '../components/HotStreaks';

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
  hot_streak: number;
  max_hot_streak: number;
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
  const [currentHotStreakPlayers, setCurrentHotStreakPlayers] = useState<PlayerStats[]>([]);
  const [maxHotStreakPlayers, setMaxHotStreakPlayers] = useState<PlayerStats[]>([]);
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
      fetchCurrentHotStreakPlayers(),
      fetchMaxHotStreakPlayers(),
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

  async function fetchCurrentHotStreakPlayers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('hot_streak', { ascending: false })
        .limit(3);

      if (error) throw error;
      if (data) setCurrentHotStreakPlayers(data as PlayerStats[]);
    } catch (error) {
      console.error('Error fetching current hot streak players:', error);
    }
  }

  async function fetchMaxHotStreakPlayers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('max_hot_streak', { ascending: false })
        .limit(3);

      if (error) throw error;
      if (data) setMaxHotStreakPlayers(data as PlayerStats[]);
    } catch (error) {
      console.error('Error fetching max hot streak players:', error);
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={[theme.colors.primary, "#000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Player Statistics</Text>
      </LinearGradient>

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

      <TopPlayers
        topPlayers={activeTab === 'overall' ? topPlayers : monthlyTopPlayers}
        isMonthly={activeTab === 'monthly'}
      />

      {activeTab === 'overall' && (
        <HotStreaks
          currentHotStreakPlayers={currentHotStreakPlayers}
          maxHotStreakPlayers={maxHotStreakPlayers}
        />
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
  header: {
    padding: 24,
    paddingTop: 48,
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
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 25,
    elevation: 2,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#00A86B',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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