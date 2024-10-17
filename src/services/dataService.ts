import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Club {
  id: string;
  name: string;
  rating: number;
  attendees: number;
  image: string;
  price: number;
  category: string;
  description: string;
  address: string;
  openingHours: string;
  dressCode: string;
  musicGenre: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  favoriteClub: string;
  attendedEvents: number;
  profilePicture: string;
  preferences: {
    musicGenres: string[];
    notifications: boolean;
  };
  recentActivity: {
    event: string;
    date: string;
  }[];
}

export const getClubs = async (): Promise<Club[]> => {
  try {
    const clubsCol = collection(db, 'clubs');
    const clubSnapshot = await getDocs(clubsCol);
    return clubSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
  } catch (error) {
    console.error('Error fetching clubs:', error);
    throw error;
  }
};

export const getClubById = async (clubId: string): Promise<Club | null> => {
  try {
    const clubDoc = doc(db, 'clubs', clubId);
    const clubSnapshot = await getDoc(clubDoc);
    if (clubSnapshot.exists()) {
      return { id: clubSnapshot.id, ...clubSnapshot.data() } as Club;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching club:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const userDoc = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    if (userSnapshot.exists()) {
      return { id: userSnapshot.id, ...userSnapshot.data() } as UserProfile;
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const addRecentActivity = async (userId: string, activity: { event: string; date: string }): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data() as UserProfile;
      const updatedRecentActivity = [activity, ...userData.recentActivity.slice(0, 4)];
      await updateDoc(userDoc, { recentActivity: updatedRecentActivity });
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error adding recent activity:', error);
    throw error;
  }
};

export const updateUserPreferences = async (userId: string, preferences: UserProfile['preferences']): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, { preferences });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};