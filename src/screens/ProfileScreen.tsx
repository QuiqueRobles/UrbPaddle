import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Button, Card, TextInput, Title, Text, ActivityIndicator, useTheme, ProgressBar, IconButton, Portal, Modal } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'
import ProfileImage from '../components/ProfileImage';
import PlayerInfoForm from '../components/PlayerInfoForm';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommunitiesSection from '../components/CommunitiesSection';
import LevelIndicator from '../components/LevelIndicator';
import { colors } from "../theme/colors";
import { useNavigation } from '@react-navigation/native';
import SettingsModal from '../components/SettingsModal';
import { RootStackParamList } from '../navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [errors, setErrors] = useState({
    full_name: '',
    apartment: '',
    phone_number: '',
    motivational_speech: '',
  });

  const validateField = (field: string, value: string) => {
    let error = '';
    switch (field) {
      case 'full_name':
        if (value.trim().length < 2) {
          error = 'Full name must be at least 2 characters long';
        }
        break;
      case 'apartment':
        if (value.trim().length === 0) {
          error = 'Apartment number is required';
        }
        break;
      case 'phone_number':
        if (!/^\+?[0-9]{10,14}$/.test(value)) {
          error = 'Please enter a valid phone number';
        }
        break;
      case 'motivational_speech':
        if (value.trim().length > 200) {
          error = 'Motivational speech must be 200 characters or less';
        }
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert(t('error'), t('failedLogout'));
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
    validateField(field, value);
  };

  const canSave = () => {
    return Object.values(errors).every(error => error === '') &&
           profile !== null &&
           Object.entries(profile).some(([key, value]) => 
             ['full_name', 'apartment', 'phone_number', 'motivational_speech'].includes(key) && 
             value !== undefined && 
             value !== ''
           );
  };

  const xp_to_next_level = 5000;

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

  const fetchProfile = async (session: Session) => {
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
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (session) {
      await fetchProfile(session);
    }
    setRefreshing(false);
  }, [session]);
  
  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');
      if (!profile) throw new Error('No profile data!');

      const updates = {
        id: session.user.id,
        full_name: profile.full_name,
        apartment: profile.apartment,
        phone_number: profile.phone_number,
        motivational_speech: profile.motivational_speech,
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

  const toggleSettings = useCallback(() => {
    console.log('Toggle Settings pressed');
    setSettingsVisible((prev) => !prev);
  }, []);

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
        <Text>{t('noProfileData')}</Text>
      </View>
    );
  }
  const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;
  const winRate = profile.matches_played > 0 ? (profile.wins / profile.matches_played) * 100 : 0;
  const setWinRate = profile.sets_won + profile.sets_lost > 0 ? (profile.sets_won / (profile.sets_won + profile.sets_lost)) * 100 : 0;
  const gameWinRate = profile.games_won + profile.games_lost > 0 ? (profile.games_won / (profile.games_won + profile.games_lost)) * 100 : 0;

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['white']}
              tintColor={'white'}
            />
          }
        >
          <IconButton
            icon="cog"
            size={24}
            iconColor="white"
            style={styles.settingsButton}
            onPress={toggleSettings}
          />
          <View style={styles.header}>
            <View style={styles.profileImageContainer}>
              <ProfileImage key={refreshKey} avatarUrl={profile.avatar_url} size={140} />
              <TouchableOpacity onPress={changeProfilePicture} style={styles.cameraButtonContainer}>
                <IconButton
                  icon="camera"
                  size={24}
                  iconColor={colors.primary}
                  style={styles.cameraButton}
                />
              </TouchableOpacity>
            </View>
            <Title style={styles.name}>@{profile.username || t('nameNotSet')}</Title>
            <Text style={styles.fullName}>{profile.full_name}</Text>
            <LevelIndicator level={profile.level} />
            <View style={styles.xpContainer}>
              <Text style={styles.xpText}>{t('xp', { current: profile.xp, total: xp_to_next_level })}</Text>
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
          <CommunitiesSection />
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
                <Title style={styles.cardTitle}>{t('paddleStats')}</Title>
                <View style={styles.statsRow}>
                  <StatItem icon="tennis" value={profile.matches_played} label={t('matches')} />
                  <StatItem icon="trophy" value={profile.wins} label={t('wins')} />
                  <StatItem icon="close-circle" value={profile.losses} label={t('losses')} />
                </View>
                <View style={styles.winRateContainer}>
                  <Text style={styles.winRateLabel}>{t('matchWinRate')}</Text>
                  <ProgressBar 
                    progress={roundToTwoDecimals(winRate / 100)} 
                    color={colors.primary} 
                    style={styles.winRateBar} 
                  />
                  <Text style={styles.winRateValue}>{winRate.toFixed(1)}%</Text>
                </View>
                
                <View style={styles.statsRow}>
                  <StatItem icon="table-tennis" value={profile.sets_won} label={t('setsWon')} />
                  <StatItem icon="table-tennis" value={profile.sets_lost} label={t('setsLost')} />
                </View>
                <View style={styles.winRateContainer}>
                  <Text style={styles.winRateLabel}>{t('setWinRate')}</Text>
                  <ProgressBar 
                    progress={roundToTwoDecimals(setWinRate / 100)} 
                    color={colors.primary} 
                    style={styles.winRateBar} 
                  />
                  <Text style={styles.winRateValue}>{setWinRate.toFixed(1)}%</Text>
                </View>
                <View style={styles.statsRow}>
                  <StatItem icon="tennis-ball" value={profile.games_won} label={t('gamesWon')} />
                  <StatItem icon="tennis-ball" value={profile.games_lost} label={t('gamesLost')} />
                </View>
                <View style={styles.winRateContainer}>
                  <Text style={styles.winRateLabel}>{t('gameWinRate')}</Text>
                  <ProgressBar 
                    progress={roundToTwoDecimals(gameWinRate / 100)} 
                    color={colors.primary} 
                    style={styles.winRateBar} 
                  />
                  <Text style={styles.winRateValue}>{gameWinRate.toFixed(1)}%</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={[styles.card, editing && styles.editingCard]}>
              <Card.Content>
                <PlayerInfoForm
                  profile={profile}
                  errors={errors}
                  handleFieldChange={handleFieldChange}
                  editing={editing}
                />
                <TouchableOpacity onPress={editing ? updateProfile : () => setEditing(true)} disabled={editing && !canSave()}>
                  <LinearGradient
                    colors={editing ? ['#00A86B', '#00C853'] : ['#f0f0f0', '#e0e0e0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, editing ? styles.saveButton : styles.editButton]}
                  >
                    <Text style={[styles.buttonLabel, { color: editing ? 'white' : 'rgba(0,0,0,0.75)' }]}>
                      {editing ? t('saveChanges') : t('editProfile')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Card.Content>
            </Card>
            <Card style={styles.card}>
              <Card.Content>
                <TouchableOpacity onPress={handleLogout}>
                  <LinearGradient
                    colors={['#FF3B30', '#FF6B6B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, styles.logoutButton]}
                  >
                    <View style={styles.buttonContent}>
                      <MaterialCommunityIcons name="logout" size={24} color="white" style={{ marginRight: 8 }} />
                      <Text style={[styles.buttonLabel, { color: 'white' }]}>{t('logOut')}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
        <Portal>
        <Modal visible={settingsVisible} onDismiss={toggleSettings} contentContainerStyle={styles.modalContainer}>
          <SettingsModal onClose={toggleSettings} navigation={navigation} />
        </Modal>
      </Portal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const StatItem: React.FC<{ icon: keyof typeof MaterialCommunityIcons.glyphMap; value: number; label: string }> = ({ icon, value, label }) => (
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
    // Remove backgroundColor
  },
  saveButton: {
    // Remove backgroundColor
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
    marginBottom:14,
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
    marginTop: 20,
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
    marginTop:10,
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
    marginBottom: 40,
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
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    marginBottom: 20,
    borderRadius: 10,
    height: '70%',
  },
});