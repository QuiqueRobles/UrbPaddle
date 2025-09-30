'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps'; // Import Marker from react-native-maps
import { Community } from '../screens/CommunityMapScreen';

interface CustomMarkerProps {
  community: Community;
  onPress: (community: Community) => void;
  isSelected: boolean;
  isAccessible: boolean;
}

const CustomMarker: React.FC<CustomMarkerProps> = React.memo(
  ({ community, onPress, isSelected, isAccessible }) => {
    const markerColor = useMemo(() => {
      if (!isAccessible) return '#A9A9A9'; // Gray for inaccessible communities
      switch (community.user_relationship) {
        case 'resident':
          return '#00C853';
        case 'guest':
          return '#2196F3';
        default:
          return '#FF9800';
      }
    }, [community.user_relationship, isAccessible]);

    const scaleAnim = useRef(new Animated.Value(isSelected ? 1.2 : 1)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.2 : 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }, [isSelected, scaleAnim]);

    return (
      <Marker
        coordinate={{
          latitude: Number(community.latitude), // Ensure number type
          longitude: Number(community.longitude), // Ensure number type
        }}
        onPress={() => onPress(community)}
      >
        <Animated.View
          style={[
            styles.markerContainer,
            {
              backgroundColor: markerColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons name="office-building" size={24} color="white" />
          <View style={styles.courtNumberContainer}>
            <Text style={styles.courtNumberText}>{community.court_number}</Text>
          </View>
        </Animated.View>
      </Marker>
    );
  }
);

const styles = StyleSheet.create({
  markerContainer: {
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  courtNumberContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 2,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courtNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default CustomMarker;