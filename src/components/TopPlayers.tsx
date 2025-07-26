import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Text, Card, useTheme, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileImage from './ProfileImage';
import PlayerProfileCard from './PlayerProfileCard';
import LevelIndicator from './LevelIndicator';
import { colors } from "../theme/colors";
import { gradients } from "../theme/gradients";
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

type TopPlayersProps = {
  topPlayers: PlayerStats[];
  isMonthly: boolean;
};

export default function TopPlayers({ topPlayers, isMonthly }: TopPlayersProps) {
  const theme = useTheme();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const { t } = useTranslation();

  const handlePlayerPress = async (player: PlayerStats) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedPlayer(player);
    setModalVisible(true);
  };

  const renderPlayerCard = ({ item, index }: { item: PlayerStats; index: number }) => {
    const winRate = ((item.wins / (item.matches_played || 1)) * 100).toFixed(1);

    return (
      <TouchableOpacity onPress={() => handlePlayerPress(item)}>
        <Card style={styles.playerCard}>
          <LinearGradient
            colors={gradients.mygreen}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <ProfileImage avatarUrl={item.avatar_url} size={60} />
                <View style={styles.playerInfo}>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.playerName}>{item.full_name}</Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.playerUsername}>@{item.username}</Text>
                </View>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="trophy" size={24} color={colors.surface} />
                  <Text style={styles.statValue}>{item.wins}</Text>
                  <Text style={styles.statLabel}>{t('wins')}</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="tennis" size={24} color={colors.surface} />
                  <Text style={styles.statValue}>{item.matches_played}</Text>
                  <Text style={styles.statLabel}>{t('matches')}</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="percent" size={24} color={colors.surface} />
                  <Text style={styles.statValue}>{winRate}%</Text>
                  <Text style={styles.statLabel}>{t('winRate')}</Text>
                </View>
              </View>
              <View style={styles.levelContainer}>
                <LevelIndicator level={item.level} />
              </View>
            </View>
          </LinearGradient>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="medal" size={32} color="#FFD700" /> {t('topPlayers')} <MaterialCommunityIcons name="medal" size={32} color="#FFD700" />
        </Text>
        <IconButton
          icon="information"
          iconColor="white"
          size={24}
          onPress={() => setInfoModalVisible(true)}
        />
      </View>
      {topPlayers.length > 0 ? (
        <FlatList
          data={topPlayers}
          renderItem={renderPlayerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.noPlayersContainer}>
          <MaterialCommunityIcons name="emoticon-sad-outline" size={64} color={theme.colors.primary} />
          <Text style={styles.noPlayersText}>{t('noTopPlayers')}</Text>
          <Text style={styles.noPlayersSubtext}>{t('startPlayingPrompt')}</Text>
        </View>
      )}
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
              {t('close')}
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
            <Text style={styles.infoModalTitle}>
              <MaterialCommunityIcons name="medal" size={16} color="#FFD700" /> {t('howTopPlayersSelected')} <MaterialCommunityIcons name="medal" size={16} color="#FFD700" />
            </Text>
            <Text style={styles.infoModalText}>
              {isMonthly
                ? t('monthlyTopPlayersExplanation')
                : t('overallTopPlayersExplanation')}
            </Text>
            <Text style={styles.infoModalText}>
              {t('rankingExplanation')}
            </Text>
            <Text style={styles.infoModalText}>
              {t('keepPlayingPrompt')}
            </Text>
            <Button
              mode="contained"
              onPress={() => setInfoModalVisible(false)}
              style={styles.closeButton}
            >
              {t('gotIt')}
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    marginVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  playerCard: {
    marginBottom: 16,
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
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerUsername: {
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  levelContainer: {
    alignItems: 'center',
    marginTop: 8,
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
    fontSize: 18,
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
  noPlayersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPlayersText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    color: '#333',
  },
  noPlayersSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
});