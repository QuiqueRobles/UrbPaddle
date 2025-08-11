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
  // Refined animation values for professional look
  const baseAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    // Subtle base movement - more professional
    baseAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0.0, 0.6, 1) }),
        withTiming(0, { duration: 2000, easing: Easing.bezier(0.4, 0.0, 0.6, 1) })
      ),
      -1,
      true
    );

    // Gentle glow effect
    glowAnimation.value = withRepeat(
      withSequence(
        withSpring(1, { damping: 8, stiffness: 40 }),
        withSpring(0.3, { damping: 8, stiffness: 40 })
      ),
      -1,
      true
    );

    // Subtle shimmer effect
    shimmerAnimation.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedGradientStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            baseAnimation.value,
            [0, 1],
            [0, 2 * intensity] // Reduced movement for professionalism
          ),
        },
        {
          scaleY: interpolate(
            glowAnimation.value,
            [0, 1],
            [0.98, 1.02] // Very subtle scaling
          ),
        },
      ],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerAnimation.value,
            [0, 1],
            [-width, width]
          ),
        },
      ],
      opacity: interpolate(
        shimmerAnimation.value,
        [0, 0.5, 1],
        [0, 0.3, 0] // Very subtle shimmer
      ),
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(glowAnimation.value, [0, 1], [0.2, 0.6]),
      transform: [
        {
          scale: interpolate(glowAnimation.value, [0, 1], [1, 1.05]),
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
          {/* Main gradient - professional green theme */}
          <LinearGradient
            colors={[
              '#00A86B',  // Deep Green
              '#00C853',  // Bright Green  
              '#4CAF50',  // Material Green
              '#8BC34A',  // Light Green
              '#C8E6C9',  // Very Light Green
              'transparent'
            ]}
            style={styles.gradient}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            locations={[0, 0.25, 0.45, 0.65, 0.85, 1]}
          />

          {/* Subtle shimmer effect */}
          <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
              style={styles.shimmer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </Animated.View>
      </MaskedView>

      {/* Professional glow effect */}
      <Animated.Text 
        style={[
          styles.glowText, 
          { 
            fontSize,
            textShadowRadius: 8 * intensity,
          },
          glowStyle
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedContainer: {
    height: 50, // Slightly taller for better text rendering
    width: width,
  },
  maskContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700', // More professional weight
    textAlign: 'center',
    color: '#000',
    letterSpacing: 0.5, // Better letter spacing
  },
  gradientContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    width: 100, // Narrow shimmer band
  },
  glowText: {
    position: 'absolute',
    fontWeight: '700',
    textAlign: 'center',
    color: 'rgba(0, 200, 83, 0.15)', // Very subtle green glow
    textShadowColor: '#00C853',
    textShadowOffset: { width: 0, height: 0 },
    letterSpacing: 0.5,
  },
});

export default FireText;