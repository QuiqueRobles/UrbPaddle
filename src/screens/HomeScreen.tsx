import React from 'react';
import { View, StyleSheet, ImageBackground, Alert } from 'react-native';
import { Button, Title, Paragraph, useTheme, Avatar, IconButton } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

type Props = {
  navigation: NavigationProp<any>;
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

  return (
      <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={styles.header}>
          <Title style={[styles.title, { color: theme.colors.surface }]}>Welcome to Paddle Court Booking</Title>
          <Paragraph style={[styles.subtitle, { color: theme.colors.surface }]}>Book your court and start playing!</Paragraph>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('DateSelection')}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            icon="calendar"
          >
            Book a Court
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('MyBookings')}
            style={[styles.button, styles.outlinedButton]}
            labelStyle={[styles.buttonLabel, { color: theme.colors.surface }]}
            icon="calendar-check"
          >
            My Bookings
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Statistics')}
            style={[styles.button, styles.outlinedButton]}
            labelStyle={[styles.buttonLabel, { color: theme.colors.surface }]}
            icon="chart-bar"
          >
            View Statistics
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('AddMatchResult')}
            style={[styles.button, styles.outlinedButton]}
            labelStyle={[styles.buttonLabel, { color: theme.colors.surface }]}
            icon="plus"
          >
            Add Court Result
          </Button>
        </View>

        <View style={styles.bottomContainer}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Profile')}
            style={styles.profileButton}
            labelStyle={[styles.buttonLabel, { color: theme.colors.surface }]}
            icon={({ size, color }) => (
              <Avatar.Icon size={size} icon="account" color={color} style={{ backgroundColor: theme.colors.primary }} />
            )}
          >
            My Profile
          </Button>
          
          <IconButton
            icon="logout"
            iconColor={theme.colors.surface}
            size={24}
            onPress={handleLogout}
            style={styles.logoutButton}
          />
          
        </View>
        
      </View>
      
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    marginVertical: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  outlinedButton: {
    borderColor: 'white',
    borderWidth: 2,
  },
  buttonLabel: {
    fontSize: 18,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  profileButton: {
    flex: 1,
  },
  logoutButton: {
    marginLeft: 16,
  },
});