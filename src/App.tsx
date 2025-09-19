'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from './navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme, IconButton } from 'react-native-paper';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { colors } from './theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import * as Linking from 'expo-linking';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Importa tus pantallas
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import CommunityCodeScreen from './screens/CommunityCodeScreen';
import HomeScreen from './screens/HomeScreen';
import DateSelectionScreen from './screens/DateSelectionScreen';
import TimeSelectionScreen from './screens/TimeSelectionScreen';
import ConfirmBookingScreen from './screens/ConfirmBookingScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import CourtSelectionScreen from './screens/CourtSelection';
import MyBookingsScreen from './screens/MyBookingsScreen';
import AddMatchResultScreen from './screens/AddMatchResultScreen';
import MyStatisticsScreen from './screens/MyStatisticsScreen';
import CommunityManagementScreen from './screens/CommunityManagementScreen';
import AboutDeveloperScreen from './screens/AboutDeveloperScreen';
import MatchesScreen from './screens/MatchesScreen';
import PlayerManagementScreen from './screens/PlayerManagementScreen';
import CommunityRegistrationScreen from './screens/CommunityRegistrationScreen';
import CommunityMapScreen from './screens/CommunityMapScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import AuthCallbackScreen from './screens/AuthCallbackScreen';

// Configura el handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: colors,
};

function MainTabs() {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('resident_community_id')
        .eq('id', user.id)
        .single();

      if (profileData?.resident_community_id) {
        const { data: communityData } = await supabase
          .from('community')
          .select('admin')
          .eq('id', profileData.resident_community_id)
          .single();

        if (communityData?.admin === user.id) {
          setIsAdmin(true);
        }
      }
    }
  };

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
          } else if (route.name === 'CommunityMapTab') {
            iconName = 'map-marker';
          } else {
            iconName = 'alert-circle';
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
        options={{ tabBarLabel: t('home') }}
      />
      <Tab.Screen 
        name="MyBookingsTab" 
        component={MyBookingsScreen} 
        options={{ tabBarLabel: t('myBookings') }}
      />
      <Tab.Screen 
        name="CommunityMapTab" 
        component={CommunityMapScreen} 
        options={{ tabBarLabel: t('communityMap') }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: t('profile') }}
      />
      {isAdmin && (
        <Tab.Screen 
          name="CommunityManagementTab" 
          component={CommunityManagementScreen} 
          options={{ tabBarLabel: t('community') }}
        />
      )}
    </Tab.Navigator>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const navigationRef = useRef<any>(null);

  // Registrar notificaciones push
  async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Obtener el token de Expo
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '048a9614-92a6-4c9b-9da1-2b8d81ff1906', 
    });

    // Guardar el token en Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('user_devices').upsert({
          user_id: user.id,
          expo_push_token: token.data,
          device_info: { platform: Platform.OS }
        }, { onConflict: 'user_id' });
      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved:', token.data);
      }
    }

    // Configurar el canal de notificaciones para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  useEffect(() => {
    // Configurar idioma
    const locale = Localization.locale || Localization.getLocales()?.[0]?.languageCode || 'en';
    const deviceLanguage = typeof locale === 'string' ? locale.split('-')[0] : 'en';
    i18n.changeLanguage(deviceLanguage);

    // Configurar sesión de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        registerForPushNotificationsAsync(); // Registrar token al iniciar sesión
      }
    });

    // Configurar listeners de notificaciones
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Aquí puedes mostrar un alert o actualizar el estado si la app está en foreground
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification } = response;
      const data = notification.request.content.data;
      console.log('Notification clicked:', data);

      // Navegar según el tipo de notificación
      if (data.type === 'match_reminder' || data.type === 'match_ended') {
        navigationRef.current?.navigate('MyBookingsTab');
      } else if (data.type === 'result_proposed') {
        navigationRef.current?.navigate('AddMatchResult', { matchId: data.match_id });
      } else if (data.type === 'booking_cancelled') {
        navigationRef.current?.navigate('HomeTab');
      }
    });

    // Verificar deep links iniciales
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);
    };
    fetchAdminStatus();
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('Deep link received:', url);
    // ... tu lógica existente para deep links ...
  };

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('resident_community_id')
        .eq('id', user.id)
        .single();

      if (profileData?.resident_community_id) {
        const { data: communityData } = await supabase
          .from('community')
          .select('admin')
          .eq('id', profileData.resident_community_id)
          .single();

        return communityData?.admin === user.id;
      }
    }
    return false;
  };

  const linking = {
    prefixes: [
      'qourtify://',
      'https://qourtify.com',
      'https://auth.expo.io',
      'exp://',
      'exps://'
    ],
    config: {
      screens: {
        Login: 'login',
        Home: 'home',
        AuthCallback: { path: 'auth/callback', exact: true },
        Register: 'register',
        CommunityRegistration: 'community-registration',
      },
    },
  };

  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer linking={linking} ref={navigationRef}>
            <Stack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: colors.gradientStart },
                headerTintColor: colors.onPrimary,
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            >
              {session && session.user ? (
                <>
                  <Stack.Screen 
                    name="Home" 
                    component={MainTabs} 
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
                  <Stack.Screen name="DateSelection" component={DateSelectionScreen} options={{ title: t('selectDate') }} />
                  <Stack.Screen name="TimeSelection" component={TimeSelectionScreen} options={{ title: t('selectTime') }} />
                  <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} options={{ title: t('confirmBooking') }} />
                  <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: t('statistics') }} />
                  <Stack.Screen name="MyStatistics" component={MyStatisticsScreen} options={{ title: t('myStatistics') }} />
                  <Stack.Screen name="AddMatchResult" component={AddMatchResultScreen} options={{ title: t('addMatch') }} />
                  <Stack.Screen name="Matches" component={MatchesScreen} options={{ title: t('myMatches') }} />
                  <Stack.Screen name="CourtSelection" component={CourtSelectionScreen} options={{ title: t('paddleCourts') }} />
                  <Stack.Screen name="AboutDeveloper" component={AboutDeveloperScreen} options={{ title: t('aboutDeveloper') }} />
                  <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('changePassword') }} />
                  <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: t('privacy') }} /> 
                  <Stack.Screen name="CommunityCode" component={CommunityCodeScreen} options={{ title: t('joinCommunity') }} />
                  <Stack.Screen 
                    name="PlayerManagement" 
                    component={PlayerManagementScreen} 
                    options={{ 
                      title: t('playerManagement'),
                      headerRight: () => (
                        isAdmin ? null : (
                          <IconButton
                            icon="block-helper"
                            color={colors.onPrimary}
                            onPress={() => Alert.alert(t('accessDenied'), t('adminOnlyFeature'))}
                          />
                        )
                      )
                    }}
                  />
                </>
              ) : (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                  <Stack.Screen name="CommunityRegistration" component={CommunityRegistrationScreen} options={{ title: t('registerCommunity') }} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </I18nextProvider>
  );
}