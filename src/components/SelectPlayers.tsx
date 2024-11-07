import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, TextInput, useTheme, List, Chip, Avatar, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  level?: number;
};

type Player = {
  id: string;
  name: string;
  profile_id: string | null;
  avatar_url?: string;
  level?: number;
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
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const theme = useTheme();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1 && activeSlot !== null) {
      const filteredProfiles = profiles.filter(profile => 
        (profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.username.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !players.some(player => player.profile_id === profile.id)
      );
      setSearchResults(filteredProfiles);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, profiles, players, activeSlot]);

  useEffect(() => {
    onPlayersChange(players);
  }, [players, onPlayersChange]);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, level')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert('Error', 'Failed to fetch profiles. Please try again.');
    }
  }, []);

  const handlePlayerChange = useCallback((index: number, profile: Profile | null) => {
    setPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers];
      newPlayers[index] = { 
        ...newPlayers[index], 
        name: profile ? profile.full_name : '', 
        profile_id: profile ? profile.id : null,
        avatar_url: profile ? profile.avatar_url : undefined,
        level: profile ? profile.level : undefined
      };
      return newPlayers;
    });
    setSearchQuery('');
    setActiveSlot(null);
  }, []);

  const renderSearchResult = useCallback(({ item }: { item: Profile }) => (
    <TouchableOpacity
      onPress={() => {
        if (activeSlot !== null) {
          handlePlayerChange(activeSlot, item);
        }
      }}
    >
      <List.Item
        title={item.full_name}
        description={`@${item.username} • Level: ${item.level || 'N/A'}`}
        left={props => 
          item.avatar_url ? (
            <Avatar.Image {...props} source={{ uri: item.avatar_url }} size={40} />
          ) : (
            <Avatar.Text {...props} size={40} label={item.full_name.substring(0, 2).toUpperCase()} />
          )
        }
        right={props => <Text {...props} style={styles.levelText}>Lvl {item.level || 'N/A'}</Text>}
        style={styles.searchResultItem}
      />
    </TouchableOpacity>
  ), [activeSlot, handlePlayerChange]);

  const renderTeam = useCallback((teamName: string, teamIndex: number) => (
    <View key={teamName} style={styles.team}>
      <Text style={styles.teamTitle}>{teamName}</Text>
      <View style={styles.playerSlots}>
        {players.slice(teamIndex * 2, teamIndex * 2 + 2).map((player, index) => (
          <TouchableOpacity
            key={player.id}
            style={[
              styles.playerSlot, 
              player.name ? styles.playerSlotFilled : {},
              activeSlot === teamIndex * 2 + index ? styles.activeSlot : {}
            ]}
            onPress={() => {
              setActiveSlot(teamIndex * 2 + index);
              setSearchQuery('');
            }}
          >
            {player.name ? (
              <Chip
                avatar={
                  player.avatar_url ? (
                    <Avatar.Image size={24} source={{ uri: player.avatar_url }} />
                  ) : (
                    <Avatar.Text size={24} label={player.name.substring(0, 2).toUpperCase()} />
                  )
                }
                onClose={() => handlePlayerChange(teamIndex * 2 + index, null)}
                style={styles.playerChip}
              >
                <Text style={styles.playerNameInSlot}>{player.name}</Text>
                <Text style={styles.playerLevelInSlot}> Lvl {player.level || 'N/A'}</Text>
              </Chip>
            ) : (
              <View style={[
                styles.emptySlot,
                activeSlot === teamIndex * 2 + index ? styles.activeEmptySlot : {}
              ]}>
                <MaterialCommunityIcons 
                  name="account-plus" 
                  size={24} 
                  color={activeSlot === teamIndex * 2 + index ? theme.colors.primary : theme.colors.placeholder} 
                />
                <Text style={[
                  styles.emptySlotText,
                  activeSlot === teamIndex * 2 + index ? styles.activeEmptySlotText : {}
                ]}>
                  {activeSlot === teamIndex * 2 + index ? 'Select Player' : 'Add Player'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [players, handlePlayerChange, theme.colors.primary, theme.colors.placeholder, activeSlot]);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Select Players</Title>
        {activeSlot !== null && (
          <>
            <TextInput
              label="Search Player (name or username)"
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
                renderItem={renderSearchResult}
                style={styles.searchResults}
              />
            )}
          </>
        )}
        
        <View style={styles.teamsContainer}>
          {['Team 1', 'Team 2'].map((teamName, teamIndex) => renderTeam(teamName, teamIndex))}
        </View>
        
        {activeSlot !== null && (
          <Button 
            mode="contained" 
            onPress={() => setActiveSlot(null)} 
            style={styles.cancelButton}
          >
            Cancel Selection
          </Button>
        )}
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
    color: "#fff"
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
    marginBottom: 16,
  },
  teamTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
    color: "#fff"
  },
  playerSlots: {
    flexDirection: 'column',
  },
  playerSlot: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  playerSlotFilled: {
    borderColor: 'transparent',
  },
  playerChip: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  playerNameInSlot: {
    color: "#fff",
    marginRight: 4,
    fontWeight: 'bold',
  },
  playerLevelInSlot: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  activeEmptySlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  emptySlotText: {
    marginLeft: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  activeEmptySlotText: {
    color: '#fff',
  },
  levelText: {
    fontSize: 14,
    color: '#666',
  },
  activeSlot: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  cancelButton: {
    marginTop: 16,
  },
});