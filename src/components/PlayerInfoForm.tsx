import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  const renderInput = (field: keyof typeof profile, label: string, icon: string, multiline: boolean = false) => {
    const shakeAnimation = new Animated.Value(0);

    const startShake = () => {
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
      ]).start();
    };

    return (
      <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnimation }] }]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            label={label}
            value={profile[field] || ''}
            onChangeText={(text) => handleFieldChange(field, text)}
            disabled={!editing}
            style={styles.input}
            mode="flat"
            error={!!errors[field]}
            underlineColor={colors.primary}
            activeUnderlineColor={colors.accent}
            textColor={colors.text}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            theme={{ colors: { placeholder: colors.primary } }}
          />
          {!!errors[field] && (
            <HelperText type="error" visible={true} style={styles.errorText} onPress={startShake}>
              {errors[field]}
            </HelperText>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {renderInput('full_name', 'Full Name', 'account')}
      {renderInput('apartment', 'Apartment', 'home')}
      {renderInput('phone_number', 'Phone Number', 'phone')}
      {renderInput('motivational_speech', 'Motivational Speech', 'format-quote', true)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default PlayerInfoForm;