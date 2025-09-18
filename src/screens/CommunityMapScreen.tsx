'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Animated, PanResponder, Alert } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomMarker from '../components/CustomMarker';
import CommunityCard from '../components/CommunityCard';
import { useTranslation } from 'react-i18next';
import { useCommunities } from '../hooks/useCommunities';
import { supabase } from '../lib/supabase';

// Define the Community type (adjust as per your actual data structure)
export interface Community {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  court_number: number;
  resident_count: number;
  guest_count: number;
  booking_start_time: string;
  booking_end_time: string;
  max_number_current_bookings: number;
  address: string;
  image: string;
  user_relationship: 'resident' | 'guest' | 'none';
}

type RootStackParamList = {
  Community: { communityId: string };
};

type CommunityMapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Community'>;

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 200;

const CommunityMapScreen: React.FC = () => {
  const { t } = useTranslation();
  const { communities, loading, error, refetch } = useCommunities();
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [accessibleCommunities, setAccessibleCommunities] = useState<string[]>([]);
  const mapRef = useRef<MapView>(null);
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
        ].filter(Boolean) as string[];

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

  const handleCommunityPress = useCallback((community: Community) => {
    if (accessibleCommunities.includes(community.id)) {
      setSelectedCommunity((prev) => (prev?.id === community.id ? null : community));
      if (mapRef.current) {
        const newRegion = {
          latitude: community.latitude - 0.004,
          longitude: community.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        mapRef.current.animateToRegion(newRegion, 1000);
        setMapRegion(newRegion);
      }
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Alert.alert(
        t('accessDenied'),
        t('communityAccessMessage'),
        [{ text: t('ok'), onPress: () => console.log('OK Pressed') }]
      );
    }
  }, [translateY, accessibleCommunities, t]);

  const handleViewDetails = useCallback(() => {
    if (selectedCommunity) {
      console.log('Navigating to community:', selectedCommunity.id);
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

  const handleRegionChange = useCallback((region: Region) => {
    setMapRegion(region);
  }, []);

  const memoizedCommunities = useMemo(() => {
    return communities.map((community) => (
      <CustomMarker
        key={community.id}
        community={community}
        onPress={handleCommunityPress}
        isSelected={selectedCommunity?.id === community.id}
        isAccessible={accessibleCommunities.includes(community.id)}
      />
    ));
  }, [communities, selectedCommunity, handleCommunityPress, accessibleCommunities]);

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

  // Default region if communities are empty
  const defaultRegion: Region = {
    latitude: 37.78825, // Example default: San Francisco
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={communities.length > 0 ? {
          latitude: communities[0].latitude,
          longitude: communities[0].longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        } : defaultRegion}
        onRegionChangeComplete={handleRegionChange}
      >
        {memoizedCommunities}
      </MapView>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommunityMapScreen;