import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { HotelUser, User } from '../types';

/**
 * Service for managing hotel users and permissions
 */
export class HotelUserService {
  /**
   * Get all users with access to a specific hotel
   */
  static async getHotelUsers(hotelId: string): Promise<Array<HotelUser & { user: User }>> {
    try {
      // Query hotelUsers collection for the specific hotel
      const hotelUsersQuery = query(
        collection(db, 'hotelUsers'),
        where('hotelId', '==', hotelId)
      );
      const hotelUsersSnapshot = await getDocs(hotelUsersQuery);

      if (hotelUsersSnapshot.empty) {
        return [];
      }

      // Get user details for each hotel user
      const hotelUsersWithDetails = await Promise.all(
        hotelUsersSnapshot.docs.map(async (hotelUserDoc) => {
          const hotelUserData = hotelUserDoc.data() as HotelUser;
          
          // Fetch user document
          const userDoc = await getDoc(doc(db, 'users', hotelUserData.userId));
          if (!userDoc.exists()) {
            throw new Error(`User ${hotelUserData.userId} not found`);
          }

          const userData = userDoc.data() as User;

          return {
            ...hotelUserData,
            id: hotelUserDoc.id,
            user: userData,
          };
        })
      );

      return hotelUsersWithDetails;
    } catch (error) {
      console.error('Error fetching hotel users:', error);
      throw error;
    }
  }

  /**
   * Add a user to a hotel with specific permissions
   */
  static async addUserToHotel(
    hotelId: string,
    userEmail: string,
    permission: HotelUser['permission']
  ): Promise<void> {
    try {
      // First, find the user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', userEmail)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        throw new Error('User not found with this email address');
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      // Check if user already has access to this hotel
      const existingHotelUserDoc = await getDoc(
        doc(db, 'hotelUsers', `${userId}_${hotelId}`)
      );

      if (existingHotelUserDoc.exists()) {
        throw new Error('User already has access to this hotel');
      }

      // Create hotelUsers document
      const hotelUserRef = doc(db, 'hotelUsers', `${userId}_${hotelId}`);
      await setDoc(hotelUserRef, {
        hotelId,
        userId,
        permission,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding user to hotel:', error);
      throw error;
    }
  }

  /**
   * Update user permissions for a hotel
   */
  static async updateUserPermission(
    hotelId: string,
    userId: string,
    permission: HotelUser['permission']
  ): Promise<void> {
    try {
      const hotelUserRef = doc(db, 'hotelUsers', `${userId}_${hotelId}`);
      
      // Check if the document exists
      const hotelUserDoc = await getDoc(hotelUserRef);
      if (!hotelUserDoc.exists()) {
        throw new Error('User does not have access to this hotel');
      }

      await updateDoc(hotelUserRef, {
        permission,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user permission:', error);
      throw error;
    }
  }

  /**
   * Remove a user from a hotel
   */
  static async removeUserFromHotel(hotelId: string, userId: string): Promise<void> {
    try {
      const hotelUserRef = doc(db, 'hotelUsers', `${userId}_${hotelId}`);
      
      // Check if the document exists
      const hotelUserDoc = await getDoc(hotelUserRef);
      if (!hotelUserDoc.exists()) {
        throw new Error('User does not have access to this hotel');
      }

      await deleteDoc(hotelUserRef);
    } catch (error) {
      console.error('Error removing user from hotel:', error);
      throw error;
    }
  }

  /**
   * Get user's permission level for a specific hotel
   */
  static async getUserPermission(hotelId: string, userId: string): Promise<HotelUser['permission'] | null> {
    try {
      const hotelUserDoc = await getDoc(doc(db, 'hotelUsers', `${userId}_${hotelId}`));
      
      if (!hotelUserDoc.exists()) {
        return null;
      }

      const hotelUserData = hotelUserDoc.data() as HotelUser;
      return hotelUserData.permission;
    } catch (error) {
      console.error('Error getting user permission:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission level or higher
   */
  static hasPermission(
    userPermission: HotelUser['permission'] | null,
    requiredPermission: HotelUser['permission']
  ): boolean {
    if (!userPermission) return false;

    const permissionHierarchy: Record<HotelUser['permission'], number> = {
      owner: 4,
      manager: 3,
      receptionist: 2,
      housekeeping: 1,
    };

    return permissionHierarchy[userPermission] >= permissionHierarchy[requiredPermission];
  }
}