import React, { useState, useLayoutEffect } from 'react'
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image, SafeAreaView, Text as RNText } from 'react-native'
import { TextInput, Button, HelperText, useTheme, Text, Checkbox } from 'react-native-paper'
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
import { signInWithGoogle } from '../lib/googleAuth'

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>

type Props = {
  navigation: RegisterScreenNavigationProp
}

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userName, setUserName] = useState('')
  const [apartment, setApartment] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Form errors
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userName: '',
    fullName: '',
    phoneNumber: '',
    terms: '',
  })

  // Password strength criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  const theme = useTheme()
  const { t } = useTranslation()

  // Validation functions
  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }

  const validateUsername = (username: string) => {
    const regex = /^[a-zA-Z0-9_]{3,20}$/
    return regex.test(username)
  }

  const validatePhoneNumber = (phone: string) => {
    const regex = /^\+?[0-9]{8,15}$/
    return phone === '' || regex.test(phone)
  }

  const validateFullName = (name: string) => {
    return name.length >= 2 && name.length <= 50
  }

  const validatePasswordStrength = (password: string) => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }
    setPasswordCriteria(criteria)
    return Object.values(criteria).filter(Boolean).length >= 3
  }

  // Real-time password validation
  React.useEffect(() => {
    if (password) {
      validatePasswordStrength(password)
    }
  }, [password])

  const getPasswordStrengthColor = () => {
    const strength = Object.values(passwordCriteria).filter(Boolean).length
    if (strength <= 2) return colors.error
    if (strength <= 4) return '#FFA500'
    return colors.success || '#4CAF50'
  }

  const getPasswordStrengthText = () => {
    const strength = Object.values(passwordCriteria).filter(Boolean).length
    if (strength <= 2) return t('weak')
    if (strength <= 4) return t('medium')
    return t('strong')
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const validateForm = async () => {
    const errors = {
      email: '',
      password: '',
      confirmPassword: '',
      userName: '',
      fullName: '',
      phoneNumber: '',
      terms: '',
    }

    let isValid = true

    // Email validation
    if (!validateEmail(email)) {
      errors.email = t('invalidEmailError') || 'Invalid email format'
      isValid = false
    }

    // Username validation
    if (!validateUsername(userName)) {
      errors.userName = t('invalidUsernameError') || 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
      isValid = false
    }

    // Full name validation
    if (!validateFullName(fullName)) {
      errors.fullName = t('invalidNameError') || 'Name must be between 2 and 50 characters'
      isValid = false
    }

    // Phone validation (if provided)
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      errors.phoneNumber = t('invalidPhoneError') || 'Please enter a valid phone number'
      isValid = false
    }

    // Password validation
    if (!validatePasswordStrength(password)) {
      errors.password = t('weakPasswordError') || 'Password is too weak'
      isValid = false
    }

    // Confirm password
    if (password !== confirmPassword) {
      errors.confirmPassword = t('passwordMismatchError') || 'Passwords do not match'
      isValid = false
    }

    // Terms acceptance
    if (!acceptTerms) {
      errors.terms = t('termsRequiredError') || 'You must accept the terms and conditions'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  async function handleRegister() {
    // Reset errors
    setFormErrors({
      email: '',
      password: '',
      confirmPassword: '',
      userName: '',
      fullName: '',
      phoneNumber: '',
      terms: '',
    })

    // Validate form
    const isValid = await validateForm()
    if (!isValid) return

    setLoading(true)

    try {
      // Sign up the user first
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            username: userName,
            phone_number: phoneNumber,
          }
        }
      })
      
      if (authError) {
        // Handle specific email already exists error from Supabase auth
        if (authError.message.includes('User already registered')) {
          setFormErrors(prev => ({ ...prev, email: t('emailAlreadyExists') || 'Email already exists' }))
        } else if (authError.message.includes('Email not allowed')) {
          Alert.alert(t('error') || 'Error', t('unauthorizedEmailError') || 'Email not allowed')
        } else {
          Alert.alert(t('error') || 'Error', authError.message)
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        // Now create/update the profile
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

        if (profileError) {
          // Handle username uniqueness error
          if (profileError.message.includes('duplicate') || 
              profileError.message.includes('unique') ||
              profileError.message.includes('profiles_username_unique')) {
            setFormErrors(prev => ({ 
              ...prev, 
              userName: t('usernameAlreadyExists') || 'Username already exists' 
            }))
          } else {
            Alert.alert(t('error') || 'Error', profileError.message)
          }
          setLoading(false)
          return
        }

        // Success!
        setLoading(false)
        Alert.alert(
          t('success') || 'Success', 
          t('registrationSuccessful') || 'Registration successful'
        )
        navigation.navigate('CommunityCode', { userId: authData.user.id })
      }
    } catch (error: any) {
      setLoading(false)
      console.error('Registration error:', error)
      Alert.alert(
        t('error') || 'Error', 
        error.message || t('genericError') || 'An error occurred'
      )
    }
  }

  const handleGoogleSignUp = async () => {
    console.log("🔵 Google Sign-Up iniciado...");
    setIsGoogleLoading(true);

    try {
      const { data, error } = await signInWithGoogle();

      console.log("📤 Respuesta de signInWithGoogle:", { data, error });

      if (error) {
        console.error("❌ Error en Google Sign-Up:", error);
        if (error !== 'User cancelled the authentication') {
          Alert.alert(t('error') || 'Error', error);
        }
      } else if (data) {
        console.log("✅ Google Sign-Up exitoso, datos:", data);
        navigation.navigate('Home');
      }
    } catch (err) {
      console.error("🔥 Excepción no controlada en Google Sign-Up:", err);
      Alert.alert(t('error') || 'Error', String(err));
    } finally {
      setIsGoogleLoading(false);
      console.log("🔵 Google Sign-Up finalizado.");
    }
  }

  const renderPasswordStrength = () => {
    if (!password) return null
    
    const strength = Object.values(passwordCriteria).filter(Boolean).length
    const strengthPercentage = (strength / 5) * 100

    return (
      <View style={styles.passwordStrengthContainer}>
        <View style={styles.passwordStrengthHeader}>
          <Text style={styles.passwordStrengthLabel}>
            {t('passwordStrength') || 'Password Strength'}: 
            <Text style={{ color: getPasswordStrengthColor() }}>
              {' '}{getPasswordStrengthText()}
            </Text>
          </Text>
        </View>
        <View style={styles.strengthBar}>
          <View 
            style={[
              styles.strengthBarFill, 
              { 
                width: `${strengthPercentage}%`, 
                backgroundColor: getPasswordStrengthColor() 
              }
            ]} 
          />
        </View>
        <View style={styles.criteriaContainer}>
          {Object.entries(passwordCriteria).map(([key, met]) => (
            <View key={key} style={styles.criteriaItem}>
              <Text style={[styles.criteriaText, { color: met ? colors.success : colors.textSecondary }]}>
                {met ? '✓' : '×'} {getCriteriaText(key)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const getCriteriaText = (criteria: string) => {
    switch (criteria) {
      case 'length': return t('minChars') || 'At least 8 characters'
      case 'uppercase': return t('upperCase') || 'Uppercase letter'
      case 'lowercase': return t('lowerCase') || 'Lowercase letter'
      case 'number': return t('number') || 'Number'
      case 'special': return t('special') || 'Special character'
      default: return ''
    }
  }

  const renderInput = (
    label: string, 
    value: string, 
    onChangeText: (text: string) => void, 
    icon: string, 
    keyboardType: any = 'default', 
    secureTextEntry: boolean = false, 
    error: string = '',
    showPasswordToggle: boolean = false,
    isPassword: boolean = false
  ) => (
    <Animatable.View animation="fadeInUp" duration={800} style={styles.inputContainer}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        mode="outlined"
        outlineColor={error ? colors.error : colors.primary}
        activeOutlineColor={error ? colors.error : colors.primary}
        activeUnderlineColor='transparent'
        textColor={colors.text}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && (isPassword ? !showPassword : !showConfirmPassword)}
        left={<TextInput.Icon icon={icon} color={colors.primary} />}
        right={showPasswordToggle && (
          <TextInput.Icon 
            icon={isPassword ? (showPassword ? "eye-off" : "eye") : (showConfirmPassword ? "eye-off" : "eye")} 
            color={colors.primary}
            onPress={() => isPassword ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
          />
        )}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}
      {/* Show password strength for password field */}
      {isPassword && renderPasswordStrength()}
      {/* Show match indicator for confirm password */}
      {!isPassword && secureTextEntry && confirmPassword && password === confirmPassword && !error && (
        <HelperText type="info" visible={true} style={styles.successText}>
          ✓ {t('passwordsMatch') || 'Passwords match'}
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
                  text={t('joinPaddleCommunity') || 'Join the Paddle Community'}
                  fontSize={24}
                  intensity={1.2}
                  style={styles.fireTitle}
                />
              </Animatable.View>

              {/* Google Sign Up Button */}
              <Animatable.View animation="fadeInUp" duration={1000} delay={750} style={styles.googleButtonContainer}>
                <TouchableOpacity 
                  onPress={handleGoogleSignUp} 
                  disabled={isGoogleLoading}
                  style={styles.googleButton}
                >
                  <View style={styles.googleButtonContent}>
                    <Image 
                      source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} 
                      style={styles.googleIcon}
                    />
                    {isGoogleLoading ? (
                      <ActivityIndicator color="#757575" size="small" style={styles.googleSpinner} />
                    ) : (
                      <Text style={styles.googleButtonText}>
                        {t('continueWithGoogle') || 'Continue with Google'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </Animatable.View>

              {/* Divider */}
              <Animatable.View animation="fadeInUp" duration={1000} delay={1000} style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {t('orRegisterWith') || 'or register with'}
                </Text>
                <View style={styles.dividerLine} />
              </Animatable.View>
              
              <Animatable.View animation="fadeInUp" duration={1000} delay={1250} style={styles.formContainer}>
                {renderInput(t('fullName') || 'Full Name', fullName, setFullName, 'account', 'default', false, formErrors.fullName)}
                {renderInput(t('username') || 'Username', userName, setUserName, 'at', 'default', false, formErrors.userName)}
                {renderInput(t('email') || 'Email', email, setEmail, 'email', 'email-address', false, formErrors.email)}
                {renderInput(t('password') || 'Password', password, setPassword, 'lock', 'default', true, formErrors.password, true, true)}
                {renderInput(t('confirmPassword') || 'Confirm Password', confirmPassword, setConfirmPassword, 'lock', 'default', true, formErrors.confirmPassword, true, false)}
                {renderInput(t('phoneNumber') || 'Phone Number', phoneNumber, setPhoneNumber, 'phone', 'phone-pad', false, formErrors.phoneNumber)}
                {apartment && renderInput(t('apartment') || 'Apartment', apartment, setApartment, 'home')}

                {/* Terms and Conditions */}
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={acceptTerms ? 'checked' : 'unchecked'}
                    onPress={() => setAcceptTerms(!acceptTerms)}
                    color={colors.primary}
                  />
                  <TouchableOpacity onPress={() => setAcceptTerms(!acceptTerms)} style={styles.checkboxTextContainer}>
                    <Text style={styles.checkboxText}>
                      {t('acceptTerms') || 'I accept the'} 
                      <Text style={styles.linkText}> {t('termsAndConditions') || 'Terms and Conditions'}</Text>
                      {t('andThe') || ' and the'} 
                      <Text style={styles.linkText}> {t('privacyPolicy') || 'Privacy Policy'}</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
                {formErrors.terms && (
                  <HelperText type="error" visible={!!formErrors.terms} style={styles.errorText}>
                    {formErrors.terms}
                  </HelperText>
                )}

                {/* Security Note */}
                <View style={styles.securityNote}>
                  <Text style={styles.securityNoteText}>
                    🛡️ {t('securityNote') || 'Your data is encrypted and secure'}
                  </Text>
                </View>
                
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
                      <Text style={styles.buttonLabel}>
                        {t('createAccount') || 'Create Account'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <Button 
                  onPress={() => navigation.navigate('Login')}
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonLabel}
                >
                  {t('alreadyHaveAccount') || 'Already have an account?'}
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
    marginBottom: 20,
    color: colors.text,
  },
  googleButtonContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  googleButton: {
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
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 15,
    fontSize: 14,
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
  successText: {
    color: colors.success || '#4CAF50',
    marginTop: 4,
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: colors.textSecondary || '#666',
  },
  strengthBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  criteriaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  criteriaItem: {
    width: '48%',
    marginBottom: 2,
  },
  criteriaText: {
    fontSize: 11,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 16,
    width: '100%',
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  checkboxText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  securityNote: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    marginBottom: 16,
    width: '100%',
  },
  securityNoteText: {
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
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
    padding: 10,
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