import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import ProfileImage from './ProfileImage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Player = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

type PaddleCourtProps = {
  players: (Player | null)[];
  score: string;
  winner_team: number;
};

export const PaddleCourt: React.FC<PaddleCourtProps> = ({ players, score, winner_team }) => {
  const { colors } = useTheme();

  const parsedScore = score.split(',').map(set => {
    const [team1, team2] = set.trim().split('-');
    return { team1: parseInt(team1, 10), team2: parseInt(team2, 10) };
  });

  const getWinnerStyle = (teamNumber: number) => {
    return winner_team === teamNumber ? styles.winnerTeam : null;
  };

  return (
    <View style={styles.courtContainer}>
      <LinearGradient
        colors={['#8BC34A', '#4CAF50', '#2E7D32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.court}
      >
        <View style={[styles.teamContainer, getWinnerStyle(1)]}>
          {players.slice(0, 2).map((player, index) => (
            <View key={index} style={styles.playerContainer}>
              <ProfileImage
                avatarUrl={player?.avatar_url || null}
                size={48}
              />
              <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
                {player?.full_name || 'Anonymous'}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.scoreContainer}>
          <View style={styles.net} />
          {parsedScore.map((set, index) => (
            <View key={index} style={styles.setContainer}>
              <Text style={styles.scoreText}>{set.team1}</Text>
              <Text style={styles.scoreText}>{set.team2}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.teamContainer, getWinnerStyle(2)]}>
          {players.slice(2, 4).map((player, index) => (
            <View key={index} style={styles.playerContainer}>
              <ProfileImage
                avatarUrl={player?.avatar_url || null}
                size={48}
              />
              <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
                {player?.full_name || 'Anonymous'}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
      {winner_team > 0 && (
        <MaterialCommunityIcons 
          name="trophy" 
          size={24} 
          color="gold" 
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 3,
            elevation: 5,
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  courtContainer: {
    alignItems: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  court: {
    width: '100%',
    marginTop:10,
    aspectRatio: 1.1,
    borderRadius: 24,
    padding: 8,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  teamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    margin: 4,
  },
  playerContainer: {
    alignItems: 'center',
    width: '45%',
  },
  playerName: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 3,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: 60,
  },
  net: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  setContainer: {
    alignItems: 'center',
    marginHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 2,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 3,
  },
  icon: {
    position: 'absolute',
    top: -10,
    left: -10,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 2,
  },
  winnerTeam: {
    borderColor: 'rgba(255, 215, 0, 0.7)',
    borderWidth: 2,
    borderRadius: 16,
  },
  winnerBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'absolute',
    bottom: -16,
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  winnerBadgeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});