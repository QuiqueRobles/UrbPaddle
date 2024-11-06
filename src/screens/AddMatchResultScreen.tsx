import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity, Animated } from 'react-native';
import { Button, Title, TextInput, HelperText, ActivityIndicator, useTheme, Card, Paragraph, List, Chip, Avatar, IconButton } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';


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
};

type SetScore = {
  team1: string;
  team2: string;
};

type Score = {
  [key: string]: SetScore;
};

export default function AddMatchResultScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ set1: { team1: '', team2: '' } });
  const [setCount, setSetCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', profile_id: null },
    { id: '2', name: '', profile_id: null },
    { id: '3', name: '', profile_id: null },
    { id: '4', name: '', profile_id: null },
  ]);
  const [winningTeam, setWinningTeam] = useState<'1' | '2' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const theme = useTheme();
  const navigation = useNavigation();
  const [winningTeamAnim] = useState(new Animated.Value(0));

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

  async function handleSubmit() {
    if (!selectedBooking || !isValidScore() || !winningTeam || players.some(p => !p.name)) {
      Alert.alert('Error', 'Please fill in all fields correctly');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const selectedBookingData = bookings.find(b => b.id === selectedBooking);
      if (!selectedBookingData || selectedBookingData.user_id !== user.id) {
        throw new Error('You can only add results for your own bookings');
      }

      const formattedScore = formatScore();

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          booking_id: selectedBooking,
          player1_id: players[0].profile_id,
          player2_id: players[1].profile_id,
          player3_id: players[2].profile_id,
          player4_id: players[3].profile_id,
          score: formattedScore,
          winner_team: winningTeam,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      Alert.alert('Success', 'Match result added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding match result:', error);
      Alert.alert('Error', 'Failed to add match result');
    } finally {
      setLoading(false);
    }
  }

  function handlePlayerChange(index: number, profile: Profile | null) {
    const newPlayers = [...players];
    newPlayers[index] = { 
      ...newPlayers[index], 
      name: profile ? profile.full_name : '', 
      profile_id: profile ? profile.id : null,
      avatar_url: profile ? profile.avatar_url : undefined
    };
    setPlayers(newPlayers);
    setSearchQuery('');
  }

  function isValidScore() {
    return Object.values(score).some(set => set.team1 !== '' && set.team2 !== '');
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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
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
            <Title style={styles.title}>Add Match Result</Title>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Select Completed Booking</Title>
            {bookings.length > 0 ? (
              <FlatList
                data={bookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item.id}
                style={styles.bookingList}
              />
            ) : (
              <Paragraph style={styles.noBookingsText}>No completed bookings found.</Paragraph>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Select Players</Title>
            <TextInput
              label="Search Player"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.input}
              left={<TextInput.Icon icon="magnify" />}
            />
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      const emptyPlayerIndex = players.findIndex(p => !p.profile_id);
                      if (emptyPlayerIndex !== -1) {
                        handlePlayerChange(emptyPlayerIndex, item);
                      }
                    }}
                  >
                    <List.Item
                      title={item.full_name}
                      left={props => <Avatar.Image {...props} source={{ uri: item.avatar_url }} size={40} />}
                    />
                  </TouchableOpacity>
                )}
                style={styles.searchResults}
              />
            )}
            <View style={styles.teamsContainer}>
              <View style={styles.team}>
                <Paragraph style={styles.teamTitle}>Team 1</Paragraph>
                {players.slice(0, 2).map((player, index) => (
                  <Chip
                    key={player.id}
                    avatar={player.avatar_url ? <Avatar.Image size={24} source={{ uri: player.avatar_url }} /> : undefined}
                    onClose={() => handlePlayerChange(index, null)}
                    style={styles.playerChip}
                    mode="outlined"
                  >
                    {player.name || `Player ${index + 1}`}
                  </Chip>
                ))}
              </View>
              <View style={styles.team}>
                <Paragraph style={styles.teamTitle}>Team 2</Paragraph>
                {players.slice(2, 4).map((player, index) => (
                  <Chip
                    key={player.id}
                    avatar={player.avatar_url ? <Avatar.Image size={24} source={{ uri: player.avatar_url }} /> : undefined}
                    onClose={() => handlePlayerChange(index + 2, null)}
                    style={styles.playerChip}
                    mode="outlined"
                  >
                    {player.name || `Player ${index + 3}`}
                  </Chip>
                ))}
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Match Score</Title>
            <View style={styles.scoreCard}>
              <View style={styles.setControlsContainer}>
                <IconButton
                  icon="minus-circle"
                  size={24}
                  onPress={handleRemoveSet}
                  disabled={setCount === 1}
                />
                <Paragraph style={styles.setCountLabel}>{setCount} {setCount === 1 ? 'Set' : 'Sets'}</Paragraph>
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
                    <Paragraph style={styles.setLabel}>Set {index + 1}</Paragraph>
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
            <HelperText type="info" style={styles.helperText}>
              Enter the score for each set (e.g., 6-4). Leave empty if not played.
            </HelperText>
            
            <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Select Winning Team</Title>
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
              color={winningTeam === '1' ? theme.colors.primary : colors.text}
            />
            <Paragraph style={[
              styles.teamButtonText,
              winningTeam === '1' && styles.teamButtonTextSelected
            ]}>
              Team 1
            </Paragraph>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.teamButton, winningTeam === '2' && styles.teamButtonSelected]}
            onPress={() => handleWinningTeamSelect('2')}
          >
            <MaterialCommunityIcons
              name={winningTeam === '2' ? "trophy" : "trophy-outline"}
              size={32}
              color={winningTeam === '2' ? colors.primary : colors.text}
            />
            <Paragraph style={[
              styles.teamButtonText,
              winningTeam === '2' && styles.teamButtonTextSelected
            ]}>
              Team 2
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
          Submit Result
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
    color: '#666',
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
  helperText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
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
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});