import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Card, Title, TextInput, useTheme, List, Chip, Avatar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string;
};

type Player = {
  id: string;
  name: string;
  profile_id: string | null;
  avatar_url?: string;
};

interface SelectPlayersProps {
  onPlayersChange: (players: Player[]) => void;
}

export default function SelectPlayers({ onPlayersChange }: SelectPlayersProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', profile_id: null },
    { id: '2', name: '', profile_id: null },
    { id: '3', name: '', profile_id: null },
    { id: '4', name: '', profile_id: null },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const theme = useTheme();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filteredProfiles = profiles.filter(profile => 
        profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !players.some(player => player.profile_id === profile.id)
      );
      setSearchResults(filteredProfiles);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, profiles, players]);

  useEffect(() => {
    onPlayersChange(players);
  }, [players, onPlayersChange]);

  async function fetchProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      // Consider using a more user-friendly error handling method here
    }
  }

  function handlePlayerChange(index: number, profile: Profile | null) {
    const newPlayers = [...players];
    newPlayers[index] = { 
      ...newPlayers[index], 
      name: profile ? profile.full_name : '', 
      profile_id: profile ? profile.id : null,
      avatar_url: profile ? profile.avatar_url : undefined
    };
    setPlayers(newPlayers);
    setSearchQuery('');
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Select Players</Title>
        <TextInput
          label="Search Player"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
          right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : null}
        />
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  const emptyPlayerIndex = players.findIndex(p => !p.profile_id);
                  if (emptyPlayerIndex !== -1) {
                    handlePlayerChange(emptyPlayerIndex, item);
                  }
                }}
              >
                <List.Item
                  title={item.full_name}
                  left={props => <Avatar.Image {...props} source={{ uri: item.avatar_url }} size={40} />}
                  style={styles.searchResultItem}
                />
              </TouchableOpacity>
            )}
            style={styles.searchResults}
          />
        )}
        <View style={styles.teamsContainer}>
          {['Team 1', 'Team 2'].map((teamName, teamIndex) => (
            <View key={teamName} style={styles.team}>
              <Text style={styles.teamTitle}>{teamName}</Text>
              <View style={styles.playerSlots}>
                {players.slice(teamIndex * 2, teamIndex * 2 + 2).map((player, index) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[styles.playerSlot, player.name ? styles.playerSlotFilled : {}]}
                    onPress={() => !player.name && setSearchQuery('')}
                  >
                    {player.name ? (
                      <Chip
                        avatar={player.avatar_url ? <Avatar.Image size={24} source={{ uri: player.avatar_url }} /> : undefined}
                        onClose={() => handlePlayerChange(teamIndex * 2 + index, null)}
                        style={styles.playerChip}
                      >
                        <Text style={styles.playerNameInSlot}>{player.name}</Text>
                      </Chip>
                    ) : (
                      <View style={styles.emptySlot}>
                        <MaterialCommunityIcons name="account-plus" size={24} color={theme.colors.primary} />
                        <Text style={styles.emptySlotText}>Add Player</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
    color:"#fff"
  },
  searchInput: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  searchResultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teamsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    marginHorizontal: 8,
  },
  teamTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
    color:"#fff"
  },
  playerSlots: {
    flexDirection: 'column',
  },
  playerSlot: {
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    
  },
  playerNameInSlot:{
    color:"#fff"
  },
  playerSlotFilled: {
    borderColor: 'transparent',
  },
  playerChip: {
    borderRadius: 8,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  emptySlotText: {
    marginLeft: 8,
    color: '#666',
  },
});