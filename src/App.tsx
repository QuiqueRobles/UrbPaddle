import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs'
import { RootStackParamList } from './navigation'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { colors } from './theme/colors'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import ProfileScreen from './screens/ProfileScreen'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import HomeScreen from './screens/HomeScreen'
import DateSelectionScreen from './screens/DateSelectionScreen'
import TimeSelectionScreen from './screens/TimeSelectionScreen'
import ConfirmBookingScreen from './screens/ConfirmBookingScreen'
import StatisticsScreen from './screens/StatisticsScreen'
import CourtSelectionScreen from './screens/CourtSelection'
import MyBookingsScreen from './screens/MyBookingsScreen'
import AddMatchResultScreen from './screens/AddMatchResultScreen'
import MyStatisticsScreen from './screens/MyStatisticsScreen'

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createMaterialBottomTabNavigator()

const theme = {
  ...DefaultTheme,
  colors: colors,
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      activeColor={colors.primary}
      inactiveColor="rgba(255, 255, 255, 0.6)"
      barStyle={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        position: 'absolute',        
        height: 120,
        overflow: 'hidden',
        elevation: 10,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen 
        name="MyBookingsTab" 
        component={MyBookingsScreen} 
        options={{
          tabBarLabel: 'My Bookings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar-check" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  )
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
                <Stack.Screen 
                  name="Home" 
                  component={MainTabs} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="DateSelection" component={DateSelectionScreen} options={{ title: 'Seleccionar Fecha' }} />
                <Stack.Screen name="TimeSelection" component={TimeSelectionScreen} options={{ title: 'Seleccionar Hora' }} />
                <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} options={{ title: 'Confirmar Reserva' }} />
                <Stack.Screen name="Statistics" component={StatisticsScreen} />
                <Stack.Screen name="MyStatistics" component={MyStatisticsScreen} />
                <Stack.Screen name="AddMatchResult" component={AddMatchResultScreen} options={{ title: 'Add match' }} />
                <Stack.Screen name="CourtSelection" component={CourtSelectionScreen} options={{ title: 'Pistas de Pádel' }} />
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