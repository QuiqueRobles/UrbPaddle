import React, { useState, useLayoutEffect, useRef } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { TextInput, useTheme, Text } from 'react-native-paper';
import type { TextInput as TextInputType } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { ActivityIndicator } from 'react-native';
import FireText from '../components/FireText';
import { useTranslation } from 'react-i18next';
import LanguageSelector2 from '../components/LanguageSelector2';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { signInWithGoogle } from '../lib/googleAuth';
import * as Animatable from 'react-native-animatable';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();

  const emailInputRef = useRef<TextInputType>(null);
  const passwordInputRef = useRef<TextInputType>(null);

  const emailAnimation = useRef(new Animated.Value(0)).current;
  const passwordAnimation = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const animateInput = (animation: Animated.Value, toValue: number) => {
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleEmailFocus = () => animateInput(emailAnimation, 1);
  const handleEmailBlur = () => animateInput(emailAnimation, 0);
  const handlePasswordFocus = () => animateInput(passwordAnimation, 1);
  const handlePasswordBlur = () => animateInput(passwordAnimation, 0);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(t('error'), t('pleaseEnterEmailAndPassword'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert(t('error'), error.message);
    } else {
      navigation.navigate('Home');
    }
  }

  async function handleGoogleSignIn() {
    console.log("🔵 Google Sign-In iniciado...");
    setGoogleLoading(true);

    try {
      const { data, error } = await signInWithGoogle();

      console.log("📤 Respuesta de signInWithGoogle:", { data, error });

      if (error) {
        console.error("❌ Error en Google Sign-In:", error);
        if (error !== 'User cancelled the authentication') {
          Alert.alert(t('error'), error);
        }
      } else if (data) {
        console.log("✅ Google Sign-In exitoso, datos:", data);
        navigation.navigate('Home');
      }
    } catch (err) {
      console.error("🔥 Excepción no controlada en Google Sign-In:", err);
      Alert.alert(t('error'), String(err));
    } finally {
      setGoogleLoading(false);
      console.log("🔵 Google Sign-In finalizado.");
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Language Selector - Posición fija */}
            <View style={styles.languageSelectorFixed}>
              <LanguageSelector2 />
            </View>
            {/* Logo Section */}
            <Animatable.View animation="fadeInDown" duration={800} style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/quortify-logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <FireText
                text={t('welcomeBack') || 'Welcome Back'}
                fontSize={28}
                intensity={0.8}
                style={styles.welcomeFireText}
              />
              <Text style={styles.subtitleText}>{t('signInToContinue') || 'Sign in to continue'}</Text>
            </Animatable.View>

            {/* Login Form */}
            <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
              {/* Google Sign-In Button */}
              <TouchableOpacity 
                onPress={handleGoogleSignIn} 
                style={styles.googleButton}
                disabled={googleLoading}
              >
                <View style={styles.googleButtonContent}>
                  <Image 
                    source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                    style={styles.googleIcon}
                  />
                  {googleLoading ? (
                    <ActivityIndicator color="#757575" size="small" style={styles.googleSpinner} />
                  ) : (
                    <Text style={styles.googleButtonText}>
                      {t('continueWithGoogle') || 'Continue with Google'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('or') || 'OR'}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email Input */}
              <Animated.View style={[
                styles.inputContainer,
                {
                  borderColor: emailAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255,255,255,0.1)', '#00C853']
                  }),
                  shadowOpacity: emailAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3]
                  })
                }
              ]}>
                <TextInput
                  ref={emailInputRef}
                  label={t('email')}
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  mode="outlined"
                  outlineColor="transparent"
                  activeOutlineColor="transparent"
                  textColor='#ffffff'
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  theme={{
                    colors: {
                      onSurfaceVariant: 'rgba(255,255,255,0.6)',
                      outline: 'transparent',
                    }
                  }}
                  left={<TextInput.Icon icon="email" iconColor="rgba(255,255,255,0.6)" />}
                  onFocus={handleEmailFocus}
                  onBlur={handleEmailBlur}
                />
              </Animated.View>

              {/* Password Input */}
              <Animated.View style={[
                styles.inputContainer,
                {
                  borderColor: passwordAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255,255,255,0.1)', '#00C853']
                  }),
                  shadowOpacity: passwordAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3]
                  })
                }
              ]}>
                <TextInput
                  ref={passwordInputRef}
                  label={t('password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="transparent"
                  activeOutlineColor="transparent"
                  textColor='#ffffff'
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  theme={{
                    colors: {
                      onSurfaceVariant: 'rgba(255,255,255,0.6)',
                      outline: 'transparent',
                    }
                  }}
                  left={<TextInput.Icon icon="lock" iconColor="rgba(255,255,255,0.6)" />}
                  right={
                    <TextInput.Icon 
                      icon={showPassword ? "eye-off" : "eye"} 
                      iconColor="rgba(255,255,255,0.6)"
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                />
              </Animated.View>

              {/* Sign In Button */}
              <TouchableOpacity 
                onPress={handleLogin} 
                style={[
                  styles.signInButton,
                  { opacity: (loading || googleLoading) ? 0.7 : 1 }
                ]} 
                disabled={loading || googleLoading}
              >
                <LinearGradient
                  colors={['#00A86B', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.signInButtonText}>{t('login')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign Up Section */}
              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>
                  {t('dontHaveAccount')} 
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signUpLink}>{t('register')}</Text>
                </TouchableOpacity>
              </View>

              {/* Community Registration */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('CommunityRegistration')}
                style={styles.communityButton}
              >
                <Text style={styles.communityButtonText}>
                  {t('registerCommunity')}
                </Text>
              </TouchableOpacity>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  languageSelectorFixed: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 100,
    elevation: 100, // Para Android
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60, // Ajuste para el espacio del selector
  },
  logoSection: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  logoContainer: {
    marginTop: -20,
    marginBottom: -80,
  },
  logo: {
    width: 280,
    height: 280,
  },
  welcomeFireText: {
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 8,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 32,
  },
  googleButton: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleSpinner: {
    marginLeft: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  signInButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signUpText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '400',
  },
  signUpLink: {
    color: '#00C853',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  communityButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  communityButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});