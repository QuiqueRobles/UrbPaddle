import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Text } from 'react-native-paper';

export default function AuthCallbackScreen() {
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Procesando autenticación...');

  useEffect(() => {
    console.log('AuthCallbackScreen mounted');

    const handleAuth = async () => {
      if (isProcessing) {
        console.log('Already processing, skipping');
        return;
      }
      
      setIsProcessing(true);
      setStatus('Verificando credenciales...');

      try {
        // Para web, obtener parámetros de la URL
        if (typeof window !== 'undefined') {
          const hashParams = window.location.hash.substring(1);
          const queryParams = window.location.search.substring(1);
          const params = new URLSearchParams(hashParams || queryParams);

          console.log('URL Parameters:', Object.fromEntries(params.entries()));

          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const errorParam = params.get('error');
          const errorDescription = params.get('error_description');

          if (errorParam) {
            console.error('OAuth error:', errorParam, errorDescription);
            Alert.alert('Error de autenticación', errorDescription || errorParam);
            navigation.navigate('Login' as never);
            return;
          }

          if (accessToken && refreshToken) {
            console.log('Setting session with tokens from callback screen');
            setStatus('Estableciendo sesión...');
            
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
              Alert.alert('Error', 'No se pudo establecer la sesión: ' + error.message);
              navigation.navigate('Login' as never);
              return;
            }

            console.log('Session set successfully from callback, navigating to Home');
            setStatus('¡Autenticación exitosa!');
            
            // Pequeña pausa para mostrar el éxito antes de navegar
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' as never }],
              });
            }, 1000);
          } else {
            console.error('No tokens found in URL parameters');
            Alert.alert('Error', 'No se recibieron los tokens de autenticación');
            navigation.navigate('Login' as never);
          }
        } else {
          // En móvil, este componente no debería ser necesario ya que el deep linking maneja todo
          console.log('Mobile environment, redirecting to login');
          navigation.navigate('Login' as never);
        }
      } catch (err) {
        console.error('Error in AuthCallbackScreen:', err);
        Alert.alert('Error', 'Error procesando la autenticación: ' + String(err));
        navigation.navigate('Login' as never);
      } finally {
        setIsProcessing(false);
      }
    };

    // Pequeño delay para permitir que la navegación se estabilice
    const timer = setTimeout(handleAuth, 500);
    
    return () => clearTimeout(timer);
  }, [navigation, isProcessing]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00A86B" />
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
});