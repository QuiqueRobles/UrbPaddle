import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, SafeAreaView,Alert,Image } from 'react-native';
import { Text, useTheme, IconButton  } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';

type Props = {
  navigation: NavigationProp<any>;
};

type ActionButtonProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  delay: number;
  color: string;
};

export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, delay, color }) => (
    <Animated.View entering={FadeInRight.delay(delay)} style={styles.actionButtonContainer}>
      <TouchableOpacity onPress={onPress} style={[styles.actionButton, { backgroundColor: color }]}>
        <View style={styles.actionButtonContent}>
          <MaterialCommunityIcons name={icon} size={28} color={colors.primary} style={styles.actionButtonIcon} />
          <Text style={[styles.actionButtonLabel, { color: colors.text }]}>{label}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
          <Image 
              source={require('../../assets/images/logoUrbPaddle.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Animated.View style={styles.header} entering={FadeInDown.delay(200)}>
            <Text style={[styles.title, { color: colors.onPrimary }]}>U R your Best with paddle</Text>
            <Text style={[styles.subtitle, { color: colors.onPrimary }]}>Book your court and enjoy playing!</Text>
          </Animated.View>
          
          <View style={styles.buttonContainer}>
            <ActionButton
              icon="calendar-plus"
              label="Book a Court"
              onPress={() => navigation.navigate('DateSelection')}
              delay={400}
              color={colors.surface}
            />
            <ActionButton
              icon="chart-bar"
              label="View Statistics"
              onPress={() => navigation.navigate('Statistics')}
              delay={600}
              color={colors.surface}
            />
            <ActionButton
              icon="trophy"
              label="Add Match Result"
              onPress={() => navigation.navigate('AddMatchResult')}
              delay={800}
              color={colors.surface}
            />
          </View>
           <IconButton
            icon="logout"
            iconColor={colors.error}
            size={28}
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 24 : 48,
    paddingBottom: 80, // Add extra padding at the bottom to account for the tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
  },
  actionButtonContainer: {
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonIcon: {
    marginRight: 16,
  },
  actionButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
   logoutButton: {
    alignSelf:'flex-end',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});