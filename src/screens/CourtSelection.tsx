import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Title, Card, Chip, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { NavigationProp, RouteProp } from '../navigation';
import { supabase } from '../lib/supabase';
import { format, addMinutes, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react-native';

type Props = {
  navigation: NavigationProp;
  route: RouteProp<'CourtSelection'>;
};

const TIME_SLOTS = Array.from({ length: 30 }, (_, i) => 
  format(addMinutes(parseISO('2023-01-01T08:00:00'), i * 30), 'HH:mm')
);

const DURATIONS = [
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '1.5h', value: 90 },
  { label: '2h', value: 120 },
];

export default function CourtSelectionScreen({ navigation, route }: Props) {
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const { date } = route.params;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', date);

    if (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Unable to load bookings. Please try again.');
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const isSlotAvailable = (courtId: number, time: string) => {
    const endTime = format(addMinutes(parseISO(`2023-01-01T${time}`), selectedDuration), 'HH:mm');
    return !bookings.some(booking => 
      booking.court_number === courtId &&
      ((time >= booking.start_time && time < booking.end_time) ||
       (endTime > booking.start_time && endTime <= booking.end_time) ||
       (time <= booking.start_time && endTime >= booking.end_time))
    );
  };

  const handleBooking = () => {
    if (selectedCourt && selectedTime) {
      const endTime = format(addMinutes(parseISO(`2023-01-01T${selectedTime}`), selectedDuration), 'HH:mm');
      navigation.navigate('ConfirmBooking', {
        courtId: selectedCourt,
        date: date,
        startTime: selectedTime,
        endTime: endTime,
      });
    }
  };

  const renderTimeSlots = (courtId: number) => {
    return TIME_SLOTS.map((time) => {
      const isAvailable = isSlotAvailable(courtId, time);
      const isSelected = selectedCourt === courtId && selectedTime === time;
      return (
        <Chip
          key={time}
          selected={isSelected}
          onPress={() => {
            if (isAvailable) {
              setSelectedCourt(courtId);
              setSelectedTime(time);
            } else {
              Alert.alert('Not Available', 'This time slot is already booked.');
            }
          }}
          style={[
            styles.timeChip,
            !isAvailable && styles.unavailableChip,
            isSelected && styles.selectedChip
          ]}
          textStyle={[
            styles.chipText,
            !isAvailable && styles.unavailableChipText,
            isSelected && styles.selectedChipText
          ]}
          disabled={!isAvailable}
        >
          {time}
        </Chip>
      );
    });
  };

  const renderCourtCard = (courtId: number) => (
    <Card key={courtId} style={styles.courtCard}>
      <Card.Content>
        <Title style={styles.courtTitle}>Court {courtId}</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTimeSlots(courtId)}
        </ScrollView>
      </Card.Content>
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Title style={styles.title}>Book a Court</Title>
        <View style={styles.dateContainer}>
          <Calendar size={24} color={theme.colors.primary} />
          <Text style={styles.dateText}>{format(parseISO(date), 'MMMM d, yyyy')}</Text>
        </View>
      </View>
      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>Duration:</Text>
        <View style={styles.durationButtons}>
          {DURATIONS.map((duration) => (
            <Chip
              key={duration.value}
              selected={selectedDuration === duration.value}
              onPress={() => setSelectedDuration(duration.value)}
              style={[
                styles.durationChip,
                selectedDuration === duration.value && styles.selectedDurationChip
              ]}
              textStyle={[
                styles.durationChipText,
                selectedDuration === duration.value && styles.selectedDurationChipText
              ]}
            >
              {duration.label}
            </Chip>
          ))}
        </View>
      </View>
      {renderCourtCard(1)}
      {renderCourtCard(2)}
      <Button
        mode="contained"
        onPress={handleBooking}
        disabled={!selectedCourt || !selectedTime}
        style={styles.bookButton}
        labelStyle={styles.buttonLabel}
        icon="check"
      >
        Confirm Booking
      </Button>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
          <Text>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.error }]} />
          <Text>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.selectedChip]} />
          <Text>Selected</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 18,
    marginLeft: 8,
  },
  durationContainer: {
    marginBottom: 24,
  },
  durationLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationChip: {
    flex: 1,
    marginHorizontal: 4,
  },
  selectedDurationChip: {
    backgroundColor: '#4caf50',
  },
  durationChipText: {
    textAlign: 'center',
  },
  selectedDurationChipText: {
    color: '#ffffff',
  },
  courtCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 12,
  },
  courtTitle: {
    fontSize: 22,
    marginBottom: 12,
  },
  timeChip: {
    margin: 4,
    backgroundColor: '#e0e0e0',
  },
  unavailableChip: {
    backgroundColor: '#ffcccb',
  },
  selectedChip: {
    backgroundColor: '#4caf50',
  },
  chipText: {
    color: '#000000',
  },
  unavailableChipText: {
    color: '#d32f2f',
  },
  selectedChipText: {
    color: '#ffffff',
  },
  bookButton: {
    marginTop: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 18,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
  },
});