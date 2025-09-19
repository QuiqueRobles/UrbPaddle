"use client"

import { useState, useEffect, useMemo } from "react"
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native"
import { Title, Card, Text, useTheme, ActivityIndicator, HelperText, Button } from "react-native-paper"
import type { RouteProp, CompositeNavigationProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { supabase } from "../lib/supabase"
import { format, addMinutes, parseISO, parse, isBefore, isAfter, isEqual } from "date-fns"
import { Calendar } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"

type RootStackParamList = {
  CourtSelection: { date: string }
  ConfirmBooking: { courtId: number; date: string; startTime: string; endTime: string; communityId: string }
}

type BottomTabParamList = {
  HomeTab: undefined
  MyBookingsTab: undefined
  ProfileTab: undefined
  CommunityManagementTab: undefined
}

type CourtSelectionScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, "CourtSelection">,
  BottomTabNavigationProp<BottomTabParamList>
>

type Props = {
  navigation: CourtSelectionScreenNavigationProp
  route: RouteProp<RootStackParamList, "CourtSelection">
}

type Booking = {
  id: string
  court_number: number
  date: string
  start_time: string
  end_time: string
  user_id: string
}

type Community = {
  id: string
  name: string
  booking_start_time: string
  booking_end_time: string
  booking_duration_options: number[]
  default_booking_duration: number
  court_number: number
  max_number_current_bookings: number
  simultaneous_bookings: boolean
  manual_booking: boolean
}

type UserProfile = {
  resident_community_id: string
  can_book: string[]
  group_owner_id: string | null
  effectiveUserId: string
}

export default function CourtSelectionScreen({ navigation, route }: Props) {
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [community, setCommunity] = useState<Community | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [canBook, setCanBook] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const theme = useTheme()
  const { date } = route.params
  const { t } = useTranslation()
  const gradientStart = "#0e3730ff"
  const gradientMiddle = "#000"
  const gradientEnd = "#000"

  useEffect(() => {
    fetchUserAndCommunity()
  }, [])

  const fetchUserAndCommunity = async () => {
    setLoading(true)
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError
      
      setUserId(user?.id || null)

      // 1) Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("resident_community_id, can_book, group_owner_id")
        .eq("id", user?.id)
        .single()
      if (profileError) throw profileError

      // 2) Determine effective user ID for booking (group owner or self)
      const effectiveUserId = profileData.group_owner_id || user?.id
      const updatedProfile = { ...profileData, effectiveUserId }
      setUserProfile(updatedProfile)

      // 3) Get community data from the "owner" resident
      const { data: ownerProfile, error: ownerError } = await supabase
        .from("profiles")
        .select("resident_community_id, can_book")
        .eq("id", effectiveUserId)
        .single()
      if (ownerError) throw ownerError

      const { data: communityData, error: communityError } = await supabase
        .from("community")
        .select("*")
        .eq("id", ownerProfile.resident_community_id)
        .single()
      if (communityError) throw communityError

      setCommunity(communityData)
      setSelectedDuration(communityData.default_booking_duration)

      // 4) Check booking permissions
      if (communityData.manual_booking) {
        const userCanBook =
          Array.isArray(ownerProfile.can_book) &&
          ownerProfile.can_book.includes(communityData.id)
        setCanBook(userCanBook)
      } else {
        setCanBook(true)
      }

      // 5) Fetch bookings for the selected date
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("date", date)
        .eq("community_id", communityData.id)
      if (bookingsError) throw bookingsError

      setBookings(bookingsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      Alert.alert(t("error"), t("unableToLoadData"))
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = useMemo(() => {
    if (!community) return []
    const startTime = parse(community.booking_start_time, "HH:mm:ss", new Date())
    const endTime = parse(community.booking_end_time, "HH:mm:ss", new Date())
    const slots = []
    let currentTime = startTime

    while (isBefore(currentTime, endTime)) {
      slots.push(format(currentTime, "HH:mm"))
      currentTime = addMinutes(currentTime, 30)
    }

    return slots
  }, [community])

  const isSlotAvailable = (courtId: number, slotStart: Date, slotEnd: Date) => {
    return !bookings.some((booking) => {
      if (booking.court_number !== courtId) return false
      const bookingStart = parse(booking.start_time, "HH:mm:ss", slotStart)
      const bookingEnd = parse(booking.end_time, "HH:mm:ss", slotStart)
      return (
        ((isEqual(slotStart, bookingStart) || isAfter(slotStart, bookingStart)) && isBefore(slotStart, bookingEnd)) ||
        (isAfter(slotEnd, bookingStart) && (isBefore(slotEnd, bookingEnd) || isEqual(slotEnd, bookingEnd))) ||
        (isBefore(slotStart, bookingStart) && isAfter(slotEnd, bookingEnd))
      )
    })
  }

  const getSlotStatus = (courtId: number, time: string) => {
    if (!selectedDuration || !community) return "unavailable"

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selectedDate = parseISO(date)
    const slotStart = parse(time, "HH:mm", selectedDate)
    const slotEnd = addMinutes(slotStart, selectedDuration)
    const communityEnd = parse(community.booking_end_time, "HH:mm:ss", selectedDate)

    // Check if the slot is in the past
    if (isEqual(selectedDate, today) && isBefore(slotStart, now)) {
      return "past"
    }

    if (isAfter(slotEnd, communityEnd)) {
      return "unavailable"
    }

    if (isSlotAvailable(courtId, slotStart, slotEnd)) {
      return "available"
    }

    return "unavailable"
  }

  const handleBooking = async () => {
    // Check if user can book
    if (!canBook) {
      Alert.alert(t("bookingNotAllowed"), t("noBookingPermission"))
      return
    }

    // Additional safeguard: prevent booking for past dates
    const today = new Date().toISOString().split("T")[0]
    if (isBefore(parseISO(date), parseISO(today))) {
      Alert.alert(t("error"), t("pastDateMessage"))
      return
    }

    if (selectedCourt && selectedTime && selectedDuration && community && userProfile) {
      try {
        // Use effective user ID (group owner or self)
        const bookingUserId = userProfile.effectiveUserId

        // 1) Count future bookings for the effective user
        const { data: userBookings, error: userBookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", bookingUserId)
          .gte("date", new Date().toISOString().split("T")[0])

        if (userBookingsError) throw userBookingsError

        if (userBookings && userBookings.length >= community.max_number_current_bookings) {
          Alert.alert(t("bookingLimitReached"), t("maxBookingsReached"))
          return
        }

        // 2) Check simultaneous bookings setting
        if (!community.simultaneous_bookings) {
          const sameDayBooking = userBookings?.find((booking) => booking.date === date)
          if (sameDayBooking) {
            Alert.alert(t("bookingNotAllowed"), t("alreadyBookedForDay"))
            return
          }
        }

        const endTime = format(addMinutes(parseISO(`2023-01-01T${selectedTime}`), selectedDuration), "HH:mm")

        // 3) Fetch the latest bookings for this court and date to check for overlaps
        const { data: latestBookings, error: latestBookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("date", date)
          .eq("court_number", selectedCourt)
          .eq("community_id", community.id)

        if (latestBookingsError) throw latestBookingsError

        // Check for overlapping bookings
        const isOverlapping = latestBookings.some((booking) => {
          const bookingStart = parse(booking.start_time, "HH:mm:ss", new Date())
          const bookingEnd = parse(booking.end_time, "HH:mm:ss", new Date())
          const newBookingStart = parse(selectedTime, "HH:mm", new Date())
          const newBookingEnd = parse(endTime, "HH:mm", new Date())

          return (
            (isAfter(newBookingStart, bookingStart) && isBefore(newBookingStart, bookingEnd)) ||
            (isAfter(newBookingEnd, bookingStart) && isBefore(newBookingEnd, bookingEnd)) ||
            (isBefore(newBookingStart, bookingStart) && isAfter(newBookingEnd, bookingEnd)) ||
            isEqual(newBookingStart, bookingStart) ||
            isEqual(newBookingEnd, bookingEnd)
          )
        })

        if (isOverlapping) {
          Alert.alert(t("bookingOverlap"), t("bookingOverlapMessage"))
          return
        }

        // If no overlap, proceed to the confirmation screen
        navigation.navigate("ConfirmBooking", {
          courtId: selectedCourt,
          date: date,
          startTime: selectedTime,
          endTime: endTime,
          communityId: community.id,
        })
      } catch (error) {
        console.error("Error checking booking restrictions:", error)
        Alert.alert(t("error"), t("unableToProcessBooking"))
      }
    }
  }

  const renderTimeSlots = (courtId: number) => {
    return generateTimeSlots.map((time) => {
      const slotStatus = getSlotStatus(courtId, time)
      const isAvailable = slotStatus === "available"
      const isPast = slotStatus === "past"
      const isSelected = selectedCourt === courtId && selectedTime === time

      return (
        <TouchableOpacity
          key={time}
          onPress={() => {
            if (isAvailable) {
              setSelectedCourt(courtId)
              setSelectedTime(time)
            }
          }}
          disabled={!isAvailable || isPast}
        >
          <LinearGradient
            colors={
              isPast
                ? ["rgba(128, 128, 128, 0.5)", "rgba(128, 128, 128, 0.5)"]
                : isAvailable
                  ? isSelected
                    ? ["#00A86B", "#00C853"]
                    : ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.2)"]
                  : ["rgba(255, 0, 0, 0.5)", "rgba(255, 0, 0, 0.5)"]
            }
            style={[styles.timeSlot, { opacity: isAvailable ? (isSelected ? 1 : 0.7) : 1 }]}
          >
            <Text style={[styles.timeSlotText, { color: isPast ? "#888" : "#fff" }]}>{time}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )
    })
  }

  const renderCourtCard = (courtId: number) => (
    <Card key={courtId} style={styles.courtCard}>
      <Card.Content>
        <Title style={styles.courtTitle}>{t("court_number", { number: courtId })}</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotContainer}>
          {renderTimeSlots(courtId)}
        </ScrollView>
      </Card.Content>
    </Card>
  )

  if (loading) {
    return (
      <LinearGradient colors={[gradientStart, gradientEnd]} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    )
  }

  if (!canBook) {
    return (
      <LinearGradient
        colors={[gradientStart, gradientMiddle, gradientEnd]}
        style={styles.container}
        locations={[0, 0.7, 1]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Title style={styles.title}>{t("bookACourt")}</Title>
          </View>
          <Card style={styles.warningCard}>
            <Card.Content>
              <Text style={styles.warningText}>{t("noBookingPermission")}</Text>
            </Card.Content>
          </Card>
        </ScrollView>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={[gradientStart, gradientMiddle, gradientEnd]}
      style={styles.container}
      locations={[0, 0.7, 1]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Title style={styles.title}>{t("bookACourt")}</Title>
          <View style={styles.dateContainer}>
            <Calendar size={24} color="#fff" />
            <Text style={styles.dateText}>{format(parseISO(date), "MMMM d, yyyy")}</Text>
          </View>
        </View>

        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>{t("duration")}:</Text>
          <View style={styles.durationButtons}>
            {community?.booking_duration_options.map((duration) => (
              <LinearGradient
                key={duration}
                colors={
                  selectedDuration === duration
                    ? ["#00A86B", "#00C853"]
                    : ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.2)"]
                }
                style={[styles.durationButton, { borderRadius: 8 }]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDuration(duration)
                    setSelectedCourt(null)
                    setSelectedTime(null)
                  }}
                  style={styles.durationButtonContent}
                >
                  <Text style={[styles.durationButtonText, { color: selectedDuration === duration ? "#fff" : "#000" }]}>
                    {duration >= 60 ? t("hours", { count: duration / 60 }) : t("minutes", { count: duration })}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </View>
        </View>

        {community &&
          Array.from({ length: community.court_number }, (_, i) => i + 1).map((courtId) => renderCourtCard(courtId))}

        <LinearGradient
          colors={["#00A86B", "#00C853"]}
          style={[styles.bookButton, !selectedCourt || !selectedTime ? styles.disabledButton : null]}
        >
          <Button
            onPress={handleBooking}
            disabled={!selectedCourt || !selectedTime}
            labelStyle={styles.buttonLabel}
            icon="check"
            style={styles.buttonContent}
          >
            {t("confirmBooking")}
          </Button>
        </LinearGradient>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <LinearGradient colors={["#00A86B", "#00C853"]} style={[styles.legendColor, { opacity: 0.7 }]} />
            <Text style={styles.legendText}>{t("available")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "rgba(255, 0, 0, 0.5)" }]} />
            <Text style={styles.legendText}>{t("unavailable")}</Text>
          </View>
          <View style={styles.legendItem}>
            <LinearGradient colors={["#00A86B", "#00C853"]} style={styles.legendColor} />
            <Text style={styles.legendText}>{t("selected")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "rgba(128, 128, 128, 0.5)" }]} />
            <Text style={styles.legendText}>{t("past")}</Text>
          </View>
        </View>

        <HelperText type="info" style={styles.helperText}>
          {t("tapToSelectHelperText")}
        </HelperText>
      </ScrollView>
    </LinearGradient>
  )
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#fff",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 18,
    marginLeft: 8,
    color: "#fff",
  },
  durationContainer: {
    marginBottom: 24,
  },
  durationLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#fff",
  },
  durationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  durationButton: {
    flex: 0.45,
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 8,
  },
  durationButtonContent: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  durationButtonText: {
    textAlign: "center",
  },
  courtCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  courtTitle: {
    fontSize: 22,
    marginBottom: 12,
    color: "#fff",
  },
  timeSlotContainer: {
    paddingVertical: 8,
  },
  timeSlot: {
    padding: 8,
    margin: 4,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  timeSlotText: {
    fontSize: 14,
  },
  bookButton: {
    marginTop: 24,
    borderRadius: 8,
    overflow: "hidden",
  },
  buttonContent: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  buttonLabel: {
    fontSize: 18,
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
  },
  legendText: {
    color: "#fff",
  },
  helperText: {
    textAlign: "center",
    marginTop: 16,
    color: "#fff",
  },
  warningCard: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    borderRadius: 12,
    marginTop: 24,
  },
  warningText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
})