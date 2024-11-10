import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, ToastAndroid } from 'react-native'
import { Text, Card, Title, Paragraph, Button, TextInput, IconButton, Dialog, Portal } from 'react-native-paper'
import { supabase } from '../lib/supabase'
import { colors } from '../theme/colors'
import * as Clipboard from 'expo-clipboard'

type CommunityData = {
  id: string
  name: string
  address: string
  resident_code: string
  guest_code: string
  rules: string
  court_number: number
}

export default function CommunityManagementScreen() {
  const [communityData, setCommunityData] = useState<CommunityData | null>(null)
  const [showResidentCode, setShowResidentCode] = useState(false)
  const [showGuestCode, setShowGuestCode] = useState(false)
  const [rules, setRules] = useState('')
  const [numberOfCourts, setNumberOfCourts] = useState(0)
  const [isEditingRules, setIsEditingRules] = useState(false)
  const [isChangingCourts, setIsChangingCourts] = useState(false)

  useEffect(() => {
    fetchCommunityData()
  }, [])

  const fetchCommunityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('resident_community_id')
          .eq('id', user.id)
          .single()

        if (profileData?.resident_community_id) {
          const { data: communityData, error } = await supabase
            .from('community')
            .select('*')
            .eq('id', profileData.resident_community_id)
            .single()
          if (error) throw error
          setCommunityData(communityData || null)
          setRules(communityData?.rules || '')
          setNumberOfCourts(communityData?.court_number || 0)
        }
      }
    } catch (error) {
      console.error('Error fetching community data:', error)
    }
  }

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text)
    ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT)
  }

  const updateRules = async () => {
    try {
      const { error } = await supabase
        .from('community')
        .update({ rules })
        .eq('id', communityData?.id)

      if (error) throw error
      Alert.alert('Success', 'Community rules updated successfully')
      setIsEditingRules(false)
    } catch (error) {
      console.error('Error updating rules:', error)
      Alert.alert('Error', 'Failed to update community rules')
    }
  }

  const updateNumberOfCourts = async () => {
    try {
      const { error } = await supabase
        .from('community')
        .update({ court_number: numberOfCourts })
        .eq('id', communityData?.id)

      if (error) throw error
      Alert.alert('Success', 'Number of courts updated successfully')
      setIsChangingCourts(false)
    } catch (error) {
      console.error('Error updating number of courts:', error)
      Alert.alert('Error', 'Failed to update number of courts')
    }
  }

  if (!communityData) {
    return (
      <View style={styles.container}>
        <Text>Loading community data...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>{communityData.name}</Title>
          <Paragraph style={styles.paragraph}>Address: {communityData.address}</Paragraph>
          
          <View style={styles.codeContainer}>
            <Text>Resident Code: </Text>
            {showResidentCode ? (
              <Text>{communityData.resident_code}</Text>
            ) : (
              <Text>••••••</Text>
            )}
            <IconButton
              icon={showResidentCode ? "eye-off" : "eye"}
              onPress={() => {
                if (!showResidentCode) {
                  Alert.alert(
                    "Warning",
                    "This code is for residents only. Do not share it with guests.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Show", onPress: () => setShowResidentCode(true) }
                    ]
                  )
                } else {
                  setShowResidentCode(false)
                }
              }}
            />
            <IconButton
              icon="content-copy"
              onPress={() => copyToClipboard(communityData.resident_code)}
            />
          </View>

          <View style={styles.codeContainer}>
            <Text>Guest Code: </Text>
            {showGuestCode ? (
              <Text>{communityData.guest_code}</Text>
            ) : (
              <Text>••••••</Text>
            )}
            <IconButton
              icon={showGuestCode ? "eye-off" : "eye"}
              onPress={() => {
                if (!showGuestCode) {
                  Alert.alert(
                    "Warning",
                    "This code is for guests only. It has limited access.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Show", onPress: () => setShowGuestCode(true) }
                    ]
                  )
                } else {
                  setShowGuestCode(false)
                }
              }}
            />
            <IconButton
              icon="content-copy"
              onPress={() => copyToClipboard(communityData.guest_code)}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Community Rules</Title>
          {isEditingRules ? (
            <>
              <TextInput
                multiline
                numberOfLines={4}
                value={rules}
                onChangeText={setRules}
                style={styles.rulesInput}
              />
              <Button onPress={updateRules} mode="contained" style={styles.button}>
                Save Rules
              </Button>
              <Button onPress={() => setIsEditingRules(false)} style={styles.button}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Paragraph style={styles.paragraph}>{rules || 'No rules set'}</Paragraph>
              <Button onPress={() => setIsEditingRules(true)} mode="contained" style={styles.button}>
                Edit Rules
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Number of Courts</Title>
          <Paragraph style={styles.paragraph}>Current number of courts: {numberOfCourts}</Paragraph>
          <Button onPress={() => setIsChangingCourts(true)} mode="contained" style={styles.button}>
            Change Number of Courts
          </Button>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={isChangingCourts} onDismiss={() => setIsChangingCourts(false)}>
          <Dialog.Title>Change Number of Courts</Dialog.Title>
          <Dialog.Content>
            <TextInput
              keyboardType="numeric"
              value={numberOfCourts.toString()}
              onChangeText={(text) => setNumberOfCourts(parseInt(text) || 0)}
              style={styles.input}
            />
            <Paragraph style={styles.warningText}>
              Warning: Changing the number of courts may affect existing bookings and statistics.
              Please ensure all necessary adjustments are made before proceeding.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsChangingCourts(false)}>Cancel</Button>
            <Button onPress={updateNumberOfCourts}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    margin: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rulesInput: {
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  warningText: {
    color: colors.error,
    fontStyle: 'italic',
  },
})