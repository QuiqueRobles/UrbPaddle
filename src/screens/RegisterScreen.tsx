import React, { useState, useLayoutEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Animated } from 'react-native';
import { TextInput, useTheme, Text, Checkbox, HelperText } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import FireText from '../components/FireText';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { signInWithGoogle } from '../lib/googleAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [apartment, setApartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Form errors
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userName: '',
    fullName: '',
    phoneNumber: '',
    terms: '',
  });

  // Password strength criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const inputFields = ['fullName', 'userName', 'email', 'password', 'confirmPassword', 'phoneNumber', 'apartment'];
  const inputAnimations = useRef(inputFields.reduce((acc, field) => {
    acc[field] = new Animated.Value(0);
    return acc;
  }, {})).current;

  const animateInput = (animation: Animated.Value, toValue: number) => {
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const validateUsername = (username: string) => {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
  };

  const validatePhoneNumber = (phone: string) => {
    const regex = /^\+?[0-9]{8,15}$/;
    return phone === '' || regex.test(phone);
  };

  const validateFullName = (name: string) => {
    return name.length >= 2 && name.length <= 50;
  };

  const validatePasswordStrength = (password: string) => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    setPasswordCriteria(criteria);
    return Object.values(criteria).filter(Boolean).length >= 3;
  };

  // Real-time password validation
  React.useEffect(() => {
    if (password) {
      validatePasswordStrength(password);
    }
  }, [password]);

  const getPasswordStrengthColor = () => {
    const strength = Object.values(passwordCriteria).filter(Boolean).length;
    if (strength <= 2) return colors.error;
    if (strength <= 4) return '#FFA500';
    return colors.success || '#4CAF50';
  };

  const getPasswordStrengthText = () => {
    const strength = Object.values(passwordCriteria).filter(Boolean).length;
    if (strength <= 2) return t('weak');
    if (strength <= 4) return t('medium');
    return t('strong');
  };

  // Check if email exists
  const checkEmailExists = async (email: string) => {
    const { data } = await supabase.from('profiles').select('id').eq('email', email).single();
    return !!data;
  };

  // Check if username exists
  const checkUsernameExists = async (username: string) => {
    const { data } = await supabase.from('profiles').select('id').eq('username', username).single();
    return !!data;
  };

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
    };

    let isValid = true;

    // Email validation
    if (!validateEmail(email)) {
      errors.email = t('invalidEmailError') || 'Invalid email format';
      isValid = false;
    } else if (await checkEmailExists(email)) {
      errors.email = t('emailAlreadyExists') || 'Email already exists';
      isValid = false;
    }

    // Username validation
    if (!validateUsername(userName)) {
      errors.userName = t('invalidUsernameError') || 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
      isValid = false;
    } else if (await checkUsernameExists(userName)) {
      errors.userName = t('usernameAlreadyExists') || 'Username already exists';
      isValid = false;
    }

    // Full name validation
    if (!validateFullName(fullName)) {
      errors.fullName = t('invalidNameError') || 'Name must be between 2 and 50 characters';
      isValid = false;
    }

    // Phone validation (if provided)
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      errors.phoneNumber = t('invalidPhoneError') || 'Please enter a valid phone number';
      isValid = false;
    }

    // Password validation
    if (!validatePasswordStrength(password)) {
      errors.password = t('weakPasswordError') || 'Password is too weak';
      isValid = false;
    }

    // Confirm password
    if (password !== confirmPassword) {
      errors.confirmPassword = t('passwordMismatchError') || 'Passwords do not match';
      isValid = false;
    }

    // Terms acceptance
    if (!acceptTerms) {
      errors.terms = t('termsRequiredError') || 'You must accept the terms and conditions';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  async function handleRegister() {
    setFormErrors({
      email: '',
      password: '',
      confirmPassword: '',
      userName: '',
      fullName: '',
      phoneNumber: '',
      terms: '',
    });

    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);

    try {
      // Store user data in AsyncStorage to use after confirmation
      const userData = {
        email,
        fullName,
        userName,
        phoneNumber,
        apartment,
      };
      await AsyncStorage.setItem('pendingUserData', JSON.stringify(userData));

      // Get current language for redirect URL
      const lang = i18n.language || 'en';

      // Sign up with Supabase - email confirmation is required
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `https://qourtify.com/${lang}/confirm-email`, 
          data: {
            full_name: fullName,
            username: userName,
            phone_number: phoneNumber,
            apartment,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setFormErrors((prev) => ({ ...prev, email: t('emailAlreadyExists') || 'Email already exists' }));
        } else if (authError.message.includes('Email not allowed')) {
          Alert.alert(t('error') || 'Error', t('unauthorizedEmailError') || 'Email not allowed');
        } else {
          Alert.alert(t('error') || 'Error', authError.message);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      Alert.alert(
        t('success') || 'Success',
        t('confirmationEmailSent') || 'A confirmation email has been sent. Please check your inbox.'
      );
      // Navigate to ConfirmEmailSent screen with the email
      navigation.navigate('ConfirmEmailSent', { email });
    } catch (error: any) {
      setLoading(false);
      console.error('Registration error:', error);
      Alert.alert(
        t('error') || 'Error',
        error.message || t('genericError') || 'An error occurred'
      );
    }
  }

  async function handleGoogleSignUp() {
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
    if (!password) return null;

    const strength = Object.values(passwordCriteria).filter(Boolean).length;
    const strengthPercentage = (strength / 5) * 100;

    return (
      <View style={styles.passwordStrengthContainer}>
        <View style={styles.passwordStrengthHeader}>
          <Text style={styles.passwordStrengthLabel}>
            {t('passwordStrength') || 'Password Strength'}: {' '}
            <Text style={{ color: getPasswordStrengthColor() }}>{getPasswordStrengthText()}</Text>
          </Text>
        </View>
        <View style={styles.strengthBar}>
          <View
            style={[
              styles.strengthBarFill,
              {
                width: `${strengthPercentage}%`,
                backgroundColor: getPasswordStrengthColor(),
              },
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
    );
  };

  const getCriteriaText = (criteria: string) => {
    switch (criteria) {
      case 'length':
        return t('minChars') || 'At least 8 characters';
      case 'uppercase':
        return t('upperCase') || 'Uppercase letter';
      case 'lowercase':
        return t('lowerCase') || 'Lowercase letter';
      case 'number':
        return t('number') || 'Number';
      case 'special':
        return t('special') || 'Special character';
      default:
        return '';
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: string,
    keyboardType: any = 'default',
    secureTextEntry: boolean = false,
    error: string = '',
    showPasswordToggle: boolean = false,
    isPassword: boolean = false,
    animationKey: string
  ) => (
    <Animated.View style={[
      styles.inputContainer,
      {
        borderColor: inputAnimations[animationKey].interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(255,255,255,0.1)', '#00C853']
        }),
        shadowOpacity: inputAnimations[animationKey].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.3]
        })
      }
    ]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        autoCapitalize="none"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && (isPassword ? !showPassword : !showConfirmPassword)}
        mode="outlined"
        outlineColor="transparent"
        activeOutlineColor="transparent"
        selectionColor="#00C853"
        textColor='#ffffff'
        placeholderTextColor="rgba(255,255,255,0.6)"
        theme={{
          colors: {
            onSurfaceVariant: 'rgba(255,255,255,0.6)',
            outline: 'transparent',
          }
        }}
        left={<TextInput.Icon icon={icon} iconColor="rgba(255,255,255,0.6)" />}
        right={
          showPasswordToggle && (
            <TextInput.Icon 
              icon={isPassword ? (showPassword ? "eye-off" : "eye") : (showConfirmPassword ? "eye-off" : "eye")} 
              iconColor="rgba(255,255,255,0.6)"
              onPress={() => isPassword ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
            />
          )
        }
        onFocus={() => animateInput(inputAnimations[animationKey], 1)}
        onBlur={() => animateInput(inputAnimations[animationKey], 0)}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}
      {isPassword && renderPasswordStrength()}
      {!isPassword && secureTextEntry && confirmPassword && password === confirmPassword && !error && (
        <HelperText type="info" visible={true} style={styles.successText}>
          ✓ {t('passwordsMatch') || 'Passwords match'}
        </HelperText>
      )}
      {!isPassword && label === (t('username') || 'Username') && userName && !error && validateUsername(userName) && (
        <HelperText type="info" visible={true} style={styles.successText}>
          ✓ {t('validUsername') || 'Valid username format'}
        </HelperText>
      )}
    </Animated.View>
  );

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
                text={t('joinPaddleCommunity') || 'Join the Paddle Community'}
                fontSize={19}
                intensity={0.8}
                style={styles.welcomeFireText}
              />
            </Animatable.View>

            {/* Register Form */}
            <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
              {/* Google Sign-Up Button */}
              <TouchableOpacity 
                onPress={handleGoogleSignUp} 
                style={styles.googleButton}
                disabled={isGoogleLoading}
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
              
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('or') || 'OR'}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Inputs */}
              {renderInput(t('fullName') || 'Full Name', fullName, setFullName, 'account', 'default', false, formErrors.fullName, false, false, 'fullName')}
              {renderInput(t('username') || 'Username', userName, setUserName, 'at', 'default', false, formErrors.userName, false, false, 'userName')}
              {renderInput(t('email') || 'Email', email, setEmail, 'email', 'email-address', false, formErrors.email, false, false, 'email')}
              {renderInput(t('password') || 'Password', password, setPassword, 'lock', 'default', true, formErrors.password, true, true, 'password')}
              {renderInput(t('confirmPassword') || 'Confirm Password', confirmPassword, setConfirmPassword, 'lock', 'default', true, formErrors.confirmPassword, true, false, 'confirmPassword')}
              {renderInput(t('phoneNumber') || 'Phone Number', phoneNumber, setPhoneNumber, 'phone', 'phone-pad', false, formErrors.phoneNumber, false, false, 'phoneNumber')}
              {renderInput(t('apartment') || 'Apartment', apartment, setApartment, 'home', 'default', false, '', false, false, 'apartment')}

              {/* Terms and Conditions */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  style={styles.customCheckbox}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={acceptTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={acceptTerms ? '#00C853' : 'rgba(255,255,255,0.6)'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  style={styles.checkboxTextContainer}
                >
                  <Text style={styles.checkboxText}>
                    {t('acceptTerms') || 'I accept the'}{' '}
                    <Text style={styles.linkText}>{t('termsAndConditions') || 'Terms and Conditions'}</Text>
                    {t('andThe') || ' and the'}{' '}
                    <Text style={styles.linkText}>{t('privacyPolicy') || 'Privacy Policy'}</Text>
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

              {/* Create Account Button */}
              <TouchableOpacity 
                onPress={handleRegister} 
                style={[
                  styles.signInButton,
                  { opacity: (loading || isGoogleLoading) ? 0.7 : 1 }
                ]} 
                disabled={loading || isGoogleLoading}
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
                    <Text style={styles.signInButtonText}>{t('createAccount') || 'Create Account'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Already have account Section */}
              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>
                  {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signUpLink}>{t('login') || 'Sign In'}</Text>
                </TouchableOpacity>
              </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  logoSection: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  logoContainer: {
    marginTop: -70,
    marginBottom: -80,
  },
  logo: {
    width: 280,
    height: 280,
  },
  welcomeFireText: {
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
  passwordStrengthContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  passwordStrengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.8)',
  },
  errorText: {
    color: colors.error,
    paddingHorizontal: 16,
  },
  successText: {
    color: '#00C853',
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 16,
    borderColor: '#00C853',  
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 8,
    
  },
  checkboxText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: '#00C853',
    textDecorationLine: 'underline',
  },
  securityNote: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 83, 0.2)',
    marginBottom: 16,
    alignItems: 'center',
  },
  securityNoteText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
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
});