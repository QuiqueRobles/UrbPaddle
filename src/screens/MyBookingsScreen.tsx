'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format, parseISO, isBefore, subDays, isToday, isTomorrow } from 'date-fns';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { enUS, es, fr, it } from 'date-fns/locale';
import * as Animatable from 'react-native-animatable';

type Booking = {
  id: string;
  court_number: number;
  date: string;
  start_time: string;
  end_time: string;
  user_id: string;
  status: string;
  has_match: boolean;
  booked_by_user_id?: string | null;
  booked_by_profile?: { full_name: string; username: string } | null;
  booking_owner_profile?: { full_name: string; username: string } | null;
};

type UserProfile = {
  resident_community_id: string;
  can_book: string[];
  group_owner_id: string | null;
  effectiveUserId: string;
  full_name: string;
  username: string;
};

export default function MyBookingsScreen() {
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGroupOwner, setIsGroupOwner] = useState(false);
  const [maxBookings, setMaxBookings] = useState<number | null>(null);
  const [currentBookingsCount, setCurrentBookingsCount] = useState(0);
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();

  const getDateFnsLocale = (language: string) => {
    switch (language) {
      case 'es':
        return es;
      case 'fr':
        return fr;
      case 'it':
        return it;
      case 'en':
      case 'en-US':
      default:
        return enUS;
    }
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        Alert.alert(t('error'), t('userNotFound'));
        return null;
      }

      setUserId(userData.user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("resident_community_id, can_book, group_owner_id, full_name, username")
        .eq("id", userData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setUserProfile({ effectiveUserId: userData.user.id } as UserProfile);
        setIsGroupOwner(false);
        return { effectiveUserId: userData.user.id, currentUserId: userData.user.id };
      }

      const effectiveUserId = profileData.group_owner_id || userData.user.id;
      const updatedProfile = { ...profileData, effectiveUserId };
      setUserProfile(updatedProfile);

      const { data: groupMembers } = await supabase
        .from("profiles")
        .select("id")
        .eq("group_owner_id", userData.user.id)
        .limit(1);

      const isOwner = groupMembers && groupMembers.length > 0;
      setIsGroupOwner(isOwner);

      await fetchCommunityLimits(effectiveUserId);

      return { effectiveUserId, currentUserId: userData.user.id };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile({ effectiveUserId: userData.user.id } as UserProfile);
      setIsGroupOwner(false);
      return { effectiveUserId: userData.user.id, currentUserId: userData.user.id };
    }
  }, [t]);

  const fetchCommunityLimits = async (effectiveUserId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("resident_community_id")
        .eq("id", effectiveUserId)
        .single();

      if (profileError || !profileData?.resident_community_id) {
        console.error("Error fetching resident community:", profileError);
        return;
      }

      const { data: communityData, error: communityError } = await supabase
        .from("community")
        .select("max_number_current_bookings")
        .eq("id", profileData.resident_community_id)
        .single();

      if (communityError) {
        console.error("Error fetching community limits:", communityError);
      } else {
        setMaxBookings(communityData?.max_number_current_bookings || null);
      }
    } catch (error) {
      console.error("Error fetching community limits:", error);
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const result = await fetchUserProfile();
    if (!result) {
      setLoading(false);
      return;
    }

    const { effectiveUserId, currentUserId } = result;

    try {
      const now = new Date();
      const nowISODate = now.toISOString().split("T")[0];
      const nowTime = now.toTimeString().slice(0, 5);
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split("T")[0];

      const { data: futureData, error: futureError } = await supabase
        .from("bookings")
        .select(`
          *,
          booked_by_profile:booked_by_user_id(full_name, username),
          booking_owner_profile:user_id(full_name, username)
        `)
        .or(`user_id.eq.${currentUserId},booked_by_user_id.eq.${currentUserId}`)
        .or(`date.gt.${nowISODate},and(date.eq.${nowISODate},end_time.gt.${nowTime})`)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      const { data: pastData, error: pastError } = await supabase
        .from("bookings")
        .select(`
          *,
          booked_by_profile:booked_by_user_id(full_name, username),
          booking_owner_profile:user_id(full_name, username)
        `)
        .or(`user_id.eq.${currentUserId},booked_by_user_id.eq.${currentUserId}`)
        .or(`date.lt.${nowISODate},and(date.eq.${nowISODate},end_time.lte.${nowTime})`)
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });

      if (futureError || pastError) {
        throw futureError || pastError;
      }

      const allBookings = [...(futureData || []), ...(pastData || [])];
      const bookingIds = allBookings.map(booking => booking.id);

      let matchesData = [];
      if (bookingIds.length > 0) {
        const { data: matchesResult, error: matchesError } = await supabase
          .from('matches')
          .select('booking_id')
          .in('booking_id', bookingIds);

        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
        } else {
          matchesData = matchesResult || [];
        }
      }

      const bookingsWithMatches = new Set(matchesData.map(match => match.booking_id));
      const futureBookingsWithMatches = (futureData || []).map(booking => ({
        ...booking,
        has_match: bookingsWithMatches.has(booking.id)
      }));
      const pastBookingsWithMatches = (pastData || []).map(booking => ({
        ...booking,
        has_match: bookingsWithMatches.has(booking.id)
      }));

      setFutureBookings(futureBookingsWithMatches);
      setPastBookings(pastBookingsWithMatches);
      setCurrentBookingsCount(futureData?.length || 0);
    } catch (error) {
      console.error(t('errorFetchingBookings'), error);
      Alert.alert(t('error'), t('failedToFetchBookings'));
    } finally {
      setLoading(false);
    }
  }, [t, fetchUserProfile]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      t('cancelBooking'),
      t('cancelBookingConfirmation'),
      [
        { text: t('no'), style: "cancel" },
        {
          text: t('yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (!userProfile || !userId) {
                Alert.alert(t('error'), t('userNotFound'));
                return;
              }

              const { data, error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId)
                .or(`user_id.eq.${userId},booked_by_user_id.eq.${userId}`)
                .select();

              if (error) {
                Alert.alert(t('error'), t('failedToCancelBooking'));
                console.error(t('errorCancellingBooking'), error);
              } else if (data && data.length > 0) {
                Alert.alert(t('success'), t('bookingCancelledSuccessfully'));
                fetchBookings();
              } else {
                Alert.alert(t('error'), t('bookingNotFoundOrNoPermission'));
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert(t('error'), t('failedToCancelBooking'));
            }
          }
        }
      ]
    );
  };

  const handleAddMatchResult = (booking: Booking) => {
    navigation.navigate('AddMatchResult', { bookingId: booking.id });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const getDateLabel = (date: string) => {
    const bookingDate = parseISO(date);
    const currentLocale = getDateFnsLocale(i18n.language);
    if (isToday(bookingDate)) return t('today');
    if (isTomorrow(bookingDate)) return t('tomorrow');
    return format(bookingDate, t('dateFormat'), { locale: currentLocale });
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <MaterialCommunityIcons name="check-circle" size={16} color="#22C55E" />;
      case 'cancelled': return <MaterialCommunityIcons name="close-circle" size={16} color="#EF4444" />;
      case 'pending': return <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />;
      default: return <MaterialCommunityIcons name="alert-circle" size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#22C55E';
      case 'cancelled': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getBookedByInfo = (booking: Booking) => {
    if (booking.booked_by_user_id && booking.booked_by_user_id !== booking.user_id) {
      const bookerName = booking.booked_by_profile?.full_name || booking.booked_by_profile?.username || t('unknown');
      return { name: bookerName, isProxy: true };
    }
    const ownerName = booking.booking_owner_profile?.full_name || booking.booking_owner_profile?.username || t('unknown');
    return { name: ownerName, isProxy: false };
  };

  const renderBookingQuota = () => {
    if (maxBookings === null) return null;

    const isOverLimit = currentBookingsCount > maxBookings;
    const isNearLimit = currentBookingsCount === maxBookings;

    return (
      <Animatable.View animation="bounceIn" duration={800} style={styles.quotaContainer}>
        <MaterialCommunityIcons name="information-outline" size={16} color="#D1D5DB" />
        <View style={[styles.quotaBadge, isOverLimit ? styles.quotaOverLimit : isNearLimit ? styles.quotaNearLimit : styles.quotaNormal]}>
          <Paragraph style={[styles.quotaText, isOverLimit ? styles.quotaOverLimitText : isNearLimit ? styles.quotaNearLimitText : styles.quotaNormalText]}>
            {currentBookingsCount}/{maxBookings} {t('bookingsUsed')}
          </Paragraph>
        </View>
      </Animatable.View>
    );
  };

  const renderUniversalBookedByBadge = (booking: Booking) => {
    const bookedByInfo = getBookedByInfo(booking);
    return (
      <Chip
        style={[styles.bookedByChip, bookedByInfo.isProxy ? styles.proxyBookingChip : styles.ownerBookingChip]}
        textStyle={[styles.chipText, bookedByInfo.isProxy ? styles.proxyBookingText : styles.ownerBookingText]}
        icon="account"
      >
        {t('bookedBy', { name: bookedByInfo.name })}
      </Chip>
    );
  };

  const renderBookingInfo = (booking: Booking) => {
    const isOwnBooking = booking.user_id === userId;
    const isBookedByMe = booking.booked_by_user_id === userId;
    const bookerName = booking.booked_by_profile?.full_name || booking.booked_by_profile?.username || t('unknown');
    const ownerName = booking.booking_owner_profile?.full_name || booking.booking_owner_profile?.username || t('unknown');

    if (isGroupOwner && !isOwnBooking) {
      return (
        <Chip style={styles.specialInfoChip} textStyle={styles.specialInfoText} icon="account-supervisor">
          {t('bookedBy', { name: bookerName })}
        </Chip>
      );
    } else if (!isOwnBooking && isBookedByMe) {
      return (
        <Chip style={styles.specialInfoChip} textStyle={styles.specialInfoText} icon="account-group">
          {t('bookedFor', { name: ownerName })}
        </Chip>
      );
    }
    return null;
  };

  const renderBookingItem = ({ item, isPast }: { item: Booking; isPast: boolean }) => (
    <Animatable.View animation="fadeInUp" duration={800} delay={100 * (futureBookings.indexOf(item) + pastBookings.indexOf(item))}>
      <Card style={[styles.card, isPast && styles.pastBooking]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons name="tennis" size={20} color="#22C55E" />
              <Title style={styles.courtTitle}>{t('court_number', { number: item.court_number })}</Title>
            </View>
            <View style={styles.statusContainer}>
              {getStatusIcon(item.status)}
              <Paragraph style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Paragraph>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={18} color="#22C55E" />
              <Paragraph style={styles.infoText}>{getDateLabel(item.date)}</Paragraph>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#22C55E" />
              <Paragraph style={styles.infoText}>
                {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
              </Paragraph>
            </View>
          </View>

          <View style={styles.badgeContainer}>
            {renderUniversalBookedByBadge(item)}
            {renderBookingInfo(item)}
          </View>

          <View style={styles.buttonContainer}>
            {!isPast && item.status !== 'cancelled' && (
              <Animatable.View animation="pulse" duration={300} iterationCount={1} trigger="onPress">
                <Button
                  mode="contained"
                  onPress={() => handleCancelBooking(item.id)}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonText}
                  icon="cancel"
                >
                  {t('cancelBooking')}
                </Button>
              </Animatable.View>
            )}
            {isPast && !item.has_match && item.status !== 'cancelled' && (
              <Animatable.View animation="pulse" duration={300} iterationCount={1} trigger="onPress">
                <Button
                  mode="contained"
                  onPress={() => handleAddMatchResult(item)}
                  style={styles.addResultButton}
                  labelStyle={styles.addResultButtonText}
                  icon="plus"
                >
                  {t('addMatchResult')}
                </Button>
              </Animatable.View>
            )}
            {isPast && item.has_match && (
              <Chip style={styles.matchAddedChip} textStyle={styles.matchAddedChipText} icon="check">
                {t('matchAdded')}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  if (loading) {
    return (
      <LinearGradient colors={[colors.gradientStart, '#000']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centered}>
            <Animatable.View animation="rotate" duration={1500} iterationCount="infinite">
              <ActivityIndicator size="large" color="white" />
            </Animatable.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, '#000']} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#22C55E']} tintColor="#22C55E" />}
        >
          <Animatable.View animation="fadeInDown" duration={800}>
            <View style={styles.header}>
              <Title style={styles.title}>{t('myBookings')}</Title>
              {renderBookingQuota()}
            </View>
          </Animatable.View>

          <View style={styles.sectionContainer}>
            {futureBookings.length > 0 && (
              <Animatable.View animation="fadeInUp" duration={800} delay={200}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#22C55E" />
                    <Title style={styles.sectionTitle}>{t('upcomingBookings')} ({futureBookings.length})</Title>
                  </View>
                </View>
              </Animatable.View>
            )}
            <FlatList
              data={futureBookings.map(booking => ({ ...booking, isPast: false }))}
              renderItem={({ item }) => renderBookingItem({ item, isPast: item.isPast })}
              keyExtractor={item => `future-${item.id}`}
              contentContainerStyle={[styles.listContent, futureBookings.length === 0 && styles.emptyList]}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Animatable.View animation="zoomIn" duration={800} style={styles.emptyState}>
                  <Animatable.View animation="bounceIn" duration={800} delay={200}>
                    <MaterialCommunityIcons name="calendar-blank" size={48} color="#D1D5DB" />
                  </Animatable.View>
                  <Animatable.Text animation="fadeIn" duration={800} delay={400} style={styles.noBookings}>
                    {t('noUpcomingBookings')}
                  </Animatable.Text>
                  <Animatable.View animation="bounceIn" duration={800} delay={600}>
                    <Button mode="contained" onPress={onRefresh} style={styles.refreshButton} labelStyle={styles.refreshButtonText}>
                      {t('refresh')}
                    </Button>
                  </Animatable.View>
                </Animatable.View>
              }
            />
          </View>

          <View style={styles.sectionContainer}>
            {pastBookings.length > 0 && (
              <Animatable.View animation="fadeInUp" duration={800} delay={400}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <MaterialCommunityIcons name="calendar-check" size={20} color="#22C55E" />
                    <Title style={styles.sectionTitle}>{t('pastBookings')} ({pastBookings.length})</Title>
                  </View>
                </View>
              </Animatable.View>
            )}
            <FlatList
              data={pastBookings.map(booking => ({ ...booking, isPast: true }))}
              renderItem={({ item }) => renderBookingItem({ item, isPast: item.isPast })}
              keyExtractor={item => `past-${item.id}`}
              contentContainerStyle={[styles.listContent, pastBookings.length === 0 && styles.emptyList]}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Animatable.View animation="zoomIn" duration={800} style={styles.emptyState}>
                  <Animatable.View animation="bounceIn" duration={800} delay={200}>
                    <MaterialCommunityIcons name="calendar-blank" size={48} color="#D1D5DB" />
                  </Animatable.View>
                  <Animatable.Text animation="fadeIn" duration={800} delay={400} style={styles.noBookings}>
                    {t('noPastBookings')}
                  </Animatable.Text>
                  <Animatable.View animation="bounceIn" duration={800} delay={600}>
                    <Button mode="contained" onPress={onRefresh} style={styles.refreshButton} labelStyle={styles.refreshButtonText}>
                      {t('refresh')}
                    </Button>
                  </Animatable.View>
                </Animatable.View>
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3C34',
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quotaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quotaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  quotaNormal: {
    backgroundColor: 'rgba(209, 213, 219, 0.1)',
    borderColor: 'rgba(209, 213, 219, 0.2)',
  },
  quotaNearLimit: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  quotaOverLimit: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  quotaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quotaNormalText: {
    color: '#D1D5DB',
  },
  quotaNearLimitText: {
    color: '#F59E0B',
  },
  quotaOverLimitText: {
    color: '#EF4444',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courtTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardContent: {
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  bookedByChip: {
    borderRadius: 16,
  },
  proxyBookingChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  ownerBookingChip: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  proxyBookingText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
  },
  ownerBookingText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  specialInfoChip: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 16,
  },
  specialInfoText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addResultButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
  },
  addResultButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  matchAddedChip: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 16,
  },
  matchAddedChipText: {
    color: '#22C55E',
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noBookings: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginVertical: 16,
  },
  refreshButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pastBooking: {
    opacity: 0.7,
  },
});