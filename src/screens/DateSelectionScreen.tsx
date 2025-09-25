import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Button, Title, Text, useTheme } from 'react-native-paper';
import { NavigationProp } from '../navigation';
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, isBefore, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { es, enUS } from 'date-fns/locale';
import { colors } from '../theme/colors';
import * as Animatable from 'react-native-animatable';
import { supabase } from '../lib/supabase';

type Props = {
  navigation: NavigationProp;
};

export default function DateSelectionScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const [isResidentOrGroupMember, setIsResidentOrGroupMember] = useState<boolean | null>(null);
  const { colors: themeColors } = useTheme();
  const { t, i18n } = useTranslation();

  // Check if user is a resident or part of a resident group
  useEffect(() => {
    async function checkResidencyOrGroup() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert(
            t('error') || 'Error',
            t('notLoggedIn') || 'You must be logged in to access this feature.',
            [{ text: t('ok') || 'OK', onPress: () => navigation.navigate('Login') }]
          );
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('resident_community_id, group_owner_id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          Alert.alert(t('error') || 'Error', t('genericError') || 'An error occurred');
          setIsResidentOrGroupMember(false);
          return;
        }

        setIsResidentOrGroupMember(!!data?.resident_community_id || !!data?.group_owner_id);
      } catch (error: any) {
        console.error('Residency/Group check error:', error);
        Alert.alert(t('error') || 'Error', t('genericError') || 'An error occurred');
        setIsResidentOrGroupMember(false);
      }
    }

    checkResidencyOrGroup();
  }, [t, navigation]);

  // Configure calendar locale
  React.useEffect(() => {
    const currentLocale = i18n.language === 'es' ? es : enUS;
    const firstDay = i18n.language === 'es' ? 1 : 0; // Monday for Spanish, Sunday for English

    LocaleConfig.locales[i18n.language] = {
      monthNames: Array.from({ length: 12 }, (_, i) =>
        format(new Date(2021, i, 1), 'MMMM', { locale: currentLocale })
      ),
      monthNamesShort: Array.from({ length: 12 }, (_, i) =>
        format(new Date(2021, i, 1), 'MMM', { locale: currentLocale })
      ),
      dayNames: Array.from({ length: 7 }, (_, i) =>
        format(new Date(2021, 0, i + (i18n.language === 'es' ? 4 : 3)), 'EEEE', { locale: currentLocale })
      ),
      dayNamesShort: Array.from({ length: 7 }, (_, i) =>
        format(new Date(2021, 0, i + (i18n.language === 'es' ? 4 : 3)), 'EEEEEE', { locale: currentLocale })
      ),
    };
    LocaleConfig.defaultLocale = i18n.language;
  }, [i18n.language]);

  useFocusEffect(
    useCallback(() => {
      setSelectedDate('');
    }, [])
  );

  const handleDateSelect = (day: DateData) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (isBefore(parseISO(day.dateString), parseISO(today))) {
      Alert.alert(
        t('pastDateError') || 'Invalid Date',
        t('pastDateMessage') || 'You cannot select a past date for booking.',
        [{ text: t('ok') || 'OK' }]
      );
      setSelectedDate('');
      return;
    }
    
    setSelectedDate(day.dateString);
  };

  const handleContinue = () => {
    if (selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      
      if (isBefore(parseISO(selectedDate), parseISO(today))) {
        Alert.alert(
          t('pastDateError') || 'Invalid Date',
          t('pastDateMessage') || 'You cannot select a past date for booking.',
          [{ text: t('ok') || 'OK' }]
        );
        setSelectedDate('');
        return;
      }
      
      navigation.navigate('CourtSelection', { date: selectedDate });
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  if (isResidentOrGroupMember === null) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!isResidentOrGroupMember) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
          <ScrollView 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animatable.View animation="fadeInUp" duration={800} style={styles.messageContainer}>
              <Text style={styles.messageTitle}>
                {t('residentRequired') || 'Resident Access Required'}
              </Text>
              <Text style={styles.messageText}>
                {t('residentRequiredMessage') || 'You must be a resident of a community or part of a resident group to access this feature.'}
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })} 
                style={styles.profileButton}
              >
                <LinearGradient
                  colors={['#00A86B', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.profileButtonText}>
                    {t('goToProfile') || 'Go to Profile'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animatable.View animation="fadeInDown" duration={800} style={styles.calendarContainer}>
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
              firstDay={i18n.language === 'es' ? 1 : 0} // Monday for Spanish, Sunday for English
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: 'rgba(255, 255, 255, 0.8)',
                selectedDayBackgroundColor: '#00A86B',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#86FC1F',
                dayTextColor: '#ffffff',
                textDisabledColor: 'rgba(255, 255, 255, 0.3)',
                dotColor: '#00C853',
                monthTextColor: '#ffffff',
                textMonthFontWeight: '600',
                arrowColor: '#ffffff',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              accessibilityLabel={t('calendarAccessibilityLabel')}
            />
          </Animatable.View>
          
          {selectedDate && (
            <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateLabel}>{t('selectedDate')}</Text>
              <Text style={styles.selectedDateText}>
                {format(new Date(selectedDate), t('dateFormat') || 'MMMM d, yyyy', { locale: i18n.language === 'es' ? es : enUS })}
              </Text>
            </Animatable.View>
          )}
          
          <Animatable.View animation="fadeInUp" duration={800} delay={400}>
            <LinearGradient
              colors={['#00A86B', '#00C853']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: -100,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 2,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxWidth: 400,
    alignSelf: 'center',
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  profileButton: {
    width: '100%',
    borderRadius: 12,
    
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 16,
    padding: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  calendarContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 2,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedDateContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 2,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  selectedDateLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00C853',
    textAlign: 'center',
  },
  button: {
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    height: 56,
    flexDirection: 'row-reverse',
    backgroundColor: 'transparent',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#ffffff',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
});