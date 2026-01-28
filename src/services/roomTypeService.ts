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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { RoomType, CreateRoomTypeInput, SeasonalPricing } from '../types';

/**
 * Service class for managing room types in Firestore
 */
export class RoomTypeService {
  private collectionName = 'roomTypes';

  /**
   * Get all room types for a hotel
   */
  async getRoomTypes(hotelId: string): Promise<RoomType[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RoomType[];
    } catch (error) {
      console.error('Error getting room types:', error);
      throw new Error('Failed to fetch room types');
    }
  }

  /**
   * Get a single room type by ID
   */
  async getRoomTypeById(id: string): Promise<RoomType | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as RoomType;
    } catch (error) {
      console.error('Error getting room type:', error);
      throw new Error('Failed to fetch room type');
    }
  }

  /**
   * Create a new room type
   */
  async createRoomType(data: CreateRoomTypeInput): Promise<string> {
    try {
      // Validate required fields
      if (!data.name || !data.basePrice || !data.capacity) {
        throw new Error('Name, base price, and capacity are required');
      }

      // Validate seasonal pricing non-overlap
      if (data.seasonalPricing && data.seasonalPricing.length > 0) {
        this.validateSeasonalPricing(data.seasonalPricing);
      }

      const now = Timestamp.now();

      const roomTypeData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(
        collection(db, this.collectionName),
        roomTypeData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating room type:', error);
      throw error;
    }
  }

  /**
   * Update an existing room type
   */
  async updateRoomType(id: string, data: Partial<RoomType>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Room type not found');
      }

      // Validate seasonal pricing non-overlap if being updated
      if (data.seasonalPricing && data.seasonalPricing.length > 0) {
        this.validateSeasonalPricing(data.seasonalPricing);
      }

      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating room type:', error);
      throw error;
    }
  }

  /**
   * Delete a room type
   */
  async deleteRoomType(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Room type not found');
      }

      // Check if any rooms use this room type
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('roomTypeId', '==', id)
      );

      const roomsSnapshot = await getDocs(roomsQuery);

      if (!roomsSnapshot.empty) {
        throw new Error('Cannot delete room type that is assigned to rooms');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting room type:', error);
      throw error;
    }
  }

  /**
   * Validate that seasonal pricing periods do not overlap
   */
  private validateSeasonalPricing(seasonalPricing: SeasonalPricing[]): void {
    for (let i = 0; i < seasonalPricing.length; i++) {
      for (let j = i + 1; j < seasonalPricing.length; j++) {
        const period1 = seasonalPricing[i];
        const period2 = seasonalPricing[j];

        // Check if periods overlap
        // Overlap occurs if: start1 < end2 AND end1 > start2
        if (
          period1.startDate < period2.endDate &&
          period1.endDate > period2.startDate
        ) {
          throw new Error(
            `Seasonal pricing periods overlap: ${period1.startDate} to ${period1.endDate} and ${period2.startDate} to ${period2.endDate}`
          );
        }
      }
    }
  }

  /**
   * Calculate price for a specific date
   */
  calculatePriceForDate(roomType: RoomType, date: string): number {
    // Check seasonal pricing first
    if (roomType.seasonalPricing && roomType.seasonalPricing.length > 0) {
      const seasonalRate = roomType.seasonalPricing.find(
        (season) => date >= season.startDate && date <= season.endDate
      );

      if (seasonalRate) {
        return seasonalRate.price;
      }
    }

    // Check weekday pricing
    if (roomType.weekdayPricing) {
      const dateObj = new Date(date);
      const dayOfWeek = dateObj
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();

      const weekdayPrice =
        roomType.weekdayPricing[dayOfWeek as keyof typeof roomType.weekdayPricing];

      if (weekdayPrice !== undefined) {
        return weekdayPrice;
      }
    }

    // Return base price as fallback
    return roomType.basePrice;
  }

  /**
   * Calculate total price for a date range
   */
  calculatePriceForDateRange(
    roomType: RoomType,
    checkInDate: string,
    checkOutDate: string
  ): {
    nights: number;
    breakdown: Array<{ date: string; price: number }>;
    subtotal: number;
  } {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Calculate number of nights
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      throw new Error('Check-out date must be after check-in date');
    }

    const breakdown: Array<{ date: string; price: number }> = [];
    let subtotal = 0;

    // Calculate price for each night
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkIn);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const price = this.calculatePriceForDate(roomType, dateStr);
      breakdown.push({ date: dateStr, price });
      subtotal += price;
    }

    return { nights, breakdown, subtotal };
  }

  /**
   * Calculate total price with tax
   */
  calculateTotalPrice(
    roomType: RoomType,
    checkInDate: string,
    checkOutDate: string,
    taxRate: number
  ): {
    nights: number;
    breakdown: Array<{ date: string; price: number }>;
    subtotal: number;
    tax: number;
    total: number;
  } {
    const { nights, breakdown, subtotal } = this.calculatePriceForDateRange(
      roomType,
      checkInDate,
      checkOutDate
    );

    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return { nights, breakdown, subtotal, tax, total };
  }
}

// Export singleton instance
export const roomTypeService = new RoomTypeService();
