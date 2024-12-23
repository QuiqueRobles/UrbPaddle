import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Text, Card, useTheme, Button, IconButton, Tooltip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileImage from './ProfileImage';
import PlayerProfileCard from './PlayerProfileCard';
import { gradients } from "../theme/gradients";

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

type HotStreaksProps = {
  currentHotStreakPlayers: PlayerStats[];
  maxHotStreakPlayers: PlayerStats[];
};

export default function HotStreaks({ currentHotStreakPlayers, maxHotStreakPlayers }: HotStreaksProps) {
  const theme = useTheme();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const renderHotStreakPlayer = (player: PlayerStats, index: number, isCurrentStreak: boolean) => {
    const animatedValue = new Animated.Value(0);
    
    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        key={player.id}
        style={[
          styles.cardContainer,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity onPress={() => {
          setSelectedPlayer(player);
          setModalVisible(true);
        }}>
          <Card style={styles.hotStreakCard}>
            <LinearGradient
              colors={gradients.obsidian}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.cardGradient}
            >
              <Card.Content style={styles.hotStreakContent}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.playerInfoContainer}>
                  <ProfileImage avatarUrl={player.avatar_url} size={60} />
                  <View style={styles.hotStreakInfo}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.hotStreakName}>{player.full_name}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.hotStreakUsername}>@{player.username}</Text>
                  </View>
                </View>
                <View style={styles.streakContainer}>
                  <MaterialCommunityIcons 
                    name={isCurrentStreak ? "fire" : "crown"} 
                    size={36} 
                    color={isCurrentStreak ? "#FF6B6B" : "#FFD700"} 
                  />
                  <Text style={styles.hotStreakValue}>
                    {isCurrentStreak ? player.hot_streak : player.max_hot_streak}
                  </Text>
                </View>
              </Card.Content>
            </LinearGradient>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSection = (title: string, players: PlayerStats[], isCurrentStreak: boolean) => (
    <View style={styles.section}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>
          {isCurrentStreak ? '🔥 Current Hot Streak 🔥' : '👑 Historical Hot Streak 👑'}
        </Text>
        <IconButton
          icon="information"
          iconColor='white'
          size={24}
          onPress={() => setInfoModalVisible(true)}
        />
      </View>
      {players.length > 0 ? (
        players.map((player, index) => renderHotStreakPlayer(player, index, isCurrentStreak))
      ) : (
        <Text style={styles.noDataText}>No players on a hot streak at the moment.</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderSection('Historical Hot Streak', maxHotStreakPlayers, false)}
      {renderSection('Current Hot Streak', currentHotStreakPlayers, true)}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedPlayer && <PlayerProfileCard player={selectedPlayer} />}
            <Button
              mode="contained"
              onPress={() => {
                setModalVisible(false);
                setSelectedPlayer(null);
              }}
              style={styles.closeButton}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.infoModalView}>
            <Text style={styles.infoModalTitle}>Hot Streaks Explained</Text>
            <Text style={styles.infoModalText}>
              🔥 Current Hot Streak: This shows the players who are currently on a winning streak. The number indicates how many consecutive matches they've won without losing. Keep an eye on these players - they're on fire!
            </Text>
            <Text style={styles.infoModalText}>
              👑 Historical Hot Streak: This displays the players who have achieved the longest winning streaks in the past. The number represents their best streak ever. These players have proven they can dominate!
            </Text>
            <Button
              mode="contained"
              onPress={() => setInfoModalVisible(false)}
              style={styles.closeButton}
            >
              Got it!
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContainer: {
    marginBottom: 16,
  },
  hotStreakCard: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    borderRadius: 16,
  },
  hotStreakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rankContainer: {
    width: 20,
    height: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hotStreakInfo: {
    marginLeft: 6,
    flex: 1,
  },
  hotStreakName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hotStreakUsername: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hotStreakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  infoModalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '90%',
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoModalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});