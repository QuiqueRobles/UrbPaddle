import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface FireTextProps {
  text: string;
  fontSize?: number;
  style?: any;
  intensity?: number;
}

const { width } = Dimensions.get('window');

const FireText = ({ 
  text, 
  fontSize = 28, 
  style,
  intensity = 1.0 
}: FireTextProps) => {
  // Multiple animation values for different effects
  const baseAnimation = useSharedValue(0);
  const flameHeight = useSharedValue(0);
  const sparkAnimation = useSharedValue(0);

  useEffect(() => {
    // Base flame movement
    baseAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      true
    );

    // Flame height variation
    flameHeight.value = withRepeat(
      withSequence(
        withSpring(1, { damping: 2, stiffness: 80 }),
        withSpring(0.5, { damping: 2, stiffness: 80 })
      ),
      -1,
      true
    );

    // Spark effect
    sparkAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedGradientStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            baseAnimation.value,
            [0, 1],
            [0, 3 * intensity]
          ),
        },
        {
          scaleY: interpolate(
            flameHeight.value,
            [0, 1],
            [0.95, 1.05]
          ),
        },
      ],
    };
  });

  const sparkStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(sparkAnimation.value, [0, 1], [0, 0.8]),
      transform: [
        {
          translateY: interpolate(
            sparkAnimation.value,
            [0, 1],
            [0, -20 * intensity]
          ),
        },
      ],
    };
  });

  return (
    <View style={[styles.container, style]}>
      <MaskedView
        style={styles.maskedContainer}
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={[styles.text, { fontSize }]}>{text}</Text>
          </View>
        }
      >
        <Animated.View style={[styles.gradientContainer, animatedGradientStyle]}>
         <LinearGradient
            colors={[
                '#008000',  // Green
                '#32CD32',  // Lime Green
                '#00FF00',  // Bright Green
                '#7CFC00',  // Lawn Green
                '#ADFF2F',  // Green Yellow
                'transparent'
            ]}
            style={styles.gradient}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        />

        </Animated.View>
        
        {/* Sparks Layer */}
        <Animated.View style={[styles.sparksContainer, sparkStyle]}>
          <LinearGradient
            colors={['transparent', '#FFD700', 'transparent']}
            style={styles.sparks}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
          />
        </Animated.View>
      </MaskedView>

      {/* Glow Effect */}
      <Text 
        style={[
          styles.glowText, 
          { 
            fontSize,
            textShadowRadius: 10 * intensity,
          }
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedContainer: {
    height: 40,
    width: width,
  },
  maskContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    fontFamily: 'Firestarter',
  },
  gradientContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  gradient: {
    flex: 2,
    width: '100%',
  },
  sparksContainer: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ translateY: -20 }],
  },
  sparks: {
    flex: 1,
    opacity: 0.5,
  },
  glowText: {
    position: 'absolute',
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'rgba(255, 100, 0, 0.3)',
    textShadowColor: '#FF4500',
    textShadowOffset: { width: 0, height: 0 },
  },
});

export default FireText;