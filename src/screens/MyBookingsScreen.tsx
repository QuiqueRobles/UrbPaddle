import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format, parseISO, isBefore, subDays, isToday, isTomorrow } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

type Booking = {
  id: string;
  court_number: number;
  date: string;
  start_time: string;
  end_time: string;
  user_id: string;
  has_match: boolean;
};

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not found');
      setLoading(false);
      return;
    }

    const threeDaysAgo = subDays(new Date(), 3).toISOString().split('T')[0];

    try {
      // First, fetch all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', threeDaysAgo)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Then, fetch all matches for these bookings
      const bookingIds = bookingsData?.map(booking => booking.id) || [];
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('booking_id')
        .in('booking_id', bookingIds);

      if (matchesError) throw matchesError;

      // Create a Set of booking IDs that have matches for efficient lookup
      const bookingsWithMatches = new Set(matchesData?.map(match => match.booking_id));

      // Combine the data
      const bookingsWithMatchStatus = bookingsData?.map(booking => ({
        ...booking,
        has_match: bookingsWithMatches.has(booking.id)
      })) || [];

      setBookings(bookingsWithMatchStatus);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

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
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          style: 'destructive',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              Alert.alert('Error', 'User not found');
              return;
            }

            const { data, error } = await supabase
              .from('bookings')
              .delete()
              .eq('id', bookingId)
              .eq('user_id', user.id)
              .select();

            if (error) {
              Alert.alert('Error', 'Failed to cancel booking');
              console.error('Error cancelling booking:', error);
            } else if (data && data.length > 0) {
              Alert.alert('Success', 'Booking cancelled successfully');
              fetchBookings();
            } else {
              Alert.alert('Error', 'Booking not found or you do not have permission to cancel it');
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const getDateLabel = (date: string) => {
    const bookingDate = parseISO(date);
    if (isToday(bookingDate)) return 'Today';
    if (isTomorrow(bookingDate)) return 'Tomorrow';
    return format(bookingDate, 'EEEE, MMMM d, yyyy');
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const bookingDate = parseISO(`${item.date}T${item.start_time}`);
    const isPastBooking = isBefore(bookingDate, new Date());

    return (
      <Card style={[styles.card, isPastBooking && styles.pastBooking]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="tennis" size={24} color={colors.primary} />
            <Title style={styles.courtTitle}>Court {item.court_number}</Title>
            {isPastBooking && (
              <Chip 
                style={[
                  styles.statusChip, 
                  item.has_match ? styles.matchAddedChip : styles.pendingResultChip
                ]}
              >
                {item.has_match ? 'Match Added' : 'Pending Result'}
              </Chip>
            )}
          </View>
          <View style={styles.cardContent}>
            <View style={styles.dateTimeContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
              <Paragraph style={styles.dateTime}>{getDateLabel(item.date)}</Paragraph>
            </View>
            <View style={styles.dateTimeContainer}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
              <Paragraph style={styles.dateTime}>{item.start_time} - {item.end_time}</Paragraph>
            </View>
          </View>
          {!isPastBooking && (
            <Button
              mode="contained"
              onPress={() => handleCancelBooking(item.id)}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonText}
            >
              Cancel Booking
            </Button>
          )}
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

  return (
    <LinearGradient colors={[colors.primary, "#000"]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Title style={styles.title}>My Bookings</Title>
          {loading && <ActivityIndicator size="small" color="#ffffff" />}
        </View>
       
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#ffffff" />
            <Paragraph style={styles.noBookings}>You have no bookings in the last 3 days or upcoming.</Paragraph>
            <Button mode="contained" textColor='black' onPress={onRefresh} style={styles.refreshButton}>
              Refresh
            </Button>
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
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
    marginBottom: 16,
  },
  courtTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  cardContent: {
    marginBottom: 16,
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
  cancelButton: {
    marginTop: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
  },
  cancelButtonText: {
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
    paddingBottom:200,
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
    opacity: 0.8,
  },
  statusChip: {
    marginLeft: 'auto',
  },
  matchAddedChip: {
    backgroundColor: '#4CAF50',
  },
  pendingResultChip: {
    backgroundColor: '#FFA000',
  },
});