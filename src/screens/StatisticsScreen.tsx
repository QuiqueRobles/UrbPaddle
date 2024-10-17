import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Text } from 'react-native-paper';

export default function StatisticsScreen() {
  // TODO: Fetch statistics from Supabase
  const totalGames = 0;
  const winRate = 0;

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Your Statistics</Title>
      <Text style={styles.stat}>Total Games Played: {totalGames}</Text>
      <Text style={styles.stat}>Win Rate: {winRate}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  stat: {
    fontSize: 18,
    marginBottom: 12,
  },
});