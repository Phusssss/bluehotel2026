import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { HotelUserService } from '../services/hotelUserService';
import { HotelUser } from '../types';

export interface Hotel {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  currency: string;
  logoUrl?: string;
}

export interface HotelContextValue {
  currentHotel: Hotel | null;
  hotels: Hotel[];
  loading: boolean;
  userPermission: HotelUser['permission'] | null;
  selectHotel: (hotelId: string) => void;
  addHotel: (hotel: Omit<Hotel, 'id'>) => Promise<string>;
  updateHotel: (hotelId: string, data: Partial<Hotel>) => Promise<void>;
}

const HotelContext = createContext<HotelContextValue | undefined>(undefined);

const CURRENT_HOTEL_KEY = 'currentHotelId';

export function HotelProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPermission, setUserPermission] = useState<HotelUser['permission'] | null>(null);

  useEffect(() => {
    if (user) {
      loadUserHotels();
    } else {
      setCurrentHotel(null);
      setHotels([]);
      setUserPermission(null);
      setLoading(false);
      localStorage.removeItem(CURRENT_HOTEL_KEY);
    }
  }, [user]);

  const loadUserHotels = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Query hotelUsers collection to get hotels user has access to
      const hotelUsersQuery = query(
        collection(db, 'hotelUsers'),
        where('userId', '==', user.uid)
      );
      const hotelUsersSnapshot = await getDocs(hotelUsersQuery);

      if (hotelUsersSnapshot.empty) {
        setHotels([]);
        setCurrentHotel(null);
        setLoading(false);
        return;
      }

      // Get hotel IDs
      const hotelIds = hotelUsersSnapshot.docs.map((doc) => doc.data().hotelId);

      // Fetch hotel documents
      const hotelPromises = hotelIds.map(async (hotelId) => {
        const hotelDoc = await getDoc(doc(db, 'hotels', hotelId));
        if (hotelDoc.exists()) {
          return { id: hotelDoc.id, ...hotelDoc.data() } as Hotel;
        }
        return null;
      });

      const hotelResults = await Promise.all(hotelPromises);
      const validHotels = hotelResults.filter((h) => h !== null) as Hotel[];
      setHotels(validHotels);

      // Restore current hotel from localStorage
      const savedHotelId = localStorage.getItem(CURRENT_HOTEL_KEY);
      if (savedHotelId && validHotels.some((h) => h.id === savedHotelId)) {
        const hotel = validHotels.find((h) => h.id === savedHotelId);
        setCurrentHotel(hotel || null);
        // Load user permission for the selected hotel
        if (hotel) {
          const permission = await HotelUserService.getUserPermission(hotel.id, user.uid);
          setUserPermission(permission);
        }
      } else if (validHotels.length > 0) {
        // Auto-select first hotel if no saved selection
        setCurrentHotel(validHotels[0]);
        localStorage.setItem(CURRENT_HOTEL_KEY, validHotels[0].id);
        // Load user permission for the first hotel
        const permission = await HotelUserService.getUserPermission(validHotels[0].id, user.uid);
        setUserPermission(permission);
      }
    } catch (error) {
      console.error('Error loading user hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectHotel = async (hotelId: string) => {
    const hotel = hotels.find((h) => h.id === hotelId);
    if (hotel && user) {
      setCurrentHotel(hotel);
      localStorage.setItem(CURRENT_HOTEL_KEY, hotelId);
      // Load user permission for the selected hotel
      const permission = await HotelUserService.getUserPermission(hotelId, user.uid);
      setUserPermission(permission);
    }
  };

  const addHotel = async (hotelData: Omit<Hotel, 'id'>): Promise<string> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Create hotel document
      const hotelRef = doc(collection(db, 'hotels'));
      const hotelId = hotelRef.id;

      await setDoc(hotelRef, {
        ...hotelData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create hotelUsers document with owner permission
      const hotelUserRef = doc(db, 'hotelUsers', `${user.uid}_${hotelId}`);
      await setDoc(hotelUserRef, {
        hotelId,
        userId: user.uid,
        permission: 'owner',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Reload hotels
      await loadUserHotels();

      return hotelId;
    } catch (error) {
      console.error('Error adding hotel:', error);
      throw error;
    }
  };

  const updateHotel = async (
    hotelId: string,
    data: Partial<Hotel>
  ): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const hotelRef = doc(db, 'hotels', hotelId);
      await updateDoc(hotelRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setHotels((prev) =>
        prev.map((h) => (h.id === hotelId ? { ...h, ...data } : h))
      );

      if (currentHotel?.id === hotelId) {
        setCurrentHotel({ ...currentHotel, ...data });
      }
    } catch (error) {
      console.error('Error updating hotel:', error);
      throw error;
    }
  };

  const value: HotelContextValue = {
    currentHotel,
    hotels,
    loading,
    userPermission,
    selectHotel,
    addHotel,
    updateHotel,
  };

  return (
    <HotelContext.Provider value={value}>{children}</HotelContext.Provider>
  );
}

export function useHotel(): HotelContextValue {
  const context = useContext(HotelContext);
  if (context === undefined) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
}
