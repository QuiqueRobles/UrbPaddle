import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator, 
  TouchableWithoutFeedback,
  PanResponder,
  Animated as RNAnimated 
} from 'react-native';
import { Card, Title, Paragraph, Text, Avatar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from "../theme/colors";
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

type CommunityInfoProps = {
  communityId: string;
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
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_HEIGHT * 0.2;

export default function CommunityInfoCard({ communityId, onClose }: CommunityInfoProps) {
  const [communityInfo, setCommunityInfo] = useState<CommunityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  // Swipe to dismiss animation
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) {
          // Swipe down far enough, close the modal
          RNAnimated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          // Snap back to original position
          RNAnimated.spring(translateY, {
            toValue: 0,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    fetchCommunityInfo();
  }, [communityId]);

  const fetchCommunityInfo = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('community')
        .select('name, rules, resident_count, guest_count, court_number, booking_start_time, booking_end_time, booking_duration_options, default_booking_duration')
        .eq('id', communityId)
        .single();

      if (error) throw error;
      if (data) {
        setCommunityInfo({
          name: data.name,
          residentCount: data.resident_count,
          guestCount: data.guest_count,
          rules: data.rules || 'No rules specified',
          courtCount: data.court_number,
          bookingStartTime: data.booking_start_time,
          bookingEndTime: data.booking_end_time,
          bookingDurations: data.booking_duration_options || [],
          defaultBookingDuration: data.default_booking_duration,
        });
      }
    } catch (error) {
      console.error('Error fetching community info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View 
            style={styles.loadingContainer} 
            entering={FadeIn.duration(300)}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  if (!communityInfo) {
    return (
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View 
            style={styles.loadingContainer} 
            entering={FadeIn.duration(300)}
          >
            <Text>Unable to load community information</Text>
            <TouchableOpacity onPress={onClose} style={styles.errorCloseButton}>
              <Text>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <RNAnimated.View 
          style={[
            styles.container, 
            { 
              transform: [{ translateY: translateY }],
              // Optional: Add opacity to darken background when swiping down
              opacity: translateY.interpolate({
                inputRange: [0, SCREEN_HEIGHT * 0.5],
                outputRange: [1, 0.5],
                extrapolate: 'clamp'
              }) 
            }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={[colors.primary, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.View style={styles.headerContent} entering={FadeInUp.delay(150).duration(300)}>
                  <Avatar.Icon size={64} icon="home-group" style={styles.avatar} />
                  <Title style={styles.title}>{communityInfo.name}</Title>
                </Animated.View>
              </LinearGradient>
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                bounces={true} 
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
        <Card.Content style={styles.content}>
          <Animated.View style={styles.statsContainer} entering={FadeInUp.delay(300).duration(300)}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={32} color={colors.primary} />
              <Paragraph style={styles.statValue}>{communityInfo.residentCount}</Paragraph>
              <Paragraph style={styles.statLabel}>Residents</Paragraph>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-multiple" size={32} color={colors.accent} />
              <Paragraph style={styles.statValue}>{communityInfo.guestCount}</Paragraph>
              <Paragraph style={styles.statLabel}>Guests</Paragraph>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="tennis-ball" size={32} color={colors.warning} />
              <Paragraph style={styles.statValue}>{communityInfo.courtCount}</Paragraph>
              <Paragraph style={styles.statLabel}>Courts</Paragraph>
            </View>
          </Animated.View>
          
          <Animated.View entering={FadeInUp.delay(450).duration(300)}>
            <Title style={styles.sectionTitle}>Booking Information</Title>
            <View style={styles.bookingInfoContainer}>
              <View style={styles.bookingInfoItem}>
                <MaterialCommunityIcons name="clock-start" size={24} color={colors.primary} />
                <Text style={styles.bookingInfoText}>Start Time: {communityInfo.bookingStartTime}</Text>
              </View>
              <View style={styles.bookingInfoItem}>
                <MaterialCommunityIcons name="clock-end" size={24} color={colors.primary} />
                <Text style={styles.bookingInfoText}>End Time: {communityInfo.bookingEndTime}</Text>
              </View>
              {communityInfo.bookingDurations.length > 0 && (
                <View style={styles.bookingInfoItem}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
                  <Text style={styles.bookingInfoText}>
                    Durations: {communityInfo.bookingDurations.map(d => `${d}min`).join(', ')}
                  </Text>
                </View>
              )}
              <View style={styles.bookingInfoItem}>
                <MaterialCommunityIcons name="clock-check" size={24} color={colors.primary} />
                <Text style={styles.bookingInfoText}>
                  Default Duration: {communityInfo.defaultBookingDuration}min
                </Text>
              </View>
            </View>
          </Animated.View>
          
          <Animated.View entering={FadeInUp.delay(600).duration(300)}>
            <Title style={styles.sectionTitle}>Community Rules</Title>
            <View style={styles.rulesContainer}>
              <Text style={styles.ruleText}>{communityInfo.rules}</Text>
            </View>
          </Animated.View>
        </Card.Content>
     </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </RNAnimated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
  

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.9,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  errorCloseButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  headerGradient: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 50, // Añadir padding al final para mejor experiencia de scroll
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bookingInfoContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  bookingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingInfoText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1, // Permitir que el texto se expanda
  },
  rulesContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
  },
  ruleText: {
    fontSize: 16,
    lineHeight: 24,
  },
});