import React, { useState } from 'react'
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput, Button, Title, Card, Text } from 'react-native-paper'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'

type CommunityCodeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CommunityCode'>;
type CommunityCodeScreenRouteProp = RouteProp<RootStackParamList, 'CommunityCode'>;

type Props = {
  navigation: CommunityCodeScreenNavigationProp;
  route: CommunityCodeScreenRouteProp;
};

export default function CommunityCodeScreen({ navigation, route }: Props) {
  const [communityCode, setCommunityCode] = useState('')
  const [loading, setLoading] = useState(false)

  const { userId } = route.params

  async function handleSubmitCode() {
    if (!communityCode) {
      Alert.alert('Error', 'Please enter a community code')
      return
    }

    setLoading(true)
    // Here you would typically validate the community code against your database
    // For this example, we'll just update the user's profile with the code
    const { error } = await supabase
      .from('profiles')
      .update({ community_code: communityCode })
      .eq('id', userId)

    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Community code added successfully')
      navigation.navigate('Home')
    }
  }

  function handleSkip() {
    navigation.navigate('Home')
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={['#00A86B', '#0f3d0f', '#000000']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="home-group" size={50} color="#00A86B" />
              </View>
              <Title style={styles.title}>Join a Community</Title>
              <Text style={styles.subtitle}>Enter your community code or skip to continue</Text>
              <TextInput
                label="Community Code"
                value={communityCode}
                onChangeText={setCommunityCode}
                style={styles.input}
                mode="outlined"
                left={<TextInput.Icon icon="key" color="#00A86B" />}
                theme={{ colors: { primary: '#00A86B', text: '#333' } }}
              />
              <Button 
                mode="contained" 
                onPress={handleSubmitCode} 
                style={styles.button} 
                loading={loading} 
                disabled={loading}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                color="#00A86B"
              >
                Submit Code
              </Button>
              <Button 
                onPress={handleSkip} 
                style={styles.skipButton}
                labelStyle={styles.skipButtonLabel}
                color="#00A86B"
              >
                Skip for now
              </Button>
            </Card.Content>
          </Card>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    elevation: 4,
    borderRadius: 20,
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
  skipButton: {
    marginTop: 8,
  },
  skipButtonLabel: {
    fontSize: 14,
    color: '#1a5c1a',
  },
})