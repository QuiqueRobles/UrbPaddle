import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Title, TextInput, HelperText, ActivityIndicator, useTheme, Card, Paragraph, Searchbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

type Booking = {
  id: string;
  court_id: string;
  start_time: string;
  end_time: string;
  user_id: string;
};

type Profile = {
  id: string;
  full_name: string;
};

type Player = {
  id: string;
  name: string;
  isAnonymous: boolean;
  isLocal: boolean;
};

export default function AddMatchResultScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [score, setScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', isAnonymous: false, isLocal: true },
    { id: '2', name: '', isAnonymous: false, isLocal: true },
    { id: '3', name: '', isAnonymous: false, isLocal: false },
    { id: '4', name: '', isAnonymous: false, isLocal: false },
  ]);
  const [winningTeam, setWinningTeam] = useState<'local' | 'visiting' | null>(null);
  const theme = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    fetchBookings();
    fetchProfiles();
  }, []);

  async function fetchBookings() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

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
        .select('id, full_name')
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

      const { data, error } = await supabase
        .from('matches')
        .insert({
          booking_id: selectedBooking,
          score,
          winner: winningTeam,
          user_id: user.id,
          players: players.map(p => ({ name: p.name, is_anonymous: p.isAnonymous, is_local: p.isLocal })),
        });

      if (error) throw error;

      Alert.alert('Success', 'Match result added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding match result:', error);
      Alert.alert('Error', 'Failed to add match result');
    } finally {
      setLoading(false);
    }
  }

  function handlePlayerChange(index: number, name: string, isAnonymous: boolean) {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], name, isAnonymous };
    setPlayers(newPlayers);
  }

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Paragraph>Select Booking</Paragraph>
          <Picker
            selectedValue={selectedBooking}
            onValueChange={(itemValue) => setSelectedBooking(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select a booking" value={null} />
            {bookings.map((booking) => (
              <Picker.Item
                key={booking.id}
                label={`Court ${booking.court_id} - ${new Date(booking.start_time).toLocaleString()}`}
                value={booking.id}
              />
            ))}
          </Picker>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Paragraph>Enter Players</Paragraph>
          <Searchbar
            placeholder="Search players"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          {players.map((player, index) => (
            <View key={player.id} style={styles.playerInput}>
              <Paragraph>{player.isLocal ? 'Local' : 'Visiting'} Player {index % 2 + 1}</Paragraph>
              <Picker
                selectedValue={player.isAnonymous ? 'anonymous' : player.name}
                onValueChange={(itemValue) => 
                  handlePlayerChange(index, itemValue === 'anonymous' ? '' : itemValue, itemValue === 'anonymous')
                }
                style={styles.playerPicker}
              >
                <Picker.Item label={`Select Player ${index + 1}`} value="" />
                <Picker.Item label="Anonymous Player" value="anonymous" />
                {filteredProfiles.map((profile) => (
                  <Picker.Item key={profile.id} label={profile.full_name} value={profile.full_name} />
                ))}
              </Picker>
              {player.isAnonymous && (
                <TextInput
                  label={`Anonymous Player ${index + 1} Name`}
                  value={player.name}
                  onChangeText={(text) => handlePlayerChange(index, text, true)}
                  style={styles.input}
                />
              )}
            </View>
          ))}
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
              mode={winningTeam === 'local' ? 'contained' : 'outlined'}
              onPress={() => setWinningTeam('local')}
              style={styles.teamButton}
            >
              Local Team
            </Button>
            <Button
              mode={winningTeam === 'visiting' ? 'contained' : 'outlined'}
              onPress={() => setWinningTeam('visiting')}
              style={styles.teamButton}
            >
              Visiting Team
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
  searchBar: {
    marginBottom: 16,
  },
  playerInput: {
    marginBottom: 16,
  },
  playerPicker: {
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  input: {
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