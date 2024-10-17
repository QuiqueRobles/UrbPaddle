import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nxmeulbjuracpcwinoup.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bWV1bGJqdXJhY3Bjd2lub3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNDg5MTksImV4cCI6MjA0NDcyNDkxOX0.y2P0Sy9_3Aura6NvuoaqKNhDkai37lbCY_Oy0_6qgbI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})