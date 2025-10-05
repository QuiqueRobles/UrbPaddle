import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Title, Divider } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Flag from 'react-native-flags';
import * as Animatable from 'react-native-animatable';

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

  const handleChangePassword = () => {
    onClose();
    navigation.navigate('ChangePassword');
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

  const languages = [
    { code: 'en', flag: 'GB' },
    { code: 'es', flag: 'ES' },
    { code: 'it', flag: 'IT' },
    { code: 'fr', flag: 'FR' },
    { code: 'de', flag: 'DE' },
  ];

  return (
    <Animatable.View style={{ flex: 1, backgroundColor: 'white' }} animation="slideInUp" duration={300} useNativeDriver>
    <ScrollView>
      <Title style={styles.title}>{t('settings')}</Title>
      
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>{t('account')}</Title>
        <GradientButton onPress={handleChangePassword} icon="lock-reset">
          {t('changePassword')}
        </GradientButton>
        <GradientButton onPress={() => {
        onClose();
        navigation.navigate('Privacy');
      }} icon="shield-account">
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
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.flagButton, i18n.language === lang.code && styles.activeLanguage]}
              onPress={() => changeLanguage(lang.code)}
            >
              <Flag code={lang.flag} size={32} />
            </TouchableOpacity>
          ))}
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
    </Animatable.View>
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
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  flagButton: {
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 4,
    borderRadius: 8,
  },
  activeLanguage: {
    backgroundColor: 'rgba(0, 168, 107, 0.2)',
  },
});

export default SettingsModal;

