import React, { useRef, useMemo, useEffect,useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { UpdateModal } from './UpdateModal';
import { parse, format, addMinutes } from 'date-fns';

interface BookingSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  bookingStartTime: Date;
  setBookingStartTime: (date: Date) => void;
  bookingEndTime: Date;
  setBookingEndTime: (date: Date) => void;
  bookingDurations: number[];
  setBookingDurations: (durations: number[]) => void;
  defaultBookingDuration: number;
  setDefaultBookingDuration: (duration: number) => void;
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
}) => {
  const theme = useTheme();
  const startTimeScrollViewRef = useRef<ScrollView>(null);
  const endTimeScrollViewRef = useRef<ScrollView>(null);
  const [timeSlotWidth, setTimeSlotWidth] = useState(0);

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
              style={[
                styles.timeSlot,
                { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface }
              ]}
              onLayout={handleTimeSlotLayout}
            >
              <Text style={[styles.timeSlotText, { color: isSelected ? theme.colors.onPrimary : theme.colors.onSurface }]}>
                {time}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <UpdateModal
      visible={visible}
      onClose={onClose}
      title="Update Booking Settings"
      onUpdate={onUpdate}
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
            <TouchableOpacity
              key={duration}
              onPress={() => {
                if (bookingDurations.includes(duration)) {
                  setBookingDurations(bookingDurations.filter(d => d !== duration));
                } else {
                  setBookingDurations([...bookingDurations, duration].sort((a, b) => a - b));
                }
              }}
              style={[
                styles.durationButton,
                { backgroundColor: bookingDurations.includes(duration) ? theme.colors.primary : theme.colors.surface }
              ]}
            >
              <Text style={[
                styles.durationButtonText,
                { color: bookingDurations.includes(duration) ? theme.colors.onPrimary : theme.colors.onSurface }
              ]}>
                {duration >= 60 ? `${duration / 60}h` : `${duration}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Default Booking Duration:</Text>
        <View style={styles.durationContainer}>
          {[30, 60, 90, 120].map((duration) => (
            <TouchableOpacity
              key={duration}
              onPress={() => setDefaultBookingDuration(duration)}
              style={[
                styles.durationButton,
                { backgroundColor: defaultBookingDuration === duration ? theme.colors.primary : theme.colors.surface }
              ]}
            >
              <Text style={[
                styles.durationButtonText,
                { color: defaultBookingDuration === duration ? theme.colors.onPrimary : theme.colors.onSurface }
              ]}>
                {duration >= 60 ? `${duration / 60}h` : `${duration}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
  timeSlotText: {
    fontSize: 14,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  durationButton: {
    flex: 0.45,
    marginHorizontal: 4,
    marginVertical: 4,
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

