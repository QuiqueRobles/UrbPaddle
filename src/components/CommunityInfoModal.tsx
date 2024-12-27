import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, ImageBackground, Dimensions, Animated, Image } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

type CommunityInfoModalProps = {
  communityId: string;
  isVisible: boolean;
  onClose: () => void;
};

type CommunityInfo = {
  name: string;
  residentCount: number;
  guestCount: number;
  rules: string;
  courtCount: number;
  bookingStartTime: string;
  bookingEndTime: string;
  bookingDurations: number[];
  defaultBookingDuration: number;
  image: string | null;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CommunityInfoModal({ communityId, isVisible, onClose }: CommunityInfoModalProps) {
  const { t } = useTranslation();
  const [communityInfo, setCommunityInfo] = useState<CommunityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isVisible) {
      fetchCommunityInfo();
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setImageLoaded(false);
      modalAnimation.setValue(0);
    }
  }, [isVisible, communityId]);

  const fetchCommunityInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('community')
        .select('name, rules, resident_count, guest_count, court_number, booking_start_time, booking_end_time, booking_duration_options, default_booking_duration, image')
        .eq('id', communityId)
        .single();

      if (error) throw error;
      if (data) {
        setCommunityInfo({
          name: data.name,
          residentCount: data.resident_count,
          guestCount: data.guest_count,
          rules: data.rules || t('noRulesSpecified'),
          courtCount: data.court_number,
          bookingStartTime: data.booking_start_time,
          bookingEndTime: data.booking_end_time,
          bookingDurations: data.booking_duration_options || [],
          defaultBookingDuration: data.default_booking_duration,
          image: data.image,
        });
        if (data.image) {
          Image.prefetch(data.image).then(() => setImageLoaded(true));
        } else {
          setImageLoaded(true);
        }
      }
    } catch (error) {
      console.error('Error fetching community info:', error);
      setError(t('errorFetchingCommunityInfo'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!communityInfo) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noCommunityInfoAvailable')}</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <StatItem icon="account-group" value={communityInfo.residentCount} label={t('residents')} color={colors.primary} />
            <StatItem icon="account-multiple" value={communityInfo.guestCount} label={t('guests')} color={colors.accent} />
            <StatItem icon="tennis-ball" value={communityInfo.courtCount} label={t('courts')} color={colors.warning} />
          </View>

          <Text style={styles.sectionTitle}>{t('bookingInformation')}</Text>
          <View style={styles.bookingInfoContainer}>
            <BookingInfoItem icon="clock-start" label={t('startTime')} value={communityInfo.bookingStartTime} />
            <BookingInfoItem icon="clock-end" label={t('endTime')} value={communityInfo.bookingEndTime} />
            {communityInfo.bookingDurations.length > 0 && (
              <BookingInfoItem
                icon="clock-outline"
                label={t('durations')}
                value={communityInfo.bookingDurations.map(d => t('minutesShort', { count: d })).join(', ')}
              />
            )}
            <BookingInfoItem
              icon="clock-check"
              label={t('defaultDuration')}
              value={t('minutesShort', { count: communityInfo.defaultBookingDuration })}
            />
          </View>

          <Text style={styles.sectionTitle}>{t('communityRules')}</Text>
          <View style={styles.rulesContainer}>
            <Text style={styles.ruleText}>{communityInfo.rules}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const handleClose = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setImageLoaded(false);
    });
  };

  const modalScale = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const modalOpacity = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ scale: modalScale }],
              opacity: modalOpacity,
            },
          ]}
        >
          {imageLoaded && communityInfo?.image ? (
            <ImageBackground
              source={{ uri: communityInfo.image }}
              style={styles.headerImage}
            >
              <View style={styles.headerOverlay}>
                <Text style={styles.title}>{communityInfo?.name || ''}</Text>
              </View>
            </ImageBackground>
          ) : (
            <View style={styles.headerImage}>
              <View style={styles.headerOverlay}>
                <Text style={styles.title}>{communityInfo?.name || ''}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
}

const StatItem = ({ icon, value, label, color }) => (
  <View style={styles.statItem}>
    <MaterialCommunityIcons name={icon} size={32} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const BookingInfoItem = ({ icon, label, value }) => (
  <View style={styles.bookingInfoItem}>
    <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
    <Text style={styles.bookingInfoText}>{label}: {value}</Text>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.8,
    overflow: 'hidden',
    minHeight: SCREEN_HEIGHT * 0.5,
    justifyContent: 'flex-start',
  },
  headerImage: {
    height: 150,
    justifyContent: 'flex-end',
    backgroundColor: colors.primary, // Fallback color while image is loading
  },
  headerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.error,
  },
  scrollView: {
    flexGrow: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.primary,
  },
  bookingInfoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bookingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingInfoText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  rulesContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ruleText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

