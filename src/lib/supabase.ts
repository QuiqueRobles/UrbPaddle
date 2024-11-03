import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://swisokflspdgmshpoygl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3aXNva2Zsc3BkZ21zaHBveWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0ODc5NzIsImV4cCI6MjA0NjA2Mzk3Mn0.wjDnV9WWfxBoUcMSVXJCBfS8xsdNtw4ibGfJIUB-ID4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})