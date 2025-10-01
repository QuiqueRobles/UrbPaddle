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
import EnhancedStatisticsSection from '../components/enhanced-statistics-section';

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
  hot_streak: number;
  max_hot_streak: number;
};

export default function EnhancedProfileScreen() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [statisticsExpanded, setStatisticsExpanded] = useState(false);
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

  // Replace the existing xp_to_next_level and calculations with:
    const xp_to_next_level = 5000;
    const xpForCurrentLevel = profile ? profile.level * xp_to_next_level : 0;
    const xpForNextLevel = profile ? (profile.level + 1) * xp_to_next_level : xp_to_next_level;
    const currentLevelXp = profile ? profile.xp - xpForCurrentLevel : 0;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

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
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={[styles.container, styles.centered]}>
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={"white"} />
      </View>
      </LinearGradient>
    );
  }

  if (!profile) {
  return (
    <View style={[styles.container, styles.centered]}>
      <Text>{t('noProfileData')}</Text>
      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 20 }}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>{t('logOut')}</Text>
      </TouchableOpacity>
    </View>
  );
}


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
          
          {/* Enhanced Header Section */}
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
            
            {/* Enhanced XP Progress - Replace the existing block with this */}
            <View style={styles.xpContainer}>
              <Text style={styles.xpText}>
                {t('level')} {profile.level} - {currentLevelXp}/{xpNeededForNextLevel} XP
              </Text>
              <View style={styles.xpBarContainer}>
                <LinearGradient
                  colors={['#4CAF50', '#8BC34A']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={[styles.xpBar, { 
                    width: `${Math.min(100, (currentLevelXp / xpNeededForNextLevel) * 100)}%` 
                  }]}
                />
              </View>
              <Text style={styles.xpPercentage}>
                {Math.min(100, ((currentLevelXp / xpNeededForNextLevel) * 100)).toFixed(1)}% {t('toLevel')} {profile.level + 1}
              </Text>
            </View>

            {/* Quick Stats Overview */}
            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStatItem}>
                <MaterialCommunityIcons name="fire" size={20} color="#FF6B35" />
                <Text style={styles.quickStatValue}>{profile.hot_streak || 0}</Text>
                <Text style={styles.quickStatLabel}>Streak</Text>
              </View>
              <View style={styles.quickStatItem}>
                <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.quickStatValue}>{profile.wins || 0}</Text>
                <Text style={styles.quickStatLabel}>Wins</Text>
              </View>
              <View style={styles.quickStatItem}>
                <MaterialCommunityIcons name="tennis" size={20} color="#4CAF50" />
                <Text style={styles.quickStatValue}>{profile.matches_played || 0}</Text>
                <Text style={styles.quickStatLabel}>Matches</Text>
              </View>
            </View>
          </View>

          <CommunitiesSection />
          
          <View style={styles.content}>
            {profile.motivational_speech && (
              <Card style={styles.quoteCard}>
                <Card.Content>
                  <MaterialCommunityIcons 
                    name="format-quote-open" 
                    size={24} 
                    color="rgba(255,255,255,0.7)" 
                    style={styles.quoteIcon}
                  />
                  <Text style={styles.quoteText}>"{profile.motivational_speech}"</Text>
                </Card.Content>
              </Card>
            )}

            {/* Enhanced Statistics Section */}
            <EnhancedStatisticsSection 
              profile={profile}
              onRefresh={onRefresh}
              expanded={statisticsExpanded}
              onToggleExpanded={() => setStatisticsExpanded(!statisticsExpanded)}
            />

<Card style={[styles.card, editing && styles.editingCard]}>
  
    <Card.Content style={styles.modalContent}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons 
          name="account-details" 
          size={24} 
          color="#ffffff" 
          style={styles.cardIcon}
        />
        <Title style={styles.joinTitle}>{t('personalInfo')}</Title>
        <TouchableOpacity 
          onPress={editing ? updateProfile : () => setEditing(true)} 
          disabled={editing && !canSave()}
          style={styles.editButtonContainer}
        >
          <LinearGradient
            colors={editing ? (canSave() ? ['#00A86B', '#00C853'] : ['#666', '#666']) : ['#00A86B', '#00C853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.joinButtonText}>
              {editing ? t('save') : t('edit')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.infoGrid}>
        {/* Full Name */}
<View style={styles.infoItem}>
  <Text style={styles.infoLabel}>{t('fullName')}</Text>
  {editing ? (
    <TextInput
      mode="outlined"
      value={profile?.full_name || ''}
      onChangeText={(text) => handleFieldChange('full_name', text)}
      error={!!errors.full_name}
      style={styles.input}
      textColor="#fff" // Explicitly set text color to white
      theme={{
        colors: {
          primary: '#00C853',
          background: 'rgba(255, 255, 255, 0.08)',
          text: '#fff', // White text when typing
          placeholder: 'rgba(255, 255, 255, 0.7)',
          onSurface: '#fff', // Ensures text stays white in all states
        },
      }}
      accessibilityLabel={t('fullName')}
    />
  ) : (
    <Text style={styles.infoValue}>{profile?.full_name || t('notSpecified')}</Text>
  )}
  {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
</View>

{/* Apartment */}
<View style={styles.infoItem}>
  <Text style={styles.infoLabel}>{t('apartment')}</Text>
  {editing ? (
    <TextInput
      mode="outlined"
      value={profile?.apartment || ''}
      onChangeText={(text) => handleFieldChange('apartment', text)}
      error={!!errors.apartment}
      style={styles.input}
      textColor="#fff" // Explicitly set text color to white
      theme={{
        colors: {
          primary: '#00C853',
          background: 'rgba(255, 255, 255, 0.08)',
          text: '#fff', // White text when typing
          placeholder: 'rgba(255, 255, 255, 0.7)',
          onSurface: '#fff', // Ensures text stays white in all states
        },
      }}
      accessibilityLabel={t('apartment')}
    />
  ) : (
    <Text style={styles.infoValue}>{profile?.apartment || t('notSpecified')}</Text>
  )}
  {errors.apartment && <Text style={styles.errorText}>{errors.apartment}</Text>}
</View>

{/* Phone Number */}
<View style={styles.infoItem}>
  <Text style={styles.infoLabel}>{t('phoneNumber')}</Text>
  {editing ? (
    <TextInput
      mode="outlined"
      value={profile?.phone_number || ''}
      onChangeText={(text) => handleFieldChange('phone_number', text)}
      error={!!errors.phone_number}
      keyboardType="phone-pad"
      style={styles.input}
      textColor="#fff" // Explicitly set text color to white
      theme={{
        colors: {
          primary: '#00C853',
          background: 'rgba(255, 255, 255, 0.08)',
          text: '#fff', // White text when typing
          placeholder: 'rgba(255, 255, 255, 0.7)',
          onSurface: '#fff', // Ensures text stays white in all states
        },
      }}
      accessibilityLabel={t('phoneNumber')}
    />
  ) : (
    <Text style={styles.infoValue}>{profile?.phone_number || t('notSpecified')}</Text>
  )}
  {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
</View>

{/* Motivational Speech */}
<View style={[styles.infoItem, styles.fullWidthItem]}>
  <Text style={styles.infoLabel}>{t('motivationalSpeech')}</Text>
  {editing ? (
    <TextInput
      mode="outlined"
      value={profile?.motivational_speech || ''}
      onChangeText={(text) => handleFieldChange('motivational_speech', text)}
      error={!!errors.motivational_speech}
      multiline
      numberOfLines={3}
      style={[styles.input, styles.multilineInput]}
      textColor="#fff" // Explicitly set text color to white
      theme={{
        colors: {
          primary: '#00C853',
          background: 'rgba(255, 255, 255, 0.08)',
          text: '#fff', // White text when typing
          placeholder: 'rgba(255, 255, 255, 0.7)',
          onSurface: '#fff', // Ensures text stays white in all states
        },
      }}
      accessibilityLabel={t('motivationalSpeech')}
    />
  ) : (
    <Text style={[styles.infoValue, styles.multilineText]}>
      {profile?.motivational_speech || t('noMotivationalSpeech')}
    </Text>
  )}
  {errors.motivational_speech && <Text style={styles.errorText}>{errors.motivational_speech}</Text>}
</View>
      </View>
    </Card.Content>
</Card>

            {/* Logout Section */}
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
    paddingBottom: 20,
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
    marginBottom: 14,
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
    marginTop: 10,
  },
  xpBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    borderRadius: 6,
  },
  xpPercentage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  editingCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gradientCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardIcon: {
    marginRight: 12,
  },
  joinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  gradientButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  editButtonContainer: {
    marginLeft: 'auto',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 24,
  },
  fullWidthItem: {
    width: '100%',
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
  multilineInput: {
    minHeight: 80,
  },
  multilineText: {
    lineHeight: 22,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  quickStatItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  content: {
    padding: 16,
  },

  quoteCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  quoteIcon: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  quoteText: {
    color: 'white',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
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
  editButton: {
    // Gradient applied via LinearGradient
  },
  saveButton: {
    // Gradient applied via LinearGradient
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

infoInput: {
  backgroundColor: 'rgba(255,255,255,0.1)',
  color: 'white',
},


});
