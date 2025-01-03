import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp as NativeRouteProp } from '@react-navigation/native'

export type RootStackParamList = {
  Home: undefined
  CourtList: undefined
  Profile: undefined
  DateSelection: undefined
  CourtSelection: { date: string }
  TimeSelection: { courtId: number; date: string }
  ConfirmBooking: { courtId: number; date: string; startTime: string; endTime: string }
  Statistics: undefined
  MyStatistics: undefined
  Login: undefined
  Register: undefined
  Booking: undefined
  MyBookings: undefined
  AddMatchResult: undefined
  CommunityCode: { userId: string }
  AboutDeveloper: undefined
  Matches: undefined
  CommunityRegistration: undefined
  Privacy: undefined
  PlayerManagement: undefined
  ChangePassword: undefined
}

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>
export type RouteProp<T extends keyof RootStackParamList> = NativeRouteProp<RootStackParamList, T>