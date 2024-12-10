import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Button, Title, Text, useTheme, Surface } from 'react-native-paper';
import { NavigationProp } from '../navigation';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

type Props = {
  navigation: NavigationProp;
};

export default function DateSelectionScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      setSelectedDate('');
    }, [])
  );

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleContinue = () => {
    if (selectedDate) {
      navigation.navigate('CourtSelection', { date: selectedDate });
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Surface style={styles.calendarContainer} elevation={2}>
        <View style={styles.titleContainer}>
          <CalendarIcon size={28} color={colors.primary} />
          <Title style={styles.title}>Select a Date</Title>
        </View>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: colors.primary },
          }}
          minDate={today}
          maxDate={maxDateString}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#555555',
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#4A90E2',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#4A90E2',
            monthTextColor: '#000000',
            textMonthFontWeight: 'bold',
            arrowColor: colors.primary,
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          accessibilityLabel="Calendar for selecting date"
        />
      </Surface>
      
      {selectedDate && (
        <Surface style={styles.selectedDateContainer} elevation={2}>
          <Text style={styles.selectedDateLabel}>Selected Date</Text>
          <Text style={styles.selectedDateText}>
            {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
          </Text>
        </Surface>
      )}
      
      <Button
        mode="contained"
        onPress={handleContinue}
        disabled={!selectedDate}
        style={[
          styles.button,
          { backgroundColor: selectedDate ? colors.primary : '#E0E0E0' }
        ]}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        icon={({ size, color }) => (
          <ArrowRight size={size} color={color} style={styles.buttonIcon} />
        )}
        accessibilityLabel="Continue to court selection"
        accessibilityState={{ disabled: !selectedDate }}
      >
        Continue to Court Selection
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  calendarContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#000000',
  },
  selectedDateContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedDateLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    elevation: 2,
    marginTop: 16,
    backgroundColor:'black'
  },
  buttonContent: {
    height: 56,
    flexDirection: 'row-reverse', // Icon on the right side
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

