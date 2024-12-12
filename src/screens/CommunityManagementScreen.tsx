import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, Image } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton, TextInput, useTheme } from 'react-native-paper';
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

const { width } = Dimensions.get('window');

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
};

export default function CommunityManagementScreen() {
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
  const theme = useTheme();

  useEffect(() => {
    fetchCommunityData();
  }, []);

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
        }
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
      Alert.alert('Error', 'Failed to fetch community data');
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'The code has been copied to clipboard');
  };

  const handleShowCode = (type: 'resident' | 'guest') => {
    Alert.alert(
      'Show Code',
      'Are you sure you want to reveal this code?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show', onPress: () => type === 'resident' ? setShowResidentCode(true) : setShowGuestCode(true) }
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
      Alert.alert('Success', 'Number of courts updated successfully');
    } catch (error) {
      console.error('Error updating courts:', error);
      Alert.alert('Error', 'Failed to update number of courts');
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
      Alert.alert('Success', 'Community rules updated successfully');
    } catch (error) {
      console.error('Error updating rules:', error);
      Alert.alert('Error', 'Failed to update community rules');
    }
  };

  const handleUpdateBookingSettings = async () => {
    try {
      const { error } = await supabase
        .from('community')
        .update({
          booking_start_time: format(bookingStartTime, 'HH:mm:ss'),
          booking_end_time: format(bookingEndTime, 'HH:mm:ss'),
          booking_duration_options: bookingDurations,
          default_booking_duration: defaultBookingDuration,
        })
        .eq('id', communityData?.id);
      
      if (error) throw error;
      
      fetchCommunityData();
      setShowBookingSettingsModal(false);
      Alert.alert('Success', 'Booking settings updated successfully');
    } catch (error) {
      console.error('Error updating booking settings:', error);
      Alert.alert('Error', 'Failed to update booking settings');
    }
  };

  if (!communityData) {
    return (
      <View style={styles.loadingContainer}>
        <Title style={styles.loadingText}>Loading community data...</Title>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar style="light" />
      <LinearGradient colors={[theme.colors.primary, '#000']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logoUrbPaddle.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>{communityData.name}</Title>
              <Paragraph style={styles.paragraph}>Address: {communityData.address}</Paragraph>
              <CodeDisplay
                label="Resident Code"
                code={communityData.resident_code}
                showCode={showResidentCode}
                onToggleShow={() => showResidentCode ? setShowResidentCode(false) : handleShowCode('resident')}
                onCopy={() => copyToClipboard(communityData.resident_code)}
              />
              <CodeDisplay
                label="Guest Code"
                code={communityData.guest_code}
                showCode={showGuestCode}
                onToggleShow={() => showGuestCode ? setShowGuestCode(false) : handleShowCode('guest')}
                onCopy={() => copyToClipboard(communityData.guest_code)}
              />
              <View style={styles.courtsContainer}>
                <MaterialCommunityIcons name="tennis" size={24} color={theme.colors.primary} />
                <Paragraph style={styles.paragraph}>Number of Courts: {communityData.court_number}</Paragraph>
              </View>
            </Card.Content>
          </Card>
          
          <Button 
            mode="contained" 
            onPress={() => setShowCourtsModal(true)} 
            style={styles.button}
            icon="tennis-ball"
          >
            Update Number of Courts
          </Button>
          
          <Button 
            mode="contained" 
            onPress={() => setShowRulesModal(true)} 
            style={styles.button}
            icon="book-open-variant"
          >
            Update Community Rules
          </Button>

          <Button 
            mode="contained" 
            onPress={() => setShowBookingSettingsModal(true)} 
            style={styles.button}
            icon="calendar-clock"
          >
            Update Booking Settings
          </Button>

          <UpdateModal
            visible={showCourtsModal}
            onClose={() => setShowCourtsModal(false)}
            title="Update Number of Courts"
            onUpdate={handleUpdateCourts}
          >
            <TextInput
              label="Number of Courts"
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
            title="Update Community Rules"
            onUpdate={handleUpdateRules}
          >
            <TextInput
              label="Community Rules"
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
    paddingBottom: 32,
    marginTop:60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4c669f',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
  },
  card: {
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
  button: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  courtsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 150,
  },
});
