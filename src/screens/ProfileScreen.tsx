import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Avatar, Button, Card, TextInput, Title, Paragraph, ActivityIndicator, useTheme, ProgressBar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  username:string,
  apartment: string;
  phone_number: string;
  avatar_url: string;
  matches_played: number;
  wins: number;
  losses: number;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session);
    });
  }, []);

  async function fetchProfile(session: Session) {
    try {
      setLoading(true);
      const { user } = session;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Error fetching profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session.user.id,
        full_name: profile?.full_name,
        apartment: profile?.apartment,
        phone_number: profile?.phone_number,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      fetchProfile(session);
    } catch (error) {
      Alert.alert('Error', 'Error updating profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Paragraph>No profile data found</Paragraph>
      </View>
    );
  }

  const winRate = profile.matches_played > 0 ? (profile.wins / profile.matches_played) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.header}
        >
          <Avatar.Image
            size={120}
            source={{ uri: profile.avatar_url || 'https://robohash.org/70d4932145e1ed9a17bd36fa004ecd9e?set=set4&bgset=&size=400x400' }}
            style={styles.avatar}
          />
          <Title style={[styles.name, { color: colors.onPrimary }]}>{profile.username || 'Name not set'}</Title>
        </LinearGradient>

        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Paddle Stats</Title>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="tennis" size={32} color={colors.primary} />
                  <Paragraph style={styles.statValue}>{profile.matches_played}</Paragraph>
                  <Paragraph style={styles.statLabel}>Matches</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="trophy" size={32} color={colors.primary} />
                  <Paragraph style={styles.statValue}>{profile.wins}</Paragraph>
                  <Paragraph style={styles.statLabel}>Wins</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="close-circle" size={32} color={colors.primary} />
                  <Paragraph style={styles.statValue}>{profile.losses}</Paragraph>
                  <Paragraph style={styles.statLabel}>Losses</Paragraph>
                </View>
              </View>
              <View style={styles.winRateContainer}>
                <Paragraph style={styles.winRateLabel}>Win Rate</Paragraph>
                <ProgressBar progress={winRate / 100} color={colors.primary} style={styles.winRateBar} />
                <Paragraph style={styles.winRateValue}>{winRate.toFixed(1)}%</Paragraph>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Player Info</Title>
              <TextInput
                label="Full Name"
                value={profile.full_name || ''}
                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                disabled={!editing}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Apartment"
                value={profile.apartment || ''}
                onChangeText={(text) => setProfile({ ...profile, apartment: text })}
                disabled={!editing}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Phone Number"
                value={profile.phone_number || ''}
                onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
                disabled={!editing}
                style={styles.input}
                mode="outlined"
              />
            </Card.Content>
          </Card>

          {editing ? (
            <Button mode="contained" onPress={updateProfile} style={styles.button}>
              Save Changes
            </Button>
          ) : (
            <Button mode="outlined" onPress={() => setEditing(true)} style={styles.button}>
              Edit Profile
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatar: {
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'white',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
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
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  winRateContainer: {
    marginTop: 16,
  },
  winRateLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  winRateBar: {
    height: 8,
    borderRadius: 4,
  },
  winRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
});