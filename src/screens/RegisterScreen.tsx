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
import * as Animatable from 'react-native-animatable'
import { gradients } from '../theme/gradients'

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

  const renderInput = (label: string, value: string, onChangeText: (text: string) => void, icon: string, keyboardType: any = 'default', secureTextEntry: boolean = false, error: string = '') => (
    <Animatable.View animation="fadeInUp" duration={800} style={styles.inputContainer}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        mode="outlined"
        outlineColor={colors.primary}
        activeOutlineColor={colors.primary}
        activeUnderlineColor='transparent'
        textColor={colors.text}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !showPassword}
        left={<TextInput.Icon icon={icon} color={colors.primary} />}
        right={secureTextEntry && (
          <TextInput.Icon 
            icon={showPassword ? "eye-off" : "eye"} 
            color={colors.primary}
            onPress={() => setShowPassword(!showPassword)}
          />
        )}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}
    </Animatable.View>
  )

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
              showsVerticalScrollIndicator={false}
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
                  text={t('joinPaddleCommunity')}
                  fontSize={24}
                  intensity={1.2}
                  style={styles.fireTitle}
                />
              </Animatable.View>
              <Animatable.View animation="fadeInUp" duration={1000} delay={1000} style={styles.formContainer}>
                {renderInput(t('fullName'), fullName, setFullName, 'account')}
                {renderInput(t('username'), userName, setUserName, 'at')}
                {renderInput(t('email'), email, (text) => {
                  setEmail(text)
                  setEmailError('')
                }, 'email', 'email-address', false, emailError)}
                {renderInput(t('password'), password, (text) => {
                  setPassword(text)
                  setPasswordError('')
                }, 'lock', 'default', true, passwordError)}
                {renderInput(t('apartmentNumber'), apartment, setApartment, 'home')}
                {renderInput(t('phoneNumber'), phoneNumber, setPhoneNumber, 'phone', 'phone-pad')}
                
                <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.button}>
                  <LinearGradient
                    colors={gradients.greenTheme}
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
              </Animatable.View>
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
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  fireTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 30,
    color: colors.text,
  },
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  errorText: {
    color: colors.error,
    marginTop: 4,
  },
  button: {
    marginTop: 24,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradientButton: {
    height: 50,
    padding:10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 18,
    
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  loginButton: {
    marginTop: 16,
  },
  loginButtonLabel: {
    fontSize: 16,
    color: 'white',
  },
})

