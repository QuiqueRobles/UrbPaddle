import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Title, Divider } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SettingsModalProps {
  onClose: () => void;
  navigation: NavigationProp<RootStackParamList>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, navigation }) => {
  const handleAboutDeveloper = () => {
    onClose();
    navigation.navigate('AboutDeveloper');
  };

 const GradientButton = ({ onPress, icon, children, colors = ['#00A86B', '#00C853'] }: { onPress: () => void; icon: string; children: React.ReactNode; colors?: string[] }) => (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientButton}
      >
        <MaterialCommunityIcons name={icon} size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>{children}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView>
      <Title style={styles.title}>Ajustes</Title>
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Cuenta</Title>
        <GradientButton onPress={() => {}} icon="lock-reset">
          Cambiar contraseña
        </GradientButton>
        <GradientButton onPress={() => {}} icon="shield-account">
          Privacidad
        </GradientButton>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Notificaciones</Title>
        <GradientButton onPress={() => {}} icon="bell-outline">
          Configurar notificaciones
        </GradientButton>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Sobre el desarrollador</Title>
        <GradientButton onPress={handleAboutDeveloper} icon="information-outline" colors={['rgba(56, 8, 99, 0.8)', 'rgba(12, 73, 195, 0.9)']}>
          Ver información del desarrollador
        </GradientButton>
      </View>
      
       <GradientButton onPress={onClose} icon="close-circle-outline" colors={['#FF6B6B', '#FF4757']}>
            Cerrar
      </GradientButton>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
 title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    color: '#555',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 1,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsModal;