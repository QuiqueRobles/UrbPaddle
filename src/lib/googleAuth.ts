import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Cierra sesiones de navegador si estaban abiertas
WebBrowser.maybeCompleteAuthSession();

// Client IDs de Google
const GOOGLE_CLIENT_ID = {
  ios: '500141855236-n54tmamcdd9sv4k91mtcnjutlk9jejo1.apps.googleusercontent.com',
  android: '500141855236-0r5h8bkr5lvj1893rp7c9l18j06guetu.apps.googleusercontent.com',
  web: '500141855236-2f9nardn4u6jjjqqtqhu8c5m9m4lt255.apps.googleusercontent.com',
};

// Detecta si es Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Obtiene Client ID según entorno
const getClientId = () => {
  if (isExpoGo) return GOOGLE_CLIENT_ID.web;
  return Platform.select({
    ios: GOOGLE_CLIENT_ID.ios,
    android: GOOGLE_CLIENT_ID.android,
    default: GOOGLE_CLIENT_ID.web,
  });
};

// Obtiene Redirect URI según entorno
const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    const redirectUri = `${window.location.origin}/authcallback`;
    console.log('Generated redirect URI for web:', redirectUri);
    return redirectUri;
  }
  
  if (isExpoGo) {
    // Para Expo Go, usar el proxy oficial de Expo
    const redirectUri = makeRedirectUri({
      useProxy: true,
      native: 'qourtify://auth/callback'
    });
    console.log('Generated redirect URI for Expo Go:', redirectUri);
    return redirectUri;
  }
  
  // Para producción, usar dominio propio o universal links
  const redirectUri = 'https://tu-dominio.com/auth/callback';
  console.log('Generated redirect URI for production:', redirectUri);
  return redirectUri;
};

export const signInWithGoogle = async () => {
  try {
    const redirectTo = getRedirectUri();
    const clientId = getClientId();

    console.log('=== Google Auth Debug ===');
    console.log('Platform:', Platform.OS);
    console.log('Environment:', isExpoGo ? 'Expo Go' : 'Standalone/Web');
    console.log('Redirect URI:', redirectTo);
    console.log('Client ID:', clientId?.substring(0, 20) + '...');
    console.log('========================');

    // En web: Supabase gestiona la redirección completa
    if (Platform.OS === 'web') {
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      console.log('Web OAuth result:', result);
      return result;
    }

    // En móvil: abrir sesión OAuth dentro de WebBrowser
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          client_id: clientId,
        },
      },
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      return { data: null, error: error.message };
    }

    if (!data?.url) {
      console.error('No authorization URL received');
      return { data: null, error: 'No authorization URL received from Supabase' };
    }

    console.log('Opening auth URL:', data.url);
    const result = await WebBrowser.openAuthSessionAsync(
      data.url, 
      redirectTo,
      {
        // Configuración adicional para mejorar la experiencia
        preferEphemeralSession: true,
        showInRecents: false,
      }
    );

    console.log('WebBrowser result:', result);

    if (result.type === 'success' && result.url) {
      // Extraer parámetros de la URL de respuesta
      let urlParams: string;
      if (result.url.includes('#')) {
        urlParams = result.url.split('#')[1];
      } else if (result.url.includes('?')) {
        urlParams = result.url.split('?')[1];
      } else {
        console.error('No parameters found in result URL');
        return { data: null, error: 'No parameters in response URL' };
      }

      const params = new URLSearchParams(urlParams);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const errorParam = params.get('error');
      const errorDescription = params.get('error_description');

      if (errorParam) {
        console.error('OAuth error in callback:', errorParam, errorDescription);
        return { data: null, error: errorDescription || errorParam };
      }

      if (accessToken && refreshToken) {
        console.log('Setting session with tokens:', { 
          accessToken: accessToken.substring(0, 20) + '...', 
          refreshToken: refreshToken.substring(0, 20) + '...' 
        });
        
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          return { data: null, error: sessionError.message };
        }
        
        console.log('Session set successfully');
        return { data: sessionData, error: null };
      }
      
      console.error('No tokens found in result URL:', result.url);
      return { data: null, error: 'No authentication tokens received' };
    }

    if (result.type === 'cancel') {
      console.log('User cancelled authentication');
      return { data: null, error: 'User cancelled the authentication' };
    }

    console.error('Authentication failed with result:', result);
    return { data: null, error: 'Authentication failed' };
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    return { data: null, error: err.message || 'Unexpected error during Google sign-in' };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  console.log('Signed out successfully');
};