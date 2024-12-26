import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, TouchableOpacity, RefreshControl, Alert, FlatList, SafeAreaView, StatusBar, Vibration } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme, Avatar, Card, Chip, Modal, Surface, IconButton } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopPlayers from '../components/TopPlayers';
import HotStreaks from '../components/HotStreaks';
import SearchPlayers from '../components/SearchPlayers';
import PlayerProfileCard from '../components/PlayerProfileCard';
import { colors } from "../theme/colors";
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

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

type Community = {
  id: string;
  name: string;
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
  }, [selectedCommunity]);

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
            [{ text: t('ok'), onPress: () => navigation.navigate('ProfileTab' as never) }]
          );
          return;
        }

        const { data: communityData, error: communityError } = await supabase
          .from('community')
          .select('id, name')
          .in('id', communityIds);

        if (communityError) throw communityError;

        if (Array.isArray(communityData) && communityData.length > 0) {
          setCommunities(communityData);
          setSelectedCommunity(communityData[0]);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('resident_community_id', selectedCommunity?.id)
        .order('wins', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setTopPlayers(data as PlayerStats[]);
    } catch (error) {
      console.error(t('errorFetchingTopPlayers'), error);
    }
  }

  async function fetchMonthlyTopPlayers() {
    try {
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

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('resident_community_id', selectedCommunity?.id)
          .in('id', Array.from(playerStats.keys()));

        if (profilesError) throw profilesError;

        if (profilesData) {
          const monthlyTopPlayers = profilesData.map(profile => ({
            ...profile,
            matches_played: playerStats.get(profile.id)?.matches || 0,
            wins: playerStats.get(profile.id)?.wins || 0,
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('resident_community_id', selectedCommunity?.id)
        .order('hot_streak', { ascending: false })
        .limit(3);

      if (error) throw error;
      if (data) setCurrentHotStreakPlayers(data as PlayerStats[]);
    } catch (error) {
      console.error(t('errorFetchingCurrentHotStreakPlayers'), error);
    }
  }

  async function fetchMaxHotStreakPlayers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('resident_community_id', selectedCommunity?.id)
        .order('max_hot_streak', { ascending: false })
        .limit(3);

      if (error) throw error;
      if (data) setMaxHotStreakPlayers(data as PlayerStats[]);
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

  const renderCommunitySelector = () => (
    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.communitySelector}>
      <MaterialCommunityIcons name="map-marker" size={24} color="#fff" style={styles.communityIcon} />
      <Text style={styles.communitySelectorText}>{selectedCommunity?.name || t('selectCommunity')}</Text>
      <MaterialCommunityIcons name="chevron-down" size={24} color="#fff" style={styles.chevronIcon} />
    </TouchableOpacity>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {['overall', 'monthly'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {t(tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCommunityModal = () => (
    <BlurView intensity={15} style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{t('selectCommunity')}</Text>
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.communityItem}
              onPress={() => {
                setSelectedCommunity(item);
                setModalVisible(false);
              }}
            >
              <MaterialCommunityIcons name="map-marker" size={24} color={colors.primary} style={styles.communityItemIcon} />
              <Text style={styles.communityItemText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
        <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.closeButton}>
          {t('close')}
        </Button>
      </View>
    </BlurView>
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

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.primary, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('playerStatistics')}</Text>
            {renderCommunitySelector()}
          </View>
          {selectedCommunity && (
            <SearchPlayers
              communityId={selectedCommunity.id}
              onSelectPlayer={handleSelectPlayer}
            />
          )}
          {renderTabs()}
          
          <Card style={styles.statsCard}>
            <Card.Content>
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
            </Card.Content>
          </Card>
        </ScrollView>
      </LinearGradient>

      {modalVisible && renderCommunityModal()}
      {selectedPlayer && renderPlayerProfileModal()}
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:'black',
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
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  communitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  communityIcon: {
    marginRight: 10,
  },
  communitySelectorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    borderRadius: 25,
    padding: 4,
    marginTop: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statsCard: {
    borderRadius: 16,
    elevation: 4,
    width:'100%'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'transparent'
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.text,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  communityItemIcon: {
    marginRight: 15,
  },
  communityItemText: {
    fontSize: 18,
    color: colors.text,
  },
  closeButton: {
    marginTop: 20,
  },
  playerProfileModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerProfileModalContent: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  playerProfileModalScrollContent: {
    flexGrow: 1,
  },
  closePlayerProfileButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
});