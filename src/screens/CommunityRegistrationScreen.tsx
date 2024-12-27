import React, { useState } from 'react'
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { TextInput, Button, useTheme, Text } from 'react-native-paper'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { colors } from '../theme/colors'
import { useTranslation } from 'react-i18next'

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  CommunityRegistration: undefined;
};

type CommunityRegistrationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CommunityRegistration'>;

type Props = {
  navigation: CommunityRegistrationScreenNavigationProp;
};

export default function CommunityRegistrationScreen({ navigation }: Props) {
  const [communityName, setCommunityName] = useState('')
  const [address, setAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const { t } = useTranslation()

  async function handleRegistration() {
  setLoading(true)
  
  try {
    const { error } = await supabase.functions.invoke('send-community-registration-email', {
      body: JSON.stringify({
        communityName,
        address,
        contactName,
        phoneNumber,
      }),
    })

    if (error) throw error

    Alert.alert(t('success'), t('communityRegistrationSuccess'))
    navigation.navigate('Login')
  } catch (error) {
    Alert.alert(t('error'), error.message)
  } finally {
    setLoading(false)
  }
}
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
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.title}>{t('communityRegistrationTitle')}</Text>
          <View style={styles.formContainer}>
            <TextInput
              label={t('communityName')}
              value={communityName}
              onChangeText={setCommunityName}
              style={styles.input}
              mode="flat"
              underlineColor="transparent"
              textColor='#fff'
            />
            <TextInput
              label={t('address')}
              value={address}
              onChangeText={setAddress}
              style={styles.input}
              mode="flat"
              underlineColor="transparent"
              textColor='#fff'
            />
            <TextInput
              label={t('contactName')}
              value={contactName}
              onChangeText={setContactName}
              style={styles.input}
              mode="flat"
              underlineColor="transparent"
              textColor='#fff'
            />
            <TextInput
              label={t('phoneNumber')}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={styles.input}
              mode="flat"
              underlineColor="transparent"
              textColor='#fff'
              keyboardType="phone-pad"
            />
            <Button 
              onPress={handleRegistration}
              disabled={loading}
              mode="contained"
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              {loading ? t('sending') : t('sendRegistration')}
            </Button>
          </View>
        </ScrollView>
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
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  button: {
    marginTop: 24,
    borderRadius: 25,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
})

