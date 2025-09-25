import React, { useState, useRef } from 'react';
import { View, StyleSheet, Linking, Dimensions, FlatList, Animated, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
}

export default function CommunityRegistrationScreen({ navigation }: Props) {
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

  const renderItem = ({ item }: { item: SlideItem }) => {
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
    if (currentSlide < introSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentSlide + 1, animated: true });
    } else {
      Linking.openURL('https://qourtify.com/pricing');
    }
  };

  const renderDotIndicator = () => {
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
        data={introSlides}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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