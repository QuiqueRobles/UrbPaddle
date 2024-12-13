import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Title, Divider } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';

interface SettingsModalProps {
  onClose: () => void;
  navigation: NavigationProp<RootStackParamList>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, navigation }) => {
  const handleAboutDeveloper = () => {
    onClose();
    navigation.navigate('AboutDeveloper');
  };

  return (
    <ScrollView>
      <Title style={styles.title}>Ajustes</Title>
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Cuenta</Title>
        <Button mode="outlined" style={styles.button}>Cambiar contraseña</Button>
        <Button mode="outlined" style={styles.button}>Privacidad</Button>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Notificaciones</Title>
        <Button mode="outlined" style={styles.button}>Configurar notificaciones</Button>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Sobre el desarrollador</Title>
        <Button mode="outlined" style={styles.button} onPress={handleAboutDeveloper}>
          Ver información del desarrollador
        </Button>
      </View>
      
      <Button mode="contained" onPress={onClose} style={styles.closeButton}>
        Cerrar
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
  },
  closeButton: {
    marginTop: 20,
  },
});

export default SettingsModal;