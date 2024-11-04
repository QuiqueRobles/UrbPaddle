import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme, Avatar, IconButton } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(200)}>
          <Text style={[styles.title, { color: colors.onPrimary }]}>Paddle Court Booking</Text>
          <Text style={[styles.subtitle, { color: colors.onPrimary }]}>Book your court and start playing!</Text>
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
            icon="calendar-check"
            label="My Bookings"
            onPress={() => navigation.navigate('MyBookings')}
            delay={600}
            color={colors.surface}
          />
          <ActionButton
            icon="chart-bar"
            label="View Statistics"
            onPress={() => navigation.navigate('Statistics')}
            delay={800}
            color={colors.surface}
          />
          <ActionButton
            icon="trophy"
            label="Add Match Result"
            onPress={() => navigation.navigate('AddMatchResult')}
            delay={1000}
            color={colors.surface}
          />
        </View>

        <Animated.View style={styles.bottomContainer} entering={FadeInDown.delay(1200)}>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Avatar.Icon size={36} icon="account" color={colors.primary} style={styles.profileAvatar} />
            <Text style={[styles.profileButtonLabel, { color: colors.text }]}>My Profile</Text>
          </TouchableOpacity>
          
          <IconButton
            icon="logout"
            iconColor={colors.error}
            size={28}
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 24 : 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
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
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  profileAvatar: {
    backgroundColor: 'transparent',
  },
  logoutButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});