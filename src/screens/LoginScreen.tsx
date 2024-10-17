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

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      navigation.navigate('Home')
    }
  }

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Paddle Court Booking</Title>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button mode="contained" onPress={handleLogin} style={styles.button} loading={loading} disabled={loading}>
        Login
      </Button>
      <Button onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register
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