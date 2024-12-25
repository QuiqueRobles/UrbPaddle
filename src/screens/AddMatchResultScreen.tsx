import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity, Animated } from 'react-native';
import { Button, Title, TextInput, ActivityIndicator, useTheme, Card, Paragraph, IconButton } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import SelectPlayers from '../components/SelectPlayers';
import { useTranslation } from 'react-i18next';


type Booking = {
  id: string;
  court_number: string;
  date: Date;
  start_time: string;
  end_time: string;
  user_id: string;
};

type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string;
};

type Player = {
  id: string;
  name: string;
  profile_id: string | null;
  avatar_url?: string;
  level?: number;
  isResident: boolean;
  isAnonymous: boolean;
};

type SetScore = {
  team1: string;
  team2: string;
};

type Score = {
  [key: string]: SetScore;
};

type ProfileData = {
  matches_played: number;
  wins: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  xp: number;
  level: number;
  hot_streak: number;
  max_hot_streak: number;
};

export default function AddMatchResultScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ set1: { team1: '', team2: '' } });
  const [setCount, setSetCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [players, setPlayers] = useState<Player[]>([
      { id: '1', name: '', profile_id: null, isResident: false, isAnonymous: false },
      { id: '2', name: '', profile_id: null, isResident: false, isAnonymous: false },
      { id: '3', name: '', profile_id: null, isResident: false, isAnonymous: false },
      { id: '4', name: '', profile_id: null, isResident: false, isAnonymous: false },
    ]);
  const [winningTeam, setWinningTeam] = useState<'1' | '2' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const [winningTeamAnim] = useState(new Animated.Value(0));
  const handlePlayersChange = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
  };


  const handleWinningTeamSelect = (team: '1' | '2') => {
    setWinningTeam(team);
    Animated.spring(winningTeamAnim, {
      toValue: team === '1' ? 0 : 1,
      useNativeDriver: false,
    }).start();
  };
  const renderBookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      style={[
        styles.bookingItem,
        selectedBooking === item.id && styles.selectedBookingItem
      ]}
      onPress={() => setSelectedBooking(item.id)}
    >
      <View style={styles.bookingItemContent}>
        <MaterialCommunityIcons
          name="tennis-ball"
          size={24}
          color={selectedBooking === item.id ? colors.primary : colors.text}
        />
        <View style={styles.bookingItemText}>
          <Paragraph style={styles.bookingItemTitle}>Court {item.court_number}</Paragraph>
          <Paragraph style={styles.bookingItemSubtitle}>
            {new Date(item.date).toLocaleDateString()} • {item.start_time} - {item.end_time}
          </Paragraph>
        </View>
      </View>
      {selectedBooking === item.id && (
        <MaterialCommunityIcons
          name="check-circle"
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchBookings();
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filteredProfiles = profiles.filter(profile => 
        profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !players.some(player => player.profile_id === profile.id)
      );
      setSearchResults(filteredProfiles);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, profiles, players]);

  async function fetchBookings() {
  try {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const currentDate = new Date().toISOString().split('T')[0];

    // First, fetch all bookings for the user
    const { data: userBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .lte('date', currentDate)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (bookingsError) throw bookingsError;

    // Then, fetch all matches for these bookings
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('booking_id')
      .in('booking_id', userBookings.map(booking => booking.id));

    if (matchesError) throw matchesError;

    // Filter out bookings that already have a match
    const completedBookingsWithoutMatch = userBookings.filter(booking => 
      !matches.some(match => match.booking_id === booking.id)
    );

    setBookings(completedBookingsWithoutMatch || []);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    Alert.alert('Error', 'Failed to fetch bookings');
  } finally {
    setLoading(false);
  }
}

  async function fetchProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert('Error', 'Failed to fetch profiles');
    }
  }
  const calculateXP = (playerProfile: any, isWinner: boolean, setsWon: number, setsLost: number, gamesWon: number, gamesLost: number) => {
    const XP_MATCH = 1000;
    const XP_VICTORY = 500;
    const XP_SETS = 50 * (setsWon / (1 + setsLost));
    const XP_GAMES = 20 * (gamesWon / (1 + gamesLost));
    
    let totalXP = XP_MATCH + XP_SETS + XP_GAMES;
    if (isWinner) totalXP += XP_VICTORY;

    return Math.round(totalXP);
  };

  

  async function handleSubmit() {
    if (!selectedBooking || !isValidScore() || !winningTeam || players.some(p => !p.name)) {
      Alert.alert('Error', 'Please fill in all fields correctly');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('resident_community_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData?.resident_community_id) throw new Error('User community not found');

      const selectedBookingData = bookings.find(b => b.id === selectedBooking);
      if (!selectedBookingData || selectedBookingData.user_id !== user.id) {
        throw new Error('You can only add results for your own bookings');
      }

      const formattedScore = formatScore();

      // Insert match data
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          booking_id: selectedBooking,
          player1_id: players[0].isAnonymous ? null : players[0].profile_id,
          player2_id: players[1].isAnonymous ? null : players[1].profile_id,
          player3_id: players[2].isAnonymous ? null : players[2].profile_id,
          player4_id: players[3].isAnonymous ? null : players[3].profile_id,
          score: formattedScore,
          winner_team: winningTeam,
          match_date: selectedBookingData.date,
          match_time: selectedBookingData.start_time,
          court_number: selectedBookingData.court_number,
          community_id: userData.resident_community_id,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Update player profiles and XP only for non-anonymous players
      await updatePlayerProfilesAndXP(formattedScore, winningTeam);

      Alert.alert('Success', 'Match result added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding match result:', error);
      Alert.alert('Error', 'Failed to add match result');
    } finally {
      setLoading(false);
    }
  }

  async function updatePlayerProfilesAndXP(formattedScore: string, winningTeam: '1' | '2') {
    const scoreArray = formattedScore.split(',');
    const team1Players = players.slice(0, 2).filter(p => !p.isAnonymous).map(p => p.profile_id).filter(Boolean) as string[];
    const team2Players = players.slice(2, 4).filter(p => !p.isAnonymous).map(p => p.profile_id).filter(Boolean) as string[];
    const allPlayers = [...team1Players, ...team2Players];

    let team1SetsWon = 0;
    let team2SetsWon = 0;
    let team1GamesWon = 0;
    let team2GamesWon = 0;

    scoreArray.forEach(set => {
      const [team1Score, team2Score] = set.split('-').map(Number);
      if (team1Score > team2Score) {
        team1SetsWon++;
      } else if (team2Score > team1Score) {
        team2SetsWon++;
      }
      team1GamesWon += team1Score;
      team2GamesWon += team2Score;
    });


    const updateProfile = async (profileId: string, isWinner: boolean, setsWon: number, setsLost: number, gamesWon: number, gamesLost: number) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('matches_played, wins, losses, sets_won, sets_lost, games_won, games_lost, xp, level, hot_streak, max_hot_streak')
        .eq('id', profileId)
        .single();
      
      const profileData = data as ProfileData;

      if (error) throw error;

      const updatedData = {
        matches_played: (data.matches_played || 0) + 1,
        wins: (data.wins || 0) + (isWinner ? 1 : 0),
        losses: (data.losses || 0) + (isWinner ? 0 : 1),
        sets_won: (data.sets_won || 0) + setsWon,
        sets_lost: (data.sets_lost || 0) + setsLost,
        games_won: (data.games_won || 0) + gamesWon,
        games_lost: (data.games_lost || 0) + gamesLost,
        xp: 0, // We'll calculate this below
        level: profileData.level || 1,
        hot_streak: 0, // We'll calculate this below
        max_hot_streak: profileData.max_hot_streak || 0,
      };

      // Calculate XP
      const xpToAdd = calculateXP(data, isWinner, setsWon, setsLost, gamesWon, gamesLost);
      let newXP = (data.xp || 0) + xpToAdd;
      let newLevel = data.level || 1;

      while (newXP >= 5000) {
        newLevel++;
        newXP -= 5000;
      }

      updatedData.xp = newXP;
      updatedData.level = newLevel;

      // Update hot streak
      let newHotStreak = isWinner ? (data.hot_streak || 0) + 1 : 0;
      updatedData.hot_streak = newHotStreak;

      // Update max hot streak if necessary
      updatedData.max_hot_streak = Math.max(newHotStreak, data.max_hot_streak || 0);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', profileId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }
    };

    // Update profiles for all players
     const updatePromises = allPlayers.map((profileId, index) => {
      const isTeam1 = index < team1Players.length;
      return updateProfile(
        profileId,
        (isTeam1 && winningTeam === '1') || (!isTeam1 && winningTeam === '2'),
        isTeam1 ? team1SetsWon : team2SetsWon,
        isTeam1 ? team2SetsWon : team1SetsWon,
        isTeam1 ? team1GamesWon : team2GamesWon,
        isTeam1 ? team2GamesWon : team1GamesWon
      );
    });

    try {
      await Promise.all(updatePromises);
      console.log('All profiles updated successfully');
    } catch (error) {
      console.error('Error updating profiles:', error);
      Alert.alert('Error', 'Failed to update player profiles');
    }
  }

  function isValidScore() {
  // Verificar que haya al menos un set con puntuación
  const setsWithScore = Object.values(score).filter(set => set.team1 !== '' && set.team2 !== '');
  
  if (setsWithScore.length === 0) {
    Alert.alert('Error', 'Debes introducir la puntuación al menos de un set');
    return false;
  }

  for (const set of setsWithScore) {
    const team1Score = parseInt(set.team1);
    const team2Score = parseInt(set.team2);

    // Verificar que sean números válidos
    if (isNaN(team1Score) || isNaN(team2Score)) {
      Alert.alert('Error', 'Las puntuaciones deben ser números');
      return false;
    }

    // Verificar que sean números positivos
    if (team1Score < 0 || team2Score < 0) {
      Alert.alert('Error', 'Las puntuaciones no pueden ser negativas');
      return false;
    }

    // Reglas para ganar un set en pádel
    if (team1Score < 6 && team2Score < 6) {
      Alert.alert('Error', 'Un set debe terminar al menos 6-x o x-6');
      return false;
    }

    // Verificar diferencia de 2 juegos o tie-break
    if (team1Score >= 6 && team2Score >= 6) {
      const difference = Math.abs(team1Score - team2Score);
      if (difference !== 1 && difference !== 2) {
        Alert.alert('Error', 'En un tie-break, la diferencia debe ser de 1 o 2 juegos');
        return false;
      }
    } else {
      const difference = Math.abs(team1Score - team2Score);
      if (difference < 2) {
        Alert.alert('Error', 'La diferencia entre equipos debe ser de al menos 2 juegos');
        return false;
      }
    }

    // Evitar resultados extremadamente improbables
    if (team1Score > 7 || team2Score > 7) {
      Alert.alert('Error', 'Los resultados de un set no suelen superar 7 juegos');
      return false;
    }
  }

  // Verificar que el número de sets no sea excesivo
  if (setsWithScore.length > 3) {
    Alert.alert('Error', 'Un partido de pádel no puede tener más de 3 sets');
    return false;
  }

  return true;
}

  function formatScore() {
    return Object.values(score)
      .filter(set => set.team1 !== '' && set.team2 !== '')
      .map(set => `${set.team1}-${set.team2}`)
      .join(',');
  }

  function handleAddSet() {
    if (setCount < 5) {
      const newSetKey = `set${setCount + 1}`;
      setScore(prev => ({ ...prev, [newSetKey]: { team1: '', team2: '' } }));
      setSetCount(prev => prev + 1);
    }
  }

  function handleRemoveSet() {
    if (setCount > 1) {
      const newScore = { ...score };
      delete newScore[`set${setCount}`];
      setScore(newScore);
      setSetCount(prev => prev - 1);
    }
  }

  if (loading) {
    return (
      <LinearGradient
      colors={[theme.colors.primary, "#000"]}
      style={styles.container}
    >
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={'white'} />
      </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.colors.primary, "#000"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.title}>{t('addMatchResult')}</Title>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>{t('selectCompletedBooking')}</Title>
            {bookings.length > 0 ? (
              <FlatList
                data={bookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item.id}
                style={styles.bookingList}
              />
            ) : (
              <Paragraph style={styles.noBookingsText}>{t('noCompletedBookings')}</Paragraph>
            )}
          </Card.Content>
        </Card>

        <SelectPlayers onPlayersChange={handlePlayersChange} />

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>{t('matchScore')}</Title>
            <View style={styles.scoreCard}>
              <View style={styles.setControlsContainer}>
                <IconButton
                  icon="minus-circle"
                  size={24}
                  onPress={handleRemoveSet}
                  disabled={setCount === 1}
                />
                <Paragraph style={styles.setCountLabel}>
                  {setCount} {setCount === 1 ? t('set') : t('sets')}
                </Paragraph>
                <IconButton
                  icon="plus-circle"
                  size={24}
                  onPress={handleAddSet}
                  disabled={setCount === 5}
                />
              </View>
              {Object.keys(score).map((set, index) => (
                <View key={set} style={styles.setContainer}>
                  <View style={styles.setLabelContainer}>
                    <MaterialCommunityIcons name="tennis" size={24} color={theme.colors.primary} />
                    <Paragraph style={styles.setLabel}>{t('set')} {index + 1}</Paragraph>
                  </View>
                  <View style={styles.scoreInputContainer}>
                    <TextInput
                      value={score[set].team1}
                      onChangeText={(value) => setScore(prev => ({ ...prev, [set]: { ...prev[set], team1: value } }))}
                      keyboardType="numeric"
                      style={styles.scoreInput}
                      maxLength={2}
                    />
                    <Paragraph style={styles.scoreSeparator}>-</Paragraph>
                    <TextInput
                      value={score[set].team2}
                      onChangeText={(value) => setScore(prev => ({ ...prev, [set]: { ...prev[set], team2: value } }))}
                      keyboardType="numeric"
                      style={styles.scoreInput}
                      maxLength={2}
                    />
                  </View>
                </View>
              ))}
            </View>
            
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.sectionTitle}>{t('selectWinningTeam')}</Title>
                <View style={styles.winningTeamContainer}>
                  <Animated.View style={[
                    styles.winningTeamIndicator,
                    {
                      left: winningTeamAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '50%'],
                      }),
                    },
                  ]} />
                  <TouchableOpacity
                    style={[styles.teamButton, winningTeam === '1' && styles.teamButtonSelected]}
                    onPress={() => handleWinningTeamSelect('1')}
                  >
                    <MaterialCommunityIcons
                      name={winningTeam === '1' ? "trophy" : "trophy-outline"}
                      size={32}
                      color={winningTeam === '1' ? colors.trophy : colors.text}
                    />
                    <Paragraph style={[
                      styles.teamButtonText,
                      winningTeam === '1' && styles.teamButtonTextSelected
                    ]}>
                      {t('team')} 1
                    </Paragraph>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.teamButton, winningTeam === '2' && styles.teamButtonSelected]}
                    onPress={() => handleWinningTeamSelect('2')}
                  >
                    <MaterialCommunityIcons
                      name={winningTeam === '2' ? "trophy" : "trophy-outline"}
                      size={32}
                      color={winningTeam === '2' ? colors.trophy : colors.text}
                    />
                    <Paragraph style={[
                      styles.teamButtonText,
                      winningTeam === '2' && styles.teamButtonTextSelected
                    ]}>
                      {t('team')} 2
                    </Paragraph>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.submitButton}
          icon="check-circle"
        >
          {t('submitResult')}
        </Button>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#ffff',
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  bookingList: {
    maxHeight: 200,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedBookingItem: {
    backgroundColor: '#e0f0ff',
  },
  bookingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingItemText: {
    marginLeft: 12,
  },
  bookingItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  noBookingsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  picker: {
    height: 50,
    color: '#333',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    marginHorizontal: 8,
  },
  teamTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
    color: '#ffff',
  },
  playerChip: {
    marginBottom: 8,
  },
   scoreCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  setControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  setControlButton: {
    flex: 1,
  },
  setCountLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    color: '#333',
  },
    setContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
 scoreInput: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    width: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  scoreSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
    color: '#333',
  },

  
  winningTeamLabel: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  winningTeamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
  },
 
    winningTeamIndicator: {
    position: 'absolute',
    top: 4,
    width: '50%',
    height: '100%',
    borderRadius: 12,
    zIndex: 0,
  },
  teamButtonSelected: {
    backgroundColor: 'transparent',
  },
  teamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    zIndex: 1,
  },
  
    teamButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamButtonTextSelected: {
  },
  submitButton: {
    marginTop: 0,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom:100,
  },
});