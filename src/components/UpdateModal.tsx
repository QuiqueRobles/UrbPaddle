import React from 'react';
import { View, StyleSheet, Modal, ScrollView } from 'react-native';
import { Title, Button, useTheme } from 'react-native-paper';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  onUpdate: () => void;
  children: React.ReactNode;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ visible, onClose, title, onUpdate, children }) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Title style={styles.modalTitle}>{title}</Title>
          <ScrollView style={styles.scrollView}>
            {children}
          </ScrollView>
          <View style={styles.modalButtons}>
            <Button onPress={onClose} style={styles.modalButton} mode="outlined">Cancel</Button>
            <Button onPress={onUpdate} style={styles.modalButton} mode="contained">Update</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: '70%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

