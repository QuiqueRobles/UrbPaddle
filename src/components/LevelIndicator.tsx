import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Portal, Modal, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type LevelInfo = {
  name: string;
  color: [string, string, ...string[]]; // Explicitly define the tuple type
};

const levelData: LevelInfo[] = [
  { name: "Novato", color: ['#4CAF50', '#8BC34A'] as const },
  { name: "Aprendiz", color: ['#2196F3', '#03A9F4'] as const },
  { name: "Intermedio", color: ['#9C27B0', '#E91E63'] as const },
  { name: "Avanzado", color: ['#FF9800', '#FF5722'] as const },
  { name: "Experto", color: ['#F44336', '#E91E63'] as const },
  { name: "Maestro", color: ['#9C27B0', '#673AB7'] as const },
  { name: "Élite", color: ['#3F51B5', '#2196F3'] as const },
  { name: "Leyenda", color: ['#FFC107', '#FF9800'] as const },
  { name: "Campeón", color: ['#FF5722', '#F44336'] as const },
  { name: "Inmortal", color: ['#607D8B', '#455A64'] as const },
  { name: "Divino", color: ['#FF9800', '#FFC107'] as const },
  { name: "Celestial", color: ['#00BCD4', '#03A9F4'] as const },
  { name: "Trascendental", color: ['#8BC34A', '#4CAF50'] as const },
  { name: "Omnipotente", color: ['#9C27B0', '#673AB7'] as const },
  { name: "Supremo", color: ['#E91E63', '#F44336'] as const },
  { name: "Mítico", color: ['#FF9800', '#FF5722'] as const },
  { name: "Legendario", color: ['#795548', '#5D4037'] as const },
  { name: "Titánico", color: ['#607D8B', '#455A64'] as const },
  { name: "Cósmico", color: ['#3F51B5', '#303F9F'] as const },
  { name: "Infinito", color: ['#212121', '#673AB7'] as const },
];


interface LevelIndicatorProps {
  level: number;
}

export default function LevelIndicator({ level }: LevelIndicatorProps) {
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
          <Text style={styles.levelText}>Nivel {level}</Text>
          <Text style={styles.levelName}>{name}</Text>
        </LinearGradient>
        <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoButton}>
          <MaterialCommunityIcons name="information" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Portal>
        <Modal visible={infoModalVisible} onDismiss={() => setInfoModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Sistema de Niveles</Text>
          <Text style={styles.modalText}>
            El sistema de niveles está diseñado para reflejar tu progreso y experiencia en el juego:
          </Text>
          <Text style={styles.modalText}>
            • Cada 5 niveles, alcanzarás un nuevo rango con un nombre y color único.
          </Text>
          <Text style={styles.modalText}>
            • Los niveles van desde "Novato" (niveles 0-4) hasta "Infinito" (niveles 95-100).
          </Text>
          <Text style={styles.modalText}>
            • Gana XP jugando partidos, ganando juegos y sets para subir de nivel.
          </Text>
          <Text style={styles.modalText}>
            • Cada nivel representa tu dedicación y habilidad en el juego.
          </Text>
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
});