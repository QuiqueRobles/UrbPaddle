import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions, StatusBar } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FireText from '../components/FireText';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import CommunityInfoModal from '../components/CommunityInfoModal';
import { useTranslation } from 'react-i18next';

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

type CommunityData = {
  id: string;
  name: string | null;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommunityInfo, setShowCommunityInfo] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

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

        if (profileData && profileData.resident_community_id) {
          const { data: communityData, error: communityError } = await supabase
            .from('community')
            .select('id, name')
            .eq('id', profileData.resident_community_id)
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
          <Text style={[styles.actionButtonLabel, { color: colors.text }]}>{t(label)}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );

  const openCommunityInfo = useCallback(() => {
    setShowCommunityInfo(true);
  }, []);

  const closeCommunityInfo = useCallback(() => {
    setShowCommunityInfo(false);
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
        <View style={styles.scrollContent}>
          <Animated.View entering={shouldAnimate ? FadeIn.duration(600) : undefined} style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/quortify-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View style={styles.header} entering={shouldAnimate ? FadeInDown.delay(300).duration(600) : undefined}>
            <FireText
              text={"Quick booking, Quality matches"}
              fontSize={21}
              intensity={1.2}
              style={styles.fireTitle}
            />
            <Text style={[styles.subtitle, { color: colors.onPrimary }]}>{t('Book and Enjoy!')}</Text>
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
              label="Book Court"
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
        </View>
      </SafeAreaView>
      {showCommunityInfo && communityData && (
        <CommunityInfoModal
          communityId={communityData.id}
          isVisible={showCommunityInfo}
          onClose={closeCommunityInfo}
        />
      )}
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
    width: 320,
    height: 150,
  },
  fireTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

