'use client';

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { TextInput, Modal, Portal, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import ApartmentForm from './ApartmentForm';

type Community = {
  id: string;
  name: string;
};

export default function CommunitiesSection() {
  const { t } = useTranslation();
  const [residentCommunity, setResidentCommunity] = useState<Community | null>(null);
  const [guestCommunities, setGuestCommunities] = useState<Community[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isApartmentFormVisible, setIsApartmentFormVisible] = useState(false);
  const [pendingResidentCommunity, setPendingResidentCommunity] = useState<Community | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('resident_community_id, guest_communities')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const residentCommunityId = data?.resident_community_id;
      const guestCommunityIds = data?.guest_communities || [];

      if (residentCommunityId) {
        const { data: residentCommunityData, error: residentError } = await supabase
          .from('community')
          .select('id, name')
          .eq('id', residentCommunityId)
          .single();
        if (residentError) throw residentError;
        setResidentCommunity(residentCommunityData);
      }

      if (guestCommunityIds.length > 0) {
        const { data: guestCommunitiesData, error: guestError } = await supabase
          .from('community')
          .select('id, name')
          .in('id', guestCommunityIds);
        if (guestError) throw guestError;
        setGuestCommunities(guestCommunitiesData);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      Alert.alert(t('error'), t('failedFetchCommunities'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunityPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsJoinModalVisible(true);
  };

  const handleJoinCommunity = async () => {
    if (!joinCode.trim()) {
      Alert.alert(t('error'), t('enterJoinCode'));
      return;
    }

    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('resident_community_id, guest_communities')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: residentCommunityData, error: residentError } = await supabase
        .from('community')
        .select('id, name')
        .eq('resident_code', joinCode)
        .single();

      if (!residentError && residentCommunityData) {
        if (profileData.resident_community_id) {
          Alert.alert(t('error'), t('alreadyResident'));
          return;
        }

        setPendingResidentCommunity(residentCommunityData);
        setIsJoinModalVisible(false);
        setIsApartmentFormVisible(true);
        return;
      }

      const { data: guestCommunityData, error: guestError } = await supabase
        .from('community')
        .select('id, name')
        .eq('guest_code', joinCode)
        .single();

      if (guestError || !guestCommunityData) {
        Alert.alert(t('error'), t('invalidJoinCode'));
        return;
      }

      if (profileData.resident_community_id === guestCommunityData.id) {
        Alert.alert(t('error'), t('alreadyResidentCantBeGuest'));
        return;
      }

      if (profileData.guest_communities && profileData.guest_communities.includes(guestCommunityData.id)) {
        Alert.alert(t('error'), t('alreadyGuest'));
        return;
      }

      const updatedGuestCommunities = [
        ...(profileData.guest_communities || []),
        guestCommunityData.id
      ];

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ guest_communities: updatedGuestCommunities })
        .eq('id', user.id);

      if (updateError) throw updateError;

      Alert.alert(t('success'), t('joinedAsGuest', { communityName: guestCommunityData.name }));
      setJoinCode('');
      setIsJoinModalVisible(false);
      fetchCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert(t('error'), t('failedJoinCommunity'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApartmentSubmit = async (apartmentInfo: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          resident_community_id: pendingResidentCommunity?.id,
          apartment: apartmentInfo
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      Alert.alert(t('success'), t('joinedAsResident', { communityName: pendingResidentCommunity?.name }));
      setIsApartmentFormVisible(false);
      setPendingResidentCommunity(null);
      fetchCommunities();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('error'), t('failedToUpdateProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseApartmentModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsApartmentFormVisible(false);
    setPendingResidentCommunity(null);
  };

  if (isLoading) {
    return (
      
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        </SafeAreaView>
      
    );
  }

  return (
    
      <SafeAreaView style={styles.safeArea}>
        <Animatable.View animation="fadeInUp" duration={800} style={styles.container}>
          <Text style={styles.sectionTitle}>{t('yourCommunities')}</Text>
          
          {residentCommunity && (
            <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.communityItem}>
              <MaterialCommunityIcons name="home" size={20} color="#00C853" />
              <Text style={styles.communityName}>{t('communityResident', { name: residentCommunity.name })}</Text>
            </Animatable.View>
          )}

          {guestCommunities.map((community, index) => (
            <Animatable.View 
              key={community.id} 
              animation="fadeInUp" 
              duration={800} 
              delay={400 + index * 100} 
              style={styles.communityItem}
            >
              <MaterialCommunityIcons name="account-group" size={20} color="#00C853" />
              <Text style={styles.communityName}>{t('communityGuest', { name: community.name })}</Text>
            </Animatable.View>
          ))}

          <Animatable.View animation="fadeInUp" duration={800} delay={600}>
            <TouchableOpacity 
              onPress={handleJoinCommunityPress} 
              style={styles.joinButton}
              activeOpacity={0.7}
              accessibilityLabel={t('joinCommunity')}
            >
              <LinearGradient
                colors={['#00A86B', '#00C853']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.joinButtonText}>{t('joinCommunity')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <Portal>
            <Modal 
              visible={isJoinModalVisible} 
              onDismiss={() => setIsJoinModalVisible(false)} 
              contentContainerStyle={styles.modalContainer}
            >
              <Animatable.View animation="fadeInUp" duration={800} style={styles.modalContent}>
                <Text style={styles.joinTitle}>{t('joinCommunity')}</Text>
                <View style={styles.warningContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF6B6B" />
                  <Text style={styles.warningText}>{t('joinWarning')}</Text>
                </View>
                <TextInput
                  label={t('communityJoinCode')}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  style={styles.input}
                  mode="outlined"
                  theme={{ colors: { primary: '#00C853', background: 'rgba(255, 255, 255, 0.08)', text: '#fff', placeholder: 'rgba(255, 255, 255, 0.7)' } }}
                  accessibilityLabel={t('communityJoinCode')}
                />
                <TouchableOpacity 
                  onPress={handleJoinCommunity} 
                  disabled={isLoading}
                  style={styles.modalJoinButton}
                  activeOpacity={0.7}
                  accessibilityLabel={t('join')}
                >
                  <LinearGradient
                    colors={isLoading ? ['#666', '#666'] : ['#00A86B', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.joinButtonText}>{t('join')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setIsJoinModalVisible(false)} 
                  style={styles.closeButton}
                  activeOpacity={0.7}
                  accessibilityLabel={t('close')}
                >
                  <LinearGradient
                    colors={['#00A86B', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.joinButtonText}>{t('close')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            </Modal>
            <Modal 
              visible={isApartmentFormVisible} 
              onDismiss={handleCloseApartmentModal} 
              contentContainerStyle={styles.modalContainer}
            >
              <Animatable.View animation="fadeInUp" duration={800} style={styles.modalContent}>
                <Text style={styles.joinTitle}>{t('enterApartmentDetails')}</Text>
                <ApartmentForm onSubmit={handleApartmentSubmit} />
                <TouchableOpacity 
                  onPress={handleCloseApartmentModal} 
                  style={styles.closeButton}
                  activeOpacity={0.7}
                  accessibilityLabel={t('close')}
                >
                  <LinearGradient
                    colors={['#00A86B', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.joinButtonText}>{t('close')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            </Modal>
          </Portal>
        </Animatable.View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  communityName: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  joinButton: {
    marginTop: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 150,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  joinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  input: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    borderRadius: 8,
  },
  modalJoinButton: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});