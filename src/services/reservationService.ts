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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  Reservation,
  CreateReservationInput,
  ReservationFilters,
  Room,
  RoomType,
  RoomTypeAvailabilityRequest,
  RoomTypeAvailabilityResult,
  AlternativeRoomType,
  CreateGroupBookingInput,
} from '../types';
import { deepRemoveUndefinedFields } from '../utils/firestore';
import { AppError, BusinessErrors, safeAsync } from '../utils/errors';

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
    return safeAsync(async () => {
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
    }, { operation: 'getReservations', hotelId, filters });
  }

  /**
   * Get a single reservation by ID
   */
  async getReservationById(id: string): Promise<Reservation | null> {
    return safeAsync(async () => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Reservation;
    }, { operation: 'getReservationById', reservationId: id });
  }

  /**
   * Create a new reservation
   */
  async createReservation(data: CreateReservationInput): Promise<string> {
    return safeAsync(async () => {
      // Validate dates
      if (data.checkOutDate <= data.checkInDate) {
        throw BusinessErrors.INVALID_DATE_RANGE();
      }

      // Check room availability
      const isAvailable = await this.checkRoomAvailability(
        data.hotelId,
        data.roomId,
        data.checkInDate,
        data.checkOutDate
      );

      if (!isAvailable) {
        throw BusinessErrors.ROOM_NOT_AVAILABLE({
          checkIn: data.checkInDate,
          checkOut: data.checkOutDate,
        });
      }

      const now = Timestamp.now();
      const confirmationNumber = this.generateConfirmationNumber();

      const reservationData = deepRemoveUndefinedFields({
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
    }, { operation: 'createReservation', hotelId: data.hotelId, roomId: data.roomId });
  }

  /**
   * Update an existing reservation
   */
  async updateReservation(
    id: string,
    data: Partial<Reservation>
  ): Promise<void> {
    return safeAsync(async () => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
      }

      const reservation = docSnap.data() as Reservation;

      // Check if reservation can be edited
      if (
        reservation.status !== 'pending' &&
        reservation.status !== 'confirmed'
      ) {
        throw BusinessErrors.RESERVATION_NOT_EDITABLE(reservation.status);
      }

      // If dates are being changed, check availability
      if (data.checkInDate || data.checkOutDate) {
        const checkInDate = data.checkInDate || reservation.checkInDate;
        const checkOutDate = data.checkOutDate || reservation.checkOutDate;
        const roomId = data.roomId || reservation.roomId;

        if (checkOutDate <= checkInDate) {
          throw BusinessErrors.INVALID_DATE_RANGE();
        }

        const isAvailable = await this.checkRoomAvailability(
          reservation.hotelId,
          roomId,
          checkInDate,
          checkOutDate,
          id // Exclude current reservation from availability check
        );

        if (!isAvailable) {
          throw BusinessErrors.ROOM_NOT_AVAILABLE({
            checkIn: checkInDate,
            checkOut: checkOutDate,
          });
        }
      }

      await updateDoc(docRef, deepRemoveUndefinedFields({
        ...data,
        updatedAt: Timestamp.now(),
      }));
    }, { operation: 'updateReservation', reservationId: id });
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(id: string): Promise<void> {
    return safeAsync(async () => {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
      }

      await updateDoc(docRef, {
        status: 'cancelled',
        updatedAt: Timestamp.now(),
      });
    }, { operation: 'cancelReservation', reservationId: id });
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

  /**
   * Check availability for multiple room types simultaneously (for group bookings)
   * Returns availability status for each requested room type
   */
  async checkGroupAvailability(
    hotelId: string,
    checkInDate: string,
    checkOutDate: string,
    roomTypeRequests: RoomTypeAvailabilityRequest[]
  ): Promise<RoomTypeAvailabilityResult[]> {
    try {
      const results: RoomTypeAvailabilityResult[] = [];

      for (const request of roomTypeRequests) {
        // Get available rooms for this room type
        const availableRooms = await this.getAvailableRooms(
          hotelId,
          checkInDate,
          checkOutDate,
          request.roomTypeId
        );

        results.push({
          roomTypeId: request.roomTypeId,
          requested: request.quantity,
          available: availableRooms.length,
          isAvailable: availableRooms.length >= request.quantity,
        });
      }

      return results;
    } catch (error) {
      console.error('Error checking group availability:', error);
      throw new Error('Failed to check group availability');
    }
  }

  /**
   * Find alternative room types when requested room type is not available
   * Returns room types with capacity >= requested capacity, sorted by price
   */
  async findAlternativeRoomTypes(
    hotelId: string,
    checkInDate: string,
    checkOutDate: string,
    originalRoomTypeId: string,
    requestedQuantity: number
  ): Promise<AlternativeRoomType[]> {
    try {
      // Get the original room type to compare capacity and price
      const originalRoomTypeDoc = await getDoc(doc(db, 'roomTypes', originalRoomTypeId));
      if (!originalRoomTypeDoc.exists()) {
        throw new Error('Original room type not found');
      }
      const originalRoomType = {
        id: originalRoomTypeDoc.id,
        ...originalRoomTypeDoc.data(),
      } as RoomType;

      // Get all room types for the hotel
      const roomTypesQuery = query(
        collection(db, 'roomTypes'),
        where('hotelId', '==', hotelId)
      );
      const roomTypesSnapshot = await getDocs(roomTypesQuery);
      const allRoomTypes = roomTypesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RoomType[];

      // Filter room types by capacity (must be >= original capacity)
      const eligibleRoomTypes = allRoomTypes.filter(
        (rt) => rt.id !== originalRoomTypeId && rt.capacity >= originalRoomType.capacity
      );

      // Check availability for each eligible room type
      const alternatives: AlternativeRoomType[] = [];

      for (const roomType of eligibleRoomTypes) {
        const availableRooms = await this.getAvailableRooms(
          hotelId,
          checkInDate,
          checkOutDate,
          roomType.id
        );

        // Only include if enough rooms are available
        if (availableRooms.length >= requestedQuantity) {
          // Calculate price comparison percentage
          const priceComparison = originalRoomType.basePrice > 0
            ? ((roomType.basePrice - originalRoomType.basePrice) / originalRoomType.basePrice) * 100
            : 0;

          alternatives.push({
            roomTypeId: roomType.id,
            roomType,
            availableCount: availableRooms.length,
            priceComparison: Math.round(priceComparison * 100) / 100, // Round to 2 decimal places
          });
        }
      }

      // Sort by price (cheapest first)
      alternatives.sort((a, b) => a.roomType.basePrice - b.roomType.basePrice);

      return alternatives;
    } catch (error) {
      console.error('Error finding alternative room types:', error);
      throw new Error('Failed to find alternative room types');
    }
  }

  /**
   * Create a group booking with multiple reservations atomically
   * All reservations share the same groupId and are created in a single transaction
   */
  async createGroupBooking(data: CreateGroupBookingInput): Promise<string> {
    try {
      // Validate dates
      if (data.checkOutDate <= data.checkInDate) {
        throw new Error('Check-out date must be after check-in date');
      }

      // Validate that we have at least one reservation
      if (!data.reservations || data.reservations.length === 0) {
        throw new Error('Group booking must have at least one reservation');
      }

      // Validate all rooms are available
      for (const reservation of data.reservations) {
        const isAvailable = await this.checkRoomAvailability(
          data.hotelId,
          reservation.roomId,
          data.checkInDate,
          data.checkOutDate
        );

        if (!isAvailable) {
          throw new Error(`Room ${reservation.roomId} is not available for the selected dates`);
        }
      }

      // Generate unique groupId (UUID)
      const groupId = crypto.randomUUID();
      const groupSize = data.reservations.length;
      const now = Timestamp.now();

      // Use batch write for atomicity
      const batch = writeBatch(db);
      const reservationIds: string[] = [];

      // Create each reservation in the group
      data.reservations.forEach((reservation, index) => {
        const confirmationNumber = this.generateConfirmationNumber();
        const reservationRef = doc(collection(db, this.collectionName));
        
        const reservationData = deepRemoveUndefinedFields({
          hotelId: data.hotelId,
          customerId: data.customerId,
          roomId: reservation.roomId,
          roomTypeId: reservation.roomTypeId,
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate,
          numberOfGuests: reservation.numberOfGuests,
          source: data.source,
          totalPrice: reservation.totalPrice,
          paidAmount: 0,
          notes: data.notes,
          status: 'pending' as const,
          confirmationNumber,
          isGroupBooking: true,
          groupId,
          groupSize,
          groupIndex: index + 1, // 1-based index
          createdAt: now,
          updatedAt: now,
        });

        batch.set(reservationRef, reservationData);
        reservationIds.push(reservationRef.id);
      });

      // Commit the batch
      await batch.commit();

      // Return the groupId
      return groupId;
    } catch (error) {
      console.error('Error creating group booking:', error);
      throw error;
    }
  }

  /**
   * Get all reservations in a group booking
   * Returns reservations ordered by groupIndex
   */
  async getGroupReservations(hotelId: string, groupId: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('groupId', '==', groupId),
        orderBy('groupIndex', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];
    } catch (error) {
      console.error('Error getting group reservations:', error);
      throw new Error('Failed to fetch group reservations');
    }
  }

  /**
   * Check in all reservations in a group booking
   * Updates all reservations to checked-in status and marks rooms as occupied
   */
  async checkInGroup(hotelId: string, groupId: string): Promise<void> {
    try {
      // Get all reservations in the group
      const reservations = await this.getGroupReservations(hotelId, groupId);

      if (reservations.length === 0) {
        throw new Error('No reservations found for this group');
      }

      // Validate all reservations can be checked in
      for (const reservation of reservations) {
        if (reservation.status !== 'confirmed' && reservation.status !== 'pending') {
          throw new Error(`Cannot check in reservation ${reservation.id} with status ${reservation.status}`);
        }
      }

      const now = Timestamp.now();
      const batch = writeBatch(db);

      // Update all reservations and rooms
      for (const reservation of reservations) {
        // Update reservation status
        const reservationRef = doc(db, this.collectionName, reservation.id);
        batch.update(reservationRef, {
          status: 'checked-in',
          checkedInAt: now,
          updatedAt: now,
        });

        // Update room status to occupied
        const roomRef = doc(db, 'rooms', reservation.roomId);
        batch.update(roomRef, {
          status: 'occupied',
          updatedAt: now,
        });
      }

      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error checking in group:', error);
      throw error;
    }
  }

  /**
   * Check out all reservations in a group booking
   * Updates all reservations to checked-out status, marks rooms as dirty, and creates housekeeping tasks
   */
  async checkOutGroup(hotelId: string, groupId: string): Promise<void> {
    try {
      // Get all reservations in the group
      const reservations = await this.getGroupReservations(hotelId, groupId);

      if (reservations.length === 0) {
        throw new Error('No reservations found for this group');
      }

      // Validate all reservations can be checked out
      for (const reservation of reservations) {
        if (reservation.status !== 'checked-in') {
          throw new Error(`Cannot check out reservation ${reservation.id} with status ${reservation.status}`);
        }
      }

      const now = Timestamp.now();
      const batch = writeBatch(db);

      // Update all reservations, rooms, and create housekeeping tasks
      for (const reservation of reservations) {
        // Update reservation status
        const reservationRef = doc(db, this.collectionName, reservation.id);
        batch.update(reservationRef, {
          status: 'checked-out',
          checkedOutAt: now,
          updatedAt: now,
        });

        // Update room status to dirty
        const roomRef = doc(db, 'rooms', reservation.roomId);
        batch.update(roomRef, {
          status: 'dirty',
          updatedAt: now,
        });

        // Create housekeeping task
        const housekeepingRef = doc(collection(db, 'housekeepingTasks'));
        batch.set(housekeepingRef, {
          hotelId: reservation.hotelId,
          roomId: reservation.roomId,
          taskType: 'clean',
          priority: 'normal',
          status: 'pending',
          createdAt: now,
        });
      }

      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error checking out group:', error);
      throw error;
    }
  }

  /**
   * Cancel all reservations in a group booking
   * Updates all reservations to cancelled status
   */
  async cancelGroupBooking(hotelId: string, groupId: string): Promise<void> {
    try {
      // Get all reservations in the group
      const reservations = await this.getGroupReservations(hotelId, groupId);

      if (reservations.length === 0) {
        throw new Error('No reservations found for this group');
      }

      const now = Timestamp.now();
      const batch = writeBatch(db);

      // Update all reservations to cancelled
      for (const reservation of reservations) {
        const reservationRef = doc(db, this.collectionName, reservation.id);
        batch.update(reservationRef, {
          status: 'cancelled',
          updatedAt: now,
        });
      }

      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error cancelling group booking:', error);
      throw error;
    }
  }

  /**
   * Calculate total price for a group booking
   * Returns the sum of all individual reservation prices
   */
  async calculateGroupTotal(hotelId: string, groupId: string): Promise<number> {
    try {
      // Get all reservations in the group
      const reservations = await this.getGroupReservations(hotelId, groupId);

      if (reservations.length === 0) {
        return 0;
      }

      // Sum all totalPrice values
      const total = reservations.reduce((sum, reservation) => {
        return sum + (reservation.totalPrice || 0);
      }, 0);

      return total;
    } catch (error) {
      console.error('Error calculating group total:', error);
      throw new Error('Failed to calculate group total');
    }
  }
}

// Export singleton instance
export const reservationService = new ReservationService();
