import React, { useState, useLayoutEffect, useRef } from 'react'
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Animated } from 'react-native'
import { TextInput, useTheme, Text, Divider } from 'react-native-paper'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { colors } from '../theme/colors'
import FireText from '../components/FireText'
import { gradients } from '../theme/gradients'
import { ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import * as Animatable from 'react-native-animatable'

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

  const emailInputRef = useRef<TextInput>(null)
  const passwordInputRef = useRef<TextInput>(null)

  const emailAnimation = useRef(new Animated.Value(0)).current
  const passwordAnimation = useRef(new Animated.Value(0)).current

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const animateInput = (animation: Animated.Value, toValue: number) => {
    Animated.timing(animation, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }

  const handleEmailFocus = () => animateInput(emailAnimation, 1)
  const handleEmailBlur = () => animateInput(emailAnimation, 0)
  const handlePasswordFocus = () => animateInput(passwordAnimation, 1)
  const handlePasswordBlur = () => animateInput(passwordAnimation, 0)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(t('error'), t('pleaseEnterEmailAndPassword'))
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      Alert.alert(t('error'), error.message)
    } else {
      navigation.navigate('Home')
    }
  }

  const renderButton = (onPress: () => void, label: string, colors: string[], style: object = {}) => (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]} disabled={loading}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientButton}
      >
        {loading && label === t('login') ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonLabel}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )

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
        <Animatable.View animation="fadeIn" duration={1000} style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animatable.View>
        <Animatable.View animation="fadeInUp" duration={1000} delay={500}>
          <FireText
            text={t('loginScreenTitle')}
            fontSize={22}
            intensity={1.2}
            style={styles.fireTitle}
          />
        </Animatable.View>
        <Animatable.View animation="fadeInUp" duration={1000} delay={1000} style={styles.loginContainer}>
          <Animated.View style={[styles.inputContainer, { borderColor: emailAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', theme.colors.primary]
          }) }]}>
            <TextInput
              ref={emailInputRef}
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              mode="flat"
              underlineColor="transparent"
              textColor='#fff'
              left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
              onFocus={handleEmailFocus}
              onBlur={handleEmailBlur}
            />
          </Animated.View>
          <Animated.View style={[styles.inputContainer, { borderColor: passwordAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', theme.colors.primary]
          }) }]}>
            <TextInput
              ref={passwordInputRef}
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              mode="flat"
              underlineColor="transparent"
              textColor='#fff'
              left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  color={theme.colors.primary}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
            />
          </Animated.View>
          {renderButton(
            handleLogin,
            t('login'),
            ['#00A86B', '#00C853'],
            { marginBottom: 16, opacity: loading ? 0.7 : 1 }
          )}
          <Divider style={styles.divider} />
          <View style={styles.secondaryButtonsContainer}>
            {renderButton(
              () => navigation.navigate('Register'),
              t('register'),
              ['#1E3A8A', '#3B82F6'],
              { flex: 1, marginRight: 8 }
            )}
            {renderButton(
              () => navigation.navigate('CommunityRegistration'),
              t('registerCommunity'),
              ['#7C3AED', '#A78BFA'],
              { flex: 1, marginLeft: 8 }
            )}
          </View>
        </Animatable.View>
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
    width: '90%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 200,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
    borderWidth: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  button: {
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  gradientButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  fireTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#FFFFFF',
  },
  divider: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 16,
  },
})

