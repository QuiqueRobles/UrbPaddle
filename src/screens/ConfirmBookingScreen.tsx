import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Title, Paragraph, useTheme, ActivityIndicator, Card } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

type RootStackParamList = {
  ConfirmBooking: { courtId: number; date: string; startTime: string; endTime: string; communityId: string };
  Home: undefined;
};

type ConfirmBookingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ConfirmBooking'>;
type ConfirmBookingScreenRouteProp = RouteProp<RootStackParamList, 'ConfirmBooking'>;

type Props = {
  navigation: ConfirmBookingScreenNavigationProp;
  route: ConfirmBookingScreenRouteProp;
};

export default function ConfirmBookingScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const { courtId, date, startTime, endTime, communityId } = route.params;

  const handleConfirm = async () => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      Alert.alert(t('error'), t('user_error'));
      setLoading(false);
      return;
    }
    
    console.log(communityId);
    const { error } = await supabase
      .from('bookings')
      .insert({
        court_number: courtId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        user_id: userData.user.id,
        community_id: communityId
      });

    setLoading(false);

    if (error) {
      Alert.alert(t('error'), t('booking_error'));
    } else {
      Alert.alert(t('success'), t('booking_success'), [
        { text: t('ok'), onPress: () => navigation.navigate('Home') }
      ]);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.onSecondary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>{t('confirm_booking')}</Title>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Calendar size={24} color={colors.primary} />
                <Paragraph style={styles.details}>{t('date')}: {date}</Paragraph>
              </View>
              <View style={styles.detailRow}>
                <Clock size={24} color={colors.primary} />
                <Paragraph style={styles.details}>{t('time')}: {startTime} - {endTime}</Paragraph>
              </View>
            </View>
            <View style={styles.courtContainer}>
              <Title style={styles.courtTitle}>{t('court')} {courtId}</Title>
            </View>
            <LinearGradient
          colors={['#00A86B', '#00C853']}
          style={styles.button}
        >
          <Button
            onPress={handleConfirm}
            labelStyle={styles.buttonLabel}
  
          >
            {t('confirm_booking_button')}
          </Button>
        </LinearGradient>
          </Card.Content>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    elevation: 10,
    marginBottom: 150,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: colors.text,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  details: {
    fontSize: 18,
    marginLeft: 12,
    color: colors.text,
  },
  courtContainer: {
    backgroundColor: colors.gray900,
    borderRadius: 12,
    padding: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  courtTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onSecondary,
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    elevation: 4,
  },
  buttonLabel: {
    fontSize: 18,
    color: colors.onSecondary,
    paddingVertical: 8,
  },
});
