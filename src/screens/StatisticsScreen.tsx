import React, { useState, useEffect } from 'react';
import { View, ScrollView,Dimensions, StyleSheet, TouchableOpacity, RefreshControl, Alert, Modal, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopPlayers from '../components/TopPlayers';
import HotStreaks from '../components/HotStreaks';
import SearchPlayers from '../components/SearchPlayers';
import PlayerProfileCard from '../components/PlayerProfileCard';
import { colors } from "../theme/colors";

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
            "No Communities",
            "You haven't joined any communities yet. Please set up your profile first.",
            [{ text: "OK", onPress: () => navigation.navigate('ProfileTab' as never) }]
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
          Alert.alert("No Communities Found", "The community data is empty or not structured as expected.");
        }
      } else {
        Alert.alert("Error", "User not found. Please log in.");
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      Alert.alert("Error", "Failed to fetch communities. Please try again.");
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
      console.error('Error fetching top players:', error);
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
      console.error('Error fetching monthly top players:', error);
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
      console.error('Error fetching current hot streak players:', error);
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
      console.error('Error fetching max hot streak players:', error);
    }
  }

 
const handleSelectPlayer = async (player: { id: string }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', player.id)
        .single();

      if (error) throw error;
      setSelectedPlayer(data as PlayerStats);
    } catch (error) {
      console.error('Error fetching player details:', error);
      Alert.alert('Error', 'Failed to fetch player details. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[colors.primary, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Player Statistics</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.communitySelector}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#fff" style={styles.communityIcon} />
              <Text style={styles.communitySelectorText}>{selectedCommunity?.name || "Select Community"}</Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#fff" style={styles.chevronIcon} />
            </TouchableOpacity>
          </View>
          {selectedCommunity && (
            <SearchPlayers
              communityId={selectedCommunity.id}
              onSelectPlayer={handleSelectPlayer}
            />
          )}
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
        </LinearGradient>
        
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
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Community</Text>
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
            <Button onPress={() => setModalVisible(false)} style={styles.closeButton}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
      <Modal
  animationType="fade"
  transparent={true}
  visible={!!selectedPlayer}
  onRequestClose={() => setSelectedPlayer(null)}
>
  <View style={styles.playerProfileModalContainer}>
    <View style={styles.playerProfileModalContent}>
      <ScrollView contentContainerStyle={styles.playerProfileModalScrollContent}>
        {selectedPlayer && (
          <PlayerProfileCard
            player={selectedPlayer}
          />
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setSelectedPlayer(null)}
        accessibilityLabel="Close player profile"
      >
        <MaterialCommunityIcons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gradientBackground: {
    paddingTop: StatusBar.currentHeight,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
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
    color: '#000',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    color: '#333',
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  communityItemIcon: {
    marginRight: 15,
  },
  communityItemText: {
    fontSize: 18,
    color: '#333',
  },
  
   playerProfileModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playerProfileModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    minHeight: height,
  },
  playerProfileModalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
});