import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { TextInput, Button, Title } from 'react-native-paper'
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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apartment, setApartment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    
    if (authError) {
      setLoading(false)
      if (authError.message.includes('Email not allowed')) {
        return Alert.alert('Error', 'This email domain is not authorized. Please use an authorized email address or contact the administrator.')
      }
      return Alert.alert('Error', authError.message)
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: authData.user.id, name, apartment })

      setLoading(false)

      if (profileError) {
        return Alert.alert('Error', profileError.message)
      }

      Alert.alert('Success', 'Registration successful. Please check your email to verify your account.')
      navigation.navigate('Login')
    }
  }

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Register</Title>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        label="Apartment"
        value={apartment}
        onChangeText={setApartment}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleRegister} style={styles.button} loading={loading} disabled={loading}>
        Register
      </Button>
      <Button onPress={() => navigation.navigate('Login')}>
        Already have an account? Login
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  button: {
    marginTop: 24,
    marginBottom: 12,
  },
})