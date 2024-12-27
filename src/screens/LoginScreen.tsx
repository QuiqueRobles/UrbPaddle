import React, { useState, useLayoutEffect } from 'react'
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native'
import { TextInput, Button, useTheme, Text } from 'react-native-paper'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { colors } from '../theme/colors'
import FireText from '../components/FireText'
import { ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  CommunityRegistration: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const theme = useTheme()
  const { t } = useTranslation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      Alert.alert(t('error'), error.message)
    } else {
      navigation.navigate('Home')
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <FireText
          text={t('loginScreenTitle')}
          fontSize={23}
          intensity={1.2}
          style={styles.fireTitle}
        />
        <View style={styles.loginContainer}>
          <TextInput
            label={t('email')}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            mode="flat"
            underlineColor="transparent"
            textColor='#fff'
            left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
          />
          <TextInput
            label={t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="flat"
            underlineColor="transparent"
            theme={{ colors: { primary: theme.colors.primary, text: '#fff' } }}
            left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                color={theme.colors.primary}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.button}>
            <LinearGradient
              colors={['#00A86B', '#00C853']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonLabel}>{t('login')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Button 
            onPress={() => navigation.navigate('Register')}
            style={styles.registerButton}
            labelStyle={styles.registerButtonText}
          >
            {t('noAccountPrompt')}
          </Button>
          <TouchableOpacity 
            onPress={() => navigation.navigate('CommunityRegistration')} 
            style={styles.communityButton}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonLabel}>{t('registerCommunity')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    width: '85%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    marginBottom: 140,
  },
  logoContainer: {
    marginBottom: 0,
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginTop: 100,
  },
  input: {
    marginBottom: 16,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  button: {
    marginTop: 24,
    marginBottom: 16,
    width: '100%',
  },
  gradientButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  registerButton: {
    marginTop: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
  },
  fireTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  communityButton: {
    marginTop: 16,
    width: '100%',
  },
})
