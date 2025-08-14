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
      style={styles.searchResultItem}
    >
      <View style={styles.searchResultContent}>
        {item.avatar_url ? (
          <Avatar.Image source={{ uri: item.avatar_url }} size={36} />
        ) : (
          <Avatar.Text size={36} label={item.full_name.substring(0, 2).toUpperCase()} />
        )}
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultName}>{item.full_name}</Text>
          <Text style={styles.searchResultMeta}>
            @{item.username} • Level {item.level || 'N/A'} • {item.resident_community_id === communityId ? 'Resident' : 'Guest'}
          </Text>
        </View>
        <MaterialCommunityIcons name="plus-circle" size={20} color={colors.primary} />
      </View>
    </TouchableOpacity>
  ), [activeSlot, handlePlayerChange, communityId]);

  const renderPlayerSlot = useCallback((
    slot: keyof SelectedPlayers, 
    label: string, 
    teamColor: string,
    position: number
  ) => {
    const player = selectedPlayers[slot];
    const isActive = activeSlot === slot;
    const isCurrentUser = player && user && player.id === user.id;

    return (
      <TouchableOpacity
        key={slot}
        style={[
          styles.playerSlot,
          isActive && styles.activeSlot,
          { borderLeftColor: teamColor }
        ]}
        onPress={() => {
          setActiveSlot(slot);
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        {player ? (
          <View style={styles.playerInfo}>
            <View style={styles.playerAvatar}>
              {player.avatar_url ? (
                <Avatar.Image size={32} source={{ uri: player.avatar_url }} />
              ) : (
                <Avatar.Text size={32} label={player.full_name.substring(0, 2).toUpperCase()} />
              )}
              {isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
            </View>
            <View style={styles.playerDetails}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.full_name}
              </Text>
              <View style={styles.playerMetaContainer}>
                <Text style={styles.playerUsername}>@{player.username}</Text>
                <View style={styles.playerLevelBadge}>
                  <Text style={styles.playerLevel}>Lv.{player.level || 'N/A'}</Text>
                </View>
                <View style={[styles.playerTypeBadge, 
                  player.resident_community_id === communityId ? styles.residentBadge : styles.guestBadge]}>
                  <Text style={styles.playerTypeText}>
                    {player.resident_community_id === communityId ? 'R' : 'G'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handlePlayerChange(slot, null)}
              style={styles.removeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptySlot, isActive && styles.activeEmptySlot]}>
            <View style={styles.emptySlotIcon}>
              <MaterialCommunityIcons 
                name="account-plus" 
                size={24} 
                color={isActive ? colors.primary : '#999'} 
              />
            </View>
            <View style={styles.emptySlotText}>
              <Text style={[styles.emptySlotLabel, isActive && styles.activeEmptySlotLabel]}>
                {label} {position}
              </Text>
              <Text style={styles.emptySlotHint}>
                {isActive ? 'Search or browse' : 'Tap to select'}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedPlayers, handlePlayerChange, activeSlot, user, communityId]);

  const renderTeam = useCallback((teamName: string, teamColor: string, slots: [keyof SelectedPlayers, keyof SelectedPlayers]) => (
    <View key={teamName} style={styles.team}>
      <View style={styles.teamHeader}>
        <View style={[styles.teamColorIndicator, { backgroundColor: teamColor }]} />
        <Text style={styles.teamTitle}>{teamName}</Text>
        <MaterialCommunityIcons name="account-group" size={16} color={teamColor} />
      </View>
      <View style={styles.playerSlots}>
        {slots.map((slot, index) => 
          renderPlayerSlot(slot, 'Player', teamColor, index + 1)
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
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <Title style={styles.sectionTitle}>
            Select Players
          </Title>
          <Chip 
            style={[styles.countChip, getSelectedCount() === 4 && styles.completeChip]} 
            textStyle={styles.countChipText}
            compact
          >
            {getSelectedCount()}/4
          </Chip>
        </View>
        
        <View style={[styles.statusContainer, getCurrentUserSelected() ? styles.statusSuccess : styles.statusWarning]}>
          <MaterialCommunityIcons 
            name={getCurrentUserSelected() ? "check-circle" : "alert-circle"} 
            size={16} 
            color={getCurrentUserSelected() ? "#4CAF50" : "#FF9800"} 
          />
          <Text style={styles.statusText}>
            {getCurrentUserSelected() ? 
              'You are selected as a player' : 
              'You must be one of the players'
            }
          </Text>
        </View>

        {activeSlot !== null && (
          <View style={styles.searchContainer}>
            <TextInput
              label={`Search for ${activeSlot.replace('player', 'Player ')}`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              mode="outlined"
              dense
              left={<TextInput.Icon icon="magnify" />}
              right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : null}
            />
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSearchResult}
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                />
              </View>
            )}
          </View>
        )}
        
        <View style={styles.teamsContainer}>
          {renderTeam('Team 1', '#FF6B6B', ['player1', 'player2'])}
          {renderTeam('Team 2', '#4ECDC4', ['player3', 'player4'])}
        </View>
        
        {activeSlot !== null && (
          <Button 
            mode="text" 
            onPress={() => {
              setActiveSlot(null);
              setSearchQuery('');
            }} 
            style={styles.cancelButton}
            compact
          >
            Cancel Selection
          </Button>
        )}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons name="trophy-outline" size={16} color="#fff" />
            <Text style={styles.summaryTitle}>Match Preview</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryTeam}>
              <Text style={styles.summaryTeamLabel}>Team 1</Text>
              <Text style={styles.summaryText}>
                {selectedPlayers.player1?.full_name || 'Empty'} & {selectedPlayers.player2?.full_name || 'Empty'}
              </Text>
            </View>
            <Text style={styles.summaryVs}>VS</Text>
            <View style={styles.summaryTeam}>
              <Text style={styles.summaryTeamLabel}>Team 2</Text>
              <Text style={styles.summaryText}>
                {selectedPlayers.player3?.full_name || 'Empty'} & {selectedPlayers.player4?.full_name || 'Empty'}
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#333",
    margin: 0,
  },
  countChip: {
    backgroundColor: '#f0f0f0',
    height: 28,
  },
  completeChip: {
    backgroundColor: '#E8F5E8',
  },
  countChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  statusWarning: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  statusText: {
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 14,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    maxHeight: 200,
  },
  searchResultsList: {
    paddingVertical: 4,
  },
  searchResultItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  searchResultMeta: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  teamsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  team: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamColorIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  teamTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  playerSlots: {
    gap: 8,
  },
  playerSlot: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    minHeight: 64,
    elevation: 1,
  },
  activeSlot: {
    borderColor: colors.primary,
    borderWidth: 2,
    borderLeftWidth: 4,
    elevation: 3,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 64,
  },
  playerAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  youBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerDetails: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playerMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerUsername: {
    fontSize: 11,
    color: '#666',
    flex: 1,
    minWidth: 0,
  },
  playerLevelBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  playerLevel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  playerTypeBadge: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  residentBadge: {
    backgroundColor: '#E8F5E8',
  },
  guestBadge: {
    backgroundColor: '#FFF3E0',
  },
  playerTypeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 64,
    backgroundColor: '#f8f8f8',
  },
  activeEmptySlot: {
    backgroundColor: '#f0f8ff',
  },
  emptySlotIcon: {
    marginRight: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 1,
  },
  emptySlotText: {
    flex: 1,
  },
  emptySlotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  activeEmptySlotLabel: {
    color: colors.primary,
  },
  emptySlotHint: {
    fontSize: 11,
    color: '#999',
  },
  cancelButton: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  summaryContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTeam: {
    flex: 1,
  },
  summaryTeamLabel: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryText: {
    color: '#fff',
    fontSize: 12,
  },
  summaryVs: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginHorizontal: 8,
  },
});