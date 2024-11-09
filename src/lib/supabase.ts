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

const calculateXP = (playerProfile: any, isWinner: boolean, setsWon: number, setsLost: number, gamesWon: number, gamesLost: number) => {
  const XP_MATCH = 1000;
  const XP_VICTORY = 500;
  const XP_SETS = 50 * (setsWon / (1 + setsLost));
  const XP_GAMES = 20 * (gamesWon / (1 + gamesLost));
  
  let totalXP = XP_MATCH + XP_SETS + XP_GAMES;
  if (isWinner) totalXP += XP_VICTORY;

  return Math.round(totalXP);
};

export const updatePlayerProfiles = async (updateData: any[]) => {
  try {
    const updatePromises = updateData.map(async (data: any) => {
      const { profileId, isWinner, setsWon, setsLost, gamesWon, gamesLost } = data;

      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (selectError) throw selectError;

      const xpToAdd = calculateXP(profile, isWinner, setsWon, setsLost, gamesWon, gamesLost);
      let newXP = (profile.xp || 0) + xpToAdd;
      let newLevel = profile.level || 1;

      while (newXP >= 5000) {
        newLevel++;
        newXP -= 5000;
      }

      const updatedData = {
        matches_played: (profile.matches_played || 0) + 1,
        wins: (profile.wins || 0) + (isWinner ? 1 : 0),
        losses: (profile.losses || 0) + (isWinner ? 0 : 1),
        sets_won: (profile.sets_won || 0) + setsWon,
        sets_lost: (profile.sets_lost || 0) + setsLost,
        games_won: (profile.games_won || 0) + gamesWon,
        games_lost: (profile.games_lost || 0) + gamesLost,
        xp: newXP,
        level: newLevel,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', profileId);

      if (updateError) throw updateError;

      return `Updated profile for player ${profileId}`;
    });

    const results = await Promise.all(updatePromises);
    return { message: 'Profiles updated successfully', results };
  } catch (error) {
    console.error('Error updating player profiles:', error);
    throw error;
  }
};