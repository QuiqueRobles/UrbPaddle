  "use client"

  import { useState, useEffect } from "react"
  import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity, Animated, Text } from "react-native"
  import {
    Button,
    Title,
    TextInput,
    ActivityIndicator,
    useTheme,
    Card,
    Paragraph,
    IconButton,
    Chip,
    Modal,
    Portal,
  } from "react-native-paper"
  import { supabase } from "../lib/supabase"
  import { useNavigation } from "@react-navigation/native"
  import { LinearGradient } from "expo-linear-gradient"
  import { MaterialCommunityIcons } from "@expo/vector-icons"
  import { colors } from "../theme/colors"
  import { useTranslation } from "react-i18next"
  import SelectPlayers from "../components/SelectPlayers" // Adjust the path as needed

  type Booking = {
    id: string
    court_number: string
    date: Date
    start_time: string
    end_time: string
    user_id: string
    community_id: string
  }

  type Profile = {
    id: string
    full_name: string
    username: string
    avatar_url?: string
    resident_community_id?: string
    guest_communities?: string[]
    group_owner_id?: string
  }

  type SetScore = {
    team1: string
    team2: string
  }

  type Score = {
    [key: string]: SetScore
  }

  type Match = {
    id: string
    match_date: string
    match_time: string
    court_number: number
    score: string
    winner_team: number
    is_validated: boolean
    created_at: string
    validation_deadline?: string
    player1_id: string
    player2_id: string
    player3_id: string
    player4_id: string
    proposed_by_player: string
    player1?: { full_name: string; username: string }
    player2?: { full_name: string; username: string }
    player3?: { full_name: string; username: string }
    player4?: { full_name: string; username: string }
    booking?: { user_id: string }
    validated_by_players?: string[]
    refuted_by_players?: string[]
  }

  export default function AddMatchResultScreen() {
    const [activeTab, setActiveTab] = useState<"propose" | "validate">("propose")
    const [bookings, setBookings] = useState<Booking[]>([])
    const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
    const [score, setScore] = useState<Score>({ set1: { team1: "", team2: "" } })
    const [setCount, setSetCount] = useState(1)
    const [loading, setLoading] = useState(false)
    const [selectedPlayers, setSelectedPlayers] = useState<{
      player1: Profile | null
      player2: Profile | null
      player3: Profile | null
      player4: Profile | null
    }>({
      player1: null,
      player2: null,
      player3: null,
      player4: null,
    })
    const [winningTeam, setWinningTeam] = useState<"1" | "2" | null>(null)
    const [pendingMatches, setPendingMatches] = useState<Match[]>([])
    const [showRefuteModal, setShowRefuteModal] = useState(false)
    const [selectedMatchForRefute, setSelectedMatchForRefute] = useState<Match | null>(null)
    const [refuteData, setRefuteData] = useState({ winnerTeam: "", sets: [{ team1: "", team2: "" }] })
    const [communityId, setCommunityId] = useState<string | null>(null)

    const { t } = useTranslation()
    const theme = useTheme()
    const navigation = useNavigation()
    const [winningTeamAnim] = useState(new Animated.Value(0))
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
      getCurrentUser()
    }, [])

    useEffect(() => {
      if (user) {
        if (activeTab === "propose") {
          fetchBookings()
        } else {
          fetchPendingMatches()
        }
      }
    }, [activeTab, user])

    useEffect(() => {
      if (selectedBooking) {
        const fetchCommunity = async () => {
          const { data, error } = await supabase
            .from("bookings")
            .select("community_id")
            .eq("id", selectedBooking)
            .single()

          if (error) {
            console.error("Error fetching community:", error)
            Alert.alert("Error", "Failed to fetch community")
            return
          }

          setCommunityId(data.community_id)
        }

        fetchCommunity()
      } else {
        setCommunityId(null)
      }
    }, [selectedBooking])

    useEffect(() => {
      calculateWinner()
    }, [score])

    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    const handleWinningTeamSelect = (team: "1" | "2") => {
      setWinningTeam(team)
      Animated.spring(winningTeamAnim, {
        toValue: team === "1" ? 0 : 1,
        useNativeDriver: false,
      }).start()
    }

    const renderBookingItem = ({ item }: { item: Booking }) => (
      <TouchableOpacity
        style={[styles.bookingItem, selectedBooking === item.id && styles.selectedBookingItem]}
        onPress={() => setSelectedBooking(item.id)}
      >
        <View style={styles.bookingItemContent}>
          <MaterialCommunityIcons
            name="tennis-ball"
            size={24}
            color={selectedBooking === item.id ? colors.primary : styles.bookingItemTitle.color}
          />
          <View style={styles.bookingItemText}>
            <Paragraph style={styles.bookingItemTitle}>
              {t("court")} {item.court_number}
            </Paragraph>
            <Paragraph style={styles.bookingItemSubtitle}>
              {new Date(item.date).toLocaleDateString()} • {item.start_time} - {item.end_time}
            </Paragraph>
          </View>
        </View>
        {selectedBooking === item.id && (
          <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    )

    const fetchBookings = async () => {
      try {
        setLoading(true)
        if (!user) throw new Error("No user found")

        const now = new Date()
        const todayStr = now.toISOString().split("T")[0]
        const nowTime = now.toTimeString().slice(0, 5)

        // Fetch bookings where date < today OR (date = today AND end_time <= now)
        const { data: userBookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .or(`date.lt.${todayStr},and(date.eq.${todayStr},end_time.lte.${nowTime})`)
          .order("date", { ascending: false })

        if (bookingsError) throw bookingsError

        // Filter out bookings that already have matches
        const bookingsWithoutMatches = []
        for (const booking of userBookings || []) {
          const { data: existingMatch } = await supabase
            .from("matches")
            .select("id")
            .eq("booking_id", booking.id)
            .single()

          if (!existingMatch) {
            bookingsWithoutMatches.push(booking)
          }
        }

        setBookings(bookingsWithoutMatches)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        Alert.alert("Error", "Failed to fetch bookings")
      } finally {
        setLoading(false)
      }
    }

    const fetchPendingMatches = async () => {
      try {
        setLoading(true)
        if (!user) return

        const { data, error } = await supabase
          .from("matches")
          .select(`
            *,
            player1:player1_id(full_name, username),
            player2:player2_id(full_name, username),
            player3:player3_id(full_name, username),
            player4:player4_id(full_name, username),
            booking:booking_id(user_id),
            validated_by_players,
            refuted_by_players
          `)
          .eq("is_validated", false)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Filter matches based on validation logic
        const userMatches = (data || []).filter((match) => {
          const playerIds = [match.player1_id, match.player2_id, match.player3_id, match.player4_id].filter(Boolean)

          if (!playerIds.includes(user.id)) return false

          const proposedBy = match.proposed_by_player
          const isUserOnTeam1 = match.player1_id === user.id || match.player2_id === user.id
          const isUserOnTeam2 = match.player3_id === user.id || match.player4_id === user.id
          const isProposerPlaying = playerIds.includes(proposedBy)

          if (isProposerPlaying) {
            const isProposerOnTeam1 = match.player1_id === proposedBy || match.player2_id === proposedBy
            const isProposerOnTeam2 = match.player3_id === proposedBy || match.player4_id === proposedBy

            if (isProposerOnTeam1 && isUserOnTeam2) return true
            if (isProposerOnTeam2 && isUserOnTeam1) return true
          } else {
            const isTeam1Winning = match.winner_team === 1
            const isTeam2Winning = match.winner_team === 2

            if (isTeam1Winning && isUserOnTeam2) return true
            if (isTeam2Winning && isUserOnTeam1) return true
          }

          return false
        })

        setPendingMatches(userMatches as Match[])
      } catch (error) {
        console.error("Error fetching pending matches:", error)
      } finally {
        setLoading(false)
      }
    }

    const validateSets = (sets: SetScore[]) => {
      if (sets.length === 0) {
        return false
      }

      for (const set of sets) {
        const team1Score = Number.parseInt(set.team1) || 0
        const team2Score = Number.parseInt(set.team2) || 0

        if (team1Score === 0 && team2Score === 0) {
          return false
        }

        const maxScore = Math.max(team1Score, team2Score)
        const minScore = Math.min(team1Score, team2Score)

        if (maxScore > 7) {
          return false
        }

        if (maxScore < 6) {
          return false
        }

        if (maxScore === 6 && minScore > 4) {
          return false
        }

        if (maxScore === 7 && minScore !== 5 && minScore !== 6) {
          return false
        }
      }

      const hasValidSet = sets.some((set) => Number.parseInt(set.team1) > 0 || Number.parseInt(set.team2) > 0)
      if (!hasValidSet) {
        return false
      }

      if (sets.length > 3) {
        return false
      }

      let team1Sets = 0
      let team2Sets = 0

      sets.forEach((set) => {
        const team1Score = Number.parseInt(set.team1) || 0
        const team2Score = Number.parseInt(set.team2) || 0
        if (team1Score > team2Score && team1Score >= 6 && team1Score - team2Score >= 2) {
          team1Sets++
        } else if (team2Score > team1Score && team2Score >= 6 && team2Score - team1Score >= 2) {
          team2Sets++
        } else if (team1Score === 7 && team2Score === 6) {
          team1Sets++
        } else if (team2Score === 7 && team1Score === 6) {
          team2Sets++
        }
      })

      if (sets.length >= 2 && team1Sets < 2 && team2Sets < 2) {
        return false
      }

      return true
    }

    const calculateWinner = () => {
      let team1Sets = 0
      let team2Sets = 0

      Object.values(score).forEach((set) => {
        const team1Score = Number.parseInt(set.team1) || 0
        const team2Score = Number.parseInt(set.team2) || 0

        if (team1Score > team2Score && team1Score >= 6) {
          const scoreDiff = team1Score - team2Score
          if ((team1Score === 6 && scoreDiff >= 2) || (team1Score === 7 && (team2Score === 5 || team2Score === 6))) {
            team1Sets++
          }
        } else if (team2Score > team1Score && team2Score >= 6) {
          const scoreDiff = team2Score - team1Score
          if ((team2Score === 6 && scoreDiff >= 2) || (team2Score === 7 && (team1Score === 5 || team1Score === 6))) {
            team2Sets++
          }
        }
      })

      if (team1Sets > team2Sets) {
        setWinningTeam("1")
      } else if (team2Sets > team1Sets) {
        setWinningTeam("2")
      } else {
        setWinningTeam(null)
      }
    }

    const handleAddSet = () => {
      if (setCount < 3) {
        const newSetKey = `set${setCount + 1}`
        setScore((prev) => ({ ...prev, [newSetKey]: { team1: "", team2: "" } }))
        setSetCount((prev) => prev + 1)
      }
    }

    const handleRemoveSet = () => {
      if (setCount > 1) {
        const newScore = { ...score }
        delete newScore[`set${setCount}`]
        setScore(newScore)
        setSetCount((prev) => prev - 1)
      }
    }

    const updateSet = (setKey: string, team: "team1" | "team2", value: string) => {
      setScore((prev) => ({
        ...prev,
        [setKey]: {
          ...prev[setKey],
          [team]: value,
        },
      }))
    }

    const handleSubmitMatchProposal = async () => {
      if (!selectedBooking || !winningTeam) {
        Alert.alert("Error", "Please fill in all fields correctly")
        return
      }

      const selectedPlayersList = Object.values(selectedPlayers).filter(Boolean)
      if (selectedPlayersList.length < 2) {
        Alert.alert("Error", "Please select at least 2 players")
        return
      }

      const uniquePlayerIds = new Set(selectedPlayersList.map((p) => p.id))
      if (uniquePlayerIds.size !== selectedPlayersList.length) {
        Alert.alert("Error", "Duplicate players selected")
        return
      }

      const team1HasPlayer = selectedPlayers.player1 || selectedPlayers.player2
      const team2HasPlayer = selectedPlayers.player3 || selectedPlayers.player4

      if (!team1HasPlayer || !team2HasPlayer) {
        Alert.alert("Error", "Each team must have at least one player")
        return
      }

      const currentUserSelected = selectedPlayersList.some((player) => player.id === user.id)
      if (!currentUserSelected) {
        Alert.alert("Error", "You must be one of the players in the match")
        return
      }

      const setsArray = Object.values(score).filter((set) => set.team1 !== "" && set.team2 !== "")
      if (!validateSets(setsArray)) {
        Alert.alert("Error", "Invalid set scores")
        return
      }

      try {
        setLoading(true)

        const booking = bookings.find((b) => b.id === selectedBooking)
        if (!booking) throw new Error("Invalid booking selected")

        const scoreString = setsArray.map((set) => `${set.team1}-${set.team2}`).join(", ")

        const matchData = {
          booking_id: selectedBooking,
          player1_id: selectedPlayers.player1?.id || null,
          player2_id: selectedPlayers.player2?.id || null,
          player3_id: selectedPlayers.player3?.id || null,
          player4_id: selectedPlayers.player4?.id || null,
          winner_team: Number.parseInt(winningTeam),
          score: scoreString,
          match_date: booking.date,
          match_time: booking.start_time,
          court_number: booking.court_number,
          community_id: booking.community_id,
          proposed_by_player: user.id,
          is_validated: false,
          validation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        }

        const { error: matchError } = await supabase.from("matches").insert(matchData)

        if (matchError) throw matchError

        Alert.alert(
          "Success",
          "Match result proposed successfully! Other players will need to validate it within 48 hours.",
        )

        // Reset form
        setSelectedBooking(null)
        setSelectedPlayers({ player1: null, player2: null, player3: null, player4: null })
        setScore({ set1: { team1: "", team2: "" } })
        setSetCount(1)
        setWinningTeam(null)

        // Refresh bookings
        fetchBookings()
      } catch (error) {
        console.error("Error submitting match proposal:", error)
        Alert.alert("Error", "Failed to submit match proposal")
      } finally {
        setLoading(false)
      }
    }

    const handleValidateMatch = async (matchId: string) => {
      try {
        setLoading(true)

        // Check if match is already validated
        const { data: currentMatch, error: fetchError } = await supabase
          .from("matches")
          .select("is_validated, validated_by_players")
          .eq("id", matchId)
          .single()

        if (fetchError || currentMatch?.is_validated) {
          Alert.alert("Error", "This match is already validated or cannot be found")
          return
        }

        const validatedBy = currentMatch.validated_by_players || []
        if (validatedBy.includes(user.id)) {
          Alert.alert("Error", "You have already validated this match.")
          return
        }

        const updatedValidatedBy = [...validatedBy, user.id]

        const { error: updateError } = await supabase
          .from("matches")
          .update({
            validated_by_players: updatedValidatedBy,
          })
          .eq("id", matchId)

        if (updateError) throw updateError

        const { error: rpcError } = await supabase.rpc("update_match_and_xp", { p_match_id: matchId })

        if (rpcError) {
          throw new Error(rpcError.message)
        }

        Alert.alert("Success", "Match validated successfully")

        fetchPendingMatches()
      } catch (error) {
        console.error("Error validating match:", error)
        Alert.alert("Error", "Failed to validate match")
      } finally {
        setLoading(false)
      }
    }

    const addRefuteSet = () => {
      if (refuteData.sets.length < 3) {
        setRefuteData((prev) => ({
          ...prev,
          sets: [...prev.sets, { team1: "", team2: "" }],
        }))
      }
    }

    const removeRefuteSet = (index: number) => {
      setRefuteData((prev) => ({
        ...prev,
        sets: prev.sets.filter((_, i) => i !== index),
      }))
    }

    const updateRefuteSet = (index: number, team: "team1" | "team2", value: string) => {
      setRefuteData((prev) => {
        const newSets = [...prev.sets]
        newSets[index][team] = value
        return { ...prev, sets: newSets }
      })
    }

    const handleRefuteMatch = async () => {
      if (!selectedMatchForRefute || !refuteData.winnerTeam || refuteData.sets.length === 0) {
        Alert.alert("Error", "Please fill in all refutation fields")
        return
      }

      try {
        setLoading(true)

        const sets = refuteData.sets.map((set, index) => {
          const team1 = Number.parseInt(set.team1)
          const team2 = Number.parseInt(set.team2)
          if (isNaN(team1) || isNaN(team2)) {
            throw new Error(`Invalid score for Set ${index + 1}. Enter numeric values.`)
          }
          return { team1: team1.toString(), team2: team2.toString() }
        })

        if (!validateSets(sets)) {
          throw new Error("Invalid set scores. Please check padel scoring rules.")
        }

        let team1Sets = 0
        let team2Sets = 0

        sets.forEach((set) => {
          const team1Score = Number.parseInt(set.team1) || 0
          const team2Score = Number.parseInt(set.team2) || 0
          if (team1Score > team2Score && team1Score >= 6 && team1Score - team2Score >= 2) {
            team1Sets++
          } else if (team2Score > team1Score && team2Score >= 6 && team2Score - team1Score >= 2) {
            team2Sets++
          } else if (team1Score === 7 && team2Score === 6) {
            team1Sets++
          } else if (team2Score === 7 && team1Score === 6) {
            team2Sets++
          }
        })

        const inputWinnerTeam = Number.parseInt(refuteData.winnerTeam)
        if ((inputWinnerTeam === 1 && team2Sets >= team1Sets) || (inputWinnerTeam === 2 && team1Sets >= team2Sets)) {
          throw new Error("The selected winner team does not match the score provided.")
        }

        const scoreString = sets.map((set) => `${set.team1}-${set.team2}`).join(", ")

        const { data: currentMatch, error: fetchError } = await supabase
          .from("matches")
          .select("is_validated, refuted_by_players, validated_by_players")
          .eq("id", selectedMatchForRefute.id)
          .single()

        if (fetchError || currentMatch?.is_validated) {
          Alert.alert("Error", "This match has already been validated or an error occurred.")
          return
        }

        const refutedBy = currentMatch.refuted_by_players || []
        if (refutedBy.includes(user.id)) {
          Alert.alert("Error", "You have already refuted this match.")
          return
        }

        const { error } = await supabase
          .from("matches")
          .update({
            winner_team: inputWinnerTeam,
            score: scoreString,
            proposed_by_player: user.id,
            validated_by_players: [],
            refuted_by_players: [],
            validation_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", selectedMatchForRefute.id)

        if (error) throw error

        Alert.alert("Success", "Refutation submitted successfully. The validation timer has been reset.")

        setShowRefuteModal(false)
        setRefuteData({ winnerTeam: "", sets: [{ team1: "", team2: "" }] })
        fetchPendingMatches()
      } catch (error) {
        console.error("Error refuting match:", error)
        Alert.alert("Error", error.message)
      } finally {
        setLoading(false)
      }
    }

    const formatTimeRemaining = (deadline: string) => {
      if (!deadline) return null

      const now = new Date()
      const deadlineDate = new Date(deadline)
      const diffInMs = deadlineDate.getTime() - now.getTime()

      if (diffInMs <= 0) {
        return "Auto-validating soon..."
      }

      const hours = Math.floor(diffInMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        return `${hours}h ${minutes}m remaining`
      } else {
        return `${minutes}m remaining`
      }
    }

    const formatTimeAgo = (dateString: string) => {
      const now = new Date()
      const created = new Date(dateString)
      const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 24) {
        return `${diffInHours}h ago`
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays}d ago`
      }
    }

    const renderPendingMatch = ({ item: match }: { item: Match }) => (
      <Card style={styles.matchCard}>
        <Card.Content style={styles.matchContent}>
          <View style={styles.matchHeader}>
            <View style={styles.matchInfo}>
              <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
              <Paragraph style={styles.matchDate}>
                {match.match_date} - {match.match_time}
              </Paragraph>
              <Chip style={styles.courtChip}>Court {match.court_number}</Chip>
            </View>
            <View style={styles.matchTimestamps}>
              <Paragraph style={styles.timeAgo}>{formatTimeAgo(match.created_at)}</Paragraph>
              {match.validation_deadline && (
                <Paragraph style={styles.timeRemaining}>{formatTimeRemaining(match.validation_deadline)}</Paragraph>
              )}
            </View>
          </View>

          <View style={styles.teamsContainer}>
            <View style={styles.teamSection}>
              <View style={styles.teamHeader}>
                <MaterialCommunityIcons name="account-group" size={18} color={colors.primary} />
                <Paragraph style={styles.teamTitle}>
                  {t("team")} 1 {match.winner_team === 1 && `(${t("winner")})`}
                </Paragraph>
              </View>
              {match.player1 && (
                <Paragraph style={styles.playerName}>
                  {match.player1.full_name} (@{match.player1.username})
                </Paragraph>
              )}
              {match.player2 && (
                <Paragraph style={styles.playerName}>
                  {match.player2.full_name} (@{match.player2.username})
                </Paragraph>
              )}
            </View>
            <Paragraph style={styles.vs}>VS</Paragraph>
            <View style={styles.teamSection}>
              <View style={styles.teamHeader}>
                <MaterialCommunityIcons name="account-group" size={18} color={colors.primary} />
                <Paragraph style={styles.teamTitle}>
                  {t("team")} 2 {match.winner_team === 2 && `(${t("winner")})`}
                </Paragraph>
              </View>
              {match.player3 && (
                <Paragraph style={styles.playerName}>
                  {match.player3.full_name} (@{match.player3.username})
                </Paragraph>
              )}
              {match.player4 && (
                <Paragraph style={styles.playerName}>
                  {match.player4.full_name} (@{match.player4.username})
                </Paragraph>
              )}
            </View>
          </View>

          <View style={styles.scoreSection}>
            <Paragraph style={styles.scoreLabel}>Score: {match.score}</Paragraph>
          </View>

          <View style={styles.matchActions}>
            <Button
              mode="contained"
              onPress={() => handleValidateMatch(match.id)}
              style={[styles.actionButton, styles.validateButton]}
              icon="check-circle"
              disabled={loading}
            >
              {t("validate") || "Validate"}
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setSelectedMatchForRefute(match)
                setShowRefuteModal(true)
              }}
              style={[styles.actionButton, styles.refuteButton]}
              icon="close-circle"
              disabled={loading}
            >
              {t("refute") || "Refute"}
            </Button>
          </View>
        </Card.Content>
      </Card>
    )

    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading && (
            <LinearGradient 
              colors={[colors.gradientStart, colors.gradientEnd]} 
              style={styles.loadingContainer}
            >
              <ActivityIndicator size="large" color={"white"} />
              <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
            </LinearGradient>
          )}

          <Card style={styles.headerCard}>
            <Card.Content>
              <Title style={styles.title}>{t("addMatchResult") || "Add Match Result"}</Title>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "propose" && styles.activeTab]}
                  onPress={() => setActiveTab("propose")}
                >
                  <MaterialCommunityIcons
                    name="tennis"
                    size={22}
                    color={activeTab === "propose" ? colors.primary : "rgba(255, 255, 255, 0.7)"}
                  />
                  <Paragraph style={[styles.tabText, activeTab === "propose" && styles.activeTabText]}>
                    {t("proposeMatch") || "Propose"}
                  </Paragraph>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "validate" && styles.activeTab]}
                  onPress={() => setActiveTab("validate")}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={22}
                    color={activeTab === "validate" ? colors.primary : "rgba(255, 255, 255, 0.7)"}
                  />
                  <Paragraph style={[styles.tabText, activeTab === "validate" && styles.activeTabText]}>
                    {t("validateMatch") || "Validate"}
                  </Paragraph>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {activeTab === "propose" ? (
            <>
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.sectionTitle}>{t("selectCompletedBooking") || "Select Completed Booking"}</Title>
                  {bookings.length > 0 ? (
                    <FlatList
                      data={bookings}
                      renderItem={renderBookingItem}
                      keyExtractor={(item) => item.id}
                      style={styles.bookingList}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <Paragraph style={styles.noBookingsText}>
                      {t("noCompletedBookings") || "No completed bookings available"}
                    </Paragraph>
                  )}
                </Card.Content>
              </Card>

              {selectedBooking && communityId && (
                <Card style={styles.card}>
                  <Card.Content>
                    <Title style={styles.sectionTitle}>{t("selectPlayers") || "Select Players"}</Title>
                    <SelectPlayers communityId={communityId} onPlayersChange={setSelectedPlayers} />
                  </Card.Content>
                </Card>
              )}

              {selectedBooking && (
                <Card style={styles.card}>
                  <Card.Content>
                    <Title style={styles.sectionTitle}>{t("enterSets") || "Enter Sets"}</Title>
                    <View style={styles.scoreCard}>
                      <View style={styles.setControlsContainer}>
                        <IconButton
                          icon="minus-circle-outline"
                          size={28}
                          iconColor={colors.primary}
                          onPress={handleRemoveSet}
                          disabled={setCount === 1}
                        />
                        <Paragraph style={styles.setCountLabel}>
                          {setCount} {setCount === 1 ? t("set") : t("sets")}
                        </Paragraph>
                        <IconButton
                          icon="plus-circle-outline"
                          size={28}
                          iconColor={colors.primary}
                          onPress={handleAddSet}
                          disabled={setCount === 3}
                        />
                      </View>
                      {Object.keys(score).map((setKey, index) => (
                        <View key={setKey} style={styles.setContainer}>
                          <View style={styles.setLabelContainer}>
                            <MaterialCommunityIcons name="tennis" size={26} color={colors.primary} />
                            <Paragraph style={styles.setLabel}>
                              {t("set")} {index + 1}
                            </Paragraph>
                          </View>
                          <View style={styles.scoreInputContainer}>
                            <TextInput
                              value={score[setKey].team1}
                              onChangeText={(value) => updateSet(setKey, "team1", value)}
                              keyboardType="numeric"
                              style={styles.scoreInput}
                              maxLength={1}
                              placeholder="0"
                            />
                            <Paragraph style={styles.scoreSeparator}>-</Paragraph>
                            <TextInput
                              value={score[setKey].team2}
                              onChangeText={(value) => updateSet(setKey, "team2", value)}
                              keyboardType="numeric"
                              style={styles.scoreInput}
                              maxLength={1}
                              placeholder="0"
                            />
                          </View>
                        </View>
                      ))}
                    </View>

                    {winningTeam && (
                      <View style={styles.winningTeamContainer}>
                        <Title style={{ fontSize: 18, fontWeight: "bold", color: "#1b5e20" }}>
                          {t("winner") || "Winner"}:
                        </Title>
                        <Paragraph style={{ fontSize: 16, fontWeight: "bold", color: "#1b5e20" }}>
                          {t("team") || "Team"} {winningTeam}
                        </Paragraph>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              )}

              {selectedBooking && (
                <TouchableOpacity
                  onPress={handleSubmitMatchProposal}
                  disabled={loading}
                  style={styles.submitButton}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={loading ? ['#666', '#666'] : ['#00A86B', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <MaterialCommunityIcons name="check-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>{t("proposeResult") || "Propose Result"}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.sectionTitle}>{t("pendingValidations") || "Pending Validations"}</Title>
                {pendingMatches.length > 0 ? (
                  <FlatList
                    data={pendingMatches}
                    renderItem={renderPendingMatch}
                    keyExtractor={(item) => item.id}
                    style={styles.matchList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.noMatchesContainer}>
                    <MaterialCommunityIcons name="information-outline" size={56} color={"#bdbdbd"} />
                    <Paragraph style={styles.noMatchesText}>
                      {t("noPendingValidations") || "No pending match validations at the moment."}
                    </Paragraph>
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
                  <Title style={styles.modalTitle}>{t("refuteMatch") || "Refute Match Result"}</Title>
                  <Paragraph style={styles.modalDescription}>
                    {t("refuteDescription") ||
                      "Enter the correct match result below. This will reset the 48-hour validation timer for all players."}
                  </Paragraph>

                  <View style={styles.refuteForm}>
                    <View style={styles.formField}>
                      <Paragraph style={styles.fieldLabel}>{t("correctWinnerTeam") || "Correct Winner Team"}</Paragraph>
                      <View style={styles.winnerSelection}>
                        <TouchableOpacity
                          style={[styles.winnerOption, refuteData.winnerTeam === "1" && styles.winnerOptionSelected]}
                          onPress={() => setRefuteData((prev) => ({ ...prev, winnerTeam: "1" }))}
                        >
                          <Paragraph
                            style={{ fontWeight: "bold", color: refuteData.winnerTeam === "1" ? colors.primary : "#333" }}
                          >
                            {t("team")} 1
                          </Paragraph>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.winnerOption, refuteData.winnerTeam === "2" && styles.winnerOptionSelected]}
                          onPress={() => setRefuteData((prev) => ({ ...prev, winnerTeam: "2" }))}
                        >
                          <Paragraph
                            style={{ fontWeight: "bold", color: refuteData.winnerTeam === "2" ? colors.primary : "#333" }}
                          >
                            {t("team")} 2
                          </Paragraph>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.formField}>
                      <Paragraph style={styles.fieldLabel}>{t("correctScore") || "Correct Score"}</Paragraph>
                      {refuteData.sets.map((set, index) => (
                        <View key={index} style={styles.setContainer}>
                          <Paragraph style={styles.setLabel}>
                            {t("set")} {index + 1}
                          </Paragraph>
                          <View style={styles.scoreInputContainer}>
                            <TextInput
                              value={set.team1}
                              onChangeText={(value) => updateRefuteSet(index, "team1", value)}
                              keyboardType="numeric"
                              style={styles.scoreInput}
                              maxLength={1}
                              placeholder="0"
                            />
                            <Paragraph style={styles.scoreSeparator}>-</Paragraph>
                            <TextInput
                              value={set.team2}
                              onChangeText={(value) => updateRefuteSet(index, "team2", value)}
                              keyboardType="numeric"
                              style={styles.scoreInput}
                              maxLength={1}
                              placeholder="0"
                            />
                          </View>
                          {refuteData.sets.length > 1 && (
                            <IconButton
                              icon="minus-circle-outline"
                              size={24}
                              iconColor={colors.error}
                              onPress={() => removeRefuteSet(index)}
                            />
                          )}
                        </View>
                      ))}
                      {refuteData.sets.length < 3 && (
                        <Button
                          mode="outlined"
                          onPress={addRefuteSet}
                          style={styles.addSetButton}
                          icon="plus-circle-outline"
                        >
                          {t("addSet") || "Add Set"}
                        </Button>
                      )}
                    </View>
                    <View style={styles.modalActions}>
                      <Button mode="outlined" onPress={() => setShowRefuteModal(false)} style={styles.modalCancelButton}>
                        {t("cancel") || "Cancel"}
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleRefuteMatch}
                        style={styles.modalSubmitButton}
                        icon="refresh-circle"
                        disabled={loading}
                      >
                        {t("submitRefutation") || "Submit Refutation"}
                      </Button>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>
        </ScrollView>
      </LinearGradient>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    loadingText: {
      marginTop: 16,
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 40,
    },
    headerCard: {
      marginBottom: 24,
      borderRadius: 16,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    title: {
      fontSize: 32,
      textAlign: "center",
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 20,
      letterSpacing: 0.5,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 14,
      padding: 6,
      backdropFilter: "blur(10px)",
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      transition: "all 0.3s ease",
    },
    activeTab: {
      backgroundColor: "#fff",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    tabText: {
      marginLeft: 8,
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: 15,
    },
    activeTabText: {
      color: colors.primary,
    },
    card: {
      marginBottom: 20,
      borderRadius: 16,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      overflow: "hidden",
    },
    sectionTitle: {
      fontSize: 22,
      marginBottom: 20,
      fontWeight: "bold",
      color: "#ffffffff",
      letterSpacing: 0.3,
    },
    bookingList: {
      maxHeight: 240,
    },
    bookingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#fafafa",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: "transparent",
      transition: "all 0.2s ease",
    },
    selectedBookingItem: {
      backgroundColor: "#f0f8ff",
      borderColor: colors.primary,
      elevation: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    bookingItemContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    bookingItemText: {
      marginLeft: 16,
      flex: 1,
    },
    bookingItemTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: "#1a1a1a",
      marginBottom: 4,
    },
    bookingItemSubtitle: {
      fontSize: 14,
      color: "#666",
      lineHeight: 20,
    },
    noBookingsText: {
      textAlign: "center",
      fontSize: 16,
      color: "#999",
      marginTop: 24,
      marginBottom: 24,
      fontStyle: "italic",
    },
    scoreCard: {
      backgroundColor: "#f8f9fa",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: "#e9ecef",
    },
    setControlsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    setCountLabel: {
      fontSize: 18,
      fontWeight: "bold",
      marginHorizontal: 20,
      color: "#1a1a1a",
    },
    setContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      backgroundColor: "#ffffff",
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: "#f0f0f0",
    },
    scoreInputContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    setLabelContainer: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 80,
    },
    setLabel: {
      fontSize: 17,
      fontWeight: "bold",
      marginLeft: 10,
      color: "#1a1a1a",
    },
    scoreInput: {
      textAlign: "center",
      fontSize: 22,
      fontWeight: "bold",
      width: 56,
      height: 56,
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      marginHorizontal: 6,
      borderWidth: 2,
      borderColor: "#e9ecef",
    },
    scoreSeparator: {
      fontSize: 28,
      fontWeight: "bold",
      marginHorizontal: 12,
      color: "#495057",
    },
    winningTeamContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#e8f5e9",
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 2,
      borderColor: "#4CAF50",
    },
    buttonContent: {
      height: 56,
      flexDirection: 'row-reverse',
      backgroundColor: 'transparent',
    },
    buttonLabel: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: '#ffffff',
    },
    matchList: {
      maxHeight: 600,
    },
    matchCard: {
      marginBottom: 16,
      borderRadius: 16,
      elevation: 3,
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#f0f0f0",
    },
    matchContent: {
      padding: 20,
    },
    matchHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    matchInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      flexWrap: "wrap",
    },
    matchDate: {
      fontSize: 14,
      color: "#666",
      marginLeft: 10,
      marginRight: 10,
      fontWeight: "500",
    },
    courtChip: {
      height: 32,
      backgroundColor: "#e3f2fd",
      borderRadius: 8,
    },
    matchTimestamps: {
      alignItems: "flex-end",
      backgroundColor: "#f8f9fa",
      padding: 8,
      borderRadius: 8,
    },
    timeAgo: {
      fontSize: 12,
      color: "#999",
      marginBottom: 4,
    },
    timeRemaining: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.primary,
    },
    teamsContainer: {
      flexDirection: "column",
      marginVertical: 16,
      gap: 12,
    },
    vs: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#495057",
      textAlign: "center",
      marginVertical: 12,
      letterSpacing: 2,
    },
    teamSection: {
      flex: 1,
      padding: 16,
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e9ecef",
      minHeight: 100,
    },
    teamHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e9ecef",
    },
    teamTitle: {
      fontSize: 17,
      fontWeight: "bold",
      marginLeft: 10,
      color: "#1a1a1a",
    },
    playerName: {
      fontSize: 15,
      color: "#495057",
      marginBottom: 6,
      marginLeft: 4,
      lineHeight: 22,
    },
    scoreSection: {
      marginVertical: 20,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#e9ecef",
      alignItems: "center",
      backgroundColor: "#fafafa",
      borderRadius: 12,
    },
    scoreLabel: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1a1a1a",
      letterSpacing: 0.5,
    },
    matchActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
      gap: 12,
    },
    actionButton: {
      flex: 0.48,
      borderRadius: 12,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    validateButton: {
      backgroundColor: "#4CAF50",
    },
    refuteButton: {
      backgroundColor: "#f44336",
      borderWidth: 0,
    },
    refuteButtonLabel: {
      color: "white",
      fontWeight: "600",
    },
    noMatchesContainer: {
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    noMatchesText: {
      fontSize: 16,
      color: "#999",
      marginTop: 20,
      textAlign: "center",
      lineHeight: 24,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalCard: {
      borderRadius: 20,
      padding: 24,
      elevation: 8,
      backgroundColor: "#fff",
      maxHeight: "85%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      color: "#1a1a1a",
      letterSpacing: 0.3,
    },
    modalDescription: {
      fontSize: 15,
      color: "#666",
      marginBottom: 24,
      lineHeight: 22,
    },
    refuteForm: {
      marginVertical: 8,
    },
    formField: {
      marginBottom: 24,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#1a1a1a",
      marginBottom: 12,
    },
    winnerSelection: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    winnerOption: {
      flex: 0.48,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#e0e0e0",
      alignItems: "center",
      backgroundColor: "#fafafa",
      transition: "all 0.2s ease",
    },
    winnerOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "15",
      elevation: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    addSetButton: {
      marginTop: 12,
      borderRadius: 10,
      borderWidth: 2,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 24,
      gap: 12,
    },
    modalCancelButton: {
      flex: 0.48,
      borderRadius: 12,
      borderWidth: 2,
    },
    modalSubmitButton: {
      flex: 0.48,
      borderRadius: 12,
      elevation: 3,
    },
    submitButton: {
  marginTop: 24,
  borderRadius: 12,
  elevation: 4,
  shadowColor: '#00C853',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
},
gradientButton: {
  height: 56,
  borderRadius: 12,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 16,
},
submitButtonText: {
  fontSize: 18,
  fontWeight: '600',
  color: '#ffffff',
  letterSpacing: 0.5,
},
  })
