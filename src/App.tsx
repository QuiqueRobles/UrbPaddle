import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
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
import CommunityManagementScreen from './screens/CommunityManagementScreen'

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

const theme = {
  ...DefaultTheme,
  colors: colors,
}

function MainTabs() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('resident_community_id')
        .eq('id', user.id)
        .single()

      if (profileData?.resident_community_id) {
        const { data: communityData } = await supabase
          .from('community')
          .select('admin')
          .eq('id', profileData.resident_community_id)
          .single()

        if (communityData?.admin === user.id) {
          setIsAdmin(true)
        }
      }
    }
  }

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];

        if (route.name === 'HomeTab') {
          iconName = 'home';
        } else if (route.name === 'MyBookingsTab') {
          iconName = 'calendar-check';
        } else if (route.name === 'ProfileTab') {
          iconName = 'account';
        } else if (route.name === 'CommunityManagementTab') {
          iconName = 'office-building';
        } else {
          iconName = 'alert-circle'; // Default icon
        }

        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          position: 'absolute',
          height: 80,
          overflow: 'hidden',
          elevation: 10,
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="MyBookingsTab" 
        component={MyBookingsScreen} 
        options={{ tabBarLabel: 'My Bookings' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
      {isAdmin && (
        <Tab.Screen 
          name="CommunityManagementTab" 
          component={CommunityManagementScreen} 
          options={{ tabBarLabel: 'Community' }}
        />
      )}
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

