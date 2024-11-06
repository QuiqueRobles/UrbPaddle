import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Button, Title, Text, useTheme } from 'react-native-paper';
import { NavigationProp } from '../navigation';
import { ArrowRight } from 'lucide-react-native';

type Props = {
  navigation: NavigationProp;
};

export default function DateSelectionScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const theme = useTheme();

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleContinue = () => {
    if (selectedDate) {
      navigation.navigate('CourtSelection', { date: selectedDate });
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <Title style={styles.title}>Select a Date</Title>
      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: theme.colors.primary },
        }}
        minDate={today}
        theme={{
          todayTextColor: theme.colors.secondary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.surface,
        }}
        accessibilityLabel="Calendar for selecting date"
      />
      {selectedDate && (
        <Text style={styles.selectedDateText}>
          Selected date: {selectedDate}
        </Text>
      )}
      <Button
        mode="contained"
        onPress={handleContinue}
        disabled={!selectedDate}
        style={styles.button}
        labelStyle={styles.buttonLabel}
        icon={() => <ArrowRight color={theme.colors.surface} />}
        accessibilityLabel="Continue to court selection"
      >
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 18,
  },
});