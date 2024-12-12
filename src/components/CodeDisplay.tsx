import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Paragraph, IconButton, useTheme } from 'react-native-paper';

interface CodeDisplayProps {
  label: string;
  code: string;
  showCode: boolean;
  onToggleShow: () => void;
  onCopy: () => void;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ label, code, showCode, onToggleShow, onCopy }) => {
  const theme = useTheme();

  return (
    <View style={styles.codeContainer}>
      <Paragraph style={styles.paragraph}>
        {label}: {showCode ? code : '********'}
      </Paragraph>
      <View style={styles.iconContainer}>
        <IconButton 
          icon={showCode ? "eye-off" : "eye"} 
          iconColor={theme.colors.primary}
          onPress={onToggleShow}
        />
        <IconButton 
          icon="content-copy" 
          iconColor={theme.colors.primary}
          onPress={onCopy}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  iconContainer: {
    flexDirection: 'row',
  },
});

