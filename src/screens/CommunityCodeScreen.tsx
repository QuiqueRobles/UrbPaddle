import React, { useState, useLayoutEffect } from 'react'
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image, SafeAreaView } from 'react-native'
import { TextInput, Button, Text, useTheme } from 'react-native-paper'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../navigation'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { colors } from '../theme/colors'
import FireText from '../components/FireText'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next';

type CommunityCodeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CommunityCode'>

type Props = {
  navigation: CommunityCodeScreenNavigationProp
  route: {
    params: {
      userId: string
    }
  }
}

export default function CommunityCodeScreen({ navigation, route }: Props) {
  const [communityCode, setCommunityCode] = useState('')
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const { userId } = route.params
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  async function handleJoinCommunity() {
    if (!communityCode.trim()) {
      Alert.alert(t('error'), t('enterCommunityCode'))
      return
    }

    setLoading(true)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('resident_community_id, guest_communities')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Check if the code matches a resident_code
      const { data: residentCommunityData, error: residentError } = await supabase
        .from('community')
        .select('id, name')
        .eq('resident_code', communityCode)
        .single()
      
      if (!residentError && residentCommunityData) {
        // Code matches a resident_code
        if (profileData.resident_community_id) {
          Alert.alert(t('error'), t('alreadyResident'))
          setLoading(false)
          return
        }

        if (profileData.guest_communities && profileData.guest_communities.includes(residentCommunityData.id)) {
          Alert.alert(
            t('confirmation'),
            t('becomeResidentConfirmation'),
            [
              {
                text: t('cancel'),
                style: 'cancel',
                onPress: () => setLoading(false)
              },
              {
                text: t('confirm'),
                onPress: async () => {
                  const updatedGuestCommunities = profileData.guest_communities.filter((id: string) => id !== residentCommunityData.id)
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ 
                      resident_community_id: residentCommunityData.id,
                      guest_communities: updatedGuestCommunities
                    })
                    .eq('id', userId)

                  if (updateError) throw updateError

                  Alert.alert(t('success'), t('nowResident', { name: residentCommunityData.name }))
                  navigation.navigate('Home')
                }
              }
            ]
          )
          return
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ resident_community_id: residentCommunityData.id })
          .eq('id', userId)

        if (updateError) throw updateError

        Alert.alert(t('success'), t('joinedAsResident', { name: residentCommunityData.name }))
        navigation.navigate('Home')
        return
      }

      // If not a resident_code, check if it's a guest_code
      const { data: guestCommunityData, error: guestError } = await supabase
        .from('community')
        .select('id, name')
        .eq('guest_code', communityCode)
        .single()

      if (guestError || !guestCommunityData) {
        Alert.alert(t('error'), t('invalidJoinCode'))
        setLoading(false)
        return
      }

      // Code matches a guest_code
      if (profileData.resident_community_id === guestCommunityData.id) {
        Alert.alert(t('error'), t('alreadyResidentCantBeGuest'))
        setLoading(false)
        return
      }

      if (profileData.guest_communities && profileData.guest_communities.includes(guestCommunityData.id)) {
        Alert.alert(t('error'), t('alreadyGuest'))
        setLoading(false)
        return
      }

      const updatedGuestCommunities = [
        ...(profileData.guest_communities || []),
        guestCommunityData.id
      ]

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ guest_communities: updatedGuestCommunities })
        .eq('id', userId)

      if (updateError) throw updateError

      Alert.alert(t('success'), t('joinedAsGuest', { name: guestCommunityData.name }))
      navigation.navigate('Home')
    } catch (error) {
      console.error('Error joining community:', error)
      Alert.alert(t('error'), t('failedToJoin'))
    } finally {
      setLoading(false)
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
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <FireText
                text={t('joinCommunity')}
                fontSize={28}
                intensity={1.2}
                style={styles.fireTitle}
              />
              <View style={styles.warningContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#000" />
                  <Text style={styles.warningText}>
                    {t('residentWarning')}
                  </Text>
                </View>
              <View style={styles.formContainer}>
                <TextInput
                  label={t('communityCode')}
                  value={communityCode}
                  onChangeText={setCommunityCode}
                  style={styles.input}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  mode="flat"
                  underlineColor="transparent"
                  textColor='#fff'
                  left={<TextInput.Icon icon="home-group" color={theme.colors.primary} />}
                />
                <TouchableOpacity onPress={handleJoinCommunity} disabled={loading} style={styles.button}>
                  <LinearGradient
                    colors={['#00A86B', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.buttonLabel}>{t('joinCommunity')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <Button 
                  onPress={handleSkip}
                  style={styles.skipButton}
                  labelStyle={styles.skipButtonLabel}
                >
                  {t('skipForNow')}
                </Button>
              </View>
            </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 180,
  },
  fireTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  formContainer: {
    width: '85%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  input: {
    marginBottom: 20,
    width: '100%',
    borderRadius: 20,
    height: 55,
  },
  button: {
    marginTop: 16,
    width: '100%',
  },
  gradientButton: {
    height: 55,
    width:200,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipButton: {
    marginTop: 20,
  },
  skipButtonLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    maxWidth:300,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
})

