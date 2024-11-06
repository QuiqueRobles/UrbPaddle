import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { Button, Card, TextInput, Title, Text, ActivityIndicator, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'
import ProfileImage from '../components/ProfileImage';

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
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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
      Alert.alert('Permiso necesario', 'Por favor, concede permiso para acceder a tus fotos');
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
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      const fileName = `${userId}/${Date.now()}.jpg`;

      try {
        setLoading(true);

        const base64FileData = asset.base64;
        if (!base64FileData) {
          throw new Error('No se pudo obtener los datos base64 de la imagen');
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
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
      } catch (error) {
        console.error('Error al actualizar la foto de perfil:', error);
        Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[colors.primary, "#000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.profileImageContainer}>
            <ProfileImage key={refreshKey} avatarUrl={profile?.avatar_url} size={120} />
            <TouchableOpacity onPress={changeProfilePicture} style={styles.cameraButtonContainer}>
              <IconButton
                icon="camera"
                size={20}
                iconColor={colors.primary}
                style={styles.cameraButton}
              />
            </TouchableOpacity>
          </View>
          <Title style={styles.name}>{profile.username || 'Name not set'}</Title>
          <Text style={styles.email}>{profile.email}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Paddle Stats</Title>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="tennis" size={32} color={colors.primary} />
                  <Text style={styles.statValue}>{profile.matches_played}</Text>
                  <Text style={styles.statLabel}>Matches</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="trophy" size={32} color={colors.primary} />
                  <Text style={styles.statValue}>{profile.wins}</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="close-circle" size={32} color={colors.primary} />
                  <Text style={styles.statValue}>{profile.losses}</Text>
                  <Text style={styles.statLabel}>Losses</Text>
                </View>
              </View>
              <View style={styles.winRateContainer}>
                <Text style={styles.winRateLabel}>Win Rate</Text>
                <ProgressBar progress={winRate / 100} color={colors.primary} style={styles.winRateBar} />
                <Text style={styles.winRateValue}>{winRate.toFixed(1)}%</Text>
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

          <Button 
            mode={editing ? "contained" : "outlined"} 
            onPress={editing ? updateProfile : () => setEditing(true)} 
            style={styles.button}
          >
            {editing ? 'Save Changes' : 'Edit Profile'}
          </Button>
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
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 20,
    elevation: 4,
  },
  cameraButton: {
    margin: 0,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
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
    borderRadius: 8,
  },
});