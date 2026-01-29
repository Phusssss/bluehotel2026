import { useState, useEffect } from 'react';
import { HotelUser, User } from '../../../types';
import { HotelUserService } from '../../../services/hotelUserService';
import { useHotel } from '../../../contexts/HotelContext';
import { useAuth } from '../../../contexts/AuthContext';

export interface HotelUserWithDetails extends HotelUser {
  user: User;
}

export interface UseHotelUsersResult {
  hotelUsers: HotelUserWithDetails[];
  loading: boolean;
  error: Error | null;
  addUser: (userEmail: string, permission: HotelUser['permission']) => Promise<void>;
  updateUserPermission: (userId: string, permission: HotelUser['permission']) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  currentUserPermission: HotelUser['permission'] | null;
  canManageUsers: boolean;
}

export function useHotelUsers(): UseHotelUsersResult {
  const { currentHotel } = useHotel();
  const { user: currentUser } = useAuth();
  const [hotelUsers, setHotelUsers] = useState<HotelUserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentUserPermission, setCurrentUserPermission] = useState<HotelUser['permission'] | null>(null);

  const loadHotelUsers = async () => {
    if (!currentHotel) {
      setHotelUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const users = await HotelUserService.getHotelUsers(currentHotel.id);
      setHotelUsers(users);

      // Get current user's permission
      if (currentUser) {
        const permission = await HotelUserService.getUserPermission(currentHotel.id, currentUser.uid);
        setCurrentUserPermission(permission);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotelUsers();
  }, [currentHotel, currentUser]);

  const addUser = async (userEmail: string, permission: HotelUser['permission']) => {
    if (!currentHotel) {
      throw new Error('No hotel selected');
    }

    await HotelUserService.addUserToHotel(currentHotel.id, userEmail, permission);
    await loadHotelUsers(); // Refresh the list
  };

  const updateUserPermission = async (userId: string, permission: HotelUser['permission']) => {
    if (!currentHotel) {
      throw new Error('No hotel selected');
    }

    await HotelUserService.updateUserPermission(currentHotel.id, userId, permission);
    await loadHotelUsers(); // Refresh the list
  };

  const removeUser = async (userId: string) => {
    if (!currentHotel) {
      throw new Error('No hotel selected');
    }

    await HotelUserService.removeUserFromHotel(currentHotel.id, userId);
    await loadHotelUsers(); // Refresh the list
  };

  const refresh = async () => {
    await loadHotelUsers();
  };

  // Check if current user can manage other users (owner or manager)
  const canManageUsers = HotelUserService.hasPermission(currentUserPermission, 'manager');

  return {
    hotelUsers,
    loading,
    error,
    addUser,
    updateUserPermission,
    removeUser,
    refresh,
    currentUserPermission,
    canManageUsers,
  };
}