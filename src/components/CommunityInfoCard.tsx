import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
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

export default function CommunityInfoCard({ communityId, onClose }: CommunityInfoProps) {
  const [communityInfo, setCommunityInfo] = useState<CommunityInfo | null>(null);
  const theme = useTheme();

  useEffect(() => {
    fetchCommunityInfo();
  }, [communityId]);

  const fetchCommunityInfo = async () => {
    try {
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
          rules: data.rules || '',
          courtCount: data.court_number,
          bookingStartTime: data.booking_start_time,
          bookingEndTime: data.booking_end_time,
          bookingDurations: data.booking_duration_options,
          defaultBookingDuration: data.default_booking_duration,
        });
      }
    } catch (error) {
      console.error('Error fetching community info:', error);
    }
  };

  if (!communityInfo) {
    return null;
  }

  return (
    <Animated.View 
      style={styles.container} 
      entering={FadeIn.duration(300)}
    >
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
              <View style={styles.bookingInfoItem}>
                <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
                <Text style={styles.bookingInfoText}>
                  Durations: {communityInfo.bookingDurations.map(d => `${d}min`).join(', ')}
                </Text>
              </View>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
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

