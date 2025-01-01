import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, useTheme, ActivityIndicator, TextInput } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  joined_at: string;
};

export default function PlayerManagementScreen() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, profiles]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('resident_community_id')
          .eq('id', user.id)
          .single();

        if (profileData?.resident_community_id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, created_at')
            .eq('resident_community_id', profileData.resident_community_id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          const formattedProfiles = (data || []).map(profile => ({
            ...profile,
            joined_at: profile.created_at
          }));
          setProfiles(formattedProfiles);
          setFilteredProfiles(formattedProfiles);
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert(t('error'), t('failedToFetchProfiles'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    const confirmRemoval = () => {
      return new Promise((resolve) => {
        Alert.alert(
          t('removePlayer'),
          t('areYouSureRemovePlayer', { name: playerName }),
          [
            { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
            { text: t('remove'), onPress: () => resolve(true) }
          ]
        );
      });
    };

    const confirmFinalRemoval = () => {
      return new Promise((resolve) => {
        Alert.alert(
          t('finalConfirmation'),
          t('allPlayerDataWillBeDeleted'),
          [
            { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
            { text: t('confirmRemove'), style: 'destructive', onPress: () => resolve(true) }
          ]
        );
      });
    };

    const firstConfirmation = await confirmRemoval();
    if (firstConfirmation) {
      const finalConfirmation = await confirmFinalRemoval();
      if (finalConfirmation) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ resident_community_id: null })
            .eq('id', playerId);

          if (error) throw error;
          setProfiles(profiles.filter(profile => profile.id !== playerId));
          setFilteredProfiles(filteredProfiles.filter(profile => profile.id !== playerId));
          Alert.alert(t('success'), t('playerRemovedFromCommunity'));
        } catch (error) {
          console.error('Error removing player:', error);
          Alert.alert(t('error'), t('failedToRemovePlayer'));
        }
      }
    }
  };

  const handleSearch = (query: string) => {
    const filtered = profiles.filter(profile => 
      profile.full_name.toLowerCase().includes(query.toLowerCase()) ||
      profile.username.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProfiles(filtered);
  };

  const renderItem = ({ item, index }: { item: Profile; index: number }) => (
    <Animated.View
      entering={FadeInRight.delay(index * 100)}
      exiting={FadeOutLeft}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Image 
            size={60} 
            source={item.avatar_url ? { uri: item.avatar_url } : require('../../assets/images/logo.png')} 
            style={styles.avatar}
          />
          <View style={styles.playerInfo}>
            <Title style={styles.playerName}>{item.full_name}</Title>
            <Paragraph style={styles.username}>{item.username}</Paragraph>
            <Paragraph style={styles.joinedDate}>
              {t('joinedOn', { date: format(new Date(item.joined_at), 'PP') })}
            </Paragraph>
          </View>
          <TouchableOpacity 
            onPress={() => handleRemovePlayer(item.id, item.full_name)}
            style={styles.removeButton}
          >
            <Feather name="user-x" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar style="light" />
      <LinearGradient colors={[theme.colors.primary, '#000']} style={styles.container}>
        <Title style={styles.title}>{t('communityPlayers')}</Title>
        <TextInput
          placeholder={t('searchPlayers')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" color={theme.colors.primary} />}
        />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Title style={styles.loadingText}>{t('loadingPlayers')}</Title>
          </View>
        ) : (
          <FlatList
            data={filteredProfiles}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  searchInput: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#00A86B',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  joinedDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
});