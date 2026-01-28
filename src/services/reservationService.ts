import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  orderBy,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  Reservation,
  CreateReservationInput,
  ReservationFilters,
  Room,
} from '../types';
import { removeUndefinedFields } from '../utils/firestore';

/**
 * Service class for managing reservations in Firestore
 */
export class ReservationService {
  private collectionName = 'reservations';

  /**
   * Generate a unique confirmation number
   */
  private generateConfirmationNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}${random}`;
  }

  /**
   * Get all reservations for a hotel with optional filters
   */
  async getReservations(
    hotelId: string,
    filters?: ReservationFilters
  ): Promise<Reservation[]> {
    try {
      let q: Query<DocumentData> = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId)
      );

      // Apply filters
      if (filters?.startDate) {
        q = query(q, where('checkInDate', '>=', filters.startDate));
      }
      if (filters?.endDate) {
        q = query(q, where('checkOutDate', '<=', filters.endDate));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.source) {
        q = query(q, where('source', '==', filters.source));
      }
      if (filters?.customerId) {
        q = query(q, where('customerId', '==', filters.customerId));
      }

      // Order by check-in date
      q = query(q, orderBy('checkInDate', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];
    } catch (error) {
      console.error('Error getting reservations:', error);
      throw new Error('Failed to fetch reservations');
    }
  }

  /**
   * Get a single reservation by ID
   */
  async getReservationById(id: string): Promise<Reservation | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Reservation;
    } catch (error) {
      console.error('Error getting reservation:', error);
      throw new Error('Failed to fetch reservation');
    }
  }

  /**
   * Create a new reservation
   */
  async createReservation(data: CreateReservationInput): Promise<string> {
    try {
      // Validate dates
      if (data.checkOutDate <= data.checkInDate) {
        throw new Error('Check-out date must be after check-in date');
      }

      // Check room availability
      const isAvailable = await this.checkRoomAvailability(
        data.hotelId,
        data.roomId,
        data.checkInDate,
        data.checkOutDate
      );

      if (!isAvailable) {
        throw new Error('Room is not available for the selected dates');
      }

      const now = Timestamp.now();
      const confirmationNumber = this.generateConfirmationNumber();

      const reservationData = removeUndefinedFields({
        ...data,
        confirmationNumber,
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(
        collection(db, this.collectionName),
        reservationData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  /**
   * Update an existing reservation
   */
  async updateReservation(
    id: string,
    data: Partial<Reservation>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Reservation not found');
      }

      const reservation = docSnap.data() as Reservation;

      // Check if reservation can be edited
      if (
        reservation.status !== 'pending' &&
        reservation.status !== 'confirmed'
      ) {
        throw new Error(
          'Cannot edit reservation that is checked-in, checked-out, or cancelled'
        );
      }

      // If dates are being changed, check availability
      if (data.checkInDate || data.checkOutDate) {
        const checkInDate = data.checkInDate || reservation.checkInDate;
        const checkOutDate = data.checkOutDate || reservation.checkOutDate;
        const roomId = data.roomId || reservation.roomId;

        if (checkOutDate <= checkInDate) {
          throw new Error('Check-out date must be after check-in date');
        }

        const isAvailable = await this.checkRoomAvailability(
          reservation.hotelId,
          roomId,
          checkInDate,
          checkOutDate,
          id // Exclude current reservation from availability check
        );

        if (!isAvailable) {
          throw new Error('Room is not available for the selected dates');
        }
      }

      await updateDoc(docRef, removeUndefinedFields({
        ...data,
        updatedAt: Timestamp.now(),
      }));
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Reservation not found');
      }

      await updateDoc(docRef, {
        status: 'cancelled',
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error canceling reservation:', error);
      throw error;
    }
  }

  /**
   * Check in a guest
   */
  async checkIn(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Reservation not found');
      }

      const reservation = docSnap.data() as Reservation;

      if (reservation.status !== 'confirmed' && reservation.status !== 'pending') {
        throw new Error('Can only check in confirmed or pending reservations');
      }

      const now = Timestamp.now();

      // Update reservation status
      await updateDoc(docRef, {
        status: 'checked-in',
        checkedInAt: now,
        updatedAt: now,
      });

      // Update room status to occupied
      const roomRef = doc(db, 'rooms', reservation.roomId);
      await updateDoc(roomRef, {
        status: 'occupied',
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  }

  /**
   * Check out a guest
   */
  async checkOut(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Reservation not found');
      }

      const reservation = docSnap.data() as Reservation;

      if (reservation.status !== 'checked-in') {
        throw new Error('Can only check out checked-in reservations');
      }

      const now = Timestamp.now();

      // Update reservation status
      await updateDoc(docRef, {
        status: 'checked-out',
        checkedOutAt: now,
        updatedAt: now,
      });

      // Update room status to dirty
      const roomRef = doc(db, 'rooms', reservation.roomId);
      await updateDoc(roomRef, {
        status: 'dirty',
        updatedAt: now,
      });

      // Create housekeeping task
      await addDoc(collection(db, 'housekeepingTasks'), {
        hotelId: reservation.hotelId,
        roomId: reservation.roomId,
        taskType: 'clean',
        priority: 'normal',
        status: 'pending',
        createdAt: now,
      });
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  }

  /**
   * Check if a room is available for the given date range
   */
  async checkRoomAvailability(
    hotelId: string,
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: string
  ): Promise<boolean> {
    try {
      // Query for overlapping reservations
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('roomId', '==', roomId),
        where('status', 'in', ['pending', 'confirmed', 'checked-in'])
      );

      const snapshot = await getDocs(q);
      const reservations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      // Check for date overlaps
      for (const reservation of reservations) {
        // Skip the current reservation if updating
        if (excludeReservationId && reservation.id === excludeReservationId) {
          continue;
        }

        // Check if dates overlap
        // Overlap occurs if: checkIn < existing.checkOut AND checkOut > existing.checkIn
        if (
          checkInDate < reservation.checkOutDate &&
          checkOutDate > reservation.checkInDate
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw new Error('Failed to check room availability');
    }
  }

  /**
   * Get available rooms for a date range and optional room type
   */
  async getAvailableRooms(
    hotelId: string,
    checkInDate: string,
    checkOutDate: string,
    roomTypeId?: string
  ): Promise<Room[]> {
    try {
      // Get all rooms for the hotel
      let roomsQuery: Query<DocumentData> = query(
        collection(db, 'rooms'),
        where('hotelId', '==', hotelId),
        where('status', '!=', 'maintenance')
      );

      if (roomTypeId) {
        roomsQuery = query(roomsQuery, where('roomTypeId', '==', roomTypeId));
      }

      const roomsSnapshot = await getDocs(roomsQuery);
      const allRooms = roomsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];

      // Filter out rooms with conflicting reservations
      const availableRooms: Room[] = [];

      for (const room of allRooms) {
        const isAvailable = await this.checkRoomAvailability(
          hotelId,
          room.id,
          checkInDate,
          checkOutDate
        );

        if (isAvailable) {
          availableRooms.push(room);
        }
      }

      return availableRooms;
    } catch (error) {
      console.error('Error getting available rooms:', error);
      throw new Error('Failed to fetch available rooms');
    }
  }

  /**
   * Search reservations by confirmation number
   */
  async searchByConfirmationNumber(
    hotelId: string,
    confirmationNumber: string
  ): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('confirmationNumber', '==', confirmationNumber.toUpperCase())
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];
    } catch (error) {
      console.error('Error searching by confirmation number:', error);
      throw new Error('Failed to search reservations');
    }
  }
}

// Export singleton instance
export const reservationService = new ReservationService();
