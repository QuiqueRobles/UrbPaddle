import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Title, Chip, useTheme, ActivityIndicator, Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { format, addMinutes, parseISO } from 'date-fns';

type RootStackParamList = {
  TimeSelection: { courtId: number; date: string };
  ConfirmBooking: { courtId: number; date: string; startTime: string; endTime: string };
};

type TimeSelectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TimeSelection'>;
type TimeSelectionScreenRouteProp = RouteProp<RootStackParamList, 'TimeSelection'>;

type Props = {
  navigation: TimeSelectionScreenNavigationProp;
  route: TimeSelectionScreenRouteProp;
};

const TIME_SLOTS = Array.from({ length: 30 }, (_, i) => 
  format(addMinutes(parseISO('2023-01-01T08:00:00'), i * 30), 'HH:mm')
).filter(time => time <= '23:00');

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '1 hora 30 min', value: 90 },
  { label: '2 horas', value: 120 },
];

export default function TimeSelectionScreen({ navigation, route }: Props) {
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const { courtId, date } = route.params;

  useEffect(() => {
    fetchBookedSlots();
  }, []);

  const fetchBookedSlots = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('court_number', courtId)
      .eq('date', date);

    if (error) {
      console.error('Error fetching booked slots:', error);
    } else {
      const bookedTimes = data.flatMap(booking => 
        TIME_SLOTS.filter(slot => 
          slot >= booking.start_time && slot < booking.end_time
        )
      );
      setBookedSlots(bookedTimes);
    }
    setLoading(false);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedStartTime(time);
  };

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
  };

  const isSlotAvailable = (startTime: string) => {
    const endTime = format(addMinutes(parseISO(`2023-01-01T${startTime}`), selectedDuration), 'HH:mm');
    const slots = TIME_SLOTS.filter(slot => slot >= startTime && slot < endTime);
    return !slots.some(slot => bookedSlots.includes(slot));
  };

  const handleContinue = () => {
    if (selectedStartTime) {
      const endTime = format(addMinutes(parseISO(`2023-01-01T${selectedStartTime}`), selectedDuration), 'HH:mm');
      navigation.navigate('ConfirmBooking', { courtId, date, startTime: selectedStartTime, endTime });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={styles.title}>Selecciona una hora de inicio</Title>
      <View style={styles.timeSlotContainer}>
        {TIME_SLOTS.map((time) => (
          <Chip
            key={time}
            selected={selectedStartTime === time}
            onPress={() => handleTimeSelect(time)}
            disabled={bookedSlots.includes(time) || !isSlotAvailable(time)}
            style={[
              styles.timeSlot,
              bookedSlots.includes(time) && styles.bookedSlot,
              selectedStartTime === time && styles.selectedSlot,
            ]}
            textStyle={selectedStartTime === time ? styles.selectedText : undefined}
          >
            {time}
          </Chip>
        ))}
      </View>
      <Title style={styles.title}>Selecciona la duración</Title>
      <View style={styles.durationContainer}>
        {DURATIONS.map((duration) => (
          <Chip
            key={duration.value}
            selected={selectedDuration === duration.value}
            onPress={() => handleDurationSelect(duration.value)}
            style={[
              styles.duration,
              selectedDuration === duration.value && styles.selectedDuration,
            ]}
            textStyle={selectedDuration === duration.value ? styles.selectedText : undefined}
          >
            {duration.label}
          </Chip>
        ))}
      </View>
      {selectedStartTime && (
        <Text style={styles.selectedTime}>
          Hora seleccionada: {selectedStartTime} - {format(addMinutes(parseISO(`2023-01-01T${selectedStartTime}`), selectedDuration), 'HH:mm')}
        </Text>
      )}
      <Button
        mode="contained"
        onPress={handleContinue}
        disabled={!selectedStartTime}
        style={[styles.button, { backgroundColor: colors.secondary }]}
        labelStyle={{ color: colors.onSecondary }}
      >
        Continuar
      </Button>
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
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timeSlot: {
    margin: 4,
  },
  bookedSlot: {
    backgroundColor: colors.error,
  },
  selectedSlot: {
    backgroundColor: colors.primary,
  },
  selectedText: {
    color: colors.onPrimary,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  duration: {
    marginHorizontal: 4,
  },
  selectedDuration: {
    backgroundColor: colors.primary,
  },
  selectedTime: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});