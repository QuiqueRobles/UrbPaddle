import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, FlatList, Animated, TouchableOpacity } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import IntroductionSlide from '../components/IntroductionSlide';
import { gradients } from '../theme/gradients';
const { width } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  CommunityRegistration: undefined;
};

type CommunityRegistrationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CommunityRegistration'>;

type Props = {
  navigation: CommunityRegistrationScreenNavigationProp;
};

interface SlideItem {
  title: string;
  description: string;
  iconName: string;
  isForm?: boolean;
}

export default function CommunityRegistrationScreen({ navigation }: Props) {
  const [communityName, setCommunityName] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList<SlideItem>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  const introSlides: SlideItem[] = [
    {
      title: t('introTitle1'),
      description: t('introDescription1'),
      iconName: 'tennis',
    },
    {
      title: t('introTitle2'),
      description: t('introDescription2'),
      iconName: 'map-search',
    },
    {
      title: t('introTitle3'),
      description: t('introDescription3'),
      iconName: 'account-group',
    },
  ];

  async function handleRegistration() {
    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-community-registration-email', {
        body: JSON.stringify({
          communityName,
          address,
          contactName,
          phoneNumber,
        }),
      });

      if (error) throw error;

      Alert.alert(t('success'), t('communityRegistrationSuccess'));
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item, index }: { item: SlideItem; index: number }) => {
    if (item.isForm) {
      return (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formSlide}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            <Text style={styles.title}>{t('communityRegistrationTitle')}</Text>
            <View style={styles.formContainer}>
              <TextInput
                label={t('communityName')}
                value={communityName}
                onChangeText={setCommunityName}
                style={styles.input}
                mode="flat"
                underlineColor="transparent"
                textColor='#fff'
                left={<TextInput.Icon icon={() => <Icon name="home" size={24} color="#FFFFFF" />} />}
              />
              <TextInput
                label={t('address')}
                value={address}
                onChangeText={setAddress}
                style={styles.input}
                mode="flat"
                underlineColor="transparent"
                textColor='#fff'
                left={<TextInput.Icon icon={() => <Icon name="map-marker" size={24} color="#FFFFFF" />} />}
              />
              <TextInput
                label={t('contactName')}
                value={contactName}
                onChangeText={setContactName}
                style={styles.input}
                mode="flat"
                underlineColor="transparent"
                textColor='#fff'
                left={<TextInput.Icon icon={() => <Icon name="account" size={24} color="#FFFFFF" />} />}
              />
              <TextInput
                label={t('phoneNumber')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                mode="flat"
                underlineColor="transparent"
                textColor='#fff'
                keyboardType="phone-pad"
                left={<TextInput.Icon icon={() => <Icon name="phone" size={24} color="#FFFFFF" />} />}
              />
              <TouchableOpacity onPress={handleRegistration} disabled={loading}>
                <LinearGradient
                  colors={gradients.greenTheme}
                  style={styles.button}
                >
                  <Text style={styles.buttonLabel}>
                    {loading ? t('sending') : t('sendRegistration')}
                  </Text>
                  <Icon name="send" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }
    return <IntroductionSlide title={item.title} description={item.description} iconName={item.iconName} />;
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const goToNextSlide = () => {
    if (currentSlide < introSlides.length) {
      flatListRef.current?.scrollToIndex({ index: currentSlide + 1, animated: true });
    }
  };

  const renderDotIndicator = () => {
    if (currentSlide === introSlides.length) return null;
    return (
      <View style={styles.paginationDots}>
        {introSlides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.4, 0.8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={[...introSlides, { isForm: true } as SlideItem]}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => index.toString()}
      />
      {renderDotIndicator()}
      {currentSlide < introSlides.length && (
        <TouchableOpacity onPress={goToNextSlide}>
          <LinearGradient
            colors={gradients.greenTheme}
            style={styles.nextButton}
          >
            <Text style={styles.buttonLabel}>
              {currentSlide === introSlides.length - 1 ? t('startRegistration') : t('next')}
            </Text>
            <Icon name="arrow-right" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formSlide: {
    width,
    height: '100%',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 50,
    bottom: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    bottom:50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  button: {
    marginTop: 24,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  nextButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 120,
    width: '100%',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
  },
});

