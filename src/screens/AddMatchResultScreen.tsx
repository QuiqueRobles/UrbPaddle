import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity, Animated } from 'react-native';
import { Button, Title, TextInput, ActivityIndicator, useTheme, Card, Paragraph, IconButton, Chip, Modal, Portal, Searchbar } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import SelectPlayers from '../components/SelectPlayers';  // Adjust the path as needed

type Booking = {
  id: string;
  court_number: string;
  date: Date;
  start_time: string;
  end_time: string;
  user_id: string;
  community_id: string;
};

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  resident_community_id?: string;
  guest_communities?: string[];
  group_owner_id?: string;
};

type SetScore = {
  team1: string;
  team2: string;
};

type Score = {
  [key: string]: SetScore;
};

type Match = {
  id: string;
  match_date: string;
  match_time: string;
  court_number: number;
  score: string;
  winner_team: number;
  is_validated: boolean;
  created_at: string;
  validation_deadline?: string;
  player1_id: string;
  player2_id: string;
  player3_id: string;
  player4_id: string;
  proposed_by_player: string;
  player1?: { full_name: string; username: string };
  player2?: { full_name: string; username: string };
  player3?: { full_name: string; username: string };
  player4?: { full_name: string; username: string };
  booking?: { user_id: string };
};

export default function AddMatchResultScreen() {
  const [activeTab, setActiveTab] = useState<'propose' | 'validate'>('propose');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ set1: { team1: '', team2: '' } });
  const [setCount, setSetCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<{
    player1: Profile | null;
    player2: Profile | null;
    player3: Profile | null;
    player4: Profile | null;
  }>({
    player1: null,
    player2: null,
    player3: null,
    player4: null,
  });
  const [winningTeam, setWinningTeam] = useState<'1' | '2' | null>(null);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [showRefuteModal, setShowRefuteModal] = useState(false);
  const [selectedMatchForRefute, setSelectedMatchForRefute] = useState<Match | null>(null);
  const [refuteData, setRefuteData] = useState({ winnerTeam: '', score: '' });
  const [communityId, setCommunityId] = useState<string | null>(null);
  
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const [winningTeamAnim] = useState(new Animated.Value(0));
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'propose') {
        fetchBookings();
      } else {
        fetchPendingMatches();
      }
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (selectedBooking) {
      const fetchCommunity = async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select('community_id')
          .eq('id', selectedBooking)
          .single();

        if (error) {
          console.error('Error fetching community:', error);
          Alert.alert('Error', 'Failed to fetch community');
          return;
        }

        setCommunityId(data.community_id);
      };

      fetchCommunity();
    } else {
      setCommunityId(null);
    }
  }, [selectedBooking]);

  useEffect(() => {
    calculateWinner();
  }, [score]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleWinningTeamSelect = (team: '1' | '2') => {
    setWinningTeam(team);
    Animated.spring(winningTeamAnim, {
      toValue: team === '1' ? 0 : 1,
      useNativeDriver: false,
    }).start();
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      style={[
        styles.bookingItem,
        selectedBooking === item.id && styles.selectedBookingItem
      ]}
      onPress={() => setSelectedBooking(item.id)}
    >
      <View style={styles.bookingItemContent}>
        <MaterialCommunityIcons
          name="tennis-ball"
          size={24}
          color={selectedBooking === item.id ? colors.primary : colors.text}
        />
        <View style={styles.bookingItemText}>
          <Paragraph style={styles.bookingItemTitle}>Court {item.court_number}</Paragraph>
          <Paragraph style={styles.bookingItemSubtitle}>
            {new Date(item.date).toLocaleDateString()} • {item.start_time} - {item.end_time}
          </Paragraph>
        </View>
      </View>
      {selectedBooking === item.id && (
        <MaterialCommunityIcons
          name="check-circle"
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      if (!user) throw new Error('No user found');

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nowTime = now.toTimeString().slice(0, 5);

      // Fetch bookings where date < today OR (date = today AND end_time <= now)
      const { data: userBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .or(`date.lt.${todayStr},and(date.eq.${todayStr},end_time.lte.${nowTime})`)
        .order('date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Filter out bookings that already have matches
      const bookingsWithoutMatches = [];
      for (const booking of userBookings || []) {
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('booking_id', booking.id)
          .single();

        if (!existingMatch) {
          bookingsWithoutMatches.push(booking);
        }
      }

      setBookings(bookingsWithoutMatches);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingMatches = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(full_name, username),
          player2:player2_id(full_name, username),
          player3:player3_id(full_name, username),
          player4:player4_id(full_name, username),
          booking:booking_id(user_id)
        `)
        .eq('is_validated', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter matches based on validation logic
      const userMatches = (data || []).filter((match) => {
        const playerIds = [match.player1_id, match.player2_id, match.player3_id, match.player4_id].filter(Boolean);

        if (!playerIds.includes(user.id)) return false;

        const proposedBy = match.proposed_by_player;
        const isUserOnTeam1 = match.player1_id === user.id || match.player2_id === user.id;
        const isUserOnTeam2 = match.player3_id === user.id || match.player4_id === user.id;
        const isProposerPlaying = playerIds.includes(proposedBy);

        if (isProposerPlaying) {
          const isProposerOnTeam1 = match.player1_id === proposedBy || match.player2_id === proposedBy;
          const isProposerOnTeam2 = match.player3_id === proposedBy || match.player4_id === proposedBy;

          if (isProposerOnTeam1 && isUserOnTeam2) return true;
          if (isProposerOnTeam2 && isUserOnTeam1) return true;
        } else {
          const isTeam1Winning = match.winner_team === 1;
          const isTeam2Winning = match.winner_team === 2;

          if (isTeam1Winning && isUserOnTeam2) return true;
          if (isTeam2Winning && isUserOnTeam1) return true;
        }

        return false;
      });

      setPendingMatches(userMatches as Match[]);
    } catch (error) {
      console.error('Error fetching pending matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateSets = () => {
    const setsWithScore = Object.values(score).filter(set => set.team1 !== '' && set.team2 !== '');
    
    if (setsWithScore.length === 0) {
      Alert.alert('Error', 'You must enter the score for at least one set');
      return false;
    }

    for (const set of setsWithScore) {
      const team1Score = parseInt(set.team1);
      const team2Score = parseInt(set.team2);

      if (isNaN(team1Score) || isNaN(team2Score)) {
        Alert.alert('Error', 'Scores must be numbers');
        return false;
      }

      if (team1Score < 0 || team2Score < 0) {
        Alert.alert('Error', 'Scores cannot be negative');
        return false;
      }

      const maxScore = Math.max(team1Score, team2Score);
      const minScore = Math.min(team1Score, team2Score);

      if (maxScore > 7) {
        Alert.alert('Error', 'Set scores cannot exceed 7');
        return false;
      }

      if (maxScore < 6) {
        Alert.alert('Error', 'A set must be won by at least 6 games');
        return false;
      }

      if (maxScore === 6 && minScore > 4) {
        Alert.alert('Error', 'Invalid set score for 6-game set');
        return false;
      }

      if (maxScore === 7 && minScore !== 5 && minScore !== 6) {
        Alert.alert('Error', 'Invalid set score for 7-game set');
        return false;
      }
    }

    if (setsWithScore.length > 3) {
      Alert.alert('Error', 'A padel match cannot have more than 3 sets');
      return false;
    }

    return true;
  };

  const calculateWinner = () => {
    let team1Sets = 0;
    let team2Sets = 0;

    Object.values(score).forEach(set => {
      const team1Score = parseInt(set.team1) || 0;
      const team2Score = parseInt(set.team2) || 0;

      if (team1Score > team2Score && team1Score >= 6) {
        const scoreDiff = team1Score - team2Score;
        if ((team1Score === 6 && scoreDiff >= 2) || (team1Score === 7 && (team2Score === 5 || team2Score === 6))) {
          team1Sets++;
        }
      } else if (team2Score > team1Score && team2Score >= 6) {
        const scoreDiff = team2Score - team1Score;
        if ((team2Score === 6 && scoreDiff >= 2) || (team2Score === 7 && (team1Score === 5 || team1Score === 6))) {
          team2Sets++;
        }
      }
    });

    if (team1Sets > team2Sets) {
      setWinningTeam('1');
    } else if (team2Sets > team1Sets) {
      setWinningTeam('2');
    } else {
      setWinningTeam(null);
    }
  };

  const handleAddSet = () => {
    if (setCount < 3) {
      const newSetKey = `set${setCount + 1}`;
      setScore(prev => ({ ...prev, [newSetKey]: { team1: '', team2: '' } }));
      setSetCount(prev => prev + 1);
    }
  };

  const handleRemoveSet = () => {
    if (setCount > 1) {
      const newScore = { ...score };
      delete newScore[`set${setCount}`];
      setScore(newScore);
      setSetCount(prev => prev - 1);
    }
  };

  const updateSet = (setKey: string, team: 'team1' | 'team2', value: string) => {
    setScore(prev => ({
      ...prev,
      [setKey]: {
        ...prev[setKey],
        [team]: value,
      }
    }));
  };

  const handleSubmitMatchProposal = async () => {
    if (!selectedBooking || !validateSets() || !winningTeam) {
      Alert.alert('Error', 'Please fill in all fields correctly');
      return;
    }

    const selectedPlayersList = Object.values(selectedPlayers).filter(Boolean);
    if (selectedPlayersList.length < 2) {
      Alert.alert('Error', 'Please select at least 2 players');
      return;
    }

    const team1HasPlayer = selectedPlayers.player1 || selectedPlayers.player2;
    const team2HasPlayer = selectedPlayers.player3 || selectedPlayers.player4;

    if (!team1HasPlayer || !team2HasPlayer) {
      Alert.alert('Error', 'Each team must have at least one player');
      return;
    }

    const currentUserSelected = selectedPlayersList.some(player => player.id === user.id);
    if (!currentUserSelected) {
      Alert.alert('Error', 'You must be one of the players in the match');
      return;
    }

    try {
      setLoading(true);

      const booking = bookings.find(b => b.id === selectedBooking);
      if (!booking) throw new Error('Invalid booking selected');

      const scoreString = Object.values(score)
        .filter(set => set.team1 !== '' && set.team2 !== '')
        .map(set => `${set.team1}-${set.team2}`)
        .join(', ');

      const matchData = {
        booking_id: selectedBooking,
        player1_id: selectedPlayers.player1?.id || null,
        player2_id: selectedPlayers.player2?.id || null,
        player3_id: selectedPlayers.player3?.id || null,
        player4_id: selectedPlayers.player4?.id || null,
        winner_team: parseInt(winningTeam),
        score: scoreString,
        match_date: booking.date,
        match_time: booking.start_time,
        court_number: booking.court_number,
        community_id: booking.community_id,
        proposed_by_player: user.id,
        is_validated: false,
        validation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };

      const { error: matchError } = await supabase.from('matches').insert(matchData);

      if (matchError) throw matchError;

      Alert.alert(
        'Success', 
        'Match result proposed successfully! Other players will need to validate it within 48 hours.'
      );

      // Reset form
      setSelectedBooking(null);
      setSelectedPlayers({ player1: null, player2: null, player3: null, player4: null });
      setScore({ set1: { team1: '', team2: '' } });
      setSetCount(1);
      setWinningTeam(null);
      
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Error submitting match proposal:', error);
      Alert.alert('Error', 'Failed to submit match proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateMatch = async (matchId: string) => {
    try {
      setLoading(true);

      // Check if match is already validated
      const { data: currentMatch, error: fetchError } = await supabase
        .from('matches')
        .select('is_validated, validated_by_players')
        .eq('id', matchId)
        .single();

      if (fetchError || currentMatch?.is_validated) {
        Alert.alert('Error', 'This match is already validated or cannot be found');
        return;
      }

      // Update the match with user's validation
      const validatedByPlayers = currentMatch.validated_by_players || [];
      validatedByPlayers.push(user.id);

      const { error: updateError } = await supabase
        .from('matches')
        .update({
          validated_by_players: validatedByPlayers,
          is_validated: true // Assume validation completes the process; adjust if more validations needed
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Match validated successfully');

      fetchPendingMatches();
    } catch (error) {
      console.error('Error validating match:', error);
      Alert.alert('Error', 'Failed to validate match');
    } finally {
      setLoading(false);
    }
  };

  const handleRefuteMatch = async () => {
    if (!selectedMatchForRefute || !refuteData.winnerTeam || !refuteData.score) {
      Alert.alert('Error', 'Please fill in all refutation fields');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('matches')
        .update({
          winner_team: parseInt(refuteData.winnerTeam),
          score: refuteData.score,
          proposed_by_player: user.id,
          validated_by_players: [], // Reset validations
          validation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', selectedMatchForRefute.id);

      if (error) throw error;

      Alert.alert('Success', 'Refutation submitted successfully. The validation timer has been reset.');

      setShowRefuteModal(false);
      setSelectedMatchForRefute(null);
      setRefuteData({ winnerTeam: '', score: '' });
      fetchPendingMatches();
    } catch (error) {
      console.error('Error refuting match:', error);
      Alert.alert('Error', 'Failed to submit refutation');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTimeColor = (deadline?: string) => {
    if (!deadline) return colors.primary;
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.floor((end.getTime() - now.getTime()) / 1000 / 60 / 60);
    return diff < 12 ? '#F44336' : colors.primary;
  };

  const renderPendingMatch = ({ item: match }: { item: Match }) => {
    const team1Players = [match.player1, match.player2].filter(Boolean).map(p => p.full_name).join(' & ');
    const team2Players = [match.player3, match.player4].filter(Boolean).map(p => p.full_name).join(' & ');
    const isWinnerTeam1 = match.winner_team === 1;

    return (
      <Card style={styles.matchCard}>
        <Card.Content style={styles.matchContent}>
          <View style={styles.matchHeader}>
            <View style={styles.matchInfo}>
              <MaterialCommunityIcons name="calendar" size={16} color="#666" />
              <Paragraph style={styles.matchDate}>{new Date(match.match_date).toLocaleDateString()} • {match.match_time}</Paragraph>
              <Chip style={styles.courtChip} compact>Court {match.court_number}</Chip>
            </View>
            <View style={styles.matchTimestamps}>
              <Paragraph style={styles.timeAgo}>{getTimeAgo(match.created_at)}</Paragraph>
              <Paragraph style={[styles.timeRemaining, { color: getRemainingTimeColor(match.validation_deadline) }]}>
                {getRemainingTime(match.validation_deadline)}
              </Paragraph>
            </View>
          </View>

          <View style={styles.teamsContainer}>
            <View style={styles.teamSection}>
              <View style={styles.teamHeader}>
                <MaterialCommunityIcons name="account-group" size={20} color="#333" />
                <Paragraph style={styles.teamTitle}>Team 1</Paragraph>
                {isWinnerTeam1 && <MaterialCommunityIcons name="trophy" size={20} color={colors.trophy} />}
              </View>
              <Paragraph style={styles.playerName}>{team1Players}</Paragraph>
            </View>
            <Paragraph style={styles.vs}>VS</Paragraph>
            <View style={styles.teamSection}>
              <View style={styles.teamHeader}>
                <MaterialCommunityIcons name="account-group" size={20} color="#333" />
                <Paragraph style={styles.teamTitle}>Team 2</Paragraph>
                {!isWinnerTeam1 && <MaterialCommunityIcons name="trophy" size={20} color={colors.trophy} />}
              </View>
              <Paragraph style={styles.playerName}>{team2Players}</Paragraph>
            </View>
          </View>

          <View style={styles.scoreSection}>
            <Paragraph style={styles.scoreLabel}>Score: {match.score}</Paragraph>
          </View>

          <View style={styles.matchActions}>
            <Button 
              mode="contained" 
              style={[styles.actionButton, styles.validateButton]}
              icon="check"
              onPress={() => handleValidateMatch(match.id)}
            >
              Validate
            </Button>
            <Button 
              mode="outlined" 
              style={[styles.actionButton, styles.refuteButton]}
              labelStyle={styles.refuteButtonLabel}
              icon="close"
              onPress={() => {
                setSelectedMatchForRefute(match);
                setShowRefuteModal(true);
              }}
            >
              Refute
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000 / 60);
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const getRemainingTime = (deadline?: string) => {
    if (!deadline) return '';
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.floor((end.getTime() - now.getTime()) / 1000 / 60 / 60);
    return `${diff} hours remaining`;
  };

  if (loading) {
    return (
      <LinearGradient colors={[theme.colors.gradientStart, "#000"]} style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={'white'} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.colors.gradientStart, "#000"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.title}>{t('matchResults') || 'Match Results'}</Title>
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'propose' && styles.activeTab]}
                onPress={() => setActiveTab('propose')}
              >
                <MaterialCommunityIcons 
                  name="pencil" 
                  size={20} 
                  color={activeTab === 'propose' ? colors.primary : colors.text} 
                />
                <Paragraph style={[styles.tabText, activeTab === 'propose' && styles.activeTabText]}>
                  {t('proposeMatch') || 'Propose'}
                </Paragraph>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'validate' && styles.activeTab]}
                onPress={() => setActiveTab('validate')}
              >
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color={activeTab === 'validate' ? colors.primary : colors.text} 
                />
                <Paragraph style={[styles.tabText, activeTab === 'validate' && styles.activeTabText]}>
                  {t('validateMatch') || 'Validate'}
                </Paragraph>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {activeTab === 'propose' ? (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.sectionTitle}>{t('selectCompletedBooking') || 'Select Completed Booking'}</Title>
                {bookings.length > 0 ? (
                  <FlatList
                    data={bookings}
                    renderItem={renderBookingItem}
                    keyExtractor={(item) => item.id}
                    style={styles.bookingList}
                  />
                ) : (
                  <Paragraph style={styles.noBookingsText}>{t('noCompletedBookings') || 'No completed bookings available'}</Paragraph>
                )}
              </Card.Content>
            </Card>

            {selectedBooking && communityId && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.sectionTitle}>{t('selectPlayers') || 'Select Players'}</Title>
                  <SelectPlayers
                    communityId={communityId}
                    onPlayersChange={setSelectedPlayers}
                  />
                </Card.Content>
              </Card>
            )}

            {selectedBooking && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.sectionTitle}>{t('enterSets') || 'Enter Sets'}</Title>
                  <View style={styles.scoreCard}>
                    <View style={styles.setControlsContainer}>
                      <IconButton
                        icon="minus-circle"
                        size={24}
                        onPress={handleRemoveSet}
                        disabled={setCount === 1}
                      />
                      <Paragraph style={styles.setCountLabel}>
                        {setCount} {setCount === 1 ? t('set') : t('sets')}
                      </Paragraph>
                      <IconButton
                        icon="plus-circle"
                        size={24}
                        onPress={handleAddSet}
                        disabled={setCount === 3}
                      />
                    </View>
                    {Object.keys(score).map((setKey, index) => (
                      <View key={setKey} style={styles.setContainer}>
                        <View style={styles.setLabelContainer}>
                          <MaterialCommunityIcons name="tennis" size={24} color={theme.colors.primary} />
                          <Paragraph style={styles.setLabel}>{t('set')} {index + 1}</Paragraph>
                        </View>
                        <View style={styles.scoreInputContainer}>
                          <TextInput
                            value={score[setKey].team1}
                            onChangeText={(value) => updateSet(setKey, 'team1', value)}
                            keyboardType="numeric"
                            style={styles.scoreInput}
                            maxLength={1}
                          />
                          <Paragraph style={styles.scoreSeparator}>-</Paragraph>
                          <TextInput
                            value={score[setKey].team2}
                            onChangeText={(value) => updateSet(setKey, 'team2', value)}
                            keyboardType="numeric"
                            style={styles.scoreInput}
                            maxLength={1}
                          />
                        </View>
                      </View>
                    ))}
                  </View>

                  {winningTeam && (
                    <View style={styles.winningTeamContainer}>
                      <Title style={styles.sectionTitle}>{t('winner') || 'Winner'}</Title>
                      <Paragraph>
                        {t('team') || 'Team'} {winningTeam}
                      </Paragraph>
                    </View>
                  )}
                </Card.Content>
              </Card>
            )}

            {selectedBooking && (
              <Button 
                mode="contained" 
                onPress={handleSubmitMatchProposal} 
                style={styles.submitButton}
                icon="check-circle"
                disabled={loading}
              >
                {t('proposeResult') || 'Propose Result'}
              </Button>
            )}
          </>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('pendingValidations') || 'Pending Validations'}</Title>
              {pendingMatches.length > 0 ? (
                <FlatList
                  data={pendingMatches}
                  renderItem={renderPendingMatch}
                  keyExtractor={(item) => item.id}
                  style={styles.matchList}
                />
              ) : (
                <View style={styles.noMatchesContainer}>
                  <MaterialCommunityIcons name="clock" size={48} color={'white'} />
                  <Paragraph style={styles.noMatchesText}>{t('noPendingValidations') || 'No pending match validations'}</Paragraph>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Refute Match Modal */}
        <Portal>
          <Modal
            visible={showRefuteModal}
            onDismiss={() => setShowRefuteModal(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Card style={styles.modalCard}>
              <Card.Content>
                <Title style={styles.modalTitle}>{t('refuteMatch') || 'Refute Match Result'}</Title>
                <Paragraph style={styles.modalDescription}>
                  {t('refuteDescription') || 'Propose the correct match result. This will reset the 48-hour validation timer.'}
                </Paragraph>
                
                <View style={styles.refuteForm}>
                  <View style={styles.formField}>
                    <Paragraph style={styles.fieldLabel}>{t('correctWinnerTeam') || 'Correct Winner Team'}</Paragraph>
                    <View style={styles.winnerSelection}>
                      <TouchableOpacity
                        style={[
                          styles.winnerOption,
                          refuteData.winnerTeam === '1' && styles.winnerOptionSelected
                        ]}
                        onPress={() => setRefuteData(prev => ({ ...prev, winnerTeam: '1' }))}
                      >
                        <Paragraph>{t('team') + ' 1'}</Paragraph>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.winnerOption,
                          refuteData.winnerTeam === '2' && styles.winnerOptionSelected
                        ]}
                        onPress={() => setRefuteData(prev => ({ ...prev, winnerTeam: '2' }))}
                      >
                        <Paragraph>{t('team') + ' 2'}</Paragraph>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Paragraph style={styles.fieldLabel}>{t('correctScore') || 'Correct Score'}</Paragraph>
                    <TextInput
                      value={refuteData.score}
                      onChangeText={(value) => setRefuteData(prev => ({ ...prev, score: value }))}
                      placeholder="6-4, 6-2"
                      style={styles.scoreRefuteInput}
                    />
                  </View>
                  <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowRefuteModal(false)}
                    style={styles.modalCancelButton}
                  >
                    {t('cancel') || 'Cancel'}
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleRefuteMatch}
                    style={styles.modalSubmitButton}
                    disabled={loading}
                  >
                    {t('submitRefutation') || 'Submit Refutation'}
                  </Button>
                </View>
                </View>

                
              </Card.Content>
            </Card>
          </Modal>
        </Portal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabText: {
    marginLeft: 8,
    fontWeight: '600',
    color: colors.text,
  },
  activeTabText: {
    color: colors.primary,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#ffffffff', // Changed to dark color for better visibility on light card background
  },
  bookingList: {
    maxHeight: 200,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedBookingItem: {
    backgroundColor: '#e0f0ff',
  },
  bookingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingItemText: {
    marginLeft: 12,
  },
  bookingItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  noBookingsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#b7b7b7ff', // Changed to visible color
    marginTop: 16,
  },
  scoreCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  setControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  setCountLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    color: '#333',
  },
  setContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  scoreInput: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    width: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  scoreSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
    color: '#333',
  },
  winningTeamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  submitButton: {
    marginTop: 0,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom:100,
  },
  matchList: {
    maxHeight: 600,
  },
  matchCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff', // Ensure light background for dark text
  },
  matchContent: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16, // Increased spacing
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  courtChip: {
    height: 30,
    backgroundColor: '#e0f0ff', // Softer color for chip
  },
  matchTimestamps: {
    alignItems: 'flex-end',
    marginTop: 4, 
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6, // Increased vertical margin
    paddingHorizontal: 8, // Added padding
  },
  vs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16, // Increased spacing around VS
  },
  teamSection: {
    flex: 1,
    marginHorizontal: 8,
    padding: 12, // Added padding for better touch area
    backgroundColor: '#f8f8f8', // Light background to distinguish teams
    borderRadius: 8, // Rounded corners
    elevation: 1, // Subtle shadow
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  playerName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  scoreSection: {
    marginVertical: 16, // Increased margin
    paddingVertical: 12, // Increased padding
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center', // Center score for better visibility
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  matchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16, // Increased top margin
  },
  actionButton: {
    flex: 0.48,
    borderRadius: 8, // Rounded buttons
  
  },
  validateButton: {
    backgroundColor: '#4CAF50',
  },
  refuteButton: {
    backgroundColor: 'red', // Transparent background for outlined button
    outlineColor: 'red', // White outline for better visibility
  },
  refuteButtonLabel: {
  color: 'white', // Texto blanco
  },
  noMatchesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noMatchesText: {
    fontSize: 16,
    color: '#b4b4b4ff', // Changed to visible color
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 16,
    backgroundColor: 'blur', // Semi-transparent background
  },
  modalCard: {
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 100,
    paddingBottom: 200,
    elevation: 4,
    backgroundColor: '#fff',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  refuteForm: {
    marginVertical: 16,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  winnerSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  winnerOption: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  winnerOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  scoreRefuteInput: {
    backgroundColor: '#f5f5f5',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 0.48,
  },
  modalSubmitButton: {
    flex: 0.48,
  },
});