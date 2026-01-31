import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Hotel } from '../types';

/**
 * Service for managing users (admin operations)
 */
export class UserService {
  /**
   * Get all users in the system (Super Admin only)
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        return [];
      }

      const users = usersSnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      })) as User[];

      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      return {
        ...userDoc.data(),
        uid: userDoc.id,
      } as User;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  /**
   * Update user status (lock/unlock)
   */
  static async updateUserStatus(userId: string, status: User['status']): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Check if the document exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      await updateDoc(userRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Get hotels associated with a user
   */
  static async getUserHotels(userId: string): Promise<Hotel[]> {
    try {
      // First, get all hotelUsers documents for this user
      const hotelUsersQuery = query(
        collection(db, 'hotelUsers'),
        where('userId', '==', userId)
      );
      const hotelUsersSnapshot = await getDocs(hotelUsersQuery);

      if (hotelUsersSnapshot.empty) {
        return [];
      }

      // Extract hotel IDs
      const hotelIds = hotelUsersSnapshot.docs.map(doc => doc.data().hotelId);

      // Fetch hotel documents
      const hotels = await Promise.all(
        hotelIds.map(async (hotelId) => {
          const hotelDoc = await getDoc(doc(db, 'hotels', hotelId));
          if (hotelDoc.exists()) {
            return {
              ...hotelDoc.data(),
              id: hotelDoc.id,
            } as Hotel;
          }
          return null;
        })
      );

      // Filter out null values
      return hotels.filter((hotel): hotel is Hotel => hotel !== null);
    } catch (error) {
      console.error('Error fetching user hotels:', error);
      throw error;
    }
  }

  /**
   * Reset user permissions (remove from all hotels)
   */
  static async resetUserPermissions(userId: string): Promise<void> {
    try {
      // Get all hotelUsers documents for this user
      const hotelUsersQuery = query(
        collection(db, 'hotelUsers'),
        where('userId', '==', userId)
      );
      const hotelUsersSnapshot = await getDocs(hotelUsersQuery);

      // Delete all hotelUsers documents for this user
      const deletePromises = hotelUsersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error resetting user permissions:', error);
      throw error;
    }
  }

  /**
   * Delete user account (Super Admin only)
   * Note: This only deletes the user document from Firestore, not the Firebase Auth account
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      // First reset all permissions (remove from all hotels)
      await this.resetUserPermissions(userId);

      // Then delete the user document
      const userRef = doc(db, 'users', userId);
      
      // Check if the document exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}