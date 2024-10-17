import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { RootStackParamList } from './navigation'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { colors } from './theme/colors'

import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import HomeScreen from './screens/HomeScreen'
import CourtListScreen from './screens/CourtListScreen'
import DateSelectionScreen from './screens/DateSelectionScreen'
import TimeSelectionScreen from './screens/TimeSelectionScreen'
import BookingScreen from './screens/BookingScreen'
import ConfirmBookingScreen from './screens/ConfirmBookingScreen'
import StatisticsScreen from './screens/StatisticsScreen'

const Stack = createStackNavigator<RootStackParamList>()

const theme = {
  ...DefaultTheme,
  colors: colors,
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.primary,
              },
              headerTintColor: colors.onPrimary,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            {session && session.user ? (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="CourtList" component={CourtListScreen} options={{ title: 'Pistas de Pádel' }} />
                <Stack.Screen name="DateSelection" component={DateSelectionScreen} options={{ title: 'Seleccionar Fecha' }} />
                <Stack.Screen name="TimeSelection" component={TimeSelectionScreen} options={{ title: 'Seleccionar Hora' }} />
                <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Seleccionar booking' }} />
                <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} options={{ title: 'Confirmar Reserva' }} />
                <Stack.Screen name="Statistics" component={StatisticsScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  )
}