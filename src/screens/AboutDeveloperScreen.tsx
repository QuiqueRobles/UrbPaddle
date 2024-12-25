import React from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Title, Text, Avatar, Card, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation'; // Adjust the import path as needed
import { useTranslation } from 'react-i18next';

type AboutDeveloperScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AboutDeveloper'>;

const AboutDeveloperScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AboutDeveloperScreenNavigationProp>();
  const { t } = useTranslation();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const openWebsite = () => {
    Linking.openURL('https://enriquerobles.es');
  };

  const openLinkedIn = () => {
    Linking.openURL('https://www.linkedin.com/in/enrique-robles-uriel/');
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/QuiqueRobles');
  };

  const goToHome = () => {
    navigation.navigate('Home');
  };

  const GalaxyGradientButton: React.FC<{
    onPress: () => void;
    icon: string;
    children: React.ReactNode;
  }> = ({ onPress, icon, children }) => (
    <TouchableOpacity onPress={onPress} style={styles.gradientButton}>
      <LinearGradient
        colors={['rgba(56, 8, 99, 0.8)', 'rgba(12, 73, 195, 0.9)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientButtonInner}
      >
        <View style={styles.buttonContentContainer}>
          <MaterialCommunityIcons 
            name={icon} 
            size={20} 
            color="#00FF41" 
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonLabel}>{children}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[
        'rgba(0,7,20,1)', 
        'rgba(0,15,40,1)', 
        'rgba(0,25,60,1)', 
        'rgba(0,10,30,1)'
      ]}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.galaxyGradient}
    >
      {[...Array(50)].map((_, index) => (
        <View 
          key={index} 
          style={[
            styles.star,
            { 
              top: Math.random() * 800, 
              right: Math.random() * 800,
              left: Math.random() * 800,
              opacity: Math.random(),
              width: Math.random() * 3,
              height: Math.random() * 3,
            }
          ]} 
        />
      ))}

      <SafeAreaView style={styles.container}>
        <IconButton
          icon="arrow-left"
          iconColor="#00FF41"
          size={30}
          onPress={goToHome}
          style={styles.backButton}
        />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Avatar.Image 
            size={150} 
            source={{ uri: 'https://www.enriquerobles.es/static/media/quique.1a4aa01d625432bd2958.png' }} 
            style={styles.avatar}
          />
          <Title style={styles.name}>{t('name')}</Title>
          <Text style={styles.title}>{t('jobTitle')}</Text>
          
          <View style={styles.socialButtons}>
            <GalaxyGradientButton onPress={openWebsite} icon="web">
              {t('website')}
            </GalaxyGradientButton>
            <GalaxyGradientButton onPress={openLinkedIn} icon="linkedin">
              {t('linkedIn')}
            </GalaxyGradientButton>
            <GalaxyGradientButton onPress={openGitHub} icon="github">
              {t('gitHub')}
            </GalaxyGradientButton>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('aboutMe.title')}</Title>
              <Text style={styles.text}>{t('aboutMe.description')}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('education.title')}</Title>
              <Text style={styles.text}>{t('education.details')}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('expertise.title')}</Title>
              <View style={styles.expertiseItem}>
                <MaterialCommunityIcons name="satellite-uplink" size={24} color={theme.colors.primary} />
                <Text style={styles.expertiseText}>{t('expertise.spaceCommunications')}</Text>
              </View>
              <View style={styles.expertiseItem}>
                <MaterialCommunityIcons name="shield-lock" size={24} color={theme.colors.primary} />
                <Text style={styles.expertiseText}>{t('expertise.cybersecurity')}</Text>
              </View>
              <View style={styles.expertiseItem}>
                <MaterialCommunityIcons name="antenna" size={24} color={theme.colors.primary} />
                <Text style={styles.expertiseText}>{t('expertise.telecommunicationsSystems')}</Text>
              </View>
              <View style={styles.expertiseItem}>
                <MaterialCommunityIcons name="code-tags" size={24} color={theme.colors.primary} />
                <Text style={styles.expertiseText}>{t('expertise.softwareDevelopment')}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('projects.title')}</Title>
              <View style={styles.projectItem}>
                <Title style={styles.projectTitle}>{t('projects.urbpaddle.title')}</Title>
                <Text style={styles.text}>{t('projects.urbpaddle.description')}</Text>
              </View>
              <View style={styles.projectItem}>
                <Title style={styles.projectTitle}>{t('projects.cubesat.title')}</Title>
                <Text style={styles.text}>{t('projects.cubesat.description')}</Text>
              </View>
              <View style={styles.projectItem}>
                <Title style={styles.projectTitle}>{t('projects.meteorologicalAntenna.title')}</Title>
                <Text style={styles.text}>{t('projects.meteorologicalAntenna.description')}</Text>
              </View>
              <View style={styles.projectItem}>
                <Title style={styles.projectTitle}>{t('projects.postQuantum.title')}</Title>
                <Text style={styles.text}>{t('projects.postQuantum.description')}</Text>
              </View>
            </Card.Content>
          </Card>

          <GalaxyGradientButton onPress={openWebsite} icon="rocket">
            {t('exploreMoreProjects')}
          </GalaxyGradientButton>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
const styles = StyleSheet.create({
  galaxyGradient: {
    flex: 1,
    position: 'relative',
  },
  star: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 50,
  },
  container: {
    flex: 1,
    zIndex: 10,
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
    overflow: 'hidden',
  },
  gradientButtonInner: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonLabel: {
    color: '#00FF41',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,65,0.2)',
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

