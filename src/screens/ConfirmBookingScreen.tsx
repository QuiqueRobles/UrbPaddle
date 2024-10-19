import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Title, Paragraph, useTheme, ActivityIndicator } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

type RootStackParamList = {
  ConfirmBooking: { courtId: number; date: string; startTime: string; endTime: string };
  Home: undefined;
};

type ConfirmBookingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ConfirmBooking'>;
type  ConfirmBookingScreenRouteProp = RouteProp<RootStackParamList, 'ConfirmBooking'>;

type Props = {
  navigation: ConfirmBookingScreenNavigationProp;
  route: ConfirmBookingScreenRouteProp;
};

export default function ConfirmBookingScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { courtId, date, startTime, endTime } = route.params;

  const handleConfirm = async () => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .insert({
        court_number: courtId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        user_id: userData.user.id
      });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'No se pudo realizar la reserva. Por favor, inténtalo de nuevo.');
    } else {
      Alert.alert('Éxito', 'Reserva confirmada', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={styles.title}>Confirmar Reserva</Title>
      <Paragraph style={styles.details}>Pista: {courtId}</Paragraph>
      <Paragraph style={styles.details}>Fecha: {date}</Paragraph>
      <Paragraph style={styles.details}>Hora: {startTime} - {endTime}</Paragraph>
      <Button
        mode="contained"
        onPress={handleConfirm}
        style={[styles.button, { backgroundColor: colors.secondary }]}
        labelStyle={{ color: colors.onSecondary }}
      >
        Confirmar Reserva
      </Button>
    </View>
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
  details: {
    fontSize: 18,
    marginBottom: 8,
  },
  button: {
    marginTop: 24,
  },
});