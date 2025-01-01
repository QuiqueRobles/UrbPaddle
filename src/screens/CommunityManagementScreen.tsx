import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, Image, TouchableOpacity, Text } from 'react-native';
import { Card, Title, Paragraph, IconButton, TextInput, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CodeDisplay } from '../components/CodeDisplay';
import { UpdateModal } from '../components/UpdateModal';
import { BookingSettingsModal } from '../components/BookingSettingsModal';
import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

type CommunityData = {
  id: string;
  name: string;
  address: string;
  resident_code: string;
  guest_code: string;
  court_number: number;
  rules: string;
  booking_start_time: string;
  booking_end_time: string;
  booking_duration_options: number[];
  default_booking_duration: number;
  image: string | null;
};

export default function CommunityManagementScreen() {
  const { t } = useTranslation();
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [showResidentCode, setShowResidentCode] = useState(false);
  const [showGuestCode, setShowGuestCode] = useState(false);
  const [showCourtsModal, setShowCourtsModal] = useState(false);
  const [newCourtCount, setNewCourtCount] = useState(1);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [newRules, setNewRules] = useState('');
  const [showBookingSettingsModal, setShowBookingSettingsModal] = useState(false);
  const [bookingStartTime, setBookingStartTime] = useState(new Date());
  const [bookingEndTime, setBookingEndTime] = useState(new Date());
  const [bookingDurations, setBookingDurations] = useState<number[]>([]);
  const [defaultBookingDuration, setDefaultBookingDuration] = useState(60);
  const [maxNumberCurrentBookings, setMaxNumberCurrentBookings] = useState(1);
  const [simultaneousBookings, setSimultaneousBookings] = useState(false);
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    fetchCommunityData();
  }, []);

   const navigateToPlayerManagement = () => {
    navigation.navigate('PlayerManagement');
  };
  const fetchCommunityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('resident_community_id')
          .eq('id', user.id)
          .single();

        if (profileData?.resident_community_id) {
          const { data: communityData, error } = await supabase
            .from('community')
            .select('*')
            .eq('id', profileData.resident_community_id)
            .single();

          if (error) throw error;
        
          setCommunityData(communityData);
          setNewRules(communityData.rules);
          setNewCourtCount(communityData.court_number);
          setBookingStartTime(new Date(`2000-01-01T${communityData.booking_start_time}`));
          setBookingEndTime(new Date(`2000-01-01T${communityData.booking_end_time}`));
          setBookingDurations(communityData.booking_duration_options);
          setDefaultBookingDuration(communityData.default_booking_duration);
          setMaxNumberCurrentBookings(communityData.max_number_current_bookings);
          setSimultaneousBookings(communityData.simultaneous_bookings);
        }
        
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
      Alert.alert(t('error'), t('failedToFetchCommunityData'));
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert(t('copied'), t('codeCopiedToClipboard'));
  };

  const handleShowCode = (type: 'resident' | 'guest') => {
    Alert.alert(
      t('showCode'),
      t('areYouSureRevealCode'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('show'), onPress: () => type === 'resident' ? setShowResidentCode(true) : setShowGuestCode(true) }
      ]
    );
  };
  
  const handleUpdateCourts = async () => {
    try {
      const { error } = await supabase
        .from('community')
        .update({ court_number: newCourtCount })
        .eq('id', communityData?.id);
      
      if (error) throw error;
      
      fetchCommunityData();
      setShowCourtsModal(false);
      Alert.alert(t('success'), t('numberOfCourtsUpdated'));
    } catch (error) {
      console.error('Error updating courts:', error);
      Alert.alert(t('error'), t('failedToUpdateCourts'));
    }
  };

  const handleUpdateRules = async () => {
    try {
      const { error } = await supabase
        .from('community')
        .update({ rules: newRules })
        .eq('id', communityData?.id);
      
      if (error) throw error;
      
      fetchCommunityData();
      setShowRulesModal(false);
      Alert.alert(t('success'), t('communityRulesUpdated'));
    } catch (error) {
      console.error('Error updating rules:', error);
      Alert.alert(t('error'), t('failedToUpdateRules'));
    }
  };

   const handleUpdateBookingSettings = async (newMaxBookings: number) => {
    try {
      const { error } = await supabase
        .from('community')
        .update({
          booking_start_time: format(bookingStartTime, 'HH:mm:ss'),
          booking_end_time: format(bookingEndTime, 'HH:mm:ss'),
          booking_duration_options: bookingDurations,
          default_booking_duration: defaultBookingDuration,
          max_number_current_bookings: newMaxBookings,
          simultaneous_bookings: simultaneousBookings,
        })
        .eq('id', communityData?.id);
      
      if (error) throw error;
      
      fetchCommunityData();
      setShowBookingSettingsModal(false);
      Alert.alert(t('success'), t('bookingSettingsUpdated'));
    } catch (error) {
      console.error('Error updating booking settings:', error);
      Alert.alert(t('error'), t('failedToUpdateBookingSettings'));
    }
  };

  if (!communityData) {
    return (
      <LinearGradient colors={[theme.colors.primary, '#000']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Title style={styles.loadingText}>{t('loadingCommunityData')}</Title>
        </View>
      </LinearGradient>
    );
  }

  const GradientButton = ({ onPress, icon, children }: { onPress: () => void, icon: string, children: React.ReactNode }) => (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={['#00A86B', '#00C853']}
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar style="light" />
      <LinearGradient colors={[theme.colors.primary, '#000']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            {communityData?.image && (
              <Card.Cover 
                source={{ uri: communityData.image }} 
                style={styles.communityImage}
              />
            )}
            
            <Card.Content>
              <Title style={styles.title}>{communityData.name}</Title>
              <Paragraph style={styles.paragraph}>{t('address')}: {communityData.address}</Paragraph>
              <CodeDisplay
                label={t('residentCode')}
                code={communityData.resident_code}
                showCode={showResidentCode}
                onToggleShow={() => showResidentCode ? setShowResidentCode(false) : handleShowCode('resident')}
                onCopy={() => copyToClipboard(communityData.resident_code)}
              />
              <CodeDisplay
                label={t('guestCode')}
                code={communityData.guest_code}
                showCode={showGuestCode}
                onToggleShow={() => showGuestCode ? setShowGuestCode(false) : handleShowCode('guest')}
                onCopy={() => copyToClipboard(communityData.guest_code)}
              />
              <View style={styles.courtsContainer}>
                <MaterialCommunityIcons name="tennis" size={24} color={theme.colors.primary} />
                <Paragraph style={styles.paragraph}>{t('numberOfCourts')}: {communityData.court_number}</Paragraph>
              </View>
            </Card.Content>
          </Card>
          
          <GradientButton onPress={() => setShowCourtsModal(true)} icon="tennis-ball">
            {t('updateNumberOfCourts')}
          </GradientButton>
          
          <GradientButton onPress={() => setShowRulesModal(true)} icon="book-open-variant">
            {t('updateCommunityRules')}
          </GradientButton>

          <GradientButton onPress={() => setShowBookingSettingsModal(true)} icon="calendar-clock">
            {t('updateBookingSettings')}
          </GradientButton>
           <GradientButton onPress={navigateToPlayerManagement} icon="account-group">
            {t('managePlayersInCommunity')}
          </GradientButton>
          <UpdateModal
            visible={showCourtsModal}
            onClose={() => setShowCourtsModal(false)}
            title={t('updateNumberOfCourts')}
            onUpdate={handleUpdateCourts}
          >
            <TextInput
              label={t('numberOfCourts')}
              value={newCourtCount.toString()}
              onChangeText={(text) => setNewCourtCount(parseInt(text) || 1)}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
          </UpdateModal>

          <UpdateModal
            visible={showRulesModal}
            onClose={() => setShowRulesModal(false)}
            title={t('updateCommunityRules')}
            onUpdate={handleUpdateRules}
          >
            <TextInput
              label={t('communityRules')}
              value={newRules}
              onChangeText={setNewRules}
              multiline
              numberOfLines={6}
              style={styles.input}
              mode="outlined"
            />
          </UpdateModal>

          <BookingSettingsModal
            visible={showBookingSettingsModal}
            onClose={() => setShowBookingSettingsModal(false)}
            onUpdate={handleUpdateBookingSettings}
            bookingStartTime={bookingStartTime}
            setBookingStartTime={setBookingStartTime}
            bookingEndTime={bookingEndTime}
            setBookingEndTime={setBookingEndTime}
            bookingDurations={bookingDurations}
            setBookingDurations={setBookingDurations}
            defaultBookingDuration={defaultBookingDuration}
            setDefaultBookingDuration={setDefaultBookingDuration}
            maxNumberCurrentBookings={maxNumberCurrentBookings}
            setSimultaneousBookings={setSimultaneousBookings}
          />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100, // Increased padding to ensure content is above bottom tab
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
  },
  logoContainer: {
    position: 'relative',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  card: {
    marginTop:60,
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  courtsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  communityImage: {
    height: 200,
    marginBottom: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

