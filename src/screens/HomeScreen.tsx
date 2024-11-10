import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
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

type ProfileData = {
  resident_community_id: string | null;
};

type CommunityData = {
  name: string | null;
};

export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const [communityName, setCommunityName] = useState<string | null>(null);

  useEffect(() => {
    fetchUserCommunity();
  }, []);

  const fetchUserCommunity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('resident_community_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        const profile = profileData as ProfileData;
        if (profile && profile.resident_community_id) {
          const { data: communityData, error: communityError } = await supabase
            .from('community')
            .select('name')
            .eq('id', profile.resident_community_id)
            .single();

          if (communityError) throw communityError;
          
          const community = communityData as CommunityData;
          
          if (community && community.name) {
            setCommunityName(community.name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user community:', error);
    }
  };

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
    <Animated.View entering={FadeInRight.delay(delay).duration(400)} style={styles.actionButtonContainer}>
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
          <Animated.View entering={FadeInDown.duration(600)} style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logoUrbPaddle.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View style={styles.header} entering={FadeInDown.delay(300).duration(600)}>
            <Text style={[styles.title, { color: colors.onPrimary }]}>U R your Best with paddle</Text>
            <Text style={[styles.subtitle, { color: colors.onPrimary }]}>Book your court and enjoy playing!</Text>
          </Animated.View>
          
          {communityName && (
            <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.communityContainer}>
              <MaterialCommunityIcons name="home-group" size={24} color={colors.onPrimary} />
              <Text style={styles.communityName}>{communityName}</Text>
            </Animated.View>
          )}
          
          <View style={styles.buttonContainer}>
            <ActionButton
              icon="calendar-plus"
              label="Book a Court"
              onPress={() => navigation.navigate('DateSelection')}
              delay={900}
              color={colors.surface}
            />
            <ActionButton
              icon="chart-bar"
              label="View Statistics"
              onPress={() => navigation.navigate('Statistics')}
              delay={1000}
              color={colors.surface}
            />
            <ActionButton
              icon="trophy"
              label="Add Match Result"
              onPress={() => navigation.navigate('AddMatchResult')}
              delay={1100}
              color={colors.surface}
            />
          </View>
          <Animated.View entering={FadeInDown.delay(1200).duration(400)}>
            <IconButton
              icon="logout"
              iconColor={colors.error}
              size={28}
              onPress={handleLogout}
              style={[styles.logoutButton, { backgroundColor: colors.surface }]}
            />
          </Animated.View>
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
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
  communityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    alignSelf: 'center',
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
    marginLeft: 8,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
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
    alignSelf: 'flex-end',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 200,
    height: 200,
  },
});