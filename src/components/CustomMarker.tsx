import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { Community } from '../screens/CommunityMapScreen';

interface CustomMarkerProps {
  community: Community;
  onPress: (community: Community) => void;
  isSelected: boolean;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ community, onPress, isSelected }) => (
  <Marker
    coordinate={{ latitude: community.latitude, longitude: community.longitude }}
    onPress={() => onPress(community)}
  >
    <View style={styles.markerContainer}>
      <View style={[styles.marker, isSelected && styles.selectedMarker]}>
        <Feather name="map-pin" size={18} color={isSelected ? "#FFFFFF" : "rgb(36, 233, 59)"} />
      </View>
    </View>
    {isSelected && (
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutText}>{community.name}</Text>
        </View>
      </Callout>
    )}
  </Marker>
);

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    padding: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgb(36, 233, 59)',
  },
  selectedMarker: {
    backgroundColor: 'rgb(36, 233, 59)',
    borderColor: '#F3E8FF',
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 6,
    maxWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
});

export default CustomMarker;

