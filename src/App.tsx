'use client';

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import { Alert } from 'react-native';

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

  useEffect(() => {
    // Set the default language based on the device locale with null check
    const locale = Localization.locale || Localization.getLocales()?.[0]?.languageCode || 'en';
    const deviceLanguage = typeof locale === 'string' ? locale.split('-')[0] : 'en';
    i18n.changeLanguage(deviceLanguage);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);
    };
    fetchAdminStatus();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      // Verificar si es un callback de OAuth
      if (url.includes('access_token') || 
          url.includes('code') || 
          url.includes('auth/callback') ||
          url.includes('oauth') ||
          url.includes('supabase') ||
          url.includes('qourtify://auth')) {
        
        console.log('Processing OAuth callback:', url);
        
        try {
          // Extraer parámetros tanto de hash como de query string
          let urlParams: string = '';
          
          if (url.includes('#')) {
            urlParams = url.split('#')[1];
          } else if (url.includes('?')) {
            const urlParts = url.split('?');
            urlParams = urlParts.slice(1).join('?');
          } else {
            console.log('No parameters found in OAuth callback URL');
            return;
          }
          
          const params = new URLSearchParams(urlParams);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const errorParam = params.get('error');
          const errorDescription = params.get('error_description');
          
          console.log('OAuth params extracted:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            error: errorParam,
            errorDescription
          });
          
          if (errorParam) {
            console.error('OAuth error in deep link:', errorParam, errorDescription);
            Alert.alert('Error de autenticación', errorDescription || errorParam);
            return;
          }
          
          if (accessToken && refreshToken) {
            console.log('Setting session with tokens from deep link');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session from deep link:', error);
              Alert.alert('Error', 'No se pudo autenticar con Google: ' + error.message);
            } else {
              console.log('Google OAuth session set successfully from deep link');
            }
          } else {
            console.log('Deep link received but no valid tokens found');
            console.log('Full URL for debugging:', url);
          }
        } catch (error) {
          console.error('Error handling OAuth deep link:', error);
          Alert.alert('Error', 'No se pudo procesar la autenticación de Google');
        }
      } else {
        console.log('Deep link not related to OAuth:', url);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Verificar si la app se abrió con un deep link inicial
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL detected:', url);
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
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
        AuthCallback: {
          path: 'auth/callback',
          exact: true
        },
        Register: 'register',
        CommunityRegistration: 'community-registration',
      },
    },
  };

  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
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