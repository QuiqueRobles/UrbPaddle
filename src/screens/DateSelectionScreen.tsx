import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Button, Title, Text, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { ArrowRight } from 'lucide-react-native';

type RootStackParamList = {
  DateSelection: { courtId: number };
  TimeSelection: { courtId: number; date: string };
};

type DateSelectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DateSelection'>;
type DateSelectionScreenRouteProp = RouteProp<RootStackParamList, 'DateSelection'>;

type Props = {
  navigation: DateSelectionScreenNavigationProp;
  route: DateSelectionScreenRouteProp;
};

export default function DateSelectionScreen({ navigation, route }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const theme = useTheme();
  const { courtId } = route.params;

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleContinue = () => {
    if (selectedDate) {
      navigation.navigate('TimeSelection', { courtId, date: selectedDate });
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={styles.title}>Selecciona una fecha</Title>
      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: colors.primary },
        }}
        minDate={today}
        theme={{
          todayTextColor: colors.secondary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.onPrimary,
        }}
        accessibilityLabel="Calendario para seleccionar fecha"
      />
      {selectedDate && (
        <Text style={styles.selectedDateText}>
          Fecha seleccionada: {selectedDate}
        </Text>
      )}
      <Button
        mode="contained"
        onPress={handleContinue}
        disabled={!selectedDate}
        style={[styles.button, { backgroundColor: colors.secondary }]}
        labelStyle={{ color: colors.onSecondary }}
        icon={() => <ArrowRight color={colors.onSecondary} />}
        accessibilityLabel="Continuar a selección de hora"
      >
        Continuar
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
    marginTop: 16,
  },
});