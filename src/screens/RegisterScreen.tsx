import React, { useState, useEffect, useLayoutEffect } from 'react'
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native'
import { TextInput, Button, Title, HelperText, useTheme, Card, Text } from 'react-native-paper'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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

  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const screenHeight = Dimensions.get('window').height

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/
    return re.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }
    useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: false, // Esto oculta completamente la cabecera
      });
    }, [navigation]);

  async function handleRegister() {
    setEmailError('')
    setPasswordError('')

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters long')
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
        return Alert.alert('Error', 'This email domain is not authorized. Please contact the administrator for assistance.')
      }
      return Alert.alert('Error', authError.message)
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
        return Alert.alert('Error', profileError.message)
      }

      Alert.alert('Success', 'Registration successful. Please check your email to verify your account.')
      navigation.navigate('Login')
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={['#00A86B', '#0f3d0f', '#000000']}
        style={[styles.gradient, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, { minHeight: screenHeight - insets.top - insets.bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.cardContainer}>
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="tennis" size={50} color="#00A86B" />
                  </View>
                  <Title style={styles.title}>Join Paddle Court</Title>
                  <Text style={styles.subtitle}>Create your account to start booking</Text>
                  <TextInput
                    label="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" color="#00A86B" />}
                    theme={{ colors: { primary: '#00A86B', text: '#333' } }}
                  />
                  <TextInput
                    label="Username"
                    value={userName}
                    onChangeText={setUserName}
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="at" color="#00A86B" />}
                    theme={{ colors: { primary: '#00A86B', text: '#333' } }}
                  />
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text)
                      setEmailError('')
                    }}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={!!emailError}
                    mode="outlined"
                    left={<TextInput.Icon icon="email" color="#00A86B" />}
                    theme={{ colors: { primary: '#00A86B', text: '#333' } }}
                  />
                  <HelperText type="error" visible={!!emailError}>
                    {emailError}
                  </HelperText>
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      setPasswordError('')
                    }}
                    secureTextEntry
                    style={styles.input}
                    error={!!passwordError}
                    mode="outlined"
                    left={<TextInput.Icon icon="lock" color="#00A86B" />}
                    theme={{ colors: { primary: '#00A86B', text: '#333' } }}
                  />
                  <HelperText type="error" visible={!!passwordError}>
                    {passwordError}
                  </HelperText>
                  <TextInput
                    label="Apartment Number"
                    value={apartment}
                    onChangeText={setApartment}
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="home" color="#00A86B" />}
                    theme={{ colors: { primary: '#00A86B', text: '#333' } }}
                  />
                  <TextInput
                    label="Phone Number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={styles.input}
                    keyboardType="phone-pad"
                    mode="outlined"
                    left={<TextInput.Icon icon="phone" color="#00A86B" />}
                    theme={{ colors: { primary: '#00A86B', text: '#333' } }}
                  />
                  
                  <Button 
                    mode="contained" 
                    onPress={handleRegister} 
                    style={styles.button} 
                    loading={loading} 
                    disabled={loading}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    color="#00A86B"
                  >
                    Create Account
                  </Button>
                  <Button 
                    onPress={() => navigation.navigate('Login')} 
                    style={styles.loginButton}
                    labelStyle={styles.loginButtonLabel}
                    color="#00A86B"
                  >
                    Already have an account? Log in
                  </Button>
                </Card.Content>
              </Card>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom:200,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
    borderRadius: 20,
    marginVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(26, 92, 26, 0.1)',
    borderRadius: 50,
    padding: 16,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#00A86B',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#0f3d0f',
    opacity: 0.8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 25,
    elevation: 2,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonLabel: {
    fontSize: 14,
    color: '#1a5c1a',
  },
})