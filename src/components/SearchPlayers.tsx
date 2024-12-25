import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Animated } from 'react-native';
import { TextInput, Text, Surface } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import ProfileImage from './ProfileImage';
import { useTranslation } from 'react-i18next';

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
  const [isFocused, setIsFocused] = useState(false);
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation(); 

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchPlayers();
    } else {
      setPlayers([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

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

  const interpolatedWidth = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Surface style={styles.searchContainer}>
        <TextInput
          placeholder={t('Search players...')} // <-- Translate
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" color={colors.primary} />}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Animated.View style={[styles.focusLine, { width: interpolatedWidth }]} />
      </Surface>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.playerItem} 
            onPress={() => onSelectPlayer(item)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={t('Select player {{name}}', { name: item.full_name })} // <-- Translate
            accessibilityHint={t('Tapping this will select the player')} // <-- Translate
          >
            <View style={styles.playerContent}>
              <ProfileImage avatarUrl={item.avatar_url} size={50} />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.full_name}</Text>
                <Text style={styles.playerUsername}>@{item.username}</Text>
              </View>
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
  searchContainer: {
    borderRadius: 25,
    marginBottom: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  focusLine: {
    height: 2,
    backgroundColor: colors.primary,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 70,
  },
  playerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  playerUsername: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
