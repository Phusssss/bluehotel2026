import { useState, useEffect } from 'react';
import { User, Hotel } from '../../../types';
import { UserService } from '../../../services/userService';
import { useAuth } from '../../../contexts/AuthContext';

interface UseAdminResult {
  users: User[];
  loading: boolean;
  error: Error | null;
  refreshUsers: () => Promise<void>;
  lockUser: (userId: string) => Promise<void>;
  unlockUser: (userId: string) => Promise<void>;
  resetUserPermissions: (userId: string) => Promise<void>;
  getUserHotels: (userId: string) => Promise<Hotel[]>;
}

export function useAdmin(): UseAdminResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user: currentUser } = useAuth();

  const loadUsers = async () => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      setError(new Error('Unauthorized: Super admin access required'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const allUsers = await UserService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const refreshUsers = async () => {
    await loadUsers();
  };

  const lockUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    if (userId === currentUser.uid) {
      throw new Error('Cannot lock your own account');
    }

    await UserService.updateUserStatus(userId, 'locked');
    await refreshUsers();
  };

  const unlockUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    await UserService.updateUserStatus(userId, 'active');
    await refreshUsers();
  };

  const resetUserPermissions = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    if (userId === currentUser.uid) {
      throw new Error('Cannot reset your own permissions');
    }

    await UserService.resetUserPermissions(userId);
    await refreshUsers();
  };

  const getUserHotels = async (userId: string): Promise<Hotel[]> => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    return await UserService.getUserHotels(userId);
  };

  return {
    users,
    loading,
    error,
    refreshUsers,
    lockUser,
    unlockUser,
    resetUserPermissions,
    getUserHotels,
  };
}