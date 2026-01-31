import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDocs, getDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { reservationService } from '../../../services/reservationService';
import type { Reservation, Room, Hotel, Customer, RoomType } from '../../../types';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

vi.mock('../../../config/firebase', () => ({
  db: {},
}));

vi.mock('../../../utils/firestore', () => ({
  deepRemoveUndefinedFields: vi.fn((obj) => obj),
}));

/**
 * Reservation Unit Tests - Edge Cases
 * 
 * Tests edge cases for reservation operations including:
 * - Same-day check-in/check-out
 * - Long-term reservations
 * - Group bookings
 * - Boundary conditions and error scenarios
 * 
 * Validates: Requirements 6.9
 */
describe('Reservation Unit Tests - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test same-day check-in/check-out scenarios
   * Should handle reservations where check-in and check-out are on the same day
   */
  describe('Same-day check-in/check-out', () => {
    it('should create same-day reservation successfully', async () => {
      const hotelId = 'test-hotel';
      const roomId = 'test-room';
      const customerId = 'test-customer';
      const roomTypeId = 'test-room-type';
      const today = '2024-07-15';

      // Mock room availability check (no conflicting reservations)
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [], // No existing reservations
      } as any);

      // Mock successful reservation creation
      vi.mocked(addDoc).mockResolvedValueOnce({
        id: 'new-reservation-id',
      } as any);

      // Act
      const reservationId = await reservationService.createReservation({
        hotelId,
        customerId,
        roomId,
        roomTypeId,
        checkInDate: today,
        checkOutDate: today, // Same day
        numberOfGuests: 2,
        source: 'direct',
        totalPrice: 150,
        paidAmount: 0,
      });

      // Assert
      expect(reservationId).toBe('new-reservation-id');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          checkInDate: today,
          checkOutDate: today,
          status: 'pending',
        })
      );
    });

    it('should reject same-day reservation with invalid date order', async () => {
      const hotelId = 'test-hotel';
      const roomId = 'test-room';
      const customerId = 'test-customer';
      const roomTypeId = 'test-room-type';

      // Act & Assert - should throw error for invalid date order
      await expect(
        reservationService.createReservation({
          hotelId,
          customerId,
          roomId,
          roomTypeId,
          checkInDate: '2024-07-15',
          checkOutDate: '2024-07-14', // Before check-in
          numberOfGuests: 2,
          source: 'direct',
          totalPrice: 150,
          paidAmount: 0,
        })
      ).rejects.toThrow('Check-out date must be after check-in date');

      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should handle same-day availability check correctly', async () => {
      const hotelId = 'test-hotel';
      const roomId = 'test-room';
      const checkInDate = '2024-07-15';
      const checkOutDate = '2024-07-15';

      // Mock existing same-day reservation
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'existing-reservation',
            data: () => ({
              hotelId,
              roomId,
              checkInDate: '2024-07-15',
              checkOutDate: '2024-07-15',
              status: 'confirmed',
            }),
          },
        ],
      } as any);

      // Act
      const isAvailable = await reservationService.checkRoomAvailability(
        hotelId,
        roomId,
        checkInDate,
        checkOutDate
      );

      // Assert - should not be available due to same-day conflict
      expect(isAvailable).toBe(false);
    });

    it('should allow same-day reservations with different time slots (edge case)', async () => {
      const hotelId = 'test-hotel';
      const roomId = 'test-room';
      const date = '2024-07-15';

      // Mock existing reservation that checks out same day
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'morning-reservation',
            data: () => ({
              hotelId,
              roomId,
              checkInDate: '2024-07-14',
              checkOutDate: '2024-07-15', // Checks out today
              status: 'checked-in',
            }),
          },
        ],
      } as any);

      // Act - try to book same room for same day (new check-in)
      const isAvailable = await reservationService.checkRoomAvailability(
        hotelId,
        roomId,
        date,
        date
      );

      // Assert - should not be available (overlapping dates)
      expect(isAvailable).toBe(false);
    });
  });

  /**
   * Test long-term reservations (stays longer than 30 days)
   */
  describe('Long-term reservations', () => {
    it('should create long-term reservation successfully', async () => {
      const hotelId = 'test-hotel';
      const roomId = 'test-room';
      const customerId = 'test-customer';
      const roomTypeId = 'test-room-type';

      // Mock room availability check (no conflicting reservations)
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [], // No existing reservations
      } as any);

      // Mock successful reservation creation
      vi.mocked(addDoc).mockResolvedValueOnce({
        id: 'long-term-reservation-id',
      } as any);

      // Act - 60-day reservation
      const reservationId = await reservationService.createReservation({
        hotelId,
        customerId,
        roomId,
        roomTypeId,
        checkInDate: '2024-07-01',
        checkOutDate: '2024-08-30', // 60 days
        numberOfGuests: 2,
        source: 'direct',
        totalPrice: 6000, // Higher price for long stay
        paidAmount: 0,
      });

      // Assert
      expect(reservationId).toBe('long-term-reservation-id');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          checkInDate: '2024-07-01',
          checkOutDate: '2024-08-30',
          totalPrice: 6000,
          status: 'pending',
        })
      );
    });

    it('should handle long-term availability check with partial overlaps', async () => {
      const hotelId = 'test-hotel';
      const roomId = 'test-room';

      // Mock existing short-term reservation in the middle of long-term period
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'short-term-reservation',
            data: () => ({
              hotelId,
              roomId,
              checkInDate: '2024-07-15',
              checkOutDate: '2024-07-20', // 5-day stay in middle
              status: 'confirmed',
            }),
          },
        ],
      } as any);

      // Act - try to book long-term that overlaps
      const isAvailable = await reservationService.checkRoomAvailability(
        hotelId,
        roomId,
        '2024-07-01', // Long-term start
        '2024-08-30'  // Long-term end
      );

      // Assert - should not be available due to overlap
      expect(isAvailable).toBe(false);
    });

    it('should allow long-term reservation with adjacent bookings', async () => {
      const hotelId = 'test-hotel';
      const roomId = 'test-room';

      // Mock existing reservations that don't overlap
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'before-reservation',
            data: () => ({
              hotelId,
              roomId,
              checkInDate: '2024-06-25',
              checkOutDate: '2024-07-01', // Ends exactly when long-term starts
              status: 'confirmed',
            }),
          },
          {
            id: 'after-reservation',
            data: () => ({
              hotelId,
              roomId,
              checkInDate: '2024-08-30', // Starts exactly when long-term ends
              checkOutDate: '2024-09-05',
              status: 'pending',
            }),
          },
        ],
      } as any);

      // Act - long-term reservation between existing bookings
      const isAvailable = await reservationService.checkRoomAvailability(
        hotelId,
        roomId,
        '2024-07-01',
        '2024-08-30'
      );

      // Assert - should be available (no overlap, just adjacent)
      expect(isAvailable).toBe(true);
    });

    it('should handle long-term reservation updates correctly', async () => {
      const reservationId = 'long-term-reservation';
      const hotelId = 'test-hotel';

      // Mock existing long-term reservation
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: reservationId,
          hotelId,
          roomId: 'test-room',
          checkInDate: '2024-07-01',
          checkOutDate: '2024-08-30',
          status: 'confirmed',
          totalPrice: 6000,
        }),
      } as any);

      // Mock availability check for updated dates
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [], // No conflicts
      } as any);

      // Mock successful update
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined);

      // Act - extend the long-term reservation
      await reservationService.updateReservation(reservationId, {
        checkOutDate: '2024-09-15', // Extend by 2 weeks
        totalPrice: 7000, // Updated price
      });

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          checkOutDate: '2024-09-15',
          totalPrice: 7000,
        })
      );
    });
  });

  /**
   * Test group booking edge cases
   */
  describe('Group bookings', () => {
    it('should create group booking with multiple rooms successfully', async () => {
      const hotelId = 'test-hotel';
      const customerId = 'test-customer';

      // Mock availability checks for all rooms
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: [] } as any) // Room 1 available
        .mockResolvedValueOnce({ docs: [] } as any) // Room 2 available
        .mockResolvedValueOnce({ docs: [] } as any); // Room 3 available

      // Mock batch write
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      // Mock crypto.randomUUID
      const mockGroupId = 'group-uuid-123';
      global.crypto = {
        randomUUID: vi.fn(() => mockGroupId),
      } as any;

      // Act
      const groupId = await reservationService.createGroupBooking({
        hotelId,
        customerId,
        checkInDate: '2024-07-15',
        checkOutDate: '2024-07-17',
        source: 'direct',
        reservations: [
          {
            roomId: 'room-1',
            roomTypeId: 'standard',
            numberOfGuests: 2,
            totalPrice: 200,
          },
          {
            roomId: 'room-2',
            roomTypeId: 'standard',
            numberOfGuests: 2,
            totalPrice: 200,
          },
          {
            roomId: 'room-3',
            roomTypeId: 'deluxe',
            numberOfGuests: 3,
            totalPrice: 300,
          },
        ],
      });

      // Assert
      expect(groupId).toBe(mockGroupId);
      expect(mockBatch.set).toHaveBeenCalledTimes(3); // 3 reservations
      expect(mockBatch.commit).toHaveBeenCalledOnce();

      // Verify each reservation has correct group metadata
      const setCalls = mockBatch.set.mock.calls;
      setCalls.forEach((call, index) => {
        const reservationData = call[1];
        expect(reservationData.isGroupBooking).toBe(true);
        expect(reservationData.groupId).toBe(mockGroupId);
        expect(reservationData.groupSize).toBe(3);
        expect(reservationData.groupIndex).toBe(index + 1);
      });
    });

    it('should reject group booking if any room is unavailable', async () => {
      const hotelId = 'test-hotel';
      const customerId = 'test-customer';

      // Mock availability checks - second room is unavailable
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ docs: [] } as any) // Room 1 available
        .mockResolvedValueOnce({ // Room 2 unavailable
          docs: [
            {
              id: 'conflicting-reservation',
              data: () => ({
                hotelId,
                roomId: 'room-2',
                checkInDate: '2024-07-15',
                checkOutDate: '2024-07-17',
                status: 'confirmed',
              }),
            },
          ],
        } as any);

      // Act & Assert
      await expect(
        reservationService.createGroupBooking({
          hotelId,
          customerId,
          checkInDate: '2024-07-15',
          checkOutDate: '2024-07-17',
          source: 'direct',
          reservations: [
            {
              roomId: 'room-1',
              roomTypeId: 'standard',
              numberOfGuests: 2,
              totalPrice: 200,
            },
            {
              roomId: 'room-2', // This room is unavailable
              roomTypeId: 'standard',
              numberOfGuests: 2,
              totalPrice: 200,
            },
          ],
        })
      ).rejects.toThrow('Room room-2 is not available for the selected dates');

      // Verify no batch operations were performed
      expect(writeBatch).not.toHaveBeenCalled();
    });

    it('should handle group check-in atomically', async () => {
      const hotelId = 'test-hotel';
      const groupId = 'test-group-id';

      // Mock group reservations
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'reservation-1',
            data: () => ({
              id: 'reservation-1',
              hotelId,
              groupId,
              roomId: 'room-1',
              status: 'confirmed',
              groupIndex: 1,
            }),
          },
          {
            id: 'reservation-2',
            data: () => ({
              id: 'reservation-2',
              hotelId,
              groupId,
              roomId: 'room-2',
              status: 'confirmed',
              groupIndex: 2,
            }),
          },
        ],
      } as any);

      // Mock batch write
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      // Act
      await reservationService.checkInGroup(hotelId, groupId);

      // Assert
      expect(mockBatch.update).toHaveBeenCalledTimes(4); // 2 reservations + 2 rooms
      expect(mockBatch.commit).toHaveBeenCalledOnce();

      // Verify reservation updates
      const updateCalls = mockBatch.update.mock.calls;
      expect(updateCalls[0][1]).toEqual(
        expect.objectContaining({
          status: 'checked-in',
          checkedInAt: expect.anything(),
        })
      );
      expect(updateCalls[1][1]).toEqual(
        expect.objectContaining({
          status: 'occupied',
        })
      );
    });

    it('should calculate group total correctly', async () => {
      const hotelId = 'test-hotel';
      const groupId = 'test-group-id';

      // Mock group reservations with different prices
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'reservation-1',
            data: () => ({
              id: 'reservation-1',
              hotelId,
              groupId,
              totalPrice: 200,
              groupIndex: 1,
            }),
          },
          {
            id: 'reservation-2',
            data: () => ({
              id: 'reservation-2',
              hotelId,
              groupId,
              totalPrice: 300,
              groupIndex: 2,
            }),
          },
          {
            id: 'reservation-3',
            data: () => ({
              id: 'reservation-3',
              hotelId,
              groupId,
              totalPrice: 250,
              groupIndex: 3,
            }),
          },
        ],
      } as any);

      // Act
      const total = await reservationService.calculateGroupTotal(hotelId, groupId);

      // Assert
      expect(total).toBe(750); // 200 + 300 + 250
    });

    it('should handle empty group booking gracefully', async () => {
      const hotelId = 'test-hotel';
      const customerId = 'test-customer';

      // Act & Assert
      await expect(
        reservationService.createGroupBooking({
          hotelId,
          customerId,
          checkInDate: '2024-07-15',
          checkOutDate: '2024-07-17',
          source: 'direct',
          reservations: [], // Empty reservations array
        })
      ).rejects.toThrow('Group booking must have at least one reservation');
    });

    it('should handle group cancellation atomically', async () => {
      const hotelId = 'test-hotel';
      const groupId = 'test-group-id';

      // Mock group reservations
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'reservation-1',
            data: () => ({
              id: 'reservation-1',
              hotelId,
              groupId,
              status: 'confirmed',
            }),
          },
          {
            id: 'reservation-2',
            data: () => ({
              id: 'reservation-2',
              hotelId,
              groupId,
              status: 'pending',
            }),
          },
        ],
      } as any);

      // Mock batch write
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      // Act
      await reservationService.cancelGroupBooking(hotelId, groupId);

      // Assert
      expect(mockBatch.update).toHaveBeenCalledTimes(2); // 2 reservations
      expect(mockBatch.commit).toHaveBeenCalledOnce();

      // Verify all reservations are cancelled
      const updateCalls = mockBatch.update.mock.calls;
      updateCalls.forEach((call) => {
        expect(call[1]).toEqual(
          expect.objectContaining({
            status: 'cancelled',
          })
        );
      });
    });
  });

  /**
   * Test boundary conditions and error scenarios
   */
  describe('Boundary conditions and error scenarios', () => {
    it('should handle reservation with zero guests', async () => {
      const hotelId = 'test-hotel';

      // Mock room availability
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'reservation-id' } as any);

      // Act & Assert - should handle zero guests gracefully
      const reservationId = await reservationService.createReservation({
        hotelId,
        customerId: 'customer-id',
        roomId: 'room-id',
        roomTypeId: 'room-type-id',
        checkInDate: '2024-07-15',
        checkOutDate: '2024-07-16',
        numberOfGuests: 0, // Edge case: zero guests
        source: 'direct',
        totalPrice: 100,
        paidAmount: 0,
      });

      expect(reservationId).toBe('reservation-id');
    });

    it('should handle reservation with very high guest count', async () => {
      const hotelId = 'test-hotel';

      // Mock room availability
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'reservation-id' } as any);

      // Act
      const reservationId = await reservationService.createReservation({
        hotelId,
        customerId: 'customer-id',
        roomId: 'room-id',
        roomTypeId: 'room-type-id',
        checkInDate: '2024-07-15',
        checkOutDate: '2024-07-16',
        numberOfGuests: 50, // Edge case: very high guest count
        source: 'direct',
        totalPrice: 1000,
        paidAmount: 0,
      });

      expect(reservationId).toBe('reservation-id');
    });

    it('should handle reservation with zero price', async () => {
      const hotelId = 'test-hotel';

      // Mock room availability
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);
      vi.mocked(addDoc).mockResolvedValueOnce({ id: 'reservation-id' } as any);

      // Act
      const reservationId = await reservationService.createReservation({
        hotelId,
        customerId: 'customer-id',
        roomId: 'room-id',
        roomTypeId: 'room-type-id',
        checkInDate: '2024-07-15',
        checkOutDate: '2024-07-16',
        numberOfGuests: 2,
        source: 'direct',
        totalPrice: 0, // Edge case: zero price (comp room)
        paidAmount: 0,
      });

      expect(reservationId).toBe('reservation-id');
    });

    it('should handle Firestore errors gracefully', async () => {
      const hotelId = 'test-hotel';

      // Mock Firestore error
      const firestoreError = new Error('Firestore connection failed');
      vi.mocked(getDocs).mockRejectedValueOnce(firestoreError);

      // Act & Assert
      await expect(
        reservationService.checkRoomAvailability(hotelId, 'room-id', '2024-07-15', '2024-07-16')
      ).rejects.toThrow('Failed to check room availability');
    });

    it('should handle non-existent reservation updates', async () => {
      const reservationId = 'non-existent-reservation';

      // Mock non-existent reservation
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      // Act & Assert
      await expect(
        reservationService.updateReservation(reservationId, { numberOfGuests: 3 })
      ).rejects.toThrow('Reservation not found');
    });
  });
});