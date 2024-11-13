import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button, TextInput, Card, Title, Paragraph, Modal, Portal } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Community = {
  id: string;
  name: string;
};

export default function CommunitiesSection() {
  const [residentCommunity, setResidentCommunity] = useState<Community | null>(null);
  const [guestCommunities, setGuestCommunities] = useState<Community[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);

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
      Alert.alert('Error', 'Failed to fetch communities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
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
          Alert.alert('Error', 'You are already a resident of a community. You cannot be a resident of multiple communities.');
          return;
        }

        if (profileData.guest_communities && profileData.guest_communities.includes(residentCommunityData.id)) {
          Alert.alert(
            'Confirmation',
            'You are currently a guest in this community. Do you want to become a resident? This will remove your guest status.',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Confirm',
                onPress: async () => {
                  const updatedGuestCommunities = profileData.guest_communities.filter(id => id !== residentCommunityData.id);
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ 
                      resident_community_id: residentCommunityData.id,
                      guest_communities: updatedGuestCommunities
                    })
                    .eq('id', user.id);

                  if (updateError) throw updateError;

                  Alert.alert('Success', `You are now a resident of ${residentCommunityData.name}`);
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

        Alert.alert('Success', `You've joined ${residentCommunityData.name} as a resident`);
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
        Alert.alert('Error', 'Invalid join code');
        return;
      }

      // Code matches a guest_code
      if (profileData.resident_community_id === guestCommunityData.id) {
        Alert.alert('Error', 'You are already a resident of this community. You cannot be a guest in your resident community.');
        return;
      }

      if (profileData.guest_communities && profileData.guest_communities.includes(guestCommunityData.id)) {
        Alert.alert('Error', 'You are already a guest in this community');
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

      Alert.alert('Success', `You've joined ${guestCommunityData.name} as a guest`);
      setJoinCode('');
      setIsJoinModalVisible(false);
      fetchCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert('Error', 'Failed to join community');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Your Communities</Title>
        
        {residentCommunity && (
          <View style={styles.communityItem}>
            <MaterialCommunityIcons name="home" size={24} color="#00A86B" />
            <Paragraph style={styles.communityName}>{residentCommunity.name} (Resident)</Paragraph>
          </View>
        )}

        {guestCommunities.map((community) => (
          <View key={community.id} style={styles.communityItem}>
            <MaterialCommunityIcons name="account-group" size={24} color="#00A86B" />
            <Paragraph style={styles.communityName}>{community.name} (Guest)</Paragraph>
          </View>
        ))}

        <Button 
          mode="contained" 
          onPress={() => setIsJoinModalVisible(true)}
          style={styles.joinButton}
        >
          Join a Community
        </Button>

        <Portal>
          <Modal visible={isJoinModalVisible} onDismiss={() => setIsJoinModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            <Card>
              <Card.Content>
                <Title style={styles.joinTitle}>Join a Community</Title>
                <Paragraph style={styles.warningText}>
                  WARNING: It is strictly prohibited to join as a resident if you are not an actual resident of the community. 
                  Misuse may result in account suspension.
                </Paragraph>
                <TextInput
                  label="Community Join Code"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  style={styles.input}
                  mode="outlined"
                />
                <Button 
                  mode="contained" 
                  onPress={handleJoinCommunity}
                  disabled={isLoading}
                  style={styles.modalJoinButton}
                >
                  Join
                </Button>
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
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white'
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityName: {
    marginLeft: 12,
    fontSize: 16,
    color: 'white'
  },
  joinButton: {
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: 'black'
  },
  input: {
    marginBottom: 16,
  },
  modalJoinButton: {
    marginTop: 8,
  },
  warningText: {
    color: 'red',
    fontStyle: 'italic',
    marginBottom: 16,
  },
});