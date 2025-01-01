import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Community } from '../screens/CommunityMapScreen';

interface CommunityCardProps {
  community: Community;
  onViewDetails: () => void;
  onClose: () => void;
  panResponder: any;
  translateY: Animated.Value;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ 
  community, 
  onViewDetails, 
  onClose, 
  panResponder, 
  translateY 
}) => (
  <Animated.View 
    style={[
      styles.cardContainer, 
      { transform: [{ translateY }] }
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
            <Feather name="clock" size={16} color="#10B981" />
            <Text style={styles.cardText}>{community.booking_start_time} - {community.booking_end_time}</Text>
          </View>
        </View>
        <Text style={styles.cardAddress} numberOfLines={1}>{community.address}</Text>
      </View>
    </View>
    
  </Animated.View>
);

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    height: 200,
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
  },
  communityImage: {
    width: 100,
    height: 100,
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
    marginBottom: 4,
  },
  cardText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4B5563',
  },
  cardAddress: {
    fontSize: 12,
    color: '#4B5563',
  },
  viewDetailsButton: {
    backgroundColor: '#6D28D9',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CommunityCard;

