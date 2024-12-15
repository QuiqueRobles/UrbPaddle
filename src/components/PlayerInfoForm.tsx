import React, { useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { TextInput, HelperText, useTheme, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;

type PlayerInfoFormProps = {
  profile: {
    full_name: string;
    apartment: string;
    phone_number: string;
    motivational_speech: string;
  };
  errors: {
    full_name: string;
    apartment: string;
    phone_number: string;
    motivational_speech: string;
  };
  handleFieldChange: (field: string, value: string) => void;
  editing: boolean;
};

const { width } = Dimensions.get('window');

const PlayerInfoForm: React.FC<PlayerInfoFormProps> = ({ profile, errors, handleFieldChange, editing }) => {
  const { colors } = useTheme();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const renderInput = (
    field: keyof typeof profile,
    label: string,
    icon: MaterialCommunityIconName,
    multiline: boolean = false
  ) => {
    const shakeAnimation = new Animated.Value(0);
    const scaleAnimation = new Animated.Value(1);

    const startShake = () => {
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    };

    const handleFocus = () => {
      setFocusedField(field);
      Animated.spring(scaleAnimation, {
        toValue: 1.02,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    const handleBlur = () => {
      setFocusedField(null);
      Animated.spring(scaleAnimation, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: 100 * Object.keys(profile).indexOf(field) }}
      >
        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [
                { translateX: shakeAnimation },
                { scale: scaleAnimation },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.background, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.inputWrapper,
              focusedField === field && styles.focusedInput,
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
            </View>
            <TextInput
              label={label}
              value={profile[field] || ''}
              onChangeText={(text) => handleFieldChange(field, text)}
              disabled={!editing}
              style={styles.input}
              mode="flat"
              error={!!errors[field]}
              textColor="#000"
              placeholderTextColor="transparent"
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
              theme={{ colors: { placeholder: 'transparent', text: '#000' } }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </LinearGradient>
          {!!errors[field] && (
            <TouchableOpacity onPress={startShake}>
              <HelperText type="error" visible={true} style={styles.errorText}>
                {errors[field]}
              </HelperText>
            </TouchableOpacity>
          )}
        </Animated.View>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <Text style={styles.title}>Player Information</Text>
      </MotiView>
      {renderInput('full_name', 'Full Name', 'account')}
      {renderInput('apartment', 'Apartment', 'home')}
      {renderInput('phone_number', 'Phone Number', 'phone')}
      {renderInput('motivational_speech', 'Motivational Speech', 'format-quote-open', true)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    width: width - 32,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  focusedInput: {
    shadowColor: "#6200EA",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    color: '#fff',
  },
  errorText: {
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 60,
    fontSize: 14,
  },
});

export default PlayerInfoForm;