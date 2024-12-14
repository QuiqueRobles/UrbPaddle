import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Title, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { PaddleCourt } from '../components/PaddleCourt';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

type Match = {
  id: string;
  match_date: string | null;
  score: string | null;
  player1_id: string | null;
  player2_id: string | null;
  player3_id: string | null;
  player4_id: string | null;
  winner_team: number;
};

type Player = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: Player }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      const playerIds = new Set<string>();
      matchesData?.forEach(match => {
        [match.player1_id, match.player2_id, match.player3_id, match.player4_id].forEach(id => {
          if (id) playerIds.add(id);
        });
      });

      const { data: playersData, error: playersError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(playerIds));

      if (playersError) throw playersError;

      const playersMap = (playersData || []).reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {} as { [key: string]: Player });

      setMatches(matchesData || []);
      setPlayers(playersMap);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    const matchPlayers = [item.player1_id, item.player2_id, item.player3_id, item.player4_id]
      .map(id => id ? players[id] || null : null);

    return (
      <Card style={styles.matchCard}>
        <Text style={styles.matchDate}>
          {item.match_date ? format(parseISO(item.match_date), 'MMM d, yyyy') : 'Date not available'}
        </Text>
        <Card.Content>
          <PaddleCourt players={matchPlayers} score={item.score || 'N/A'} winner_team={item.winner_team} />
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={StyleSheet.absoluteFillObject}>
          <ActivityIndicator size="large" color={colors.primary} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={StyleSheet.absoluteFillObject}>
        <FlatList
          data={matches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matches found</Text>
            </View>
          )}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 24,
    overflow: 'hidden'
  },
  matchDate: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white',
  },
});