import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Text, Card, useTheme, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import ProfileImage from './ProfileImage';
import PlayerProfileCard from './PlayerProfileCard';
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
  motivational_speech?: string;
};

type MonthlyPlayerStats = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  monthly_matches: number;
  monthly_wins: number;
};

type TopPlayersProps = {
  topPlayers: (PlayerStats | MonthlyPlayerStats)[];
  isMonthly: boolean;
};

export default function TopPlayers({ topPlayers, isMonthly }: TopPlayersProps) {
  const theme = useTheme();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPlayerStats = async (playerId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;
      setSelectedPlayer(data as PlayerStats);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerPress = (player: PlayerStats | MonthlyPlayerStats) => {
    if (isMonthly) {
      fetchPlayerStats(player.id);
    } else {
      setSelectedPlayer(player as PlayerStats);
    }
    setModalVisible(true);
  };

  const renderPlayerCard = (player: PlayerStats | MonthlyPlayerStats, index: number) => {
    const wins = isMonthly ? (player as MonthlyPlayerStats).monthly_wins : (player as PlayerStats).wins;
    const matches = isMonthly ? (player as MonthlyPlayerStats).monthly_matches : (player as PlayerStats).matches_played;
    const winRate = ((wins / (matches || 1)) * 100).toFixed(1);

    return (
      <TouchableOpacity
        key={player.id}
        onPress={() => handlePlayerPress(player)}
      >
        <Card style={styles.playerCard}>
          <LinearGradient
            colors={[colors.primary, "#000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <ProfileImage avatarUrl={player.avatar_url} size={60} />
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.full_name}</Text>
                  <Text style={styles.playerUsername}>@{player.username}</Text>
                </View>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.surface} />
                  <Text style={styles.statValue}>{wins}</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="tennis" size={24} color={theme.colors.surface} />
                  <Text style={styles.statValue}>{matches}</Text>
                  <Text style={styles.statLabel}>Matches</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="percent" size={24} color={theme.colors.surface} />
                  <Text style={styles.statValue}>{winRate}%</Text>
                  <Text style={styles.statLabel}>Win Rate</Text>
                </View>
              </View>
              {!isMonthly && (
                <View style={styles.levelContainer}>
                  <Text style={styles.levelLabel}>Level {(player as PlayerStats).level}</Text>
                  <View style={styles.levelStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialCommunityIcons
                        key={star}
                        name={star <= Math.floor((player as PlayerStats).level / 20) ? "star" : "star-outline"}
                        size={20}
                        color={star <= Math.floor((player as PlayerStats).level / 20) ? "#FFD700" : "#E0E0E0"}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}><MaterialCommunityIcons name="medal" size={32} color="#FFc700" /> Top Players <MaterialCommunityIcons name="medal" size={32} color="#FFc700" /></Text>
      {topPlayers.map((player, index) => renderPlayerCard(player, index))}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
              selectedPlayer && <PlayerProfileCard player={selectedPlayer} />
            )}
            <Button
              mode="contained"
              onPress={() => {
                setModalVisible(!modalVisible);
                setSelectedPlayer(null);
              }}
              style={styles.closeButton}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
    color: '#333',
  },
  playerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerUsername: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  levelStars: {
    flexDirection: 'row',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
});