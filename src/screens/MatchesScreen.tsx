import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, Button, Chip, Surface } from 'react-native-paper';
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerOptions, setPlayerOptions] = useState<{id: string, name: string}[]>([]);

  const { colors } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
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
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const applyFilters = () => {
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
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedPlayerIds([]);
    setMatches(allMatches);
    setFilterModalVisible(false);
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
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
  };

  const renderFilterChips = () => {
    return (
      <View style={styles.chipContainer}>
        {startDate && endDate && (
          <Surface elevation={1} style={styles.filterChip}>
            <Ionicons name="calendar" size={16} color={colors.primary} style={styles.chipIcon} />
            <Text style={styles.chipText}>
              {`${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`}
            </Text>
            <TouchableOpacity onPress={() => {
              setStartDate(null);
              setEndDate(null);
              setMatches(allMatches);
            }}>
              <Ionicons name="close" size={16} color={colors.primary} />
            </TouchableOpacity>
          </Surface>
        )}
        {selectedPlayerIds.map(playerId => (
          <Surface key={playerId} elevation={1} style={styles.filterChip}>
            <Ionicons name="people" size={16} color={colors.primary} style={styles.chipIcon} />
            <Text style={styles.chipText}>
              {players[playerId]?.full_name || t('player')}
            </Text>
            <TouchableOpacity onPress={() => {
              setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
              applyFilters();
            }}>
              <Ionicons name="close" size={16} color={colors.primary} />
            </TouchableOpacity>
          </Surface>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={StyleSheet.absoluteFillObject}>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setFilterModalVisible(true)}
          >
            <Surface elevation={2} style={styles.filterButtonSurface}>
              <Ionicons name="filter" size={20} color={'white'} />
              <Text style={styles.filterButtonText}>{t('filters')}</Text>
            </Surface>
          </TouchableOpacity>
          {renderFilterChips()}
        </View>

        <FlatList
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
              <Text style={styles.emptyText}>{t('noMatchesFound')}</Text>
            </View>
          )}
        />

        <Modal
          visible={filterModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Surface style={styles.modalContent} elevation={5}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('matchFilters')}</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
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

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      setStartDate(selectedDate || null);
                    }}
                  />
                )}

                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      setEndDate(selectedDate || null);
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

              <View style={styles.modalButtonContainer}>
                <Button 
                  mode="outlined" 
                  onPress={resetFilters}
                  style={styles.modalButton}
                >
                  {t('clear')}
                </Button>
                <Button 
                  mode="contained" 
                  onPress={applyFilters}
                  style={styles.modalButton}
                >
                  {t('apply')}
                </Button>
              </View>
            </Surface>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 24,
    overflow: 'hidden'
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
   filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    marginRight: 12,
  },
  filterButtonSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterButtonText: {
    marginLeft: 8,
    color:'white',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    marginRight: 8,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width * 0.90,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
  },
  datePickerText: {
    marginLeft: 8,
    color: '#666',
  },
  playerFilterContainer: {
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    width: '48%',
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
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  multiSelectTagContainer: {
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
});