'use client';

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { TextInput, Card, Title, Paragraph, Modal, Portal, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
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
     
      // Check if the code matches a resident_code
      const { data: residentCommunityData, error: residentError } = await supabase
        .from('community')
        .select('id, name')
        .eq('resident_code', joinCode)
        .single();
      
      if (!residentError && residentCommunityData) {
        // Code matches a resident_code
        if (profileData.resident_community_id) {
          Alert.alert(t('error'), t('alreadyResident'));
          return;
        }

        setPendingResidentCommunity(residentCommunityData);
        setIsJoinModalVisible(false);
        setIsApartmentFormVisible(true);
        return;
      }

      // If not a resident_code, check if it's a guest_code
      const { data: guestCommunityData, error: guestError } = await supabase
        .from('community')
        .select('id, name')
        .eq('guest_code', joinCode)
        .single();

      if (guestError || !guestCommunityData) {
        Alert.alert(t('error'), t('invalidJoinCode'));
        return;
      }

      // Code matches a guest_code
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Card style={styles.container}>
      
        <Card.Content>
          <Title style={styles.sectionTitle}>{t('yourCommunities')}</Title>
          
          {residentCommunity && (
            <View style={styles.communityItem}>
              <MaterialCommunityIcons name="home" size={24} color="#ffffff" />
              <Paragraph style={styles.communityName}>{t('communityResident', { name: residentCommunity.name })}</Paragraph>
            </View>
          )}

          {guestCommunities.map((community) => (
            <View key={community.id} style={styles.communityItem}>
              <MaterialCommunityIcons name="account-group" size={24} color="#ffffff" />
              <Paragraph style={styles.communityName}>{t('communityGuest', { name: community.name })}</Paragraph>
            </View>
          ))}

          <TouchableOpacity onPress={() => setIsJoinModalVisible(true)}>
            <LinearGradient
              colors={['#00A86B', '#00C853']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButton}
            >
              <Text style={styles.joinButtonText}>{t('joinCommunity')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Portal>
            <Modal visible={isJoinModalVisible} onDismiss={() => setIsJoinModalVisible(false)} contentContainerStyle={styles.modalContainer}>
              <BlurView intensity={100} tint="dark" style={styles.blurView}>
                <Card style={styles.modalCard}>
                  <Card.Content>
                    <Title style={styles.joinTitle}>{t('joinCommunity')}</Title>
                    <View style={styles.warningContainer}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FF6B6B" />
                      <Paragraph style={styles.warningText}>
                        {t('joinWarning')}
                      </Paragraph>
                    </View>
                    <TextInput
                      label={t('communityJoinCode')}
                      value={joinCode}
                      onChangeText={setJoinCode}
                      style={styles.input}
                      mode="outlined"
                      theme={{ colors: { primary: '#00A86B', underlineColor: 'transparent' } }}
                    />
                    <TouchableOpacity onPress={handleJoinCommunity} disabled={isLoading}>
                      <LinearGradient
                        colors={['#00A86B', '#00C853']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalJoinButton}
                      >
                        <Text style={styles.joinButtonText}>{t('join')}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Card.Content>
                </Card>
              </BlurView>
            </Modal>
            <Modal visible={isApartmentFormVisible} onDismiss={() => setIsApartmentFormVisible(false)} contentContainerStyle={styles.modalContainer}>
              <BlurView intensity={100} tint="dark" style={styles.blurView}>
                <Card style={styles.modalCard}>
                  <Card.Content>
                    <ApartmentForm onSubmit={handleApartmentSubmit} />
                  </Card.Content>
                </Card>
              </BlurView>
            </Modal>
          </Portal>
        </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
  },
  communityName: {
    marginLeft: 16,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  joinButton: {
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 4,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurView: {
    padding: 24,
  },
  modalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  joinTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#333333',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  input: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  modalJoinButton: {
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 4,
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
    marginLeft: 16,
    color: '#FF6B6B',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
});