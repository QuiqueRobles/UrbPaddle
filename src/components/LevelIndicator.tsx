import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Portal, Modal, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

type LevelInfo = {
  name: string;
  color: [string, string, ...string[]]; // Explicitly define the tuple type
  description: string;
};

const levelData: LevelInfo[] = [
  { name: "novice", color: ['#4CAF50', '#8BC34A'] as const, description: "noviceDesc" },
  { name: "apprentice", color: ['#2196F3', '#03A9F4'] as const, description: "apprenticeDesc" },
  { name: "intermediate", color: ['#9C27B0', '#E91E63'] as const, description: "intermediateDesc" },
  { name: "advanced", color: ['#FF9800', '#FF5722'] as const, description: "advancedDesc" },
  { name: "expert", color: ['#F44336', '#E91E63'] as const, description: "expertDesc" },
  { name: "master", color: ['#9C27B0', '#673AB7'] as const, description: "masterDesc" },
  { name: "elite", color: ['#3F51B5', '#2196F3'] as const, description: "eliteDesc" },
  { name: "legend", color: ['#FFC107', '#FF9800'] as const, description: "legendDesc" },
  { name: "champion", color: ['#FF5722', '#F44336'] as const, description: "championDesc" },
  { name: "immortal", color: ['#607D8B', '#455A64'] as const, description: "immortalDesc" },
  { name: "divine", color: ['#FF9800', '#FFC107'] as const, description: "divineDesc" },
  { name: "celestial", color: ['#00BCD4', '#03A9F4'] as const, description: "celestialDesc" },
  { name: "transcendent", color: ['#8BC34A', '#4CAF50'] as const, description: "transcendentDesc" },
  { name: "omnipotent", color: ['#9C27B0', '#673AB7'] as const, description: "omnipotentDesc" },
  { name: "supreme", color: ['#E91E63', '#F44336'] as const, description: "supremeDesc" },
  { name: "mythic", color: ['#FF9800', '#FF5722'] as const, description: "mythicDesc" },
  { name: "legendary", color: ['#795548', '#5D4037'] as const, description: "legendaryDesc" },
  { name: "titanic", color: ['#607D8B', '#455A64'] as const, description: "titanicDesc" },
  { name: "cosmic", color: ['#3F51B5', '#303F9F'] as const, description: "cosmicDesc" },
  { name: "infinite", color: ['#212121', '#673AB7'] as const, description: "infiniteDesc" },
];

interface LevelIndicatorProps {
  level: number;
}

export default function LevelIndicator({ level }: LevelIndicatorProps) {
  const { t } = useTranslation();
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const getLevelInfo = (level: number): LevelInfo => {
    const index = Math.min(Math.floor(level / 5), levelData.length - 1);
    return levelData[index];
  };

  const { name, color } = getLevelInfo(level);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentContainer}>
        <LinearGradient
          colors={color}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.levelBadge}
        >
          <Text style={styles.levelText}>{t('level')} {level}</Text>
          <Text style={styles.levelName}>{t(name)}</Text>
        </LinearGradient>
        <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoButton}>
          <MaterialCommunityIcons name="information" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Portal>
        <Modal visible={infoModalVisible} onDismiss={() => setInfoModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.modalTitle}>{t('levelSystem')}</Text>
            <Text style={styles.modalText}>
              {t('levelSystemDescription')}
            </Text>
            <Text style={styles.modalSubtitle}>{t('levelProgression')}</Text>
            <Text style={styles.modalText}>
              {t('levelProgressionDescription')}
            </Text>
            <Text style={styles.modalSubtitle}>{t('xpGain')}</Text>
            <Text style={styles.modalText}>
              {t('xpGainDescription')}
            </Text>
            <Text style={styles.modalSubtitle}>{t('levelRanks')}</Text>
            {levelData.map((levelInfo, index) => (
              <View key={index} style={styles.rankItem}>
                <LinearGradient
                  colors={levelInfo.color}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.rankBadge}
                >
                  <Text style={styles.rankName}>{t(levelInfo.name)}</Text>
                </LinearGradient>
                <Text style={styles.rankDescription}>{t(levelInfo.description)}</Text>
              </View>
            ))}
          </ScrollView>
          <IconButton
            icon="close"
            size={24}
            onPress={() => setInfoModalVisible(false)}
            style={styles.closeButton}
          />
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  levelName: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  infoButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  rankItem: {
    marginBottom: 12,
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  rankName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  rankDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});