import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Avatar, Button, Card, TextInput, Title, Paragraph, ActivityIndicator, useTheme, Switch, ProgressBar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  apartment: string;
  phone_number: string;
  avatar_url: string;
  level: number;
  matches_played: number;
  wins: number;
  losses: number;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const theme = useTheme();

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
        .select('*, statistics(*)')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile({
          ...data,
          ...data.statistics[0],
        });
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        style={styles.header}
      >
        <Avatar.Image
          size={120}
          source={{ uri: profile.avatar_url || 'https://picsum.photos/seed/avatar/200' }}
          style={styles.avatar}
        />
        <Title style={styles.name}>{profile.full_name || 'Name not set'}</Title>
        <View style={styles.levelContainer}>
          <MaterialCommunityIcons name="star" size={24} color={theme.colors.text} />
          <Title style={styles.level}>Level {profile.level}</Title>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Paddle Stats</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="tennis" size={24} color={theme.colors.primary} />
                <Paragraph style={styles.statValue}>{profile.matches_played}</Paragraph>
                <Paragraph style={styles.statLabel}>Matches</Paragraph>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.primary} />
                <Paragraph style={styles.statValue}>{profile.wins}</Paragraph>
                <Paragraph style={styles.statLabel}>Wins</Paragraph>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.primary} />
                <Paragraph style={styles.statValue}>{profile.losses}</Paragraph>
                <Paragraph style={styles.statLabel}>Losses</Paragraph>
              </View>
            </View>
            <View style={styles.winRateContainer}>
              <Paragraph style={styles.winRateLabel}>Win Rate</Paragraph>
              <ProgressBar progress={winRate / 100} color={theme.colors.primary} style={styles.winRateBar} />
              <Paragraph style={styles.winRateValue}>{winRate.toFixed(1)}%</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.infoTitle}>Player Info</Title>
            <TextInput
              label="Full Name"
              value={profile.full_name || ''}
              onChangeText={(text) => setProfile({ ...profile, full_name: text })}
              disabled={!editing}
              style={styles.input}
            />
            <TextInput
              label="Apartment"
              value={profile.apartment || ''}
              onChangeText={(text) => setProfile({ ...profile, apartment: text })}
              disabled={!editing}
              style={styles.input}
            />
            <TextInput
              label="Phone Number"
              value={profile.phone_number || ''}
              onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
              disabled={!editing}
              style={styles.input}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
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
    color: 'white',
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  level: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
  },
  statsTitle: {
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
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'gray',
  },
  winRateContainer: {
    marginTop: 8,
  },
  winRateLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  winRateBar: {
    height: 8,
    borderRadius: 4,
  },
  winRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'right',
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
});