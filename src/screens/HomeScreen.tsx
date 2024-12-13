import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import { Text, useTheme, ActivityIndicator, Modal, Portal } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInRight, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import CommunityInfoCard from '../components/CommunityInfoCard';

type Props = {
  navigation: NavigationProp<any>;
};

type ActionButtonProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  delay: number;
  color: string;
  shouldAnimate: boolean;
};

type ProfileData = {
  resident_community_id: string | null;
};

type CommunityData = {
  id: string;
  name: string | null;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommunityInfo, setShowCommunityInfo] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const modalY = useSharedValue(SCREEN_HEIGHT);
  const isFirstLaunch = useRef(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('@first_launch');
        if (value === null) {
          setShouldAnimate(true);
          await AsyncStorage.setItem('@first_launch', 'false');
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
      }
    };

    checkFirstLaunch();
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
            .select('id, name')
            .eq('id', profile.resident_community_id)
            .single();

          if (communityError) throw communityError;
          
          setCommunityData(communityData as CommunityData);
        }
      }
    } catch (error) {
      console.error('Error fetching user community:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, delay, color, shouldAnimate }) => (
    <Animated.View 
      entering={shouldAnimate ? FadeInRight.delay(delay).duration(400) : undefined} 
      style={styles.actionButtonContainer}
    >
      <TouchableOpacity onPress={onPress} style={[styles.actionButton, { backgroundColor: color }]}>
        <View style={styles.actionButtonContent}>
          <MaterialCommunityIcons name={icon} size={28} color={colors.primary} style={styles.actionButtonIcon} />
          <Text style={[styles.actionButtonLabel, { color: colors.text }]}>{label}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );

  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: modalY.value }],
    };
  });

  const openCommunityInfo = useCallback(() => {
    setShowCommunityInfo(true);
    modalY.value = withSpring(0, { damping: 15, stiffness: 90 });
  }, []);

  const closeCommunityInfo = useCallback(() => {
    modalY.value = withSpring(SCREEN_HEIGHT, { damping: 15, stiffness: 90 }, () => {
      runOnJS(setShowCommunityInfo)(false);
    });
  }, []);

  if (isLoading) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={[styles.container, styles.loadingContainer]}
      >
        <ActivityIndicator size="large" color={colors.onPrimary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={shouldAnimate ? FadeIn.duration(600) : undefined} style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logoUrbPaddle.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View style={styles.header} entering={shouldAnimate ? FadeInDown.delay(300).duration(600) : undefined}>
            <Text style={[styles.title, { color: colors.onPrimary }]}>U R your Best with paddle</Text>
            <Text style={[styles.subtitle, { color: colors.onPrimary }]}>Book your court and enjoy playing!</Text>
          </Animated.View>
          
          {communityData && (
            <Animated.View entering={shouldAnimate ? FadeIn.delay(600).duration(400) : undefined} style={styles.communityContainer}>
              <TouchableOpacity onPress={openCommunityInfo} style={styles.communityButton}>
                <MaterialCommunityIcons name="home-group" size={24} color={colors.onPrimary} />
                <Text style={styles.communityName}>{communityData.name}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          
          <View style={styles.buttonContainer}>
            <ActionButton
              icon="calendar-plus"
              label="Book a Court"
              onPress={() => navigation.navigate('DateSelection')}
              delay={900}
              color={colors.surface}
              shouldAnimate={shouldAnimate}
            />
            <ActionButton
              icon="chart-bar"
              label="View Statistics"
              onPress={() => navigation.navigate('Statistics')}
              delay={1000}
              color={colors.surface}
              shouldAnimate={shouldAnimate}
            />
            <ActionButton
              icon="trophy"
              label="Add Match Result"
              onPress={() => navigation.navigate('AddMatchResult')}
              delay={1100}
              color={colors.surface}
              shouldAnimate={shouldAnimate}
            />
            <ActionButton
              icon="tennis-ball"
              label="View Matches"
              onPress={() => navigation.navigate('Matches')}
              delay={1200}
              color={colors.surface}
              shouldAnimate={shouldAnimate}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
      <Portal>
        <Animated.View 
          style={[styles.modalContainer, animatedModalStyle]}
          pointerEvents={showCommunityInfo ? 'auto' : 'none'}
        >
          {communityData && (
            <CommunityInfoCard
              communityId={communityData.id}
              onClose={closeCommunityInfo}
            />
          )}
        </Animated.View>
      </Portal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 24 : 24,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
    width: 200,
    height: 200,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
});