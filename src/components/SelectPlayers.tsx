import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, TextInput, useTheme, List, Chip, Avatar, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors } from "../theme/colors";
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  level?: number;
  resident_community_id?: string;
  guest_communities?: string[];
  group_owner_id?: string;
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
  const [residentIds, setResidentIds] = useState<string[]>([]); // New state for resident IDs
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
        !selectedProfileIds.includes(profile.id)
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
      // Fetch residents of the community to get their IDs
      const { data: residentProfiles, error: residentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('resident_community_id', communityId);

      if (residentError) throw residentError;

      const residentIds = residentProfiles?.map((resident) => resident.id) || [];
      setResidentIds(residentIds); // Store resident IDs

      // Fetch profiles where:
      // 1. resident_community_id matches the community_id
      // 2. guest_communities array contains the community_id
      // 3. group_owner_id is in the list of resident IDs
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, level, resident_community_id, guest_communities, group_owner_id')
        .or(
          residentIds.length > 0
            ? `resident_community_id.eq.${communityId},guest_communities.cs.{${communityId}},group_owner_id.in.(${residentIds.join(",")})`
            : `resident_community_id.eq.${communityId},guest_communities.cs.{${communityId}}`
        )
        .order('full_name', { ascending: true });

      if (error) throw error;

      // Filter profiles to ensure they meet at least one criterion
      const eligiblePlayers = data?.filter(
        (player) =>
          player.resident_community_id === communityId ||
          player.guest_communities?.includes(communityId) ||
          (player.group_owner_id && residentIds.includes(player.group_owner_id))
      ) || [];
      setProfiles(eligiblePlayers);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert(t('error') || 'Error', t('selectplayersScreen.errors.failedFetchProfiles') || 'Failed to fetch profiles');
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

  const getPlayerStatus = (profile: Profile) => {
    if (profile.resident_community_id === communityId) {
      return { label: t('selectplayersScreen.resident'), icon: 'home', style: styles.residentSearchBadge };
    }
    if (profile.guest_communities?.includes(communityId)) {
      return { label: t('selectplayersScreen.guest'), icon: 'account-group', style: styles.guestSearchBadge };
    }
    if (profile.group_owner_id && residentIds.includes(profile.group_owner_id)) {
      return { label: t('selectplayersScreen.groupMember'), icon: 'account-multiple', style: styles.groupMemberSearchBadge };
    }
    return { label: t('selectplayersScreen.guest'), icon: 'account-group', style: styles.guestSearchBadge };
  };

  const renderSearchResult = useCallback(({ item }: { item: Profile }) => {
    const { label, icon, style } = getPlayerStatus(item);
    return (
      <TouchableOpacity
        onPress={() => {
          if (activeSlot !== null) {
            handlePlayerChange(activeSlot, item);
          }
        }}
        style={styles.searchResultItem}
        activeOpacity={0.7}
      >
        <View style={styles.searchResultContent}>
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Avatar.Image source={{ uri: item.avatar_url }} size={44} />
            ) : (
              <Avatar.Text 
                size={44} 
                label={item.full_name.substring(0, 2).toUpperCase()} 
                style={styles.avatarText}
              />
            )}
            <View style={styles.levelBadgeSearch}>
              <Text style={styles.levelBadgeSearchText}>
                {item.level ?? 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.searchResultInfo}>
            <Text style={styles.searchResultName}>{item.full_name}</Text>
            <View style={styles.searchResultMetaRow}>
              <Text style={styles.searchResultUsername}>@{item.username}</Text>
              <View style={[styles.searchStatusBadge, style]}>
                <MaterialCommunityIcons 
                  name={icon} 
                  size={10} 
                  color="#fff" 
                />
                <Text style={styles.searchStatusText}>
                  {label}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.addButtonContainer}>
            <MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [activeSlot, handlePlayerChange, communityId, t, residentIds]);

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
        ]}
        onPress={() => {
          setActiveSlot(slot);
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isActive ? ['rgba(0, 168, 107, 0.1)', 'rgba(0, 200, 83, 0.05)'] : ['#ffffff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.playerSlotGradient}
        >
          <View style={[styles.teamIndicator, { backgroundColor: teamColor }]} />
          {player ? (
            <View style={styles.playerInfo}>
              <View style={styles.playerAvatarContainer}>
                {player.avatar_url ? (
                  <Avatar.Image size={48} source={{ uri: player.avatar_url }} />
                ) : (
                  <Avatar.Text 
                    size={48} 
                    label={player.full_name.substring(0, 2).toUpperCase()}
                    style={styles.avatarText}
                  />
                )}
                {isCurrentUser && (
                  <LinearGradient
                    colors={['#00A86B', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.youBadge}
                  >
                    <MaterialCommunityIcons name="account-check" size={10} color="#fff" />
                    <Text style={styles.youBadgeText}>{t('selectplayersScreen.you')}</Text>
                  </LinearGradient>
                )}
                <View style={styles.levelBadgeOnAvatar}>
                  <Text style={styles.levelBadgeOnAvatarText}>
                    {player.level ?? 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.full_name}
                </Text>
                <View style={styles.playerMetaContainer}>
                  <Text style={styles.playerUsername}>@{player.username}</Text>
                  <View style={[styles.playerTypeBadge, 
                    player.resident_community_id === communityId ? styles.residentBadge : 
                    player.guest_communities?.includes(communityId) ? styles.guestBadge : styles.groupMemberBadge]}>
                    <MaterialCommunityIcons 
                      name={player.resident_community_id === communityId ? "home" : 
                            player.guest_communities?.includes(communityId) ? "account-group" : "account-multiple"} 
                      size={10} 
                      color={player.resident_community_id === communityId ? "#4CAF50" : 
                            player.guest_communities?.includes(communityId) ? "#FF9800" : "#2196F3"} 
                    />
                    <Text style={[styles.playerTypeText, 
                      player.resident_community_id === communityId ? styles.residentText : 
                      player.guest_communities?.includes(communityId) ? styles.guestText : styles.groupMemberText]}>
                      {player.resident_community_id === communityId ? t('selectplayersScreen.resident') : 
                       player.guest_communities?.includes(communityId) ? t('selectplayersScreen.guest') : 
                       t('selectplayersScreen.groupMember')}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => handlePlayerChange(slot, null)}
                style={styles.removeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <LinearGradient
                  colors={['#f44336', '#e53935']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.removeButtonGradient}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.emptySlot, isActive && styles.activeEmptySlot]}>
              <View style={[styles.emptySlotIcon, isActive && styles.activeEmptySlotIcon]}>
                <MaterialCommunityIcons 
                  name="account-plus" 
                  size={28} 
                  color={isActive ? colors.primary : '#999'} 
                />
              </View>
              <View style={styles.emptySlotText}>
                <Text style={[styles.emptySlotLabel, isActive && styles.activeEmptySlotLabel]}>
                  {t('selectplayersScreen.player')} {position}
                </Text>
                <Text style={[styles.emptySlotHint, isActive && styles.activeEmptySlotHint]}>
                  {isActive ? t('selectplayersScreen.hints.searchOrBrowse') : t('selectplayersScreen.hints.tapToSelect')}
                </Text>
              </View>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={isActive ? colors.primary : '#ccc'} 
              />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }, [selectedPlayers, handlePlayerChange, activeSlot, user, communityId, t, residentIds]);

  const renderTeam = useCallback((teamName: string, teamColor: string, slots: [keyof SelectedPlayers, keyof SelectedPlayers]) => (
    <View key={teamName} style={styles.team}>
      <LinearGradient
        colors={[`${teamColor}15`, `${teamColor}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.teamGradient}
      >
        <View style={styles.teamHeader}>
          <View style={[styles.teamColorIndicator, { backgroundColor: teamColor }]} />
          <Text style={styles.teamTitle}>{teamName}</Text>
          <View style={[styles.teamIconBadge, { backgroundColor: teamColor }]}>
            <MaterialCommunityIcons name="account-group" size={14} color="#fff" />
          </View>
        </View>
        <View style={styles.playerSlots}>
          {slots.map((slot, index) => 
            renderPlayerSlot(slot, t('selectplayersScreen.player'), teamColor, index + 1)
          )}
        </View>
      </LinearGradient>
    </View>
  ), [renderPlayerSlot, t]);

  const getSelectedCount = () => {
    return Object.values(selectedPlayers).filter(Boolean).length;
  };

  const getCurrentUserSelected = () => {
    return Object.values(selectedPlayers).some(player => player && user && player.id === user.id);
  };

  return (
    <Card style={styles.card} elevation={6}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardGradient}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={['#00A86B', '#00C853']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <MaterialCommunityIcons name="account-multiple" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <LinearGradient
              colors={getSelectedCount() === 4 ? ['#4CAF50', '#66BB6A'] : ['#e0e0e0', '#bdbdbd']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.countChipGradient}
            >
              <Text style={[styles.countChipText, getSelectedCount() === 4 && styles.countChipTextComplete]}>
                {getSelectedCount()}/4
              </Text>
            </LinearGradient>
          </View>
          
          <View style={[styles.statusContainer, getCurrentUserSelected() ? styles.statusSuccess : styles.statusWarning]}>
            <LinearGradient
              colors={getCurrentUserSelected() ? ['#4CAF50', '#66BB6A'] : ['#FF9800', '#FFA726']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusIconCircle}
            >
              <MaterialCommunityIcons 
                name={getCurrentUserSelected() ? "check-circle" : "alert-circle"} 
                size={16} 
                color="#fff" 
              />
            </LinearGradient>
            <Text style={styles.statusText}>
              {getCurrentUserSelected() ? 
                t('selectplayersScreen.status.selected') : 
                t('selectplayersScreen.status.mustSelect')
              }
            </Text>
          </View>

          <View style={[styles.statusContainer]}>
            <LinearGradient
              colors={['#6e6e6eff', '#464646ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusIconCircle}
            >
              <MaterialCommunityIcons 
                name={"information"} 
                size={16} 
                color="#fff" 
              />
            </LinearGradient>
            <Text style={styles.statusText}>
              {
                t('selectplayersScreen.info')
              }
            </Text>
          </View>

          {activeSlot !== null && (
            <View style={styles.searchContainer}>
              <TextInput
                label={t('selectplayersScreen.searchPlaceholder', { playerSlot: activeSlot.replace('player', t('selectplayersScreen.player') + ' ') })}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                mode="outlined"
                dense
                left={<TextInput.Icon icon="magnify" />}
                right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : null}
                theme={{
                  colors: {
                    primary: colors.primary,
                  }
                }}
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
            {renderTeam(`${t('selectplayersScreen.team')} 1`, '#FF6B6B', ['player1', 'player2'])}
            {renderTeam(`${t('selectplayersScreen.team')} 2`, '#4ECDC4', ['player3', 'player4'])}
          </View>
          
          {activeSlot !== null && (
            <TouchableOpacity 
              onPress={() => {
                setActiveSlot(null);
                setSearchQuery('');
              }} 
              style={styles.cancelButton}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{t('selectplayersScreen.hints.cancel')}</Text>
            </TouchableOpacity>
          )}

          <LinearGradient
            colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryContainer}
          >
            <View style={styles.summaryHeader}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.trophyCircle}
              >
                <MaterialCommunityIcons name="trophy-outline" size={16} color="#fff" />
              </LinearGradient>
              <Text style={styles.summaryTitle}>{t('selectplayersScreen.preview.title')}</Text>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryTeam}>
                <Text style={styles.summaryTeamLabel}>{t('selectplayersScreen.team')} 1</Text>
                <Text style={styles.summaryText} numberOfLines={1}>
                  {selectedPlayers.player1?.full_name || t('selectplayersScreen.empty')} & {selectedPlayers.player2?.full_name || t('selectplayersScreen.empty')}
                </Text>
              </View>
              <View style={styles.vsCircle}>
                <Text style={styles.summaryVs}>{t('selectplayersScreen.preview.vs')}</Text>
              </View>
              <View style={styles.summaryTeam}>
                <Text style={styles.summaryTeamLabel}>{t('selectplayersScreen.team')} 2</Text>
                <Text style={styles.summaryText} numberOfLines={1}>
                  {selectedPlayers.player3?.full_name || t('selectplayersScreen.empty')} & {selectedPlayers.player4?.full_name || t('selectplayersScreen.empty')}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Card.Content>
      </LinearGradient>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardGradient: {
    flex: 1,
  },
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#1a1a1a",
    margin: 0,
  },
  countChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  countChipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  countChipTextComplete: {
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  statusWarning: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  statusIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statusText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    maxHeight: 240,
    overflow: 'hidden',
  },
  searchResultsList: {
    paddingVertical: 4,
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarText: {
    backgroundColor: colors.primary,
  },
  levelBadgeSearch: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1976D2',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#fff',
    minWidth: 24,
    alignItems: 'center',
  },
  levelBadgeSearchText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchResultInfo: {
    flex: 1,
    minWidth: 0,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  searchResultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchResultUsername: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  searchStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  residentSearchBadge: {
    backgroundColor: '#4CAF50',
  },
  guestSearchBadge: {
    backgroundColor: '#FF9800',
  },
  groupMemberSearchBadge: {
    backgroundColor: '#2196F3',
  },
  searchStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButtonContainer: {
    marginLeft: 12,
  },
  teamsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  team: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  teamGradient: {
    padding: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  teamColorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  teamTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#1a1a1a',
    flex: 1,
    letterSpacing: 0.3,
  },
  teamIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerSlots: {
    gap: 12,
  },
  playerSlot: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activeSlot: {
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  playerSlotGradient: {
    flexDirection: 'row',
    minHeight: 72,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 14,
  },
  teamIndicator: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    flex: 1,
  },
  playerAvatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  youBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
    elevation: 2,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelBadgeOnAvatar: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1976D2',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#fff',
    minWidth: 24,
    alignItems: 'center',
  },
  levelBadgeOnAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerDetails: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  playerMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerUsername: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    minWidth: 0,
  },
  playerTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  residentBadge: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  guestBadge: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  groupMemberBadge: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  playerTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  residentText: {
    color: '#4CAF50',
  },
  guestText: {
    color: '#FF9800',
  },
  groupMemberText: {
    color: '#2196F3',
  },
  removeButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  removeButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    flex: 1,
  },
  activeEmptySlot: {
    backgroundColor: 'transparent',
  },
  emptySlotIcon: {
    marginRight: 14,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  activeEmptySlotIcon: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.primary,
  },
  emptySlotText: {
    flex: 1,
  },
  emptySlotLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  activeEmptySlotLabel: {
    color: colors.primary,
  },
  emptySlotHint: {
    fontSize: 12,
    color: '#999',
  },
  activeEmptySlotHint: {
    color: colors.primary,
    fontWeight: '500',
  },
  cancelButton: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryContainer: {
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  trophyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTeam: {
    flex: 1,
    minWidth: 0,
  },
  summaryTeamLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryVs: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
});