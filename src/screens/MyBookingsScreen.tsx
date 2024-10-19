import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

type Booking = {
  id: string;
  court_number: number;
  date: string;
  start_time: string;
  end_time: string;
};

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not found');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      Alert.alert('Error', 'Failed to fetch bookings');
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
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
        { text: "Yes", onPress: async () => {
          const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);

          if (error) {
            Alert.alert('Error', 'Failed to cancel booking');
            console.error('Error cancelling booking:', error);
          } else {
            Alert.alert('Success', 'Booking cancelled successfully');
            fetchBookings();
          }
        }}
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Court {item.court_number}</Title>
        <Paragraph>Date: {format(parseISO(item.date), 'MMMM d, yyyy')}</Paragraph>
        <Paragraph>Time: {item.start_time} - {item.end_time}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button 
          onPress={() => handleCancelBooking(item.id)}
          color={theme.colors.error}
        >
          Cancel Booking
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.title}>My Bookings</Title>
      {bookings.length === 0 ? (
        <Paragraph style={styles.noBookings}>You have no bookings yet.</Paragraph>
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
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  noBookings: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});