import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, TextInput, useTheme, List, Chip, Avatar, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors } from "../theme/colors";
import { useTranslation } from 'react-i18next';

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  level?: number;
  resident_community_id?: string;
  guest_communities?: string[];
};

interface SelectedPlayers {
  player1: Profile | null;
  player2: Profile | null;
  player3: Profile | null;
  player4: Profile | null;
}

interface SelectPlayersProps {
  communityId: string;
  onPlayersChange: (players: SelectedPlayers) => void;
}

export default function SelectPlayers({ communityId, onPlayersChange }: SelectPlayersProps) {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayers>({
    player1: null,
    player2: null,
    player3: null,
    player4: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [activeSlot, setActiveSlot] = useState<keyof SelectedPlayers | null>(null);
  const [user, setUser] = useState<any>(null);
  const theme = useTheme();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (communityId) {
      fetchProfiles();
    }
  }, [communityId]);

  useEffect(() => {
    if (searchQuery.length > 1 && activeSlot !== null && communityId) {
      const selectedProfileIds = Object.values(selectedPlayers)
        .filter(Boolean)
        .map(profile => profile.id);

      const filteredProfiles = profiles.filter(profile => 
        (profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.username.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !selectedProfileIds.includes(profile.id) &&
        (profile.resident_community_id === communityId || 
         (profile.guest_communities && profile.guest_communities.includes(communityId)))
      );
      setSearchResults(filteredProfiles);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, profiles, selectedPlayers, activeSlot, communityId]);

  useEffect(() => {
    onPlayersChange(selectedPlayers);
  }, [selectedPlayers, onPlayersChange]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProfiles = useCallback(async () => {
    if (!communityId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, level, resident_community_id, guest_communities')
        .or(`resident_community_id.eq.${communityId},guest_communities.cs.{${communityId}}`)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert(t('error') || 'Error', t('failedFetchProfiles') || 'Failed to fetch profiles');
    }
  }, [communityId, t]);

  const handlePlayerChange = useCallback((slot: keyof SelectedPlayers, profile: Profile | null) => {
    setSelectedPlayers(prev => ({
      ...prev,
      [slot]: profile
    }));
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
        description={`@${item.username} • Level: ${item.level || 'N/A'} • ${item.resident_community_id === communityId ? 'Resident' : 'Guest'}`}
        left={props => 
          item.avatar_url ? (
            <Avatar.Image {...props} source={{ uri: item.avatar_url }} size={40} />
          ) : (
            <Avatar.Text {...props} size={40} label={item.full_name.substring(0, 2).toUpperCase()} />
          )
        }
        right={props => <Text {...props} style={styles.levelText}>Level {item.level || 'N/A'}</Text>}
        style={styles.searchResultItem}
      />
    </TouchableOpacity>
  ), [activeSlot, handlePlayerChange, communityId]);

  const renderPlayerSlot = useCallback((
    slot: keyof SelectedPlayers, 
    label: string, 
    teamColor: string
  ) => {
    const player = selectedPlayers[slot];
    const isActive = activeSlot === slot;
    const isCurrentUser = player && user && player.id === user.id;

    return (
      <TouchableOpacity
        key={slot}
        style={[
          styles.playerSlot, 
          player ? styles.playerSlotFilled : {},
          isActive ? styles.activeSlot : {},
          { borderLeftColor: teamColor, borderLeftWidth: 4 }
        ]}
        onPress={() => {
          setActiveSlot(slot);
          setSearchQuery('');
        }}
      >
        {player ? (
          <View style={styles.playerInfo}>
            <View style={styles.playerMainInfo}>
              {player.avatar_url ? (
                <Avatar.Image size={40} source={{ uri: player.avatar_url }} />
              ) : (
                <Avatar.Text size={40} label={player.full_name.substring(0, 2).toUpperCase()} />
              )}
              <View style={styles.playerDetails}>
                <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>
                  {player.full_name} {isCurrentUser && '(You)'}
                </Text>
                <Text style={styles.playerMeta}>
                  @{player.username} • Level {player.level || 'N/A'} • 
                  {player.resident_community_id === communityId ? ' Resident' : ' Guest'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handlePlayerChange(slot, null)}
              style={styles.removeButton}
            >
              <MaterialCommunityIcons name="close-circle" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[
            styles.emptySlot,
            isActive ? styles.activeEmptySlot : {}
          ]}>
            <MaterialCommunityIcons 
              name="account-plus" 
              size={32} 
              color={isActive ? colors.primary : colors.secondary} 
            />
            <Text style={[
              styles.emptySlotText,
              isActive ? styles.activeEmptySlotText : {}
            ]}>
              {label}
            </Text>
            <Text style={styles.slotHint}>
              {isActive ? 'Search above or tap to browse' : 'Tap to select'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedPlayers, handlePlayerChange, activeSlot, user, communityId]);

  const renderTeam = useCallback((teamName: string, teamColor: string, slots: [keyof SelectedPlayers, keyof SelectedPlayers]) => (
    <View key={teamName} style={styles.team}>
      <Text style={[styles.teamTitle, { color: teamColor }]}>{teamName}</Text>
      <View style={styles.playerSlots}>
        {slots.map((slot, index) => 
          renderPlayerSlot(slot, `Player ${index + 1}`, teamColor)
        )}
      </View>
    </View>
  ), [renderPlayerSlot]);

  const getSelectedCount = () => {
    return Object.values(selectedPlayers).filter(Boolean).length;
  };

  const getCurrentUserSelected = () => {
    return Object.values(selectedPlayers).some(player => player && user && player.id === user.id);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>
          Select Players ({getSelectedCount()}/4)
        </Title>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {getCurrentUserSelected() ? 
              '✓ You are selected as a player' : 
              '⚠ You must be one of the players'
            }
          </Text>
        </View>

        {activeSlot !== null && (
          <View style={styles.searchContainer}>
            <TextInput
              label={`Search for ${activeSlot}`}
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
                nestedScrollEnabled={true}
              />
            )}
          </View>
        )}
        
        <View style={styles.teamsContainer}>
          {renderTeam('Team 1', '#FF6B6B', ['player1', 'player2'])}
          {renderTeam('Team 2', '#4ECDC4', ['player3', 'player4'])}
        </View>
        
        {activeSlot !== null && (
          <Button 
            mode="outlined" 
            onPress={() => {
              setActiveSlot(null);
              setSearchQuery('');
            }} 
            style={styles.cancelButton}
          >
            Cancel Selection
          </Button>
        )}

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Match Summary:</Text>
          <Text style={styles.summaryText}>
            Team 1: {selectedPlayers.player1?.full_name || 'Empty'} & {selectedPlayers.player2?.full_name || 'Empty'}
          </Text>
          <Text style={styles.summaryText}>
            Team 2: {selectedPlayers.player3?.full_name || 'Empty'} & {selectedPlayers.player4?.full_name || 'Empty'}
          </Text>
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
    color: "#fff"
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  searchResults: {
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  searchResultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  team: {
    flex: 1,
    marginHorizontal: 4,
  },
  teamTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  playerSlots: {
    flexDirection: 'column',
  },
  playerSlot: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    overflow: 'hidden',
    minHeight: 80,
  },
  playerSlotFilled: {
    borderColor: '#4CAF50',
  },
  activeSlot: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  playerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentUserName: {
    color: colors.primary,
  },
  playerMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  emptySlot: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    minHeight: 80,
  },
  activeEmptySlot: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  emptySlotText: {
    marginTop: 8,
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  activeEmptySlotText: {
    color: colors.primary,
  },
  slotHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  levelText: {
    fontSize: 12,
    color: '#666',
  },
  cancelButton: {
    marginBottom: 16,
  },
  summaryContainer: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
});