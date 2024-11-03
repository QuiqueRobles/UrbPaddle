import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Paragraph, Avatar, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';

type UserProfile = {
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
};

export default function StatisticsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data as UserProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No profile data found</Text>
      </View>
    );
  }

  const winRate = profile.matches_played > 0 ? ((profile.wins / profile.matches_played) * 100).toFixed(1) : '0.0';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image size={80} source={{ uri: profile.avatar_url }} />
        <View style={styles.headerText}>
          <Title>{profile.full_name}</Title>
          <Paragraph>@{profile.username}</Paragraph>
        </View>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Player Statistics</Title>
          <View style={styles.statRow}>
            <Text>Level:</Text>
            <Text>{profile.level}</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Matches Played:</Text>
            <Text>{profile.matches_played}</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Wins:</Text>
            <Text>{profile.wins}</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Losses:</Text>
            <Text>{profile.losses}</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Win Rate:</Text>
            <Text>{winRate}%</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Set Statistics</Title>
          <View style={styles.statRow}>
            <Text>Sets Won:</Text>
            <Text>{profile.sets_won}</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Sets Lost:</Text>
            <Text>{profile.sets_lost}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Game Statistics</Title>
          <View style={styles.statRow}>
            <Text>Games Won:</Text>
            <Text>{profile.games_won}</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Games Lost:</Text>
            <Text>{profile.games_lost}</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    marginLeft: 16,
  },
  card: {
    margin: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});