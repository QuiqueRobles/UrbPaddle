import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Title, Text, Button, Avatar, Card, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation'; // Adjust the import path as needed

type AboutDeveloperScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AboutDeveloper'>;

const AboutDeveloperScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AboutDeveloperScreenNavigationProp>();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // This will hide the navigation header
    });
  }, [navigation]);

  const openWebsite = () => {
    Linking.openURL('https://enriquerobles.es');
  };

  const openLinkedIn = () => {
    Linking.openURL('https://www.linkedin.com/in/enrique-robles-ros/');
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/enriquerobles');
  };

  const goToHome = () => {
    navigation.navigate('Home');
  };

  const GradientButton: React.FC<{
    onPress: () => void;
    icon: string;
    children: React.ReactNode;
  }> = ({ onPress, icon, children }) => (
    <LinearGradient
      colors={['#00FF41', '#00C853']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.gradientButton}
    >
      <Button
        mode="contained"
        onPress={onPress}
        icon={icon}
        style={styles.button}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
      >
        {children}
      </Button>
    </LinearGradient>
  );

  return (
    <LinearGradient
      colors={['#001F0E', '#003F1C', '#006B31', '#004F24', '#002A13']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <IconButton
          icon="arrow-left"
          iconColor="#00FF41"
          size={30}
          onPress={goToHome}
          style={styles.backButton}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Avatar.Image 
            size={150} 
            source={{ uri: 'https://www.enriquerobles.es/static/media/quique.1a4aa01d625432bd2958.png' }} 
            style={styles.avatar}
          />
          <Title style={styles.name}>Enrique Robles</Title>
          <Text style={styles.title}>Telecommunications Engineer & Software Developer</Text>
          
          <View style={styles.socialButtons}>
            <GradientButton onPress={openWebsite} icon="web">
              Website
            </GradientButton>
            <GradientButton onPress={openLinkedIn} icon="linkedin">
              LinkedIn
            </GradientButton>
            <GradientButton onPress={openGitHub} icon="github">
              GitHub
            </GradientButton>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>About Me</Title>
              <Text style={styles.text}>
                Enrique Robles, also known as Quique Robles, is a telecommunications engineer and software developer with a great passion for technology and space communications. With a solid background in Telecommunications Engineering and Computer Engineering, Enrique has dedicated his career to learning and developing new techniques and devices to advance as a society.
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Education</Title>
              <Text style={styles.text}>
                • Currently pursuing a Master's degree in Signal Processing, Telecommunication Systems, and Space Communications at Politecnico di Milano.{'\n'}
                • Graduated with honors in Telecommunications Engineering from Universidad CEU San Pablo.{'\n'}
                • Bachelor's degree in Computer Engineering, including a one-year stay at Politecnico di Milano.
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Expertise</Title>
              <View style={styles.expertiseItem}>
                <MaterialCommunityIcons name="satellite-uplink" size={24} color={theme.colors.primary} />
                <Text style={styles.expertiseText}>Space Communications</Text>
              </View>
              <View style={styles.expertiseItem}>
                <MaterialCommunityIcons name="shield-lock" size={24} color={theme.colors.primary} />
                <Text style={styles.expertiseText}>Cybersecurity</Text>
              </View>
              <View style={styles.expertiseItem}>
                <MaterialCommunityIcons name="antenna" size={24} color={theme.colors.primary} />
                <Text style={styles.expertiseText}>Telecommunications Systems</Text>
              </View>
              <View style={styles.expertiseItem}>
                <MaterialCommunityIcons name="code-tags" size={24} color={theme.colors.primary} />
                <Text style={styles.expertiseText}>Software Development</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Notable Projects</Title>
              <View style={styles.projectItem}>
                <Title style={styles.projectTitle}>Urbpaddle</Title>
                <Text style={styles.text}>
                  A comprehensive mobile application for managing paddle tennis communities. Features include court booking, player matching, and community management.
                </Text>
              </View>
              <View style={styles.projectItem}>
                <Title style={styles.projectTitle}>CubeSat TMTC Subsystem</Title>
                <Text style={styles.text}>
                  Development of the Telemetry and Telecommand (TMTC) subsystem for CubeSat missions, ensuring reliable communication for satellite systems.
                </Text>
              </View>
              <View style={styles.projectItem}>
                <Title style={styles.projectTitle}>Meteorological Satellite Antenna</Title>
                <Text style={styles.text}>
                  Design and manufacture of antennas for receiving images from meteorological satellites using CST Studio.
                </Text>
              </View>
              <View style={styles.projectItem}>
                <Title style={styles.projectTitle}>Post-Quantum Cryptography Implementation</Title>
                <Text style={styles.text}>
                  Implementation of post-quantum cryptography algorithms for ensuring the integrity and confidentiality of communications in European satellites during an internship at GMV.
                </Text>
              </View>
            </Card.Content>
          </Card>

          <GradientButton onPress={openWebsite} icon="rocket">
            Explore More Projects
          </GradientButton>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'static',
    top: 40,
    left: 10,
    zIndex: 1,
  },
  avatar: {
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#00FF41',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FF41',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    color: '#00C853',
    marginBottom: 20,
    textAlign: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  gradientButton: {
    borderRadius: 90,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  button: {
    marginHorizontal: 0,
    elevation: 0,
  },
  buttonContent: {
    height: 40,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    color: '#000000',
    fontWeight: 'bold',
  },
  card: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00FF41',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  expertiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  expertiseText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  projectItem: {
    marginBottom: 15,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00C853',
    marginBottom: 5,
  },
});

export default AboutDeveloperScreen;