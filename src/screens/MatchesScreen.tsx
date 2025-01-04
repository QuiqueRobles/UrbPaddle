import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Card, useTheme, Surface } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { PaddleCourt } from '../components/PaddleCourt';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import MultiSelect from 'react-native-multiple-select';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

type Match = {
  id: string;
  match_date: string | null;
  score: string | null;
  player1_id: string | null;
  player2_id: string | null;
  player3_id: string | null;
  player4_id: string | null;
  winner_team: number;
};

type Player = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: Player }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerOptions, setPlayerOptions] = useState<{id: string, name: string}[]>([]);

  const { colors } = useTheme();
  const { t } = useTranslation();

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('noUserFound'));

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      const playerIds = new Set<string>();
      matchesData?.forEach(match => {
        [match.player1_id, match.player2_id, match.player3_id, match.player4_id].forEach(id => {
          if (id) playerIds.add(id);
        });
      });

      const { data: playersData, error: playersError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(playerIds));

      if (playersError) throw playersError;

      const playersMap = (playersData || []).reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {} as { [key: string]: Player });

      const playerFilterOptions = (playersData || [])
        .map(player => ({ id: player.id, name: player.full_name }))
        .filter(player => player.id !== user.id);

      setMatches(matchesData || []);
      setAllMatches(matchesData || []);
      setPlayers(playersMap);
      setPlayerOptions(playerFilterOptions);
    } catch (error) {
      console.error(t('errorFetchingMatches'), error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  const applyFilters = useCallback(() => {
    let filteredMatches = [...allMatches];

    if (startDate && endDate) {
      filteredMatches = filteredMatches.filter(match => {
        if (!match.match_date) return false;
        const matchDate = new Date(match.match_date);
        return matchDate >= startDate && matchDate <= endDate;
      });
    }

    if (selectedPlayerIds.length > 0) {
      filteredMatches = filteredMatches.filter(match => 
        selectedPlayerIds.some(playerId => 
          [match.player1_id, match.player2_id, match.player3_id, match.player4_id].includes(playerId)
        )
      );
    }

    setMatches(filteredMatches);
  }, [allMatches, startDate, endDate, selectedPlayerIds]);

  const resetFilters = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setSelectedPlayerIds([]);
    setMatches(allMatches);
  }, [allMatches]);

  const renderMatchItem = useCallback(({ item }: { item: Match }) => {
    const matchPlayers = [item.player1_id, item.player2_id, item.player3_id, item.player4_id]
      .map(id => id ? players[id] || null : null);

    return (
      <Card style={styles.matchCard}>
        <Text style={styles.matchDate}>
          {item.match_date ? format(parseISO(item.match_date), 'MMM d, yyyy') : t('dateNotAvailable')}
        </Text>
        <Card.Content>
          <PaddleCourt players={matchPlayers} score={item.score || t('notAvailable')} winner_team={item.winner_team} />
        </Card.Content>
      </Card>
    );
  }, [players, t]);

  const renderFilterSection = useCallback(() => {
    return (
      <Surface style={styles.filterSection}>
        <View style={styles.dateFilterContainer}>
          <Text style={styles.filterSectionTitle}>{t('dateRange')}</Text>
          <View style={styles.datePickerRow}>
            <TouchableOpacity 
              onPress={() => setShowStartDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.datePickerText}>
                {startDate ? format(startDate, 'dd/MM/yyyy') : t('startDate')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowEndDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.datePickerText}>
                {endDate ? format(endDate, 'dd/MM/yyyy') : t('endDate')}
              </Text>
            </TouchableOpacity>
          </View>

          {(showStartDatePicker || showEndDatePicker) && (
            <DateTimePicker
              testID="dateTimePicker"
              value={showStartDatePicker ? (startDate || new Date()) : (endDate || new Date())}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || (showStartDatePicker ? startDate : endDate);
                if (showStartDatePicker) {
                  setShowStartDatePicker(false);
                  setStartDate(currentDate);
                } else {
                  setShowEndDatePicker(false);
                  setEndDate(currentDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.playerFilterContainer}>
          <Text style={styles.filterSectionTitle}>{t('players')}</Text>
          <MultiSelect
            hideTags
            items={playerOptions}
            uniqueKey="id"
            onSelectedItemsChange={setSelectedPlayerIds}
            selectedItems={selectedPlayerIds}
            selectText={t('selectPlayers')}
            searchInputPlaceholderText={t('searchPlayers')}
            tagRemoveIconColor={colors.primary}
            tagBorderColor={colors.primary}
            tagTextColor={colors.primary}
            selectedItemTextColor={colors.primary}
            selectedItemIconColor={colors.primary}
            searchInputStyle={styles.multiSelectSearchInput}
            submitButtonColor={colors.primary}
            submitButtonText={t('select')}
            styleDropdownMenuSubsection={styles.multiSelectDropdownMenu}
            styleListContainer={styles.multiSelectListContainer}
            styleRowList={styles.multiSelectRowList}
          />
        </View>

        <View style={styles.filterButtonContainer}>
          <TouchableOpacity 
            onPress={resetFilters}
            style={[styles.filterButton, { backgroundColor: colors.error }]}
          >
            <Text style={styles.filterButtonText}>{t('clear')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={applyFilters}
            style={[styles.filterButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.filterButtonText}>{t('apply')}</Text>
          </TouchableOpacity>
        </View>
      </Surface>
    );
  }, [t, startDate, endDate, showStartDatePicker, showEndDatePicker, playerOptions, selectedPlayerIds, colors.primary, resetFilters, applyFilters]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={StyleSheet.absoluteFillObject}>
        <FlatList
          ListHeaderComponent={renderFilterSection}
          data={matches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{loading ? t('loading') : t('noMatchesFound')}</Text>
            </View>
          )}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 24,
    overflow: 'hidden',
  },
  matchDate: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white',
  },
  filterSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  dateFilterContainer: {
    marginBottom: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    width: '48%',
    backgroundColor: 'white',
  },
  datePickerText: {
    marginLeft: 8,
    color: '#333',
  },
  playerFilterContainer: {
    marginBottom: 20,
  },
  filterButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    width: '48%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  multiSelectMainWrapper: {
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  multiSelectDropdownMenu: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    backgroundColor: 'white',
  },
  multiSelectListContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  multiSelectRowList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  multiSelectSearchInput: {
    color: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
});

