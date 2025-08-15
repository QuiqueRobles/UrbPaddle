'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format, parseISO, isBefore, subDays, isToday, isTomorrow, isAfter, isEqual } from 'date-fns';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type Booking = {
  id: string;
  court_number: number;
  date: string;
  start_time: string;
  end_time: string;
  user_id: string;
  status: string;
  has_match: boolean;
  booked_by_user_id?: string | null;
  booked_by_profile?: {
    full_name: string;
    username: string;
  } | null;
  booking_owner_profile?: {
    full_name: string;
    username: string;
  } | null;
};

type UserProfile = {
  resident_community_id: string;
  can_book: string[];
  group_owner_id: string | null;
  effectiveUserId: string;
  full_name: string;
  username: string;
};

export default function MyBookingsScreen() {
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGroupOwner, setIsGroupOwner] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        Alert.alert(t('error'), t('userNotFound'));
        return null;
      }

      setUserId(userData.user.id);

      // Get user profile to determine effective user ID
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("resident_community_id, can_book, group_owner_id, full_name, username")
        .eq("id", userData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return userData.user.id; // Fallback to current user
      }

      // Determine effective user ID (group owner or self)
      const effectiveUserId = profileData.group_owner_id || userData.user.id;
      const updatedProfile = { ...profileData, effectiveUserId };
      setUserProfile(updatedProfile);

      // Check if current user is a group owner (has people booking for them)
      const { data: groupMembers } = await supabase
        .from("profiles")
        .select("id")
        .eq("group_owner_id", userData.user.id)
        .limit(1);

      setIsGroupOwner(groupMembers && groupMembers.length > 0);

      return { effectiveUserId, currentUserId: userData.user.id };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }, [t]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    
    const result = await fetchUserProfile();
    if (!result) {
      setLoading(false);
      return;
    }

    const { effectiveUserId, currentUserId } = result;

    try {
      // Get current date and time for filtering
      const now = new Date();
      const nowISODate = now.toISOString().split("T")[0];
      const nowTime = now.toTimeString().slice(0, 5);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      // Build the query conditions based on user type
      let userConditions: string;
      
      if (isGroupOwner) {
        // Group owner: show bookings where user_id is them OR booked_by_user_id is someone in their group
        userConditions = `user_id.eq.${currentUserId}`;
      } else {
        // Regular user or group member: show their own bookings (booked_by_user_id = currentUserId)
        // OR bookings made on behalf of their group owner (user_id = effectiveUserId AND booked_by_user_id = currentUserId)
        if (effectiveUserId === currentUserId) {
          // Regular user without group
          userConditions = `user_id.eq.${currentUserId}`;
        } else {
          // Group member: show bookings they made on behalf of group owner
          userConditions = `and(user_id.eq.${effectiveUserId},booked_by_user_id.eq.${currentUserId})`;
        }
      }

      // ✅ FUTURE BOOKINGS
      const futureQuery = supabase
        .from("bookings")
        .select(`
          *,
          booked_by_profile:booked_by_user_id(full_name, username),
          booking_owner_profile:user_id(full_name, username)
        `)
        .or(userConditions)
        .or(
          `date.gt.${nowISODate},and(date.eq.${nowISODate},end_time.gt.${nowTime})`
        )
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      // ✅ PAST BOOKINGS
      const pastQuery = supabase
        .from("bookings")
        .select(`
          *,
          booked_by_profile:booked_by_user_id(full_name, username),
          booking_owner_profile:user_id(full_name, username)
        `)
        .or(userConditions)
        .or(
          `date.lt.${nowISODate},and(date.eq.${nowISODate},end_time.lte.${nowTime})`
        )
        .gte("date", thirtyDaysAgoStr)
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });

      const [futureResult, pastResult] = await Promise.all([
        futureQuery,
        pastQuery
      ]);

      if (futureResult.error || pastResult.error) {
        throw futureResult.error || pastResult.error;
      }

      // Get booking IDs for match checking
      const allBookings = [...(futureResult.data || []), ...(pastResult.data || [])];
      const bookingIds = allBookings.map(booking => booking.id);
      
      let matchesData = [];
      if (bookingIds.length > 0) {
        const { data: matchesResult, error: matchesError } = await supabase
          .from('matches')
          .select('booking_id')
          .in('booking_id', bookingIds);

        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
        } else {
          matchesData = matchesResult || [];
        }
      }

      const bookingsWithMatches = new Set(matchesData.map(match => match.booking_id));

      // Add match status to bookings
      const futureBookingsWithMatches = (futureResult.data || []).map(booking => ({
        ...booking,
        has_match: bookingsWithMatches.has(booking.id)
      }));

      const pastBookingsWithMatches = (pastResult.data || []).map(booking => ({
        ...booking,
        has_match: bookingsWithMatches.has(booking.id)
      }));

      setFutureBookings(futureBookingsWithMatches);
      setPastBookings(pastBookingsWithMatches);

    } catch (error) {
      console.error(t('errorFetchingBookings'), error);
      Alert.alert(t('error'), t('failedToFetchBookings'));
    } finally {
      setLoading(false);
    }
  }, [t, fetchUserProfile, isGroupOwner]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      t('cancelBooking'),
      t('cancelBookingConfirmation'),
      [
        { text: t('no'), style: "cancel" },
        { 
          text: t('yes'), 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!userProfile || !userId) {
                Alert.alert(t('error'), t('userNotFound'));
                return;
              }

              // Allow cancellation if:
              // 1. User is the booking owner (user_id matches)
              // 2. User is the one who made the booking (booked_by_user_id matches)
              const { data, error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId)
                .or(`user_id.eq.${userId},booked_by_user_id.eq.${userId}`)
                .select();

              if (error) {
                Alert.alert(t('error'), t('failedToCancelBooking'));
                console.error(t('errorCancellingBooking'), error);
              } else if (data && data.length > 0) {
                Alert.alert(t('success'), t('bookingCancelledSuccessfully'));
                fetchBookings();
              } else {
                Alert.alert(t('error'), t('bookingNotFoundOrNoPermission'));
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert(t('error'), t('failedToCancelBooking'));
            }
          }
        }
      ]
    );
  };

  const handleAddMatchResult = (booking: Booking) => {
    navigation.navigate('AddMatchResult', { bookingId: booking.id });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const getDateLabel = (date: string) => {
    const bookingDate = parseISO(date);
    if (isToday(bookingDate)) return t('today');
    if (isTomorrow(bookingDate)) return t('tomorrow');
    return format(bookingDate, t('dateFormat'));
  };

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'confirmed':
        return <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />;
      case 'cancelled':
        return <MaterialCommunityIcons name="close-circle" size={16} color="#f44336" />;
      case 'pending':
        return <MaterialCommunityIcons name="clock-outline" size={16} color="#FF9800" />;
      default:
        return <MaterialCommunityIcons name="alert-circle" size={16} color="#757575" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'cancelled':
        return '#f44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const renderBookingInfo = (item: Booking) => {
    const isOwnBooking = item.user_id === userId;
    const isBookedByMe = item.booked_by_user_id === userId;
    const bookerName = item.booked_by_profile?.full_name || item.booked_by_profile?.username || t('unknown');
    const ownerName = item.booking_owner_profile?.full_name || item.booking_owner_profile?.username || t('unknown');
    
    if (isGroupOwner && !isOwnBooking) {
      // Group owner viewing a booking made by a group member
      return (
        <View style={styles.bookingInfoContainer}>
          <MaterialCommunityIcons name="account" size={16} color={colors.primary} />
          <Paragraph style={styles.bookingInfoText}>
            {t('booked_by', { name: bookerName })}
          </Paragraph>
        </View>
      );
    } else if (!isOwnBooking && isBookedByMe) {
      // Group member viewing their booking made on behalf of group owner
      return (
        <View style={styles.bookingInfoContainer}>
          <MaterialCommunityIcons name="account-supervisor" size={16} color={colors.primary} />
          <Paragraph style={styles.bookingInfoText}>
            {t('booked_for', { name: ownerName })}
          </Paragraph>
        </View>
      );
    }
    
    return null;
  };

  const renderBookingItem = ({ item, isPast }: { item: Booking; isPast: boolean }) => {
    return (
      <Card style={[styles.card, isPast && styles.pastBooking]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="tennis" size={24} color={colors.primary} />
            <Title style={styles.courtTitle}>{t('court_number', { number: item.court_number })}</Title>
            <View style={styles.statusContainer}>
              {getStatusIcon(item.status)}
              <Paragraph style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Paragraph>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.dateTimeContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
              <Paragraph style={styles.dateTime}>{getDateLabel(item.date)}</Paragraph>
            </View>
            <View style={styles.dateTimeContainer}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
              <Paragraph style={styles.dateTime}>
                {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
              </Paragraph>
            </View>
          </View>

          {/* Show booking info (who booked for whom) */}
          {renderBookingInfo(item)}

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            {!isPast && item.status !== 'cancelled' && (
              <Button
                mode="contained"
                onPress={() => handleCancelBooking(item.id)}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonText}
                icon="cancel"
              >
                {t('cancelBooking')}
              </Button>
            )}
            
            {isPast && !item.has_match && item.status !== 'cancelled' && (
              <Button
                mode="contained"
                onPress={() => handleAddMatchResult(item)}
                style={styles.addResultButton}
                labelStyle={styles.addResultButtonText}
                icon="plus"
              >
                {t('addMatchResult')}
              </Button>
            )}

            {isPast && item.has_match && (
              <Chip 
                style={styles.matchAddedChip}
                textStyle={styles.chipText}
                icon="check"
              >
                {t('matchAdded')}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.primary, '#000']} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </LinearGradient>
    );
  }

  const allBookings = [...futureBookings, ...pastBookings];

  return (
    <LinearGradient colors={[colors.primary, "#000"]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Title style={styles.title}>{t('myBookings')}</Title>
          {loading && <ActivityIndicator size="small" color="#ffffff" />}
        </View>

        {/* Upcoming Bookings Counter */}
        {futureBookings.length > 0 && (
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#4CAF50" />
            <Title style={styles.sectionTitle}>
              {t('upcomingBookings')} ({futureBookings.length})
            </Title>
          </View>
        )}

        {/* Past Bookings Counter */}
        {pastBookings.length > 0 && futureBookings.length > 0 && (
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
            <Title style={styles.sectionTitle}>
              {t('pastBookings')} ({pastBookings.length})
            </Title>
          </View>
        )}
       
        {allBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#ffffff" />
            <Paragraph style={styles.noBookings}>{t('noBookingsMessage')}</Paragraph>
            <Button mode="contained" textColor='black' onPress={onRefresh} style={styles.refreshButton}>
              {t('refresh')}
            </Button>
          </View>
        ) : (
          <FlatList
            data={[
              ...futureBookings.map(booking => ({ ...booking, isPast: false })),
              ...pastBookings.map(booking => ({ ...booking, isPast: true }))
            ]}
            renderItem={({ item }) => renderBookingItem({ item, isPast: item.isPast })}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor="#ffffff"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courtTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardContent: {
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTime: {
    marginLeft: 8,
    fontSize: 16,
    color: '#555555',
  },
  bookingInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 107, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  bookingInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#00A86B',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  addResultButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  addResultButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  matchAddedChip: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingBottom: 200,
  },
  noBookings: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    color: '#ffffff',
  },
  refreshButton: {
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  pastBooking: {
    opacity: 0.85,
  },
});