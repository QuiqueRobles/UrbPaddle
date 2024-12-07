import React, { useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

const PlayerInfoForm: React.FC<PlayerInfoFormProps> = ({ profile, errors, handleFieldChange, editing }) => {
  const { colors } = useTheme();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const renderInput = (field: keyof typeof profile, label: string, icon: string, multiline: boolean = false) => {
    const shakeAnimation = new Animated.Value(0);
    const scaleAnimation = new Animated.Value(1);

    const startShake = () => {
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
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
      <Animated.View 
        style={[
          styles.inputContainer, 
          { 
            transform: [
              { translateX: shakeAnimation },
              { scale: scaleAnimation }
            ] 
          }
        ]}
      >
        <LinearGradient
          colors={[colors.background, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.inputWrapper,
            focusedField === field && styles.focusedInput
          ]}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
          </View>
          <TextInput
            label={label}
            value={profile[field] || ''}
            onChangeText={(text) => handleFieldChange(field, text)}
            disabled={!editing}
            style={styles.input}
            mode="flat"
            error={!!errors[field]}
            textColor={colors.text}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            theme={{ colors: { placeholder: colors.primary } }}
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
    );
  };

  return (
    <View style={styles.container}>
      {renderInput('full_name', 'Full Name', 'account')}
      {renderInput('apartment', 'Apartment', 'home')}
      {renderInput('phone_number', 'Phone Number', 'phone')}
      {renderInput('motivational_speech', 'Motivational Speech', 'format-quote-open', true)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  focusedInput: {
    shadowColor: "#6200EA",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginTop: 4,
    marginLeft: 50,
  },
});

export default PlayerInfoForm;

