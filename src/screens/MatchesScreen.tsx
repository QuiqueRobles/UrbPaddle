import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Dimensions, Text, Platform, Image, ScrollView, TextInput } from 'react-native';
import { Card, useTheme, Surface, Portal, Modal, Chip } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { PaddleCourt } from '../components/PaddleCourt';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import { Subscription } from '@supabase/supabase-js';

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

type ResultFilter = 'all' | 'wins' | 'losses';

export default function MatchesScreen() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: Player }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerOptions, setPlayerOptions] = useState<{id: string, name: string, avatar_url: string | null}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const theme = useTheme();
  const { t } = useTranslation();

  const filteredPlayers = useMemo(() => {
  console.log("🔍 playerOptions:", playerOptions);
  console.log("🔍 searchQuery:", searchQuery);

  if (!searchQuery.trim()) return playerOptions;

  return playerOptions.filter(player => {
    const name = (player.name || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query);
  });
}, [playerOptions, searchQuery]);


  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId) 
        : [...prev, playerId]
    );
  };

  const removeSelectedPlayer = (playerId: string) => {
    setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
  };

  const fetchUserAndMatches = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('noUserFound'));
      setUserId(user.id);

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('resident_community_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      let playerFilterOptions: {id: string, name: string, avatar_url: string | null}[] = [];
      if (userProfile?.resident_community_id) {
        const { data: communityPlayers, error: playersError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('resident_community_id', userProfile.resident_community_id)
          .neq('id', user.id);

        if (playersError) throw playersError;

        playerFilterOptions = (communityPlayers || []).map(player => ({
          id: player.id,
          name: player.full_name,
          avatar_url: player.avatar_url
        })).sort((a, b) => a.name.localeCompare(b.name));
      }
      console.log("✅ Jugadores cargados desde Supabase:", playerFilterOptions);
      setPlayerOptions(playerFilterOptions);

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
        .order('match_date', { ascending: sortOrder === 'asc' });

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

      setAllMatches(matchesData || []);
      setPlayers(playersMap);
    } catch (error) {
      console.error(t('errorFetchingMatches'), error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, sortOrder]);

  useEffect(() => {
    fetchUserAndMatches();

    const subscription: Subscription = supabase
      .channel('matches-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, payload => {
        if (payload.new && [payload.new.player1_id, payload.new.player2_id, payload.new.player3_id, payload.new.player4_id].includes(userId)) {
          setAllMatches(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserAndMatches, userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserAndMatches();
  }, [fetchUserAndMatches]);

  const filteredMatches = useMemo(() => {
    let filtered = [...allMatches];

    if (startDate || endDate) {
      filtered = filtered.filter(match => {
        if (!match.match_date) return false;
        const matchDate = parseISO(match.match_date);
        if (startDate && isBefore(matchDate, startDate)) return false;
        if (endDate && isAfter(matchDate, endDate)) return false;
        return true;
      });
    }

    if (selectedPlayerIds.length > 0) {
      filtered = filtered.filter(match => 
        selectedPlayerIds.some(playerId => 
          [match.player1_id, match.player2_id, match.player3_id, match.player4_id].includes(playerId)
        )
      );
    }

    if (resultFilter !== 'all' && userId) {
      filtered = filtered.filter(match => {
        const isTeam1 = [match.player1_id, match.player2_id].includes(userId);
        const isTeam2 = [match.player3_id, match.player4_id].includes(userId);
        const userTeam = isTeam1 ? 1 : isTeam2 ? 2 : 0;
        if (userTeam === 0) return false;
        const isWin = match.winner_team === userTeam;
        return resultFilter === 'wins' ? isWin : !isWin;
      });
    }

    filtered.sort((a, b) => {
      const dateA = a.match_date ? parseISO(a.match_date) : new Date(0);
      const dateB = b.match_date ? parseISO(b.match_date) : new Date(0);
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [allMatches, startDate, endDate, selectedPlayerIds, resultFilter, sortOrder, userId]);

  const resetFilters = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setSelectedPlayerIds([]);
    setResultFilter('all');
    setSortOrder('desc');
    setSearchQuery('');
    setShowPlayerDropdown(false);
  }, []);

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

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const renderFilterModal = useCallback(() => {
    const pickerDisplay = Platform.OS === 'android' ? 'calendar' : 'default';

    return (
      <Portal>
        <Modal 
          visible={showFilterModal} 
          onDismiss={() => {
            setShowFilterModal(false);
            setShowPlayerDropdown(false);
          }} 
          contentContainerStyle={[styles.modalContainer, {
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 5,
          }]}
        >
          <Surface style={[styles.filterSection, {
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
          }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('filters')}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowFilterModal(false);
                  setShowPlayerDropdown(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Date Range Section */}
              <View style={styles.filterBlock}>
                <Text style={styles.filterBlockTitle}>{t('dateRange')}</Text>
                <View style={styles.dateRangeContainer}>
                  <TouchableOpacity 
                    onPress={() => setShowStartDatePicker(true)}
                    style={styles.dateInput}
                  >
                    <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                    <Text style={styles.dateInputText}>
                      {startDate ? format(startDate, 'MMM d, yyyy') : t('startDate')}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                  </TouchableOpacity>

                  <View style={styles.dateRangeSeparator} />
                  
                  <TouchableOpacity 
                    onPress={() => setShowEndDatePicker(true)}
                    style={styles.dateInput}
                  >
                    <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                    <Text style={styles.dateInputText}>
                      {endDate ? format(endDate, 'MMM d, yyyy') : t('endDate')}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {showStartDatePicker && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      testID="startDateTimePicker"
                      value={startDate || new Date()}
                      mode="date"
                      is24Hour={true}
                      display={pickerDisplay}
                      onChange={handleStartDateChange}
                      maximumDate={endDate || undefined}
                    />
                  </View>
                )}

                {showEndDatePicker && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      testID="endDateTimePicker"
                      value={endDate || new Date()}
                      mode="date"
                      is24Hour={true}
                      display={pickerDisplay}
                      onChange={handleEndDateChange}
                      minimumDate={startDate || undefined}
                    />
                  </View>
                )}
              </View>

              {/* Players Section */}
              <View style={styles.filterBlock}>
                <Text style={styles.filterBlockTitle}>{t('players')}</Text>
                
                {/* Selected Players Chips */}
                {selectedPlayerIds.length > 0 && (
                  <View style={styles.chipsContainer}>
                    {selectedPlayerIds.map(playerId => {
                      const player = playerOptions.find(p => p.id === playerId);
                      if (!player) return null;
                      return (
                        <Chip
                          key={playerId}
                          style={styles.playerChip}
                          onClose={() => removeSelectedPlayer(playerId)}
                        >
                          <View style={styles.chipContent}>
                            {player.avatar_url ? (
                              <Image source={{ uri: player.avatar_url }} style={styles.chipAvatar} />
                            ) : (
                              <View style={[styles.chipAvatar, styles.defaultAvatar]}>
                                <Ionicons name="person" size={14} color="#fff" />
                              </View>
                            )}
                            <Text style={styles.chipText}>{player.name}</Text>
                          </View>
                        </Chip>
                      );
                    })}
                  </View>
                )}

                {/* Player Search */}
                <View style={styles.searchContainer}>
                  // En el TextInput de búsqueda, cambia los eventos:
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('searchPlayers')}
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setShowPlayerDropdown(text.length > 0); // Mostrar solo si hay texto
                  }}
                  onFocus={() => setShowPlayerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPlayerDropdown(false), 200)}
                />
                  <Ionicons 
                    name="search" 
                    size={20} 
                    color="#9CA3AF" 
                    style={styles.searchIcon} 
                  />
                </View>

                // En la sección del Player Dropdown, reemplaza con esto:
{showPlayerDropdown && (
  <View style={[styles.dropdownContainer, { 
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1000 // Asegura que aparezca sobre otros elementos
  }]}>
    <FlatList
      data={filteredPlayers}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.playerItem,
            selectedPlayerIds.includes(item.id) && styles.selectedPlayerItem
          ]}
          onPress={() => {
            togglePlayerSelection(item.id);
            setSearchQuery(''); // Limpiar la búsqueda después de seleccionar
          }}
          activeOpacity={0.7}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.playerAvatar} />
          ) : (
            <View style={[styles.playerAvatar, styles.defaultAvatar]}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          )}
          <Text style={styles.playerName}>{item.name}</Text>
          {selectedPlayerIds.includes(item.id) && (
            <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      )}
      keyboardShouldPersistTaps="always"
      style={styles.dropdownList}
      contentContainerStyle={styles.dropdownListContent}
      nestedScrollEnabled
      initialNumToRender={10}
      windowSize={5}
    />
  </View>
)}
              
              </View>

              {/* Results Section */}
              <View style={styles.filterBlock}>
                <Text style={styles.filterBlockTitle}>{t('results')}</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption, 
                      resultFilter === 'all' && styles.filterOptionActive
                    ]}
                    onPress={() => setResultFilter('all')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      resultFilter === 'all' && styles.filterOptionTextActive
                    ]}>
                      {t('all')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption, 
                      resultFilter === 'wins' && styles.filterOptionActive
                    ]}
                    onPress={() => setResultFilter('wins')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      resultFilter === 'wins' && styles.filterOptionTextActive
                    ]}>
                      {t('wins')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption, 
                      resultFilter === 'losses' && styles.filterOptionActive
                    ]}
                    onPress={() => setResultFilter('losses')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      resultFilter === 'losses' && styles.filterOptionTextActive
                    ]}>
                      {t('losses')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sort Section */}
              <View style={styles.filterBlock}>
                <Text style={styles.filterBlockTitle}>{t('sortByDate')}</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption, 
                      sortOrder === 'desc' && styles.filterOptionActive
                    ]}
                    onPress={() => setSortOrder('desc')}
                  >
                    <Ionicons 
                      name="arrow-down" 
                      size={16} 
                      color={sortOrder === 'desc' ? 'white' : theme.colors.primary} 
                      style={styles.sortIcon}
                    />
                    <Text style={[
                      styles.filterOptionText,
                      sortOrder === 'desc' && styles.filterOptionTextActive
                    ]}>
                      {t('newestFirst')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption, 
                      sortOrder === 'asc' && styles.filterOptionActive
                    ]}
                    onPress={() => setSortOrder('asc')}
                  >
                    <Ionicons 
                      name="arrow-up" 
                      size={16} 
                      color={sortOrder === 'asc' ? 'white' : theme.colors.primary} 
                      style={styles.sortIcon}
                    />
                    <Text style={[
                      styles.filterOptionText,
                      sortOrder === 'asc' && styles.filterOptionTextActive
                    ]}>
                      {t('oldestFirst')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={resetFilters}
                style={[styles.actionButton, styles.secondaryActionButton]}
              >
                <Text style={styles.secondaryActionButtonText}>{t('clear')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setShowFilterModal(false);
                  setShowPlayerDropdown(false);
                }}
                style={[styles.actionButton, styles.primaryActionButton]}
              >
                <Text style={styles.primaryActionButtonText}>{t('apply')}</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </Modal>
      </Portal>
    );
  }, [
    showFilterModal, t, startDate, endDate, showStartDatePicker, showEndDatePicker, 
    playerOptions, selectedPlayerIds, resultFilter, sortOrder, theme.colors, resetFilters,
    searchQuery, showPlayerDropdown, filteredPlayers
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[theme.colors.gradientStart || colors.gradientStart, theme.colors.gradientEnd || colors.gradientEnd]} style={StyleSheet.absoluteFillObject}>
        <FlatList
          data={filteredMatches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListHeaderComponent={
            <TouchableOpacity 
              style={styles.filterHeaderButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="filter" size={24} color="white" />
              <Text style={styles.filterHeaderText}>{t('filterMatches')}</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{loading ? t('loading') : t('noMatchesFound')}</Text>
            </View>
          )}
        />
      </LinearGradient>
      {renderFilterModal()}
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
  filterHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  filterHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    margin: 16,
    borderRadius: 24,
  },
  filterSection: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  filterBlock: {
    marginBottom: 24,
  },
  filterBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 4,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateInputText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    color: '#111827',
    fontSize: 14,
  },
  dateRangeSeparator: {
    width: 12,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  pickerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  playerChip: {
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#111827',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 0,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingLeft: 40,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
  },
  dropdownContainer: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  marginTop: 4,
  maxHeight: 200,
  backgroundColor: 'white',
  position: 'absolute', // Para que flote sobre otros elementos
  top: '100%', // Posicionarlo debajo del input
  left: 0,
  right: 0,
  zIndex: 1000,
},
dropdownList: {
  flex: 1,
  width: '100%',
},
  dropdownListContent: {
    paddingVertical: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedPlayerItem: {
    backgroundColor: '#F9FAFB',
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionActive: {
    backgroundColor: '#22be46ff',
    borderColor: '#22be46ff',
  },
  filterOptionText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  sortIcon: {
    marginRight: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#22be46ff',
  },
  secondaryActionButton: {
    backgroundColor: '#F3F4F6',
  },
  primaryActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryActionButtonText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 16,
  },
});