import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Animated, PanResponder } from 'react-native';
import MapView from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomMarker from '../components/CustomMarker';
import CommunityCard from '../components/CommunityCard';

type RootStackParamList = {
  Community: { communityId: string };
};

type CommunityMapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Community'>;

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 200;

export interface Community {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  court_number: number;
  image: string;
  resident_count: number;
  booking_start_time: string;
  booking_end_time: string;
}

const CommunityMapScreen: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const translateY = useRef(new Animated.Value(CARD_HEIGHT)).current;

  const navigation = useNavigation<CommunityMapScreenNavigationProp>();

  useEffect(() => {
    fetchCommunities();
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

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      const communitiesWithCoordinates = data
        .filter((community: any) => community.latitude && community.longitude)
        .map((community: any) => ({
          ...community,
          latitude: parseFloat(community.latitude),
          longitude: parseFloat(community.longitude),
        }));

      setCommunities(communitiesWithCoordinates);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setError('Failed to fetch communities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityPress = useCallback((community: Community) => {
    setSelectedCommunity(community);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: community.latitude - 0.004,
        longitude: community.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D28D9" />
        <Text>Loading communities...</Text>
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
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: communities[0]?.latitude || 0,
          longitude: communities[0]?.longitude || 0,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {communities.map((community) => (
          <CustomMarker 
            key={community.id} 
            community={community} 
            onPress={handleCommunityPress}
            isSelected={selectedCommunity?.id === community.id}
          />
        ))}
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

