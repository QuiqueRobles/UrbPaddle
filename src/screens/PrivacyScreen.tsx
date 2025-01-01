import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Title, Paragraph, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const PrivacyScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[theme.colors.primary, 'black']}
        style={styles.header}
      >
      <Title style={styles.headerTitle}>{t('privacyPolicy')}</Title>
      </LinearGradient>
      <ScrollView  style={styles.scrollView}>
        <View style={styles.content}>
          <Section title={t('introduction')}>
            <Paragraph>{t('introductionText')}</Paragraph>
          </Section>

          <Section title={t('dataCollection')}>
            <Paragraph>{t('dataCollectionText1')}</Paragraph>
            <Paragraph>{t('dataCollectionText2')}</Paragraph>
          </Section>

          <Section title={t('dataUse')}>
            <Paragraph>{t('dataUseText1')}</Paragraph>
            <Paragraph>{t('dataUseText2')}</Paragraph>
          </Section>

          <Section title={t('dataSharing')}>
            <Paragraph>{t('dataSharingText')}</Paragraph>
          </Section>

          <Section title={t('dataProtection')}>
            <Paragraph>{t('dataProtectionText1')}</Paragraph>
            <Paragraph>{t('dataProtectionText2')}</Paragraph>
          </Section>

          <Section title={t('userRights')}>
            <Paragraph>{t('userRightsText1')}</Paragraph>
            <Paragraph>{t('userRightsText2')}</Paragraph>
          </Section>

          <Section title={t('cookies')}>
            <Paragraph>{t('cookiesText1')}</Paragraph>
            <Paragraph>{t('cookiesText2')}</Paragraph>
          </Section>

          <Section title={t('thirdPartyServices')}>
            <Paragraph>{t('thirdPartyServicesText1')}</Paragraph>
            <Paragraph>{t('thirdPartyServicesText2')}</Paragraph>
          </Section>

          <Section title={t('minors')}>
            <Paragraph>{t('minorsText')}</Paragraph>
          </Section>

          <Section title={t('changes')}>
            <Paragraph>{t('changesText')}</Paragraph>
          </Section>

          <Section title={t('contact')}>
            <Paragraph>{t('contactText')}</Paragraph>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Title style={styles.sectionTitle}>{title}</Title>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
});

export default PrivacyScreen;

