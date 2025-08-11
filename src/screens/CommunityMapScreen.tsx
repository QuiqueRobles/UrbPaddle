'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Animated, PanResponder, Alert, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CommunityCard from '../components/CommunityCard';
import { useTranslation } from 'react-i18next';
import { useCommunities, Community } from '../hooks/useCommunities';
import { supabase } from '../lib/supabase';

type RootStackParamList = {
  Community: { communityId: string };
};

type CommunityMapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Community'>;

const { height } = Dimensions.get('window');
const CARD_HEIGHT = 200;

const CommunityMapScreen: React.FC = () => {
  const { t } = useTranslation();
  const { communities, loading, error } = useCommunities();
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [accessibleCommunities, setAccessibleCommunities] = useState<string[]>([]);
  const translateY = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const navigation = useNavigation<CommunityMapScreenNavigationProp>();

  useEffect(() => {
    const fetchAccessibleCommunities = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('resident_community_id, guest_communities')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        const accessibleIds = [
          profile.resident_community_id,
          ...(profile.guest_communities || []),
        ].filter(Boolean);

        setAccessibleCommunities(accessibleIds);
      }
    };

    fetchAccessibleCommunities();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          closeCard();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleCommunityPress = useCallback(
    (community: Community) => {
      if (accessibleCommunities.includes(community.id)) {
        setSelectedCommunity((prev) => (prev?.id === community.id ? null : community));
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else {
        Alert.alert(t('accessDenied'), t('communityAccessMessage'), [
          { text: t('ok'), onPress: () => console.log('OK Pressed') },
        ]);
      }
    },
    [translateY, accessibleCommunities, t]
  );

  const handleViewDetails = useCallback(() => {
    if (selectedCommunity) {
      navigation.navigate('Community', { communityId: selectedCommunity.id });
    }
  }, [selectedCommunity, navigation]);

  const closeCard = useCallback(() => {
    Animated.timing(translateY, {
      toValue: CARD_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedCommunity(null));
  }, [translateY]);

  const memoizedCommunities = useMemo(() => {
    return communities.map((community) => (
      <View
        key={community.id}
        style={[
          styles.communityItem,
          {
            backgroundColor: accessibleCommunities.includes(community.id)
              ? '#4CAF50'
              : '#A9A9A9',
          },
        ]}
        onClick={() => handleCommunityPress(community)}
      >
        <Text style={styles.communityName}>{community.name}</Text>
        <Text style={styles.communityCoords}>
          ({community.latitude.toFixed(3)}, {community.longitude.toFixed(3)})
        </Text>
      </View>
    ));
  }, [communities, accessibleCommunities, handleCommunityPress]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>{t('loadingCommunities')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.listContainer}>
        {memoizedCommunities}
      </ScrollView>
      {selectedCommunity && (
        <CommunityCard
          community={selectedCommunity}
          onViewDetails={handleViewDetails}
          onClose={closeCard}
          panResponder={panResponder}
          translateY={translateY}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContainer: { padding: 16, gap: 10 },
  communityItem: {
    padding: 12,
    borderRadius: 8,
    cursor: 'pointer',
  },
  communityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  communityCoords: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default CommunityMapScreen;
