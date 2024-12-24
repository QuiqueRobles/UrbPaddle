import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Title, Divider } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Flag from 'react-native-flags';

interface SettingsModalProps {
  onClose: () => void;
  navigation: NavigationProp<RootStackParamList>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, navigation }) => {
  const { t, i18n } = useTranslation();

  const handleAboutDeveloper = () => {
    onClose();
    navigation.navigate('AboutDeveloper');
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
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
      <Title style={styles.title}>{t('settings')}</Title>
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>{t('account')}</Title>
        <GradientButton onPress={() => {}} icon="lock-reset">
          {t('changePassword')}
        </GradientButton>
        <GradientButton onPress={() => {}} icon="shield-account">
          {t('privacy')}
        </GradientButton>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>{t('notifications')}</Title>
        <GradientButton onPress={() => {}} icon="bell-outline">
          {t('configureNotifications')}
        </GradientButton>
      </View>
      
      <Divider style={styles.divider} />
      
       <View style={styles.section}>
          <Title style={styles.sectionTitle}>{t('language')}</Title>
          <View style={styles.languageFlags}>
            <TouchableOpacity
              style={[styles.flagButton, i18n.language === 'en' && styles.activeLanguage]}
              onPress={() => changeLanguage('en')}
            >
              <Flag code="GB" size={32} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flagButton, i18n.language === 'es' && styles.activeLanguage]}
              onPress={() => changeLanguage('es')}
            >
              <Flag code="ES" size={32} />
            </TouchableOpacity>
          </View>
        </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>{t('aboutDeveloper')}</Title>
        <GradientButton onPress={handleAboutDeveloper} icon="information-outline" colors={['rgba(56, 8, 99, 0.8)', 'rgba(12, 73, 195, 0.9)']}>
          {t('viewDeveloperInfo')}
        </GradientButton>
      </View>
      
      <GradientButton onPress={onClose} icon="close-circle-outline" colors={['#FF6B6B', '#FF4757']}>
        {t('close')}
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
  languageFlags: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  flagButton: {
    marginHorizontal: 10,
    padding: 8,
    borderRadius: 8,
  },
  activeLanguage: {
    backgroundColor: 'rgba(0, 168, 107, 0.2)',
  },
});

export default SettingsModal;