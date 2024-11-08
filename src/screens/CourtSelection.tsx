import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Title, Card, Chip, Button, Text, useTheme, ActivityIndicator, HelperText } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { format, addMinutes, parseISO, parse, isBefore } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  CourtSelection: { date: string };
  ConfirmBooking: { courtId: number; date: string; startTime: string; endTime: string };
};

type Props = {
  navigation: NavigationProp<RootStackParamList, 'CourtSelection'>;
  route: RouteProp<RootStackParamList, 'CourtSelection'>;
};

type Booking = {
  id: string;
  court_number: number;
  date: string;
  start_time: string;
  end_time: string;
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const { date } = route.params;

  const gradientStart = '#00A86B';
  const gradientEnd = '#000000';

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

  const getSlotStatus = (courtId: number, time: string) => {
    const slotStart = parse(time, 'HH:mm', new Date());
    const slotEnd = addMinutes(slotStart, selectedDuration);

    const conflictingBooking = bookings.find(booking => {
      const bookingStart = parse(booking.start_time, 'HH:mm:ss', new Date());
      const bookingEnd = parse(booking.end_time, 'HH:mm:ss', new Date());

      return (
        booking.court_number === courtId &&
        (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        )
      );
    });

    if (conflictingBooking) {
      const bookingStart = parse(conflictingBooking.start_time, 'HH:mm:ss', new Date());

      if (isBefore(slotStart, bookingStart)) {
        return 'interferes';
      } else {
        return 'unavailable';
      }
    }

    return 'available';
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
      const slotStatus = getSlotStatus(courtId, time);
      const isAvailable = slotStatus === 'available';
      const isSelected = selectedCourt === courtId && selectedTime === time;

      let chipStyle = {
        ...styles.timeChip,
        backgroundColor: isAvailable ? (isSelected ? '#28A745' : 'rgba(255, 255, 255, 0.2)') : 'rgba(255, 0, 0, 0.5)',
      };
      let chipTextStyle = {
        ...styles.chipText,
        color: isAvailable ? (isSelected ? '#000' : '#fff') : '#fff',
      };

      return (
        <Chip
          key={time}
          selected={isSelected}
          onPress={() => {
            if (isAvailable) {
              setSelectedCourt(courtId);
              setSelectedTime(time);
            }
          }}
          style={chipStyle}
          textStyle={chipTextStyle}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotContainer}>
          {renderTimeSlots(courtId)}
        </ScrollView>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <LinearGradient colors={[gradientStart, gradientEnd]} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[gradientStart, gradientEnd]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Title style={styles.title}>Book a Court</Title>
          <View style={styles.dateContainer}>
            <Calendar size={24} color="#fff" />
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
                  selectedDuration === duration.value && { backgroundColor: '#28A745' }
                ]}
                textStyle={[
                  styles.durationChipText,
                  selectedDuration === duration.value && { color: '#000' }
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
            <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 0, 0, 0.5)' }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: gradientStart }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>
        <HelperText type="info" style={styles.helperText}>
          Tap on an available time slot to select it. Unavailable slots cannot be selected.
        </HelperText>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
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
    color: '#fff',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 18,
    marginLeft: 8,
    color: '#fff',
  },
  durationContainer: {
    marginBottom: 24,
  },
  durationLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationChip: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  durationChipText: {
    textAlign: 'center',
    color: '#fff',
  },
  courtCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  courtTitle: {
    fontSize: 22,
    marginBottom: 12,
    color: '#fff',
  },
  timeSlotContainer: {
    paddingVertical: 8,
  },
  timeChip: {
    margin: 4,
  },
  chipText: {
    fontSize: 14,
  },
  bookButton: {
    marginTop: 24,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  buttonLabel: {
    fontSize: 18,
    color: '#008C59',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  legendText: {
    color: '#fff',
  },
  helperText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#fff',
  },
});