import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import FireText from '../components/FireText';
import { useTranslation } from 'react-i18next';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ConfirmEmailSentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ConfirmEmailSent'>;

type Props = {
  navigation: ConfirmEmailSentScreenNavigationProp;
  route: { params: { email: string } };
};

export default function ConfirmEmailSentScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo Section */}
            <Animatable.View animation="fadeInDown" duration={800} style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/quortify-logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <FireText
                text={t('checkYourEmail') || 'Check your email'}
                fontSize={28}
                intensity={0.8}
                style={styles.welcomeFireText}
              />
            </Animatable.View>

            {/* Content Section */}
            <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
              <View style={styles.iconContainer}>
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons name="email" size={24} color="rgba(255,255,255,0.6)" />
                </View>
              </View>

              <Text style={styles.description}>
                {t('confirmationEmailDescription') || "We've sent a confirmation link to"}{' '}
                <Text style={styles.email}>{email}</Text>
              </Text>

              <Text style={styles.instructions}>
                {t('confirmationInstructions') ||
                  'Click the link in the email to verify your account. If you don’t see it, check your spam folder.'}
              </Text>

              {/* Go to Login Button */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')} 
                style={styles.signInButton}
              >
                <LinearGradient
                  colors={['#00A86B', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.signInButtonText}>{t('goToLogin') || 'Go to Login'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  logoContainer: {
    marginTop: -70,
    marginBottom: -80,
  },
  logo: {
    width: 280,
    height: 280,
  },
  welcomeFireText: {
    marginBottom: 8,
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  email: {
    fontWeight: '600',
    color: '#00C853',
  },
  instructions: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});