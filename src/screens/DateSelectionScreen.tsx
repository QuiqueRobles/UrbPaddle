import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Button, Title, Text, useTheme } from 'react-native-paper';
import { NavigationProp } from '../navigation';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NavigationProp;
};

export default function DateSelectionScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const { colors } = useTheme();
  const { t } = useTranslation();

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
    <LinearGradient colors={['#00A86B', '#000', '#000']} style={styles.container} locations={[0, 0.7, 1]}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.calendarContainer}>
          <View style={styles.titleContainer}>
            <CalendarIcon size={28} color="#fff" />
            <Title style={styles.title}>{t('selectDate')}</Title>
          </View>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: '#00C853' },
            }}
            minDate={today}
            maxDate={maxDateString}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#ffffff',
              selectedDayBackgroundColor: '#00A86B',
              selectedDayTextColor: '#ffffff',
              todayTextColor: 'rgb(134, 252, 31)',
              dayTextColor: '#ffffff',
              textDisabledColor: 'rgba(255, 255, 255, 0.3)',
              dotColor: '#00C853',
              monthTextColor: '#ffffff',
              textMonthFontWeight: 'bold',
              arrowColor: '#ffffff',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            accessibilityLabel={t('calendarAccessibilityLabel')}
          />
        </View>
        
        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateLabel}>{t('selectedDate')}</Text>
            <Text style={styles.selectedDateText}>
              {format(new Date(selectedDate), t('dateFormat'))}
            </Text>
          </View>
        )}
        
        <LinearGradient
          colors={['#00A86B', '#00C853']}
          style={[styles.button, !selectedDate && styles.disabledButton]}
        >
          <Button
            onPress={handleContinue}
            disabled={!selectedDate}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon={({ size, color }) => (
              <ArrowRight size={size} color={color} style={styles.buttonIcon} />
            )}
            accessibilityLabel={t('continueToCourtSelectionAccessibilityLabel')}
            accessibilityState={{ disabled: !selectedDate }}
          >
            {t('continueToCourtSelection')}
          </Button>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  calendarContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#ffffff',
  },
  selectedDateContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedDateLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
  },
  buttonContent: {
    height: 56,
    flexDirection: 'row-reverse',
    backgroundColor: 'transparent',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#ffffff',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

