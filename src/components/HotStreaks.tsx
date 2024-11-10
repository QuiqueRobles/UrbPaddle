import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableOpacity, Modal } from 'react-native';
import { Text, Card, useTheme, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileImage from './ProfileImage';
import PlayerProfileCard from './PlayerProfileCard';

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
  const screenWidth = Dimensions.get('window').width;
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const renderHotStreakPlayer = (player: PlayerStats, index: number, isCurrentStreak: boolean) => {
    const animatedValue = new Animated.Value(0);
    React.useEffect(() => {
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
              colors={isCurrentStreak ? [theme.colors.primary, "#000"] : ["#000", theme.colors.primary]}
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
                    <Text style={styles.hotStreakName}>{player.full_name}</Text>
                    <Text style={styles.hotStreakUsername}>@{player.username}</Text>
                  </View>
                </View>
                <View style={styles.streakContainer}>
                  <MaterialCommunityIcons 
                    name={isCurrentStreak ? "fire" : "crown"} 
                    size={36} 
                    color={isCurrentStreak ?"#DC3545":"#fcdb03"} 
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

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👑 Historical Hot Streak 👑</Text>
        {maxHotStreakPlayers.map((player, index) => renderHotStreakPlayer(player, index, false))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Current Hot Streak 🔥</Text>
        {currentHotStreakPlayers.map((player, index) => renderHotStreakPlayer(player, index, true))}
      </View>
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
            {selectedPlayer && <PlayerProfileCard player={selectedPlayer} />}
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
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
    
  },
  cardContainer: {
    marginBottom: 16,
  },
  hotStreakCard: {
    borderRadius: 16,
    elevation: 5,
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
    width: 25,
    height: 25,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 30,
  },
  hotStreakInfo: {
    marginLeft: 6,
  },
  hotStreakName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hotStreakUsername: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hotStreakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 0,
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