// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  favoriteClub: string;
  attendedEvents: number;
  profilePicture: string;
  recentActivity: { event: string; date: string }[];
}

const ProfileScreen: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userDoc = doc(db, 'users', '1');
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          setUserData({ id: userSnapshot.id, ...userSnapshot.data() } as UserProfile);
        } else {
          console.error('User not found');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    if (userData) {
      try {
        const userDoc = doc(db, 'users', userData.id);
        await updateDoc(userDoc, {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          favoriteClub: userData.favoriteClub,
        });
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#A78BFA" />
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-white text-xl">Error loading profile</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView className="flex-1">
        <View className="items-center mt-8">
          <Image
            source={{ uri: userData.profilePicture }}
            className="w-32 h-32 rounded-full"
          />
          <TouchableOpacity className="absolute bottom-0 right-1/3 bg-purple-600 rounded-full p-2">
            <Feather name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="px-6 mt-6">
          <Text className="text-white text-2xl font-bold text-center mb-6">
            {isEditing ? 'Edit Profile' : userData.name}
          </Text>

          {['name', 'email', 'phone', 'favoriteClub'].map((key) => (
            <View key={key} className="mb-4">
              <Text className="text-gray-400 text-sm mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
              {isEditing ? (
                <TextInput
                  value={userData[key as keyof UserProfile] as string}
                  onChangeText={(text) => setUserData({ ...userData, [key]: text })}
                  className="bg-gray-800 text-white p-3 rounded-md"
                />
              ) : (
                <Text className="text-white text-lg">{userData[key as keyof UserProfile] as string}</Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-purple-600 py-3 px-6 rounded-full mt-6"
          >
            <Text className="text-white text-center text-lg font-semibold">
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 px-6">
          <Text className="text-white text-xl font-semibold mb-4">Recent Activity</Text>
          {userData.recentActivity.map((activity, index) => (
            <View key={index} className="flex-row items-center mb-3">
              <View className="bg-purple-600 rounded-full p-2 mr-3">
                <Feather name="activity" size={16} color="white" />
              </View>
              <View>
                <Text className="text-white text-base">{activity.event}</Text>
                <Text className="text-gray-400 text-sm">{new Date(activity.date).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;