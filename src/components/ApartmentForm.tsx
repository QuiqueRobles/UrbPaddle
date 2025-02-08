'use client';

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TextInput, Title } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

type ApartmentFormProps = {
  onSubmit: (apartmentInfo: string) => void;
};

const ApartmentForm: React.FC<ApartmentFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [apartmentInfo, setApartmentInfo] = useState('');

  const handleSubmit = () => {
    if (apartmentInfo.trim()) {
      onSubmit(apartmentInfo.trim());
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>{t('enterApartmentInfo')}</Title>
      <TextInput
        label={t('apartmentInfo')}
        value={apartmentInfo}
        onChangeText={setApartmentInfo}
        style={styles.input}
        mode="outlined"
        placeholder={t('apartmentInfoPlaceholder')}
      />
      <TouchableOpacity onPress={handleSubmit}>
        <LinearGradient
          colors={['#00A86B', '#00C853']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>{t('submit')}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ApartmentForm;