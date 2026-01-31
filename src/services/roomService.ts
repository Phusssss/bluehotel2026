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
import { AppError, BusinessErrors, safeAsync } from '../utils/errors';

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
    return safeAsync(async () => {
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
      const rooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];
      
      return rooms;
    }, { operation: 'getRooms', hotelId, filters });
  }

  /**
   * Get a single room by ID
   */
  async getRoomById(id: string): Promise<Room | null> {
    return safeAsync(async () => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Room;
    }, { operation: 'getRoomById', roomId: id });
  }

  /**
   * Get a room by room number
   */
  async getRoomByNumber(
    hotelId: string,
    roomNumber: string
  ): Promise<Room | null> {
    return safeAsync(async () => {
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
    }, { operation: 'getRoomByNumber', hotelId, roomNumber });
  }

  /**
   * Create a new room
   */
  async createRoom(data: CreateRoomInput): Promise<string> {
    return safeAsync(async () => {
      // Check if room number already exists
      const existingRoom = await this.getRoomByNumber(
        data.hotelId,
        data.roomNumber
      );

      if (existingRoom) {
        throw BusinessErrors.ROOM_NUMBER_EXISTS(data.roomNumber);
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
    }, { operation: 'createRoom', hotelId: data.hotelId, roomNumber: data.roomNumber });
  }

  /**
   * Update an existing room
   */
  async updateRoom(id: string, data: Partial<Room>): Promise<void> {
    return safeAsync(async () => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new AppError('Room not found', 'ROOM_NOT_FOUND', 404);
      }

      // If room number is being changed, check for duplicates
      if (data.roomNumber) {
        const room = docSnap.data() as Room;
        const existingRoom = await this.getRoomByNumber(
          room.hotelId,
          data.roomNumber
        );

        if (existingRoom && existingRoom.id !== id) {
          throw BusinessErrors.ROOM_NUMBER_EXISTS(data.roomNumber);
        }
      }

      await updateDoc(docRef, deepRemoveUndefinedFields({
        ...data,
        updatedAt: Timestamp.now(),
      }));
    }, { operation: 'updateRoom', roomId: id });
  }

  /**
   * Delete a room
   */
  async deleteRoom(id: string): Promise<void> {
    return safeAsync(async () => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new AppError('Room not found', 'ROOM_NOT_FOUND', 404);
      }

      // Check if room has active reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('roomId', '==', id),
        where('status', 'in', ['pending', 'confirmed', 'checked-in'])
      );

      const reservationsSnapshot = await getDocs(reservationsQuery);

      if (!reservationsSnapshot.empty) {
        throw BusinessErrors.CANNOT_DELETE_ROOM_WITH_RESERVATIONS();
      }

      await deleteDoc(docRef);
    }, { operation: 'deleteRoom', roomId: id });
  }

  /**
   * Update room status
   */
  async updateRoomStatus(
    id: string,
    status: Room['status']
  ): Promise<void> {
    return safeAsync(async () => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new AppError('Room not found', 'ROOM_NOT_FOUND', 404);
      }

      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    }, { operation: 'updateRoomStatus', roomId: id, status });
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
    return safeAsync(async () => {
      const rooms = await this.getRooms(hotelId);
      return rooms.length;
    }, { operation: 'getTotalRoomCount', hotelId });
  }

  /**
   * Get room count by status
   */
  async getRoomCountByStatus(
    hotelId: string,
    status: Room['status']
  ): Promise<number> {
    return safeAsync(async () => {
      const rooms = await this.getRoomsByStatus(hotelId, status);
      return rooms.length;
    }, { operation: 'getRoomCountByStatus', hotelId, status });
  }
}

// Export singleton instance
export const roomService = new RoomService();
