import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, Linking } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Button, Title, Text, useTheme,ActivityIndicator } from 'react-native-paper';
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
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  navigation: NavigationProp;
};

export default function DateSelectionScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const [isResidentOrGroupMember, setIsResidentOrGroupMember] = useState<boolean | null>(null);
  const [hasValidSubscription, setHasValidSubscription] = useState<boolean | null>(null);
  const { colors: themeColors } = useTheme();
  const { t, i18n } = useTranslation();

  // Check if user is a resident or part of a resident group and verify subscription status
  useEffect(() => {
    async function checkResidencyAndSubscription() {
      console.log('Starting residency and subscription check');
      try {
        console.log('Fetching user from Supabase');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('User fetch result:', user ? 'User found' : 'No user');
        if (!user) {
          console.log('User not logged in, showing alert');
          Alert.alert(
            t('error') || 'Error',
            t('notLoggedIn') || 'You must be logged in to access this feature.',
            [{ text: t('ok') || 'OK', onPress: () => navigation.navigate('Login') }]
          );
          return;
        }

        console.log('Fetching profile for user ID:', user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('resident_community_id, group_owner_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          console.log('Profile fetch error:', profileError.message);
          Alert.alert(t('error') || 'Error', t('genericError') || 'An error occurred');
          setIsResidentOrGroupMember(false);
          setHasValidSubscription(false);
          return;
        }
        console.log('Profile fetched:', profile);

        const isResidentOrGroup = !!profile?.resident_community_id || !!profile?.group_owner_id;
        console.log('Is resident or group member:', isResidentOrGroup);
        setIsResidentOrGroupMember(isResidentOrGroup);

        if (isResidentOrGroup && profile?.resident_community_id) {
          console.log('Fetching community data for ID:', profile.resident_community_id);
          const { data: community, error: communityError } = await supabase
            .from('community')
            .select('stripe_subscription_id, stripe_payment_status, one_time_valid_until, product_type')
            .eq('id', profile.resident_community_id)
            .single();

          if (communityError) {
            console.error('Error fetching community:', communityError);
            console.log('Community fetch error:', communityError.message);
            Alert.alert(t('error') || 'Error', t('genericError') || 'An error occurred');
            setHasValidSubscription(false);
            return;
          }
          console.log('Community data fetched:', community);

          const isSubscriptionPaid = 
            community?.stripe_subscription_id &&
            community?.stripe_payment_status === 'active' &&
            community?.product_type === 'premium';

          const isOneTimeValid = 
            community?.one_time_valid_until &&
            isBefore(new Date(), parseISO(community.one_time_valid_until)) &&
            community?.product_type === 'premium';

          // Now combine them
          const isSubscriptionValid = isSubscriptionPaid || isOneTimeValid;
          console.log('Subscription valid:', isSubscriptionValid);
          setHasValidSubscription(isSubscriptionValid);
        } else {
          console.log('No community check needed, setting subscription as valid');
          setHasValidSubscription(true); // No subscription check needed for group owners
        }
      } catch (error: any) {
        console.error('Residency/Subscription check error:', error);
        console.log('Caught error:', error.message);
        Alert.alert(t('error') || 'Error', t('genericError') || 'An error occurred');
        setIsResidentOrGroupMember(false);
        setHasValidSubscription(false);
      }
      console.log('Residency and subscription check completed');
    }

    checkResidencyAndSubscription();
  }, [t, navigation]);

  React.useEffect(() => {
  const currentLocale = i18n.language === 'es' ? es : enUS;
  const firstDay = i18n.language === 'es' ? 1 : 0;

  const baseDayNames = i18n.language === 'es'
    ? ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const baseDayNamesShort = i18n.language === 'es'
    ? ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Rotate backward for Spanish to compensate for the library's forward shift
  const dayNames = i18n.language === 'es'
    ? [baseDayNames[6], ...baseDayNames.slice(0, 6)] // domingo, lunes, martes, ..., sábado
    : baseDayNames;
  const dayNamesShort = i18n.language === 'es'
    ? [baseDayNamesShort[6], ...baseDayNamesShort.slice(0, 6)] // do, lu, ma, ..., sá
    : baseDayNamesShort;

  LocaleConfig.locales[i18n.language] = {
    monthNames: Array.from({ length: 12 }, (_, i) =>
      format(new Date(2021, i, 1), 'MMMM', { locale: currentLocale })
    ),
    monthNamesShort: Array.from({ length: 12 }, (_, i) =>
      format(new Date(2021, i, 1), 'MMM', { locale: currentLocale })
    ),
    dayNames,
    dayNamesShort,
  };
  LocaleConfig.defaultLocale = i18n.language;

  // Log for debugging
  console.log('Current language:', i18n.language);
  console.log('Day Names:', LocaleConfig.locales[i18n.language].dayNames);
  console.log('Day Names Short:', LocaleConfig.locales[i18n.language].dayNamesShort);
  console.log('Calendar firstDay:', firstDay);
}, [i18n.language]);


  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, resetting selected date');
      setSelectedDate('');
    }, [])
  );

  const handleDateSelect = (day: DateData) => {
    console.log('Date selected:', day.dateString);
    const today = new Date().toISOString().split('T')[0];
    
    if (isBefore(parseISO(day.dateString), parseISO(today))) {
      console.log('Past date selected, showing alert');
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
    console.log('Continue button pressed, selected date:', selectedDate);
    if (selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      
      if (isBefore(parseISO(selectedDate), parseISO(today))) {
        console.log('Past date detected in continue, showing alert');
        Alert.alert(
          t('pastDateError') || 'Invalid Date',
          t('pastDateMessage') || 'You cannot select a past date for booking.',
          [{ text: t('ok') || 'OK' }]
        );
        setSelectedDate('');
        return;
      }
      
      console.log('Navigating to CourtSelection with date:', selectedDate);
      navigation.navigate('CourtSelection', { date: selectedDate });
    }
  };

  const handlePurchasePremium = async () => {
    console.log('Opening pricing page: https://qourtify.com/en/pricing');
    try {
      await Linking.openURL('https://qourtify.com/en/pricing');
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert(t('error') || 'Error', t('genericError') || 'An error occurred while opening the link.');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  if (isResidentOrGroupMember === null || hasValidSubscription === null) {
    console.log('Showing loading screen, states:', { isResidentOrGroupMember, hasValidSubscription });
    return (
      <LinearGradient colors={[colors.gradientStart, '#000']} style={styles.container}>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              </SafeAreaView>
            </LinearGradient>
    );
  }

  if (!isResidentOrGroupMember) {
    console.log('User is not resident or group member, showing resident required message');
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
                onPress={() => {
                  console.log('Navigating to ProfileTab');
                  navigation.navigate('Home', { screen: 'ProfileTab' });
                }} 
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

  if (!hasValidSubscription) {
    console.log('Invalid or non-premium subscription, showing purchase premium message');
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
          <ScrollView 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animatable.View animation="fadeInUp" duration={800} style={styles.messageContainer}>
              <Text style={styles.messageTitle}>
                {t('subscriptionRequired') || 'Active Subscription Required'}
              </Text>
              <Text style={styles.messageText}>
                {t('subscriptionRequiredMessage') || 'Your community needs an active premium subscription or valid one-time premium payment to use this feature.'}
              </Text>
              <TouchableOpacity 
                onPress={handlePurchasePremium}
                style={styles.profileButton}
              >
                <LinearGradient
                  colors={['#00A86B', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.profileButtonText}>
                    {t('purchasePremium') || 'Purchase Premium'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  console.log('Rendering calendar view, all checks passed');
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
              firstDay={i18n.language === 'es' ? 1 : 0}
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
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: -130,
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