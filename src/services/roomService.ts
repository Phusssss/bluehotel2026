import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Room, CreateRoomInput } from '../types';
import { deepRemoveUndefinedFields } from '../utils/firestore';

/**
 * Filters for querying rooms
 */
export interface RoomFilters {
  status?: Room['status'];
  roomTypeId?: string;
  floor?: number;
}

/**
 * Service class for managing rooms in Firestore
 */
export class RoomService {
  private collectionName = 'rooms';

  /**
   * Get all rooms for a hotel with optional filters
   */
  async getRooms(hotelId: string, filters?: RoomFilters): Promise<Room[]> {
    try {
      let q: Query<DocumentData> = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId)
      );

      // Apply filters
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.roomTypeId) {
        q = query(q, where('roomTypeId', '==', filters.roomTypeId));
      }
      if (filters?.floor !== undefined) {
        q = query(q, where('floor', '==', filters.floor));
      }

      // Order by room number
      q = query(q, orderBy('roomNumber', 'asc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];
    } catch (error) {
      console.error('Error getting rooms:', error);
      throw new Error('Failed to fetch rooms');
    }
  }

  /**
   * Get a single room by ID
   */
  async getRoomById(id: string): Promise<Room | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Room;
    } catch (error) {
      console.error('Error getting room:', error);
      throw new Error('Failed to fetch room');
    }
  }

  /**
   * Get a room by room number
   */
  async getRoomByNumber(
    hotelId: string,
    roomNumber: string
  ): Promise<Room | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('roomNumber', '==', roomNumber)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Room;
    } catch (error) {
      console.error('Error getting room by number:', error);
      throw new Error('Failed to fetch room');
    }
  }

  /**
   * Create a new room
   */
  async createRoom(data: CreateRoomInput): Promise<string> {
    try {
      // Check if room number already exists
      const existingRoom = await this.getRoomByNumber(
        data.hotelId,
        data.roomNumber
      );

      if (existingRoom) {
        throw new Error('Room number already exists');
      }

      const now = Timestamp.now();

      const roomData = deepRemoveUndefinedFields({
        ...data,
        status: data.status || 'vacant',
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(collection(db, this.collectionName), roomData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  /**
   * Update an existing room
   */
  async updateRoom(id: string, data: Partial<Room>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Room not found');
      }

      // If room number is being changed, check for duplicates
      if (data.roomNumber) {
        const room = docSnap.data() as Room;
        const existingRoom = await this.getRoomByNumber(
          room.hotelId,
          data.roomNumber
        );

        if (existingRoom && existingRoom.id !== id) {
          throw new Error('Room number already exists');
        }
      }

      await updateDoc(docRef, deepRemoveUndefinedFields({
        ...data,
        updatedAt: Timestamp.now(),
      }));
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Room not found');
      }

      // Check if room has active reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('roomId', '==', id),
        where('status', 'in', ['pending', 'confirmed', 'checked-in'])
      );

      const reservationsSnapshot = await getDocs(reservationsQuery);

      if (!reservationsSnapshot.empty) {
        throw new Error('Cannot delete room with active reservations');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }

  /**
   * Update room status
   */
  async updateRoomStatus(
    id: string,
    status: Room['status']
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Room not found');
      }

      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  }

  /**
   * Get rooms by status
   */
  async getRoomsByStatus(
    hotelId: string,
    status: Room['status']
  ): Promise<Room[]> {
    return this.getRooms(hotelId, { status });
  }

  /**
   * Get rooms requiring cleaning (dirty status)
   */
  async getDirtyRooms(hotelId: string): Promise<Room[]> {
    return this.getRoomsByStatus(hotelId, 'dirty');
  }

  /**
   * Get rooms under maintenance
   */
  async getMaintenanceRooms(hotelId: string): Promise<Room[]> {
    return this.getRoomsByStatus(hotelId, 'maintenance');
  }

  /**
   * Get occupied rooms
   */
  async getOccupiedRooms(hotelId: string): Promise<Room[]> {
    return this.getRoomsByStatus(hotelId, 'occupied');
  }

  /**
   * Get vacant rooms
   */
  async getVacantRooms(hotelId: string): Promise<Room[]> {
    return this.getRoomsByStatus(hotelId, 'vacant');
  }

  /**
   * Get total room count for a hotel
   */
  async getTotalRoomCount(hotelId: string): Promise<number> {
    try {
      const rooms = await this.getRooms(hotelId);
      return rooms.length;
    } catch (error) {
      console.error('Error getting total room count:', error);
      throw new Error('Failed to get room count');
    }
  }

  /**
   * Get room count by status
   */
  async getRoomCountByStatus(
    hotelId: string,
    status: Room['status']
  ): Promise<number> {
    try {
      const rooms = await this.getRoomsByStatus(hotelId, status);
      return rooms.length;
    } catch (error) {
      console.error('Error getting room count by status:', error);
      throw new Error('Failed to get room count');
    }
  }
}

// Export singleton instance
export const roomService = new RoomService();
