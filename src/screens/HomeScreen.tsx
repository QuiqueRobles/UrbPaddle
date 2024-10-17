import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Title } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the types for your navigation stack
type RootStackParamList = {
  Home: undefined;
  Booking: undefined;
  Statistics: undefined;
};

// Define the type for the navigation prop
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Define the props for the HomeScreen component
type Props = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Welcome to Paddle Court Booking</Title>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Booking')}
        style={styles.button}
      >
        Book a Court
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Statistics')}
        style={styles.button}
      >
        View Statistics
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginVertical: 12,
  },
});