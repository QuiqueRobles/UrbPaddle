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

      // Intentar obtener datos del caché
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setCommunities(JSON.parse(cachedData));
        setLoading(false);
      }

      // Fetch fresh data from Supabase
      const { data, error } = await supabase
        .from('community')
        .select('id, name, address, latitude, longitude, court_number, image');

      if (error) throw error;

      if (data) {
        setCommunities(data);
        // Actualizar el caché
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
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
