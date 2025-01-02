import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Community = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  court_number: number;
  image: string;
  resident_count: number;
  guest_count: number;
  booking_start_time: string;
  booking_end_time: string;
  user_relationship: 'resident' | 'guest' | 'default';
};

const CACHE_KEY = 'COMMUNITIES_CACHE';

export const useCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get data from cache
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setCommunities(JSON.parse(cachedData));
        setLoading(false);
      }

      // Fetch fresh data from Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('community')
        .select(`
          id,
          name,
          address,
          latitude,
          longitude,
          court_number,
          image,
          resident_count,
          guest_count,
          booking_start_time,
          booking_end_time
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, resident_community_id, guest_communities')
        .eq('id', userData.user?.id)
        .single();

      if (profileError) throw profileError;

      const communitiesWithRelationship = data
        .filter((community: any) => community.latitude && community.longitude)
        .map((community: any) => ({
          ...community,
          latitude: parseFloat(community.latitude),
          longitude: parseFloat(community.longitude),
          user_relationship: 
            community.id === profileData.resident_community_id
              ? 'resident'
              : profileData.guest_communities.includes(community.id)
                ? 'guest'
                : 'default'
        }));

      setCommunities(communitiesWithRelationship);
      
      // Update the cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(communitiesWithRelationship));
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to fetch communities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  return { communities, loading, error, refetch: fetchCommunities };
};

