import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Button, Title, TextInput, HelperText, ActivityIndicator, useTheme, Card, Paragraph, List, Chip, Avatar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

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

export default function AddMatchResultScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [score, setScore] = useState('');
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

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .lte('date', currentDate)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
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
    if (!selectedBooking || !score || !winningTeam || players.some(p => !p.name)) {
      Alert.alert('Error', 'Please fill in all fields');
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

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          booking_id: selectedBooking,
          player1_id: players[0].profile_id,
          player2_id: players[1].profile_id,
          player3_id: players[2].profile_id,
          player4_id: players[3].profile_id,
          score,
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Add Match Result</Title>
      <Card style={styles.card}>
        <Card.Content>
          <Paragraph>Select Completed Booking</Paragraph>
          <Picker
            selectedValue={selectedBooking}
            onValueChange={(itemValue) => setSelectedBooking(itemValue)}
            style={styles.picker}
            accessibilityLabel="Select a booking"
          >
            <Picker.Item label="Select a booking" value={null} />
            {bookings.map((booking) => (
              <Picker.Item
                key={booking.id}
                label={`Court ${booking.court_number} - ${new Date(booking.date).toLocaleString()}`}
                value={booking.id}
              />
            ))}
          </Picker>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Paragraph>Select Players</Paragraph>
          <TextInput
            label="Search Player"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
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
          <TextInput
            label="Score"
            value={score}
            onChangeText={setScore}
            style={styles.input}
          />
          <HelperText type="info">
            Enter the score in the format: "6-4, 7-5"
          </HelperText>
          
          <Paragraph>Select Winning Team</Paragraph>
          <View style={styles.winningTeamContainer}>
            <Button
              mode={winningTeam === '1' ? 'contained' : 'outlined'}
              onPress={() => setWinningTeam('1')}
              style={styles.teamButton}
            >
              Team 1
            </Button>
            <Button
              mode={winningTeam === '2' ? 'contained' : 'outlined'}
              onPress={() => setWinningTeam('2')}
              style={styles.teamButton}
            >
              Team 2
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={handleSubmit} style={styles.submitButton}>
        Submit Result
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  input: {
    marginBottom: 8,
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: 16,
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
  },
  playerChip: {
    marginBottom: 8,
  },
  winningTeamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  teamButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  submitButton: {
    marginTop: 16,
  },
});