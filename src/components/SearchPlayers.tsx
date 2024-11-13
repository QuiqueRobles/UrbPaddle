import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { TextInput, Text, Avatar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Player = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
};

type SearchPlayersProps = {
  communityId: string;
  onSelectPlayer: (player: Player) => void;
};

export default function SearchPlayers({ communityId, onSelectPlayer }: SearchPlayersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchPlayers();
    } else {
      setPlayers([]);
    }
  }, [searchQuery]);

  const searchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('resident_community_id', communityId)
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error searching players:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search players..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        left={<TextInput.Icon icon="magnify" />}
      />
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.playerItem} onPress={() => onSelectPlayer(item)}>
            <Avatar.Image 
              size={40} 
              source={item.avatar_url ? { uri: item.avatar_url } : require('../../assets/icon.png')} 
            />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.full_name}</Text>
              <Text style={styles.playerUsername}>@{item.username}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  searchInput: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  playerUsername: {
    fontSize: 14,
    color: '#666',
  },
});