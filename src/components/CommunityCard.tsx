'use client';

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Platform, Linking } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Community } from '../screens/CommunityMapScreen';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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

  const getRelationshipBadge = () => {
    switch (community.user_relationship) {
      case 'resident':
        return (
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { backgroundColor: '#00C853', color: 'white' }]}>
              {t('resident')}
            </Text>
          </View>
        );
      case 'guest':
        return (
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { backgroundColor: '#2196F3', color: 'white' }]}>
              {t('guest')}
            </Text>
          </View>
        );
      default:
        return null;
    }
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
      <View style={styles.cardHeader}>
        <Image source={{ uri: community.image }} style={styles.communityImage} />
        <View style={styles.overlay}>
          <Text style={styles.cardTitle}>{community.name}</Text>
          {getRelationshipBadge()}
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardDetails}>
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>{t('communityStats')}</Text>
            <View style={styles.cardRow}>
              <Feather name="users" size={16} color="#00C853" />
              <Text style={styles.cardText}>
                {community.resident_count} {t('residents')}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="account-group" size={16} color="#00C853" />
              <Text style={styles.cardText}>
                {community.guest_count} {t('guests')}
              </Text>
            </View>
          </View>
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>{t('bookingInfo')}</Text>
            <View style={styles.cardRow}>
              <Feather name="clock" size={16} color="#00C853" />
              <Text style={styles.cardText}>
                {community.booking_start_time} - {community.booking_end_time}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="tennis" size={16} color="#00C853" />
              <Text style={styles.cardText}>
                {t('court')} {community.court_number}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Feather name="calendar" size={16} color="#00C853" />
              <Text style={styles.cardText}>
                {t('maxCurrentBookings')} {community.max_number_current_bookings}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.addressContainer} onPress={openMaps}>
          <Feather name="map-pin" size={16} color="#00C853" />
          <Text style={styles.cardAddress} numberOfLines={2}>
            {community.address}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
          <Text style={styles.viewDetailsText}>{t('viewDetails')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Los estilos permanecen iguales...
const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    height: 500,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 4,
  },
  cardHeader: {
    height: 140,
    position: 'relative',
  },
  communityImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
  },
  badge: {
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
    flex: 1,
  },
  cardDetails: {
    marginBottom: 16,
  },
  cardSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  cardAddress: {
    flex: 1,
    fontSize: 14,
    color: '#00C853',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  viewDetailsButton: {
    backgroundColor: '#00C853',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CommunityCard;