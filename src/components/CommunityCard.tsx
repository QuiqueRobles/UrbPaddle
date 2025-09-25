'use client';

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Platform, Linking } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Community } from '../screens/CommunityMapScreen';

interface CommunityCardProps {
  community: Community;
  onClose: () => void;
  onViewDetails: () => void;
  panResponder: Animated.PanResponderInstance;
  translateY: Animated.Value;
}

const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  onClose,
  onViewDetails,
  panResponder,
  translateY,
}) => {
  const openMaps = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${community.latitude},${community.longitude}`;
    const label = community.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url as string);
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        { transform: [{ translateY }] },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Feather name="x" size={24} color="#6D28D9" />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <Image source={{ uri: community.image }} style={styles.communityImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{community.name}</Text>
          <View style={styles.cardDetails}>
            <View style={styles.cardRow}>
              <Feather name="users" size={16} color="#A78BFA" />
              <Text style={styles.cardText}>{community.resident_count} residents</Text>
            </View>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="account-group" size={16} color="#60A5FA" />
              <Text style={styles.cardText}>{community.guest_count} guests</Text>
            </View>
            <View style={styles.cardRow}>
              <Feather name="clock" size={16} color="#10B981" />
              <Text style={styles.cardText}>
                {community.booking_start_time} - {community.booking_end_time}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="tennis" size={16} color="#F59E0B" />
              <Text style={styles.cardText}>Court {community.court_number}</Text>
            </View>
            <View style={styles.cardRow}>
              <Feather name="calendar" size={16} color="#EC4899" />
              <Text style={styles.cardText}>
                Max {community.max_number_current_bookings} current bookings
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addressContainer} onPress={openMaps}>
            <Feather name="map-pin" size={16} color="#6D28D9" />
            <Text style={styles.cardAddress} numberOfLines={2}>
              {community.address}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    height: 280, // Increased height to accommodate View Details button
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 15,
    height: '100%',
  },
  communityImage: {
    width: 120,
    height: 180,
    borderRadius: 10,
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardDetails: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#4B5563',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardAddress: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  viewDetailsButton: {
    backgroundColor: '#00A86B',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CommunityCard;