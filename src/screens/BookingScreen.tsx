import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Button, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

type RootStackParamList = {
  CourtList: undefined;
  DateSelection: { courtId: number };
};

type CourtListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourtList'>;

type Props = {
  navigation: CourtListScreenNavigationProp;
};

type Court = {
  id: number;
  name: string;
  description: string;
};

const courts: Court[] = [
  { id: 1, name: 'Pista 1', description: 'Pista cubierta con iluminación LED' },
  { id: 2, name: 'Pista 2', description: 'Pista al aire libre con gradas' },
];

export default function CourtListScreen({ navigation }: Props) {
  const theme = useTheme();

  const renderCourtItem = ({ item }: { item: Court }) => (
    <Card style={styles.card}>
      <Card.Cover 
        source={{ uri: `https://picsum.photos/seed/${item.id}/400/200` }} 
        accessibilityLabel={`Imagen de ${item.name}`}
      />
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>{item.description}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('DateSelection', { courtId: item.id })}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          accessibilityLabel={`Reservar ${item.name}`}
        >
          Reservar
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={courts}
        renderItem={renderCourtItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        accessibilityLabel="Lista de pistas de pádel disponibles"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  button: {
    backgroundColor: colors.secondary,
  },
  buttonLabel: {
    color: colors.onSecondary,
  },
});