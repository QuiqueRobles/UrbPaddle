import React, { useState } from 'react'
import { View, StyleSheet, Alert, ScrollView } from 'react-native'
import { TextInput, Button, Title, HelperText, Checkbox } from 'react-native-paper'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [apartment, setApartment] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isResident, setIsResident] = useState(false)
  const [loading, setLoading] = useState(false)

  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/
    return re.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

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
          phone_number: phoneNumber,
          is_resident: isResident,
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
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>Register for Paddle Court</Title>
      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
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
      />
      <HelperText type="error" visible={!!passwordError}>
        {passwordError}
      </HelperText>
      <TextInput
        label="Apartment Number"
        value={apartment}
        onChangeText={setApartment}
        style={styles.input}
      />
      <TextInput
        label="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        style={styles.input}
        keyboardType="phone-pad"
      />
      <View style={styles.checkboxContainer}>
        <Checkbox
          status={isResident ? 'checked' : 'unchecked'}
          onPress={() => setIsResident(!isResident)}
        />
        <HelperText type="info" visible={true} onPress={() => setIsResident(!isResident)}>
          I am a resident
        </HelperText>
      </View>
      <Button 
        mode="contained" 
        onPress={handleRegister} 
        style={styles.button} 
        loading={loading} 
        disabled={loading}
      >
        Register
      </Button>
      <Button onPress={() => navigation.navigate('Login')}>
        Already have an account? Login
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  button: {
    marginTop: 24,
    marginBottom: 12,
  },
})