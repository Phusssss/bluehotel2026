import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { reservationService } from '../../../services/reservationService';
import type { Reservation, Room, Hotel, Customer, RoomType } from '../../../types';

/**
 * Feature: hotel-management-system, Reservation Property Tests
 * 
 * Property 15: Reservation Filtering Accuracy
 * Property 16: Reservation Creation with Correct Status
 * Property 17: Room Availability Validation
 * Property 18: Reservation Edit Restriction
 * Property 19: Reservation Cancellation Status Update
 * 
 * Validates: Requirements 6.2, 6.4, 6.5, 6.7, 6.8
 */
describe('Reservation Property Tests', () => {
  const testHotelIds: string[] = [];
  const testRoomIds: string[] = [];
  const testReservationIds: string[] = [];
  const testCustomerIds: string[] = [];
  const testRoomTypeIds: string[] = [];

  afterEach(async () => {
    // Cleanup test data
    for (const reservationId of testReservationIds) {
      try {
        await deleteDoc(doc(db, 'reservations', reservationId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    for (const roomId of testRoomIds) {
      try {
        await deleteDoc(doc(db, 'rooms', roomId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    for (const customerId of testCustomerIds) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    for (const roomTypeId of testRoomTypeIds) {
      try {
        await deleteDoc(doc(db, 'roomTypes', roomTypeId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    for (const hotelId of testHotelIds) {
      try {
        await deleteDoc(doc(db, 'hotels', hotelId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    testReservationIds.length = 0;
    testRoomIds.length = 0;
    testCustomerIds.length = 0;
    testRoomTypeIds.length = 0;
    testHotelIds.length = 0;
  });

  /**
   * Property 15: Reservation Filtering Accuracy
   * 
   * For any set of reservations and any combination of filters (date range, status, source, customer),
   * the getReservations method should return exactly the reservations that match ALL applied filters.
   * 
   * Validates: Requirements 6.2
   */
  it('Property 15: Reservation Filtering Accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: fc.uuid(),
          reservations: fc.array(
            fc.record({
              reservationId: fc.uuid(),
              customerId: fc.uuid(),
              roomId: fc.uuid(),
              checkInDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              checkOutDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              status: fc.constantFrom('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'),
              source: fc.constantFrom('direct', 'booking.com', 'airbnb', 'phone', 'walk-in'),
              totalPrice: fc.float({ min: 50, max: 1000, noNaN: true }),
            }),
            { minLength: 3, maxLength: 10 }
          ),
          filters: fc.record({
            startDate: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })),
            endDate: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })),
            status: fc.option(fc.constantFrom('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled')),
            source: fc.option(fc.constantFrom('direct', 'booking.com', 'airbnb', 'phone', 'walk-in')),
            customerId: fc.option(fc.uuid()),
          }),
        }),
        async (testData) => {
          const { hotelId, reservations, filters } = testData;
          
          // Track for cleanup
          testHotelIds.push(hotelId);

          // Create hotel document
          await setDoc(doc(db, 'hotels', hotelId), {
            name: 'Test Hotel',
            address: '123 Test St',
            phone: '+1234567890',
            email: 'test@hotel.com',
            checkInTime: '14:00',
            checkOutTime: '12:00',
            taxRate: 10,
            currency: 'USD',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Hotel);

          // Create reservation documents
          const expectedReservations: Reservation[] = [];
          
          for (const reservation of reservations) {
            const { reservationId, customerId, roomId, checkInDate, checkOutDate, status, source, totalPrice } = reservation;
            
            testReservationIds.push(reservationId);

            const checkInStr = checkInDate.toISOString().split('T')[0];
            const checkOutStr = checkOutDate.toISOString().split('T')[0];
            
            // Ensure check-out is after check-in
            if (checkOutStr <= checkInStr) continue;

            const reservationData: Reservation = {
              id: reservationId,
              hotelId: hotelId,
              confirmationNumber: `CONF-${reservationId.slice(0, 8)}`,
              customerId: customerId,
              roomId: roomId,
              roomTypeId: fc.sample(fc.uuid(), 1)[0],
              checkInDate: checkInStr,
              checkOutDate: checkOutStr,
              numberOfGuests: 2,
              status: status,
              source: source,
              totalPrice: totalPrice,
              paidAmount: 0,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            };

            await setDoc(doc(db, 'reservations', reservationId), reservationData);

            // Determine if this reservation should match the filters
            let shouldMatch = true;

            if (filters.startDate && checkInStr < filters.startDate.toISOString().split('T')[0]) {
              shouldMatch = false;
            }
            if (filters.endDate && checkOutStr > filters.endDate.toISOString().split('T')[0]) {
              shouldMatch = false;
            }
            if (filters.status && status !== filters.status) {
              shouldMatch = false;
            }
            if (filters.source && source !== filters.source) {
              shouldMatch = false;
            }
            if (filters.customerId && customerId !== filters.customerId) {
              shouldMatch = false;
            }

            if (shouldMatch) {
              expectedReservations.push(reservationData);
            }
          }

          // Act: Apply filters and get reservations
          const filterParams = {
            startDate: filters.startDate?.toISOString().split('T')[0],
            endDate: filters.endDate?.toISOString().split('T')[0],
            status: filters.status,
            source: filters.source,
            customerId: filters.customerId,
          };

          const actualReservations = await reservationService.getReservations(hotelId, filterParams);

          // Assert: Verify filtering accuracy
          expect(actualReservations.length).toBe(expectedReservations.length);
          
          // Check that all expected reservations are in the result
          for (const expected of expectedReservations) {
            const found = actualReservations.find(r => r.id === expected.id);
            expect(found).toBeDefined();
            expect(found?.status).toBe(expected.status);
            expect(found?.source).toBe(expected.source);
            expect(found?.customerId).toBe(expected.customerId);
          }
          
          // Check that no unexpected reservations are in the result
          for (const actual of actualReservations) {
            const expected = expectedReservations.find(r => r.id === actual.id);
            expect(expected).toBeDefined();
          }
        }
      ),
      { numRuns: 30 }
    );
  }, 120000);

  /**
   * Property 16: Reservation Creation with Correct Status
   * 
   * For any valid reservation data, creating a reservation should result in a reservation
   * with status 'pending' and a unique confirmation number.
   * 
   * Validates: Requirements 6.4
   */
  it('Property 16: Reservation Creation with Correct Status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: fc.uuid(),
          customerId: fc.uuid(),
          roomId: fc.uuid(),
          roomTypeId: fc.uuid(),
          checkInDate: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-08-31') }),
          checkOutDate: fc.date({ min: new Date('2024-09-01'), max: new Date('2024-12-31') }),
          numberOfGuests: fc.integer({ min: 1, max: 4 }),
          source: fc.constantFrom('direct', 'booking.com', 'airbnb', 'phone', 'walk-in'),
          totalPrice: fc.float({ min: 50, max: 1000, noNaN: true }),
        }),
        async (testData) => {
          const { hotelId, customerId, roomId, roomTypeId, checkInDate, checkOutDate, numberOfGuests, source, totalPrice } = testData;
          
          // Track for cleanup
          testHotelIds.push(hotelId);
          testRoomIds.push(roomId);
          testCustomerIds.push(customerId);
          testRoomTypeIds.push(roomTypeId);

          // Create required documents
          await setDoc(doc(db, 'hotels', hotelId), {
            name: 'Test Hotel',
            address: '123 Test St',
            phone: '+1234567890',
            email: 'test@hotel.com',
            checkInTime: '14:00',
            checkOutTime: '12:00',
            taxRate: 10,
            currency: 'USD',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Hotel);

          await setDoc(doc(db, 'rooms', roomId), {
            hotelId: hotelId,
            roomNumber: '101',
            roomTypeId: roomTypeId,
            floor: 1,
            status: 'vacant',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Room);

          await setDoc(doc(db, 'customers', customerId), {
            hotelId: hotelId,
            name: 'Test Customer',
            email: 'test@customer.com',
            phone: '+1234567890',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Customer);

          await setDoc(doc(db, 'roomTypes', roomTypeId), {
            hotelId: hotelId,
            name: 'Standard Room',
            description: { en: 'Standard room' },
            basePrice: 100,
            capacity: 2,
            amenities: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as RoomType);

          const checkInStr = checkInDate.toISOString().split('T')[0];
          const checkOutStr = checkOutDate.toISOString().split('T')[0];

          // Act: Create reservation
          const reservationId = await reservationService.createReservation({
            hotelId,
            customerId,
            roomId,
            roomTypeId,
            checkInDate: checkInStr,
            checkOutDate: checkOutStr,
            numberOfGuests,
            source,
            totalPrice,
            paidAmount: 0,
          });

          testReservationIds.push(reservationId);

          // Assert: Verify reservation was created with correct status
          const createdReservation = await reservationService.getReservationById(reservationId);
          
          expect(createdReservation).toBeDefined();
          expect(createdReservation!.status).toBe('pending');
          expect(createdReservation!.confirmationNumber).toBeDefined();
          expect(createdReservation!.confirmationNumber.length).toBeGreaterThan(0);
          expect(createdReservation!.hotelId).toBe(hotelId);
          expect(createdReservation!.customerId).toBe(customerId);
          expect(createdReservation!.roomId).toBe(roomId);
          expect(createdReservation!.checkInDate).toBe(checkInStr);
          expect(createdReservation!.checkOutDate).toBe(checkOutStr);
          expect(createdReservation!.totalPrice).toBe(totalPrice);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 17: Room Availability Validation
   * 
   * For any room and date range, if a reservation exists for that room with overlapping dates
   * and active status (pending, confirmed, checked-in), then checkRoomAvailability should return false.
   * If no overlapping reservations exist, it should return true.
   * 
   * Validates: Requirements 6.5
   */
  it('Property 17: Room Availability Validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: fc.uuid(),
          roomId: fc.uuid(),
          existingReservation: fc.record({
            checkInDate: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-08-31') }),
            checkOutDate: fc.date({ min: new Date('2024-09-01'), max: new Date('2024-12-31') }),
            status: fc.constantFrom('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'),
          }),
          newReservation: fc.record({
            checkInDate: fc.date({ min: new Date('2024-05-01'), max: new Date('2024-10-31') }),
            checkOutDate: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-11-30') }),
          }),
        }),
        async (testData) => {
          const { hotelId, roomId, existingReservation, newReservation } = testData;
          
          // Track for cleanup
          testHotelIds.push(hotelId);
          testRoomIds.push(roomId);

          // Create hotel and room
          await setDoc(doc(db, 'hotels', hotelId), {
            name: 'Test Hotel',
            address: '123 Test St',
            phone: '+1234567890',
            email: 'test@hotel.com',
            checkInTime: '14:00',
            checkOutTime: '12:00',
            taxRate: 10,
            currency: 'USD',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Hotel);

          await setDoc(doc(db, 'rooms', roomId), {
            hotelId: hotelId,
            roomNumber: '101',
            roomTypeId: fc.sample(fc.uuid(), 1)[0],
            floor: 1,
            status: 'vacant',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Room);

          const existingCheckIn = existingReservation.checkInDate.toISOString().split('T')[0];
          const existingCheckOut = existingReservation.checkOutDate.toISOString().split('T')[0];
          const newCheckIn = newReservation.checkInDate.toISOString().split('T')[0];
          const newCheckOut = newReservation.checkOutDate.toISOString().split('T')[0];

          // Ensure valid date ranges
          if (existingCheckOut <= existingCheckIn || newCheckOut <= newCheckIn) {
            return; // Skip invalid date ranges
          }

          // Create existing reservation
          const existingReservationId = fc.sample(fc.uuid(), 1)[0];
          testReservationIds.push(existingReservationId);

          await setDoc(doc(db, 'reservations', existingReservationId), {
            hotelId: hotelId,
            confirmationNumber: `CONF-${existingReservationId.slice(0, 8)}`,
            customerId: fc.sample(fc.uuid(), 1)[0],
            roomId: roomId,
            roomTypeId: fc.sample(fc.uuid(), 1)[0],
            checkInDate: existingCheckIn,
            checkOutDate: existingCheckOut,
            numberOfGuests: 2,
            status: existingReservation.status,
            source: 'direct',
            totalPrice: 100,
            paidAmount: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Reservation);

          // Act: Check availability for new reservation
          const isAvailable = await reservationService.checkRoomAvailability(
            hotelId,
            roomId,
            newCheckIn,
            newCheckOut
          );

          // Assert: Determine expected availability
          // Dates overlap if: newCheckIn < existingCheckOut AND newCheckOut > existingCheckIn
          const datesOverlap = newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
          const isActiveStatus = ['pending', 'confirmed', 'checked-in'].includes(existingReservation.status);
          
          const expectedAvailable = !(datesOverlap && isActiveStatus);
          
          expect(isAvailable).toBe(expectedAvailable);
        }
      ),
      { numRuns: 30 }
    );
  }, 120000);

  /**
   * Property 18: Reservation Edit Restriction
   * 
   * For any reservation, editing should only be allowed if the reservation status is 'pending' or 'confirmed'.
   * Reservations with status 'checked-in', 'checked-out', or 'cancelled' should not be editable.
   * 
   * Validates: Requirements 6.7
   */
  it('Property 18: Reservation Edit Restriction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: fc.uuid(),
          reservationId: fc.uuid(),
          status: fc.constantFrom('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'),
          updateData: fc.record({
            numberOfGuests: fc.integer({ min: 1, max: 4 }),
            totalPrice: fc.float({ min: 50, max: 1000, noNaN: true }),
          }),
        }),
        async (testData) => {
          const { hotelId, reservationId, status, updateData } = testData;
          
          // Track for cleanup
          testHotelIds.push(hotelId);
          testReservationIds.push(reservationId);

          // Create hotel
          await setDoc(doc(db, 'hotels', hotelId), {
            name: 'Test Hotel',
            address: '123 Test St',
            phone: '+1234567890',
            email: 'test@hotel.com',
            checkInTime: '14:00',
            checkOutTime: '12:00',
            taxRate: 10,
            currency: 'USD',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Hotel);

          // Create reservation with specific status
          await setDoc(doc(db, 'reservations', reservationId), {
            hotelId: hotelId,
            confirmationNumber: `CONF-${reservationId.slice(0, 8)}`,
            customerId: fc.sample(fc.uuid(), 1)[0],
            roomId: fc.sample(fc.uuid(), 1)[0],
            roomTypeId: fc.sample(fc.uuid(), 1)[0],
            checkInDate: '2024-07-01',
            checkOutDate: '2024-07-03',
            numberOfGuests: 2,
            status: status,
            source: 'direct',
            totalPrice: 100,
            paidAmount: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Reservation);

          // Act & Assert: Try to update reservation
          const canEdit = status === 'pending' || status === 'confirmed';
          
          if (canEdit) {
            // Should succeed
            await expect(
              reservationService.updateReservation(reservationId, updateData)
            ).resolves.not.toThrow();
            
            // Verify the update was applied
            const updatedReservation = await reservationService.getReservationById(reservationId);
            expect(updatedReservation?.numberOfGuests).toBe(updateData.numberOfGuests);
            expect(updatedReservation?.totalPrice).toBe(updateData.totalPrice);
          } else {
            // Should fail
            await expect(
              reservationService.updateReservation(reservationId, updateData)
            ).rejects.toThrow();
          }
        }
      ),
      { numRuns: 25 }
    );
  }, 120000);

  /**
   * Property 19: Reservation Cancellation Status Update
   * 
   * For any reservation that exists, calling cancelReservation should update the status to 'cancelled'
   * regardless of the current status.
   * 
   * Validates: Requirements 6.8
   */
  it('Property 19: Reservation Cancellation Status Update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: fc.uuid(),
          reservationId: fc.uuid(),
          initialStatus: fc.constantFrom('pending', 'confirmed', 'checked-in', 'checked-out'),
        }),
        async (testData) => {
          const { hotelId, reservationId, initialStatus } = testData;
          
          // Track for cleanup
          testHotelIds.push(hotelId);
          testReservationIds.push(reservationId);

          // Create hotel
          await setDoc(doc(db, 'hotels', hotelId), {
            name: 'Test Hotel',
            address: '123 Test St',
            phone: '+1234567890',
            email: 'test@hotel.com',
            checkInTime: '14:00',
            checkOutTime: '12:00',
            taxRate: 10,
            currency: 'USD',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Hotel);

          // Create reservation with initial status
          await setDoc(doc(db, 'reservations', reservationId), {
            hotelId: hotelId,
            confirmationNumber: `CONF-${reservationId.slice(0, 8)}`,
            customerId: fc.sample(fc.uuid(), 1)[0],
            roomId: fc.sample(fc.uuid(), 1)[0],
            roomTypeId: fc.sample(fc.uuid(), 1)[0],
            checkInDate: '2024-07-01',
            checkOutDate: '2024-07-03',
            numberOfGuests: 2,
            status: initialStatus,
            source: 'direct',
            totalPrice: 100,
            paidAmount: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Reservation);

          // Act: Cancel the reservation
          await reservationService.cancelReservation(reservationId);

          // Assert: Verify status was updated to cancelled
          const cancelledReservation = await reservationService.getReservationById(reservationId);
          
          expect(cancelledReservation).toBeDefined();
          expect(cancelledReservation!.status).toBe('cancelled');
          
          // Verify other fields remain unchanged
          expect(cancelledReservation!.hotelId).toBe(hotelId);
          expect(cancelledReservation!.checkInDate).toBe('2024-07-01');
          expect(cancelledReservation!.checkOutDate).toBe('2024-07-03');
          expect(cancelledReservation!.totalPrice).toBe(100);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});