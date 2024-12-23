import React, { useRef, useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { UpdateModal } from './UpdateModal';
import { parse, format, addMinutes } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BookingSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (maxBookings: number) => void;
  bookingStartTime: Date;
  setBookingStartTime: (date: Date) => void;
  bookingEndTime: Date;
  setBookingEndTime: (date: Date) => void;
  bookingDurations: number[];
  setBookingDurations: (durations: number[]) => void;
  defaultBookingDuration: number;
  setDefaultBookingDuration: (duration: number) => void;
  maxNumberCurrentBookings: number;
  simultaneousBookings: boolean;
  setSimultaneousBookings: (value: boolean) => void;
}

export const BookingSettingsModal: React.FC<BookingSettingsModalProps> = ({
  visible,
  onClose,
  onUpdate,
  bookingStartTime,
  setBookingStartTime,
  bookingEndTime,
  setBookingEndTime,
  bookingDurations,
  setBookingDurations,
  defaultBookingDuration,
  setDefaultBookingDuration,
  maxNumberCurrentBookings,
  simultaneousBookings,
  setSimultaneousBookings,
}) => {
  const theme = useTheme();
  const startTimeScrollViewRef = useRef<ScrollView>(null);
  const endTimeScrollViewRef = useRef<ScrollView>(null);
  const [timeSlotWidth, setTimeSlotWidth] = useState(0);
  const [maxBookings, setMaxBookings] = useState(maxNumberCurrentBookings);

  useEffect(() => {
    setMaxBookings(maxNumberCurrentBookings);
  }, [maxNumberCurrentBookings]);

  useEffect(() => {
    // This ensures the local state is updated when the prop changes
    setSimultaneousBookings(simultaneousBookings);
  }, [simultaneousBookings]);

  const generateTimeSlots = useMemo(() => {
    const startTime = parse('00:00', 'HH:mm', new Date());
    const endTime = parse('23:30', 'HH:mm', new Date());
    const slots = [];
    let currentTime = startTime;

    while (currentTime <= endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const scrollToTime = (scrollViewRef: React.RefObject<ScrollView>, time: Date) => {
    const formattedTime = formatTime(time);
    const index = generateTimeSlots.findIndex(slot => slot === formattedTime);
    if (index !== -1 && scrollViewRef.current && timeSlotWidth > 0) {
      const scrollPosition = index * timeSlotWidth;
      scrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
    }
  };

  useEffect(() => {
    if (visible && timeSlotWidth > 0) {
      scrollToTime(startTimeScrollViewRef, bookingStartTime);
      scrollToTime(endTimeScrollViewRef, bookingEndTime);
    }
  }, [visible, bookingStartTime, bookingEndTime, timeSlotWidth]);

  const handleTimeSlotLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTimeSlotWidth(width);
  };

  const TimeSelector = ({ label, selectedTime, setSelectedTime, scrollViewRef }) => (
    <View style={styles.timeSelectorContainer}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.timePickerContainer}
        contentContainerStyle={styles.timePickerContentContainer}
      >
        {generateTimeSlots.map((time) => {
          const isSelected = formatTime(selectedTime) === time;
          return (
            <TouchableOpacity
              key={time}
              onPress={() => {
                const [hours, minutes] = time.split(':');
                const newDate = new Date(selectedTime);
                newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                setSelectedTime(newDate);
                scrollToTime(scrollViewRef, newDate);
              }}
              onLayout={handleTimeSlotLayout}
            >
              <LinearGradient
                colors={isSelected ? ['#00A86B', '#00C853'] : ['#f0f0f0', '#e0e0e0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
              >
                <Text style={[styles.timeSlotText, { color: isSelected ? 'white' : theme.colors.onSurface }]}>
                  {time}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const GradientButton = ({ onPress, isSelected, children }) => (
    <TouchableOpacity onPress={onPress} style={styles.gradientButtonContainer}>
      <LinearGradient
        colors={isSelected ? ['#00A86B', '#00C853'] : ['#f0f0f0', '#e0e0e0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientButton, isSelected && styles.selectedGradientButton]}
      >
        <Text style={[styles.gradientButtonText, { color: isSelected ? 'white' : theme.colors.onSurface }]}>
          {children}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const NumberInput = ({ value, onChange, label }) => (
    <View style={styles.numberInputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.numberInputControls}>
        <TouchableOpacity onPress={() => onChange(Math.max(1, value - 1))}>
          <LinearGradient
            colors={['#00A86B', '#00C853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.numberInputButton}
          >
            <MaterialCommunityIcons name="minus" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.numberInputValue}>{value}</Text>
        <TouchableOpacity onPress={() => onChange(value + 1)}>
          <LinearGradient
            colors={['#00A86B', '#00C853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.numberInputButton}
          >
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ToggleSwitch = ({ label, value, onToggle }) => (
    <View style={styles.toggleContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onToggle} style={styles.toggleTouchable}>
        <LinearGradient
          colors={value ? ['#00A86B', '#00C853'] : ['#f0f0f0', '#e0e0e0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.toggleSwitch}
        >
          <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <UpdateModal
      visible={visible}
      onClose={onClose}
      title="Update Booking Settings"
      onUpdate={() => onUpdate(maxBookings)}
    >
      <ScrollView style={styles.container}>
        <TimeSelector
          label="Booking Start Time:"
          selectedTime={bookingStartTime}
          setSelectedTime={setBookingStartTime}
          scrollViewRef={startTimeScrollViewRef}
        />

        <TimeSelector
          label="Booking End Time:"
          selectedTime={bookingEndTime}
          setSelectedTime={setBookingEndTime}
          scrollViewRef={endTimeScrollViewRef}
        />

        <Text style={styles.label}>Booking Durations:</Text>
        <View style={styles.durationContainer}>
          {[30, 60, 90, 120].map((duration) => (
            <GradientButton
              key={duration}
              onPress={() => {
                if (bookingDurations.includes(duration)) {
                  setBookingDurations(bookingDurations.filter(d => d !== duration));
                } else {
                  setBookingDurations([...bookingDurations, duration].sort((a, b) => a - b));
                }
              }}
              isSelected={bookingDurations.includes(duration)}
            >
              {duration >= 60 ? `${duration / 60}h` : `${duration}m`}
            </GradientButton>
          ))}
        </View>

        <Text style={styles.label}>Default Booking Duration:</Text>
        <View style={styles.durationContainer}>
          {[30, 60, 90, 120].map((duration) => (
            <GradientButton
              key={duration}
              onPress={() => setDefaultBookingDuration(duration)}
              isSelected={defaultBookingDuration === duration}
            >
              {duration >= 60 ? `${duration / 60}h` : `${duration}m`}
            </GradientButton>
          ))}
        </View>

        <NumberInput
          label="Max Number of Current Bookings:"
          value={maxBookings}
          onChange={setMaxBookings}
        />
        <ToggleSwitch
          label="Allow Simultaneous Bookings:"
          value={simultaneousBookings}
          onToggle={() => setSimultaneousBookings(prev => !prev)}
        />
      </ScrollView>
    </UpdateModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeSelectorContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  timePickerContainer: {
    flexDirection: 'row',
  },
  timePickerContentContainer: {
    paddingHorizontal: 8,
  },
  timeSlot: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 62,
  },
  selectedTimeSlot: {
    elevation: 2,
  },
  timeSlotText: {
    fontSize: 14,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  gradientButtonContainer: {
    flex: 0.45,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  gradientButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedGradientButton: {
    elevation: 2,
  },
  gradientButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  numberInputContainer: {
    marginBottom: 16,
  },
  numberInputControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberInputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  numberInputValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleTouchable: {
    padding: 5, // Add padding to increase touch area
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    elevation: 2,
    alignSelf: 'flex-start',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
});