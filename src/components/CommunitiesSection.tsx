import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { TextInput, Card, Title, Paragraph, Modal, Portal, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

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
  const { colors } = useTheme();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
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

      if (profileData.resident_community_id) {
        const { data: residentData, error: residentError } = await supabase
          .from('community')
          .select('id, name')
          .eq('id', profileData.resident_community_id)
          .single();

        if (residentError) throw residentError;
        setResidentCommunity(residentData);
      }

      if (profileData.guest_communities && profileData.guest_communities.length > 0) {
        const { data: guestData, error: guestError } = await supabase
          .from('community')
          .select('id, name')
          .in('id', profileData.guest_communities);

        if (guestError) throw guestError;
        setGuestCommunities(guestData || []);
      } else {
        setGuestCommunities([]);
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

        if (profileData.guest_communities && profileData.guest_communities.includes(residentCommunityData.id)) {
          Alert.alert(
            t('confirmation'),
            t('becomeResidentConfirmation'),
            [
              {
                text: t('cancel'),
                style: 'cancel'
              },
              {
                text: t('confirm'),
                onPress: async () => {
                 const updatedGuestCommunities = profileData.guest_communities.filter((id: string) => id !== residentCommunityData.id);
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ 
                      resident_community_id: residentCommunityData.id,
                      guest_communities: updatedGuestCommunities
                    })
                    .eq('id', user.id);

                  if (updateError) throw updateError;

                  Alert.alert(t('success'), t('nowResident', { communityName: residentCommunityData.name }));
                  setJoinCode('');
                  setIsJoinModalVisible(false);
                  fetchCommunities();
                }
              }
            ]
          );
          return;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ resident_community_id: residentCommunityData.id })
          .eq('id', user.id);

        if (updateError) throw updateError;

        Alert.alert(t('success'), t('joinedAsResident', { communityName: residentCommunityData.name }));
        setJoinCode('');
        setIsJoinModalVisible(false);
        fetchCommunities();
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
            <MaterialCommunityIcons name="home" size={24} color={colors.background} />
            <Paragraph style={styles.communityName}>{t('communityResident', { name: residentCommunity.name })}</Paragraph>
          </View>
        )}

        {guestCommunities.map((community) => (
          <View key={community.id} style={styles.communityItem}>
            <MaterialCommunityIcons name="account-group" size={24} color={colors.background} />
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
            <Card>
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
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  mode="outlined"
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  communityName: {
    marginLeft: 12,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  joinButton: {
    marginTop: 20,
    borderRadius: 25,
    paddingVertical: 12,
    elevation: 3,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  joinTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
  },
  modalJoinButton: {
    borderRadius: 25,
    paddingVertical: 12,
    elevation: 3,
  },
 warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 20,
  },
});