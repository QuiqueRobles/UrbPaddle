import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Text, Card, Title, Paragraph, ActivityIndicator, Button, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';

type Match = {
  id: string;
  match_date: string;
  match_time: string;
  court_number: number;
  score: string;
  winner_team: number;
  player1_id: string | null;
  player2_id: string | null;
  player3_id: string | null;
  player4_id: string | null;
  community_id: string | null;
};

type Player = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: Player }>({});
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [opponentFilter, setOpponentFilter] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [matches, dateFilter, opponentFilter]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
        .order('match_date', { ascending: false })
        .order('match_time', { ascending: false });

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

  const applyFilters = () => {
    let filtered = [...matches];

    if (dateFilter) {
      filtered = filtered.filter(match => match.match_date === dateFilter);
    }

    if (opponentFilter) {
      filtered = filtered.filter(match => 
        [match.player1_id, match.player2_id, match.player3_id, match.player4_id].some(playerId => 
          playerId && players[playerId]?.full_name.toLowerCase().includes(opponentFilter.toLowerCase())
        )
      );
    }

    setFilteredMatches(filtered);
  };

  const renderMatchItem = ({ item }: { item: Match }) => (
    <Card style={styles.matchCard}>
      <Card.Content>
        <View style={styles.matchHeader}>
          <Title style={styles.matchDate}>
            {format(parseISO(item.match_date), 'dd/MM/yyyy')} • {item.match_time || 'N/A'}
          </Title>
          <Paragraph style={styles.courtNumber}>Court {item.court_number || 'N/A'}</Paragraph>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{item.score || 'N/A'}</Text>
        </View>
        <View style={styles.winnerContainer}>
          <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.winnerText}>Team {item.winner_team || 'N/A'} won</Text>
        </View>
        <View style={styles.playersContainer}>
          {[item.player1_id, item.player2_id, item.player3_id, item.player4_id].map((playerId, index) => {
            const player = playerId ? players[playerId] : null;
            return (
              <View key={index} style={styles.playerItem}>
                {player ? (
                  <>
                    {player.avatar_url ? (
                      <Image source={{ uri: player.avatar_url }} style={styles.playerAvatar} />
                    ) : (
                      <View style={[styles.playerAvatar, styles.playerAvatarPlaceholder]}>
                        <Text style={styles.playerAvatarText}>{player.full_name.charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={styles.playerName}>{player.full_name}</Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.playerAvatar, styles.playerAvatarPlaceholder]}>
                      <Text style={styles.playerAvatarText}>A</Text>
                    </View>
                    <Text style={styles.playerName}>Anonymous</Text>
                  </>
                )}
                <Text style={styles.playerTeam}>Team {index < 2 ? '1' : '2'}</Text>
              </View>
            );
          })}
        </View>
        {item.community_id && (
          <Paragraph style={styles.communityId}>Community ID: {item.community_id}</Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.dateFilterButton}
          onPress={() => {
            setDateFilter(dateFilter ? null : format(new Date(), 'yyyy-MM-dd'));
          }}
        >
          <Text style={styles.dateFilterButtonText}>
            {dateFilter ? format(parseISO(dateFilter), 'dd/MM/yyyy') : 'Filter by Date'}
          </Text>
        </TouchableOpacity>
        <Searchbar
          placeholder="Search opponent"
          onChangeText={setOpponentFilter}
          value={opponentFilter}
          style={styles.searchBar}
        />
      </View>
      <FlatList
        data={filteredMatches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0000ff"]}
            tintColor="#0000ff"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches found</Text>
          </View>
        )}
      />
    </View>
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
  listContent: {
    padding: 16,
  },
  matchCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  courtNumber: {
    fontSize: 14,
    color: '#666666',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0000ff',
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  winnerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  playersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  playerItem: {
    alignItems: 'center',
    marginBottom: 8,
    width: '45%',
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  playerAvatarPlaceholder: {
    backgroundColor: '#cccccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  playerTeam: {
    fontSize: 12,
    color: '#666666',
  },
  communityId: {
    marginTop: 8,
    fontSize: 12,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  dateFilterButton: {
    backgroundColor: '#0000ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dateFilterButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  searchBar: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
  },
});

