import React, { useState, useLayoutEffect } from 'react'
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image, SafeAreaView } from 'react-native'
import { TextInput, Button, HelperText, useTheme, Text } from 'react-native-paper'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { colors } from '../theme/colors'
import FireText from '../components/FireText'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>

type Props = {
  navigation: RegisterScreenNavigationProp
}

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userName, setUserName] = useState('')
  const [apartment, setApartment] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const theme = useTheme()
  const { t } = useTranslation()

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/
    return re.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  async function handleRegister() {
    setEmailError('')
    setPasswordError('')

    if (!validateEmail(email)) {
      setEmailError(t('invalidEmailError'))
      return
    }

    if (!validatePassword(password)) {
      setPasswordError(t('passwordLengthError'))
      return
    }

    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    
    if (authError) {
      setLoading(false)
      if (authError.message.includes('Email not allowed')) {
        return Alert.alert(t('error'), t('unauthorizedEmailError'))
      }
      return Alert.alert(t('error'), authError.message)
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: authData.user.id, 
          full_name: fullName,
          apartment: apartment,
          username: userName,
          phone_number: phoneNumber,
          updated_at: new Date()
        })

      setLoading(false)

      if (profileError) {
        return Alert.alert(t('error'), profileError.message)
      }

      Alert.alert(t('success'), t('registrationSuccessful'))
      navigation.navigate('CommunityCode', { userId: authData.user.id })
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <FireText
                text={t('joinPaddleCommunity')}
                fontSize={20}
                intensity={1.2}
                style={styles.fireTitle}
              />
              <View style={styles.formContainer}>
                <TextInput
                  label={t('fullName')}
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  mode="flat"
                  underlineColor="transparent"
                  textColor='#fff'
                  left={<TextInput.Icon icon="account" color={theme.colors.primary} />}
                />
                <TextInput
                  label={t('username')}
                  value={userName}
                  onChangeText={setUserName}
                  style={styles.input}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  mode="flat"
                  underlineColor="transparent"
                  textColor='#fff'
                  left={<TextInput.Icon icon="at" color={theme.colors.primary} />}
                />
                <TextInput
                  label={t('email')}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    setEmailError('')
                  }}
                  style={styles.input}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={!!emailError}
                  mode="flat"
                  underlineColor="transparent"
                  textColor='#fff'
                  left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
                />
                <HelperText type="error" visible={!!emailError} style={styles.errorText}>
                  {emailError}
                </HelperText>
                <TextInput
                  label={t('password')}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    setPasswordError('')
                  }}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  error={!!passwordError}
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
                />
                <HelperText type="error" visible={!!passwordError} style={styles.errorText}>
                  {passwordError}
                </HelperText>
                <TextInput
                  label={t('apartmentNumber')}
                  value={apartment}
                  onChangeText={setApartment}
                  style={styles.input}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  mode="flat"
                  underlineColor="transparent"
                  textColor='#fff'
                  left={<TextInput.Icon icon="home" color={theme.colors.primary} />}
                />
                <TextInput
                  label={t('phoneNumber')}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  style={styles.input}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  keyboardType="phone-pad"
                  mode="flat"
                  underlineColor="transparent"
                  textColor='#fff'
                  left={<TextInput.Icon icon="phone" color={theme.colors.primary} />}
                />
                
                <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.button}>
                  <LinearGradient
                    colors={['#00A86B', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.buttonLabel}>{t('createAccount')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <Button 
                  onPress={() => navigation.navigate('Login')}
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonLabel}
                >
                  {t('alreadyHaveAccount')}
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
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
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 32,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
    width: '100%',
  },
  logo: {
    width: 150,
    height: 150,
    marginTop: 40,
  },
  fireTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
    fontSize: 20,
  },
  formContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
   input: {
    marginBottom: 16,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  errorText: {
    color: '#FF6B6B',
    alignSelf: 'flex-start',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
})