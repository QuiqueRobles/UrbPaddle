'use client';

import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { TextInput, Text, Card } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { MaterialCommunityIcons } from '@expo/vector-icons'

type ApartmentForm2Props = {
  onSubmit: (apartmentInfo: string) => void
  onCancel: () => void
}

export default function ApartmentForm2({ onSubmit, onCancel }: ApartmentForm2Props) {
  const [apartmentInfo, setApartmentInfo] = useState('')
  const { t } = useTranslation()

  const handleSubmit = () => {
    if (apartmentInfo.trim()) {
      onSubmit(apartmentInfo)
    }
  }

  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>{t('enterApartmentInfo')}</Text>
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.infoCardContent}>
            <MaterialCommunityIcons name="information-outline" size={24} color="#fff" />
            <Text style={styles.infoText}>{t('apartmentInfoDisclaimer')}</Text>
          </View>
        </Card.Content>
      </Card>
      <TextInput
        label={t('apartmentInfo')}
        value={apartmentInfo}
        onChangeText={setApartmentInfo}
        style={styles.input}
        mode="flat"
        underlineColor="transparent"
        textColor="#fff"
        placeholder={t('apartmentInfoPlaceholder')}
        placeholderTextColor="rgba(255,255,255,0.5)"
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <LinearGradient
            colors={['#00A86B', '#00C853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonLabel}>{t('submit')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonLabel}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
    width: '100%',
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  input: {
    marginBottom: 20,
    width: '100%',
    borderRadius: 20,
    height: 55,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  gradientButton: {
    height: 55,
    width: 200,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelButtonLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
})