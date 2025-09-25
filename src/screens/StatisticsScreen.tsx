import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, TouchableOpacity, RefreshControl, Alert, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme, Avatar, Card, Chip, Modal, Surface, IconButton, Switch } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopPlayers from '../components/TopPlayers';
import HotStreaks from '../components/HotStreaks';
import SearchPlayers from '../components/SearchPlayers';
import PlayerProfileCard from '../components/PlayerProfileCard';
import { colors } from "../theme/colors";
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import * as Animatable from 'react-native-animatable';

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
  motivational_speech?: string;
  is_guest: boolean;
  resident_community_id?: string;
  guest_communities?: string[];
  group_owner_id?: string;
};

type Community = {
  id: string;
  name: string;
  isResident: boolean;
};

export default function StatisticsScreen() {
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);
  const [monthlyTopPlayers, setMonthlyTopPlayers] = useState<PlayerStats[]>([]);
  const [currentHotStreakPlayers, setCurrentHotStreakPlayers] = useState<PlayerStats[]>([]);
  const [maxHotStreakPlayers, setMaxHotStreakPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overall');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [includeGuests, setIncludeGuests] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      fetchData();
    }
  }, [selectedCommunity, includeGuests]);

  const fetchCommunities = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('resident_community_id, guest_communities')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        const guestCommunities = profileData?.guest_communities || [];
        const communityIds = [
          profileData.resident_community_id,
          ...guestCommunities
        ].filter(Boolean);

        if (communityIds.length === 0) {
          Alert.alert(
            t('noCommunities'),
            t('noCommunitiesMessage'),
            [{ text: t('ok'), onPress: () => navigation.navigate('Tabs', { screen: 'Profile' }) }]
          );
          return;
        }

        const { data: communityData, error: communityError } = await supabase
          .from('community')
          .select('id, name')
          .in('id', communityIds);

        if (communityError) throw communityError;

        if (Array.isArray(communityData) && communityData.length > 0) {
          const formattedCommunities = communityData.map((community) => ({
            ...community,
            isResident: community.id === profileData.resident_community_id,
          }));
          setCommunities(formattedCommunities);
          console.log(formattedCommunities);
          const residentCommunity = formattedCommunities.find((c) => c.isResident);
          setSelectedCommunity(residentCommunity || formattedCommunities[0]);
        } else {
          Alert.alert(t('noCommunitiesFound'), t('communityDataEmpty'));
        }
      } else {
        Alert.alert(t('error'), t('userNotFoundLogin'));
      }
    } catch (error) {
      console.error(t('errorFetchingCommunities'), error);
      Alert.alert(t('error'), t('failedToFetchCommunities'));
    }
  };

  const fetchData = async () => {
    if (!selectedCommunity) return;
    
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
      const { data: residentProfiles, error: residentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('resident_community_id', selectedCommunity?.id);

      if (residentError) throw residentError;

      const residentIds = residentProfiles.map((resident) => resident.id);
      let query = supabase
        .from('profiles')
        .select('*, resident_community_id, guest_communities')
        .order('wins', { ascending: false });

      if (includeGuests) {
        query = query.or(
          `resident_community_id.eq.${selectedCommunity?.id},group_owner_id.in.(${residentIds.join(",")}),guest_communities.cs.{"${selectedCommunity?.id}"}`
        );
      } else {
        query = query.or(
          `resident_community_id.eq.${selectedCommunity?.id},group_owner_id.in.(${residentIds.join(",")})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        const playersWithGuestFlag = data.map((player) => ({
          ...player,
          is_guest: player.resident_community_id !== selectedCommunity?.id && player.guest_communities?.includes(selectedCommunity?.id),
        }));
        setTopPlayers(playersWithGuestFlag as PlayerStats[]);
      }
    } catch (error) {
      console.error(t('errorFetchingTopPlayers'), error);
    }
  }

  async function fetchMonthlyTopPlayers() {
    try {
      const { data: residentProfiles, error: residentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('resident_community_id', selectedCommunity?.id);

      if (residentError) throw residentError;

      const residentIds = residentProfiles.map((resident) => resident.id);
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      const { data: matchesData, error: matchesError } = await supabase
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

      if (matchesError) throw matchesError;

      if (matchesData) {
        const playerStats = new Map<string, { matches: number; wins: number }>();

        matchesData.forEach(match => {
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

        let query = supabase
          .from('profiles')
          .select('*, resident_community_id, guest_communities')
          .in('id', Array.from(playerStats.keys()));

        if (includeGuests) {
          query = query.or(
            `resident_community_id.eq.${selectedCommunity?.id},group_owner_id.in.(${residentIds.join(",")}),guest_communities.cs.{"${selectedCommunity?.id}"}`
          );
        } else {
          query = query.or(
            `resident_community_id.eq.${selectedCommunity?.id},group_owner_id.in.(${residentIds.join(",")})`
          );
        }

        const { data: profilesData, error: profilesError } = await query;
        if (profilesError) throw profilesError;

        if (profilesData) {
          const monthlyTopPlayers = profilesData.map(profile => ({
            ...profile,
            matches_played: playerStats.get(profile.id)?.matches || 0,
            wins: playerStats.get(profile.id)?.wins || 0,
            is_guest: profile.resident_community_id !== selectedCommunity?.id && profile.guest_communities?.includes(selectedCommunity?.id),
          }));

          monthlyTopPlayers.sort((a, b) => b.wins - a.wins);
          setMonthlyTopPlayers(monthlyTopPlayers.slice(0, 5));
        }
      }
    } catch (error) {
      console.error(t('errorFetchingMonthlyTopPlayers'), error);
    }
  }

  async function fetchCurrentHotStreakPlayers() {
    try {
      const { data: residentProfiles, error: residentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('resident_community_id', selectedCommunity?.id);

      if (residentError) throw residentError;

      const residentIds = residentProfiles.map((resident) => resident.id);
      let query = supabase
        .from('profiles')
        .select('*, resident_community_id, guest_communities')
        .order('hot_streak', { ascending: false })
        .limit(3);

      if (includeGuests) {
        query = query.or(
          `resident_community_id.eq.${selectedCommunity?.id},group_owner_id.in.(${residentIds.join(",")}),guest_communities.cs.{"${selectedCommunity?.id}"}`
        );
      } else {
        query = query.or(
          `resident_community_id.eq.${selectedCommunity?.id},group_owner_id.in.(${residentIds.join(",")})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        const playersWithGuestFlag = data.map((player) => ({
          ...player,
          is_guest: player.resident_community_id !== selectedCommunity?.id && player.guest_communities?.includes(selectedCommunity?.id),
        }));
        setCurrentHotStreakPlayers(playersWithGuestFlag as PlayerStats[]);
      }
    } catch (error) {
      console.error(t('errorFetchingCurrentHotStreakPlayers'), error);
    }
  }

  async function fetchMaxHotStreakPlayers() {
    try {
      const { data: residentProfiles, error: residentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('resident_community_id', selectedCommunity?.id);

      if (residentError) throw residentError;

      const residentIds = residentProfiles.map((resident) => resident.id);
      let query = supabase
        .from('profiles')
        .select('*, resident_community_id, guest_communities')
        .order('max_hot_streak', { ascending: false })
        .limit(3);

      if (includeGuests) {
        query = query.or(
          `resident_community_id.eq.${selectedCommunity?.id},group_owner_id.in.(${residentIds.join(",")}),guest_communities.cs.{"${selectedCommunity?.id}"}`
        );
      } else {
        query = query.or(
          `resident_community_id.eq.${selectedCommunity?.id},group_owner_id.in.(${residentIds.join(",")})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        const playersWithGuestFlag = data.map((player) => ({
          ...player,
          is_guest: player.resident_community_id !== selectedCommunity?.id && player.guest_communities?.includes(selectedCommunity?.id),
        }));
        setMaxHotStreakPlayers(playersWithGuestFlag as PlayerStats[]);
      }
    } catch (error) {
      console.error(t('errorFetchingMaxHotStreakPlayers'), error);
    }
  }

  const handleSelectPlayer = async (player: { id: string }) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', player.id)
        .single();

      if (error) throw error;
      setSelectedPlayer(data as PlayerStats);
    } catch (error) {
      console.error(t('errorFetchingPlayerDetails'), error);
      Alert.alert(t('error'), t('failedToFetchPlayerDetails'));
    }
  };

  const handleCommunitySelectorPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const renderCommunitySelector = () => (
    <Animatable.View animation="fadeInUp" duration={800}>
      <TouchableOpacity 
        onPress={handleCommunitySelectorPress} 
        style={styles.communitySelector}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#00A86B', '#00C853']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <MaterialCommunityIcons name="map-marker" size={20} color="#fff" style={styles.communityIcon} />
          <Text style={styles.communitySelectorText}>
            {selectedCommunity?.name || t('selectCommunityButton')}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#fff" style={styles.chevronIcon} />
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderIncludeGuestsToggle = () => (
    <Animatable.View animation="fadeInUp" duration={800} delay={200}>
      <View style={styles.guestToggleContainer}>
        <View style={styles.guestToggleContent}>
          <MaterialCommunityIcons name="account-group" size={20} color="#fff" style={styles.guestToggleIcon} />
          <Text style={styles.guestToggleText}>{t('includeGuests')}</Text>
          <Switch
            value={includeGuests}
            onValueChange={setIncludeGuests}
            thumbColor={includeGuests ? '#00C853' : '#fff'}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(0,168,107,0.3)' }}
          />
        </View>
      </View>
    </Animatable.View>
  );

  const renderTabs = () => (
    <Animatable.View animation="fadeInUp" duration={800} delay={400}>
      <View style={styles.tabContainer}>
        {['overall', 'monthly'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {t(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animatable.View>
  );

  const renderCommunityModal = () => (
    <Modal
      visible={modalVisible}
      onDismiss={() => setModalVisible(false)}
      contentContainerStyle={styles.modalContainer}
    >
      <Animatable.View animation="fadeInUp" duration={800} style={styles.modalContent}>
        <Text style={styles.modalTitle}>{t('selectCommunity')}</Text>
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.communityItem, item.id === selectedCommunity?.id && styles.selectedCommunityItem]}
              onPress={() => {
                setSelectedCommunity(item);
                setModalVisible(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={item.isResident ? "home" : "map-marker"} 
                size={24} 
                color="#00C853" 
                style={styles.communityItemIcon} 
              />
              <View style={styles.communityItemTextContainer}>
                <Text style={styles.communityItemText}>{item.name}</Text>
                {item.isResident && (
                  <Chip mode="outlined" style={styles.residentChip}>
                    <Text style={styles.residentChipText}>{t('resident')}</Text>
                  </Chip>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity 
          onPress={() => setModalVisible(false)} 
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#00A86B', '#00C853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientCloseButton}
          >
            <Text style={styles.closeButtonText}>{t('close')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </Modal>
  );

  const renderPlayerProfileModal = () => (
    <Modal
      visible={!!selectedPlayer}
      onDismiss={() => setSelectedPlayer(null)}
      contentContainerStyle={styles.playerProfileModalContainer}
    >
      <Surface style={styles.playerProfileModalContent}>
        <ScrollView contentContainerStyle={styles.playerProfileModalScrollContent}>
          {selectedPlayer && (
            <PlayerProfileCard player={selectedPlayer} />
          )}
        </ScrollView>
        <IconButton
          icon="close"
          size={24}
          onPress={() => setSelectedPlayer(null)}
          style={styles.closePlayerProfileButton}
        />
      </Surface>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons name="chart-line" size={64} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyStateTitle}>{t('noDataAvailable')}</Text>
      <Text style={styles.emptyStateMessage}>
        {activeTab === 'monthly' ? t('noMatchesThisMonth') : t('noPlayersFound')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{t('loadingStatistics')}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>

    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.container}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('playerStatistics')}</Text>
            {renderCommunitySelector()}
            {renderIncludeGuestsToggle()}
          </View>

          {selectedCommunity && (
            <View style={styles.searchContainer}>
              <SearchPlayers
                communityId={selectedCommunity.id}
                onSelectPlayer={handleSelectPlayer}
              />
            </View>
          )}

          {renderTabs()}
          
          <View style={styles.contentContainer}>
            <Card style={styles.statsCard}>
              <Card.Content>
                {(activeTab === 'overall' ? topPlayers : monthlyTopPlayers).length > 0 ? (
                  <TopPlayers
                    topPlayers={activeTab === 'overall' ? topPlayers : monthlyTopPlayers}
                    isMonthly={activeTab === 'monthly'}
                  />
                ) : (
                  renderEmptyState()
                )}

                {activeTab === 'overall' && (currentHotStreakPlayers.length > 0 || maxHotStreakPlayers.length > 0) && (
                  <HotStreaks
                    currentHotStreakPlayers={currentHotStreakPlayers}
                    maxHotStreakPlayers={maxHotStreakPlayers}
                  />
                )}
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </LinearGradient>

      {renderCommunityModal()}
      {selectedPlayer && renderPlayerProfileModal()}
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  communitySelector: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  communityIcon: {
    marginRight: 12,
  },
  communitySelectorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 12,
  },
  guestToggleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guestToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guestToggleIcon: {
    marginRight: 12,
  },
  guestToggleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#00C853',
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 2,
    paddingBottom: 20,
  },
  statsCard: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: 'transparent',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  marginTop:40,
  borderRadius: 16,
  padding: 24,
  width: '90%',
  maxHeight: height * 0.9, // <-- increased from 80% to 90%
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  elevation: 8,
  shadowColor: '#00C853',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
},

  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedCommunityItem: {
    backgroundColor: 'rgba(0, 168, 107, 0.1)',
  },
  communityItemIcon: {
    marginRight: 16,
  },
  communityItemTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  communityItemText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  residentChip: {
    backgroundColor: 'rgba(0, 168, 107, 0.1)',
    borderColor: '#00C853',
    borderRadius: 8,
  },
  residentChipText: {
    color: '#00C853',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientCloseButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  playerProfileModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  playerProfileModalContent: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
    width: '95%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playerProfileModalScrollContent: {
    flexGrow: 1,
  },
  closePlayerProfileButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    elevation: 5,
  },
});