import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, Dimensions, Image } from 'react-native'
import { Text, Card, Title, Paragraph, Button, IconButton, TextInput, useTheme } from 'react-native-paper'
import { supabase } from '../lib/supabase'
import * as Clipboard from 'expo-clipboard'
import { colors } from "../theme/colors"
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'

type CommunityData = {
  id: string
  name: string
  address: string
  resident_code: string
  guest_code: string
  court_number: number
  rules: string
}

const { width } = Dimensions.get('window')

export default function CommunityManagementScreen() {
  const [communityData, setCommunityData] = useState<CommunityData | null>(null)
  const [showResidentCode, setShowResidentCode] = useState(false)
  const [showGuestCode, setShowGuestCode] = useState(false)
  const [showCourtsModal, setShowCourtsModal] = useState(false)
  const [newCourtCount, setNewCourtCount] = useState('1')
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [newRules, setNewRules] = useState('')
  const { colors } = useTheme()

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
          setCommunityData(communityData)
          setNewRules(communityData.rules)
          setNewCourtCount(communityData.court_number.toString())
        }
      }
    } catch (error) {
      console.error('Error fetching community data:', error)
      Alert.alert('Error', 'Failed to fetch community data')
    }
  }

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text)
    Alert.alert('Copied', 'The code has been copied to clipboard')
  }

  const handleShowCode = (type: 'resident' | 'guest') => {
    Alert.alert(
      'Show Code',
      'Are you sure you want to reveal this code?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show', onPress: () => type === 'resident' ? setShowResidentCode(true) : setShowGuestCode(true) }
      ]
    )
  }

  const handleUpdateCourts = async () => {
    try {
      const { error } = await supabase
        .from('community')
        .update({ court_number: parseInt(newCourtCount) })
        .eq('id', communityData?.id)
      
      if (error) throw error
      
      fetchCommunityData()
      setShowCourtsModal(false)
      Alert.alert('Success', 'Number of courts updated successfully')
    } catch (error) {
      console.error('Error updating courts:', error)
      Alert.alert('Error', 'Failed to update number of courts')
    }
  }

  const handleUpdateRules = async () => {
    try {
      const { error } = await supabase
        .from('community')
        .update({ rules: newRules })
        .eq('id', communityData?.id)
      
      if (error) throw error
      
      fetchCommunityData()
      setShowRulesModal(false)
      Alert.alert('Success', 'Community rules updated successfully')
    } catch (error) {
      console.error('Error updating rules:', error)
      Alert.alert('Error', 'Failed to update community rules')
    }
  }

  if (!communityData) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading community data...</Text>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
        <Image 
              source={require('../../assets/images/logoUrbPaddle.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>{communityData.name}</Title>
            <Paragraph style={styles.paragraph}>Address: {communityData.address}</Paragraph>
            <View style={styles.codeContainer}>
              <Paragraph style={styles.paragraph}>
                Resident Code: {showResidentCode ? communityData.resident_code : '********'}
              </Paragraph>
              <View style={styles.iconContainer}>
                <IconButton 
                  icon={showResidentCode ? "eye-off" : "eye"} 
                  iconColor={'white'}
                  onPress={() => showResidentCode ? setShowResidentCode(false) : handleShowCode('resident')}
                />
                <IconButton 
                  icon="content-copy" 
                  iconColor={'white'}
                  onPress={() => copyToClipboard(communityData.resident_code)}
                />
              </View>
            </View>
            <View style={styles.codeContainer}>
              <Paragraph style={styles.paragraph}>
                Guest Code: {showGuestCode ? communityData.guest_code : '********'}
              </Paragraph>
              <View style={styles.iconContainer}>
                <IconButton 
                  icon={showGuestCode ? "eye-off" : "eye"} 
                  iconColor={'white'}
                  onPress={() => showGuestCode ? setShowGuestCode(false) : handleShowCode('guest')}
                />
                <IconButton 
                  icon="content-copy" 
                  iconColor={'white'}
                  onPress={() => copyToClipboard(communityData.guest_code)}
                />
              </View>
            </View>
            <View style={styles.courtsContainer}>
              <MaterialCommunityIcons name="tennis" size={24} color={'white'} />
              <Paragraph style={styles.paragraph}>Number of Courts: {communityData.court_number}</Paragraph>
            </View>
          </Card.Content>
        </Card>
        
        <TouchableOpacity onPress={() => setShowCourtsModal(true)} style={styles.buttonContainer}>
          <LinearGradient colors={['white', 'white']} style={styles.button}>
            <Text style={styles.buttonText}>Update Number of Courts</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowRulesModal(true)} style={styles.buttonContainer}>
          <LinearGradient colors={['white', 'white']} style={styles.button}>
            <Text style={styles.buttonText}>Update Community Rules</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Modal
          visible={showCourtsModal}
          onRequestClose={() => setShowCourtsModal(false)}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Title style={styles.modalTitle}>Update Number of Courts</Title>
              <Picker
                selectedValue={newCourtCount}
                onValueChange={(itemValue) => setNewCourtCount(itemValue)}
                style={styles.picker}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <Picker.Item key={num} label={num.toString()} value={num.toString()} />
                ))}
              </Picker>
              <View style={styles.modalButtons}>
                <Button onPress={() => setShowCourtsModal(false)} style={styles.modalButton}>Cancel</Button>
                <Button onPress={handleUpdateCourts} style={styles.modalButton} mode="contained">Update</Button>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showRulesModal}
          onRequestClose={() => setShowRulesModal(false)}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Title style={styles.modalTitle}>Update Community Rules</Title>
              <TextInput
                label="Community Rules"
                value={newRules}
                onChangeText={setNewRules}
                multiline
                numberOfLines={6}
                style={styles.input}
                mode="outlined"
              />
              <View style={styles.modalButtons}>
                <Button onPress={() => setShowRulesModal(false)} style={styles.modalButton}>Cancel</Button>
                <Button onPress={handleUpdateRules} style={styles.modalButton} mode="contained">Update</Button>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    marginBottom:60,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 8,
    color: 'white'
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'rgba(0,0,0,0.75)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconContainer: {
    flexDirection: 'row',
  },
  courtsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: 'black',
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
  picker: {
    width: '100%',
    marginBottom: 16,
  },
   logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
    width: 200,
    height: 200,
  },
})