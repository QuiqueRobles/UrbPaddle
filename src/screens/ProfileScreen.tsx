import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Card, TextInput, Title, Text, ActivityIndicator, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'
import ProfileImage from '../components/ProfileImage';
import { SafeAreaView } from 'react-native-safe-area-context';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  apartment: string;
  phone_number: string;
  avatar_url: string;
  matches_played: number;
  wins: number;
  losses: number;
  motivational_speech: string;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  level: number;
  xp: number;
  
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const xp_to_next_level=5000;
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session);
    });

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
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

      if (error) throw error;
      if (data) setProfile(data);
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
        motivational_speech: profile?.motivational_speech,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;

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

  async function changeProfilePicture() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const userId = session?.user.id;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const fileName = `${userId}/${Date.now()}.jpg`;

      try {
        setLoading(true);

        const base64FileData = asset.base64;
        if (!base64FileData) {
          throw new Error('Could not get base64 data from the image');
        }

        const { data: fileData, error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, decode(base64FileData), {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        if (!urlData || !urlData.publicUrl) {
          throw new Error('Failed to get public URL');
        }

        const { data: profileData, error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: urlData.publicUrl })
          .eq('id', userId)
          .select();

        if (updateError) throw updateError;

        if (profileData && profileData.length > 0) {
          setProfile(profileData[0]);
        }

        setRefreshKey(oldKey => oldKey + 1);
        Alert.alert('Success', 'Profile picture updated successfully');
      } catch (error) {
        console.error('Error updating profile picture:', error);
        Alert.alert('Error', 'Could not update profile picture');
      } finally {
        setLoading(false);
      }
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
        <Text>No profile data found</Text>
      </View>
    );
  }

  const winRate = profile.matches_played > 0 ? (profile.wins / profile.matches_played) * 100 : 0;
  const setWinRate = profile.sets_won + profile.sets_lost > 0 ? (profile.sets_won / (profile.sets_won + profile.sets_lost)) * 100 : 0;
  const gameWinRate = profile.games_won + profile.games_lost > 0 ? (profile.games_won / (profile.games_won + profile.games_lost)) * 100 : 0;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.profileImageContainer}>
                <ProfileImage key={refreshKey} avatarUrl={profile?.avatar_url} size={140} />
                <TouchableOpacity onPress={changeProfilePicture} style={styles.cameraButtonContainer}>
                  <IconButton
                    icon="camera"
                    size={24}
                    iconColor={colors.primary}
                    style={styles.cameraButton}
                  />
                </TouchableOpacity>
              </View>
              <Title style={styles.name}>@{profile.username || 'Name not set'}</Title>
              <Text style={styles.fullName}>{profile.full_name}</Text>
              <View style={styles.levelContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.levelBadge}
                >
                  <Text style={styles.levelText}>Nivel {profile.level}</Text>
                </LinearGradient>
              </View>
              <View style={styles.xpContainer}>
                <Text style={styles.xpText}>XP: {profile.xp} / {xp_to_next_level}</Text>
                <View style={styles.xpBarContainer}>
                  <LinearGradient
                    colors={['#4CAF50', '#8BC34A']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[styles.xpBar, { width: `${(profile.xp / xp_to_next_level) * 100}%` }]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.content}>
              {profile.motivational_speech && (
                <Card style={styles.quoteCard}>
                  <Card.Content>
                    <Text style={styles.quoteText}>"{profile.motivational_speech}"</Text>
                  </Card.Content>
                </Card>
              )}

              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.cardTitle}>Paddle Stats</Title>
                  <View style={styles.statsRow}>
                    <StatItem icon="tennis" value={profile.matches_played} label="Matches" />
                    <StatItem icon="trophy" value={profile.wins} label="Wins" />
                    <StatItem icon="close-circle" value={profile.losses} label="Losses" />
                  </View>
                  <View style={styles.winRateContainer}>
                    <Text style={styles.winRateLabel}>Match Win Rate</Text>
                    <ProgressBar progress={winRate / 100} color={colors.primary} style={styles.winRateBar} />
                    <Text style={styles.winRateValue}>{winRate.toFixed(1)}%</Text>
                  </View>
                  
                  <View style={styles.statsRow}>
                    <StatItem icon="table-tennis" value={profile.sets_won} label="Sets Won" />
                    <StatItem icon="table-tennis" value={profile.sets_lost} label="Sets Lost" />
                  </View>
                  <View style={styles.winRateContainer}>
                    <Text style={styles.winRateLabel}>Set Win Rate</Text>
                    <ProgressBar progress={setWinRate / 100} color={colors.primary} style={styles.winRateBar} />
                    <Text style={styles.winRateValue}>{setWinRate.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <StatItem icon="tennis-ball" value={profile.games_won} label="Games Won" />
                    <StatItem icon="tennis-ball" value={profile.games_lost} label="Games Lost" />
                  </View>
                  <View style={styles.winRateContainer}>
                    <Text style={styles.winRateLabel}>Game Win Rate</Text>
                    <ProgressBar progress={gameWinRate / 100} color={colors.primary} style={styles.winRateBar} />
                    <Text style={styles.winRateValue}>{gameWinRate.toFixed(1)}%</Text>
                  </View>
                </Card.Content>
              </Card>

              <Card style={[styles.card, editing && styles.editingCard]}>
                <Card.Content>
                  <Title style={styles.cardTitle}>Player Info</Title>
                  <TextInput
                    label="Full Name"
                    value={profile.full_name || ''}
                    onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                    disabled={!editing}
                    style={styles.input}
                    mode="flat"
                    textColor='white'
                    underlineColor="rgba(255, 255, 255, 0.3)"
                    outlineColor="white"
                    activeUnderlineColor="white"
                    theme={{ colors: { placeholder: 'white' } }}
                  />
                  <TextInput
                    label="Apartment"
                    value={profile.apartment || ''}
                    onChangeText={(text) => setProfile({ ...profile, apartment: text })}
                    disabled={!editing}
                    style={styles.input}
                    mode="flat"
                    textColor='white'
                    underlineColor="rgba(255, 255, 255, 0.3)"
                    activeUnderlineColor="white"
                    theme={{ colors: { placeholder: 'white' } }}
                  />
                  <TextInput
                    label="Phone Number"
                    value={profile.phone_number || ''}
                    onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
                    disabled={!editing}
                    style={styles.input}
                    mode="flat"
                    textColor='white'
                    underlineColor="rgba(255, 255, 255, 0.3)"
                    activeUnderlineColor="white"
                    theme={{ colors: { placeholder: 'white' } }}
                  />
                  <TextInput
                    label="Motivational Speech"
                    value={profile.motivational_speech || ''}
                    onChangeText={(text) => setProfile({ ...profile, motivational_speech: text })}
                    disabled={!editing}
                    style={styles.input}
                    mode="flat"
                    textColor='white'
                    underlineColor="rgba(255, 255, 255, 0.3)"
                    activeUnderlineColor="white"
                    theme={{ colors: { placeholder: 'white' } }}
                    multiline
                    numberOfLines={4}
                  />
                </Card.Content>
              </Card>

              <Button 
                mode={editing ? "contained" : "outlined"} 
                onPress={editing ? updateProfile : () => setEditing(true)} 
                style={[styles.button, editing ? styles.saveButton : styles.editButton]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {editing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const StatItem: React.FC<{ icon: string; value: number; label: string }> = ({ icon, value, label }) => (
  <View style={styles.statItem}>
    <MaterialCommunityIcons name={icon} size={36} color="white" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 0,
    paddingTop: 48,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 24,
    elevation: 4,
  },
  cameraButton: {
    margin: 0,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 16,
  },
  level: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  levelContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  xpContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 16,
  },
  xpText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  xpBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    borderRadius: 5,
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  quoteCard: {
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2
  },
  quoteText: {
    color: 'white',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  editingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  winRateContainer: {
    marginTop: 20,
  },
  winRateLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: 'white',
  },
  winRateBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor:'rgba(0,0,0,0.3)'
  },
  winRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
    color: 'white',
    marginBottom:20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  button: {
    marginTop: 16,
    marginBottom: 48,
    borderRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});