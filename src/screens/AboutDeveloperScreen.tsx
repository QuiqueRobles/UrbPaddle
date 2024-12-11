import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Title, Text, Button, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const AboutDeveloperScreen = () => {
  const openWebsite = () => {
    Linking.openURL('https://enriquerobles.es');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Avatar.Image 
          size={120} 
          source={{ uri: 'https://enriquerobles.es/images/profile.jpg' }} 
          style={styles.avatar}
        />
        <Title style={styles.name}>Enrique Robles</Title>
        <Text style={styles.title}>Full Stack Developer & Entrepreneur</Text>
        
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>About Me</Title>
          <Text style={styles.text}>
            I'm a passionate Full Stack Developer and Entrepreneur with over 10 years of experience in web and mobile development. I specialize in creating innovative solutions using cutting-edge technologies.
          </Text>
        </View>

        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Skills</Title>
          <Text style={styles.text}>
            JavaScript, TypeScript, React, React Native, Node.js, Express, MongoDB, PostgreSQL, AWS, Docker, and more.
          </Text>
        </View>

        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Projects</Title>
          <Text style={styles.text}>
            • Developed multiple successful web and mobile applications
            • Created scalable backend systems using Node.js and AWS
            • Implemented complex frontend interfaces with React and React Native
          </Text>
        </View>

        <Button 
          mode="contained" 
          onPress={openWebsite}
          style={styles.button}
          icon="web"
        >
          Visit My Website
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    color: colors.secondary,
    marginBottom: 20,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  button: {
    marginTop: 20,
    backgroundColor: colors.primary,
  },
});

export default AboutDeveloperScreen;

