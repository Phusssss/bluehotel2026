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
import { dashboardService } from '../../../services/dashboardService';
import type { Room, Reservation, ServiceOrder } from '../../../types';

/**
 * Feature: hotel-management-system, Dashboard Property Tests
 * 
 * Property 13: Dashboard Occupancy Calculation
 * Property 14: Dashboard Revenue Calculation
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */
describe('Dashboard Property Tests', () => {
  const testHotelIds: string[] = [];
  const testRoomIds: string[] = [];
  const testReservationIds: string[] = [];
  const testServiceOrderIds: string[] = [];

  afterEach(async () => {
    // Clear service cache
    dashboardService.clearAllCache();
    
    // Cleanup test data
    for (const serviceOrderId of testServiceOrderIds) {
      try {
        await deleteDoc(doc(db, 'serviceOrders', serviceOrderId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
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
    
    for (const hotelId of testHotelIds) {
      try {
        await deleteDoc(doc(db, 'hotels', hotelId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    testServiceOrderIds.length = 0;
    testReservationIds.length = 0;
    testRoomIds.length = 0;
    testHotelIds.length = 0;
  });

  /**
   * Property 13: Dashboard Occupancy Calculation
   * 
   * For any hotel with rooms and reservations, the occupancy percentage should be:
   * - occupancyToday = (number of rooms with checked-in reservations for today / total rooms) * 100
   * - occupancyThisWeek = (number of rooms with checked-in reservations this week / total rooms) * 100
   * - The calculation should handle edge cases (no rooms, no reservations)
   * 
   * Validates: Requirements 5.1, 5.2
   */
  it('Property 13: Dashboard Occupancy Calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: fc.uuid(),
          rooms: fc.array(
            fc.record({
              roomId: fc.uuid(),
              roomNumber: fc.string({ minLength: 1, maxLength: 10 }),
              roomTypeId: fc.uuid(),
              floor: fc.integer({ min: 1, max: 20 }),
              status: fc.constantFrom('vacant', 'occupied', 'dirty', 'maintenance'),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          reservations: fc.array(
            fc.record({
              reservationId: fc.uuid(),
              customerId: fc.uuid(),
              roomId: fc.uuid(),
              checkInDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              checkOutDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              status: fc.constantFrom('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'),
              totalPrice: fc.float({ min: 50, max: 1000, noNaN: true }),
            }),
            { minLength: 0, maxLength: 15 }
          ),
        }),
        async (testData) => {
          const { hotelId, rooms, reservations } = testData;
          
          // Track for cleanup
          testHotelIds.push(hotelId);

          // Create hotel document
          const hotelDocRef = doc(db, 'hotels', hotelId);
          await setDoc(hotelDocRef, {
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
          });

          // Create room documents
          const roomIds = new Set<string>();
          for (const room of rooms) {
            const { roomId, roomNumber, roomTypeId, floor, status } = room;
            
            testRoomIds.push(roomId);
            roomIds.add(roomId);

            const roomDocRef = doc(db, 'rooms', roomId);
            await setDoc(roomDocRef, {
              hotelId: hotelId,
              roomNumber: roomNumber,
              roomTypeId: roomTypeId,
              floor: floor,
              status: status,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            } as Room);
          }

          // Get today's date and week start for calculations
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          const dayOfWeek = today.getDay();
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
          const monday = new Date(today);
          monday.setDate(today.getDate() + diff);
          const weekStartStr = monday.toISOString().split('T')[0];

          // Create reservation documents and calculate expected occupancy
          let expectedOccupiedToday = 0;
          let expectedOccupiedThisWeek = 0;
          
          for (const reservation of reservations) {
            const { reservationId, customerId, roomId, checkInDate, checkOutDate, status, totalPrice } = reservation;
            
            // Only use rooms that exist in our test data
            if (!roomIds.has(roomId)) continue;
            
            testReservationIds.push(reservationId);

            const checkInStr = checkInDate.toISOString().split('T')[0];
            const checkOutStr = checkOutDate.toISOString().split('T')[0];
            
            // Ensure check-out is after check-in
            if (checkOutStr <= checkInStr) continue;

            const reservationDocRef = doc(db, 'reservations', reservationId);
            await setDoc(reservationDocRef, {
              hotelId: hotelId,
              confirmationNumber: `CONF-${reservationId.slice(0, 8)}`,
              customerId: customerId,
              roomId: roomId,
              roomTypeId: fc.sample(fc.uuid(), 1)[0],
              checkInDate: checkInStr,
              checkOutDate: checkOutStr,
              numberOfGuests: 2,
              status: status,
              source: 'direct',
              totalPrice: totalPrice,
              paidAmount: 0,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            } as Reservation);

            // Calculate expected occupancy for checked-in reservations
            if (status === 'checked-in') {
              // For today: check-in <= today < check-out
              if (checkInStr <= todayStr && checkOutStr > todayStr) {
                expectedOccupiedToday++;
              }
              
              // For this week: check-in <= today and check-out >= week start
              if (checkInStr <= todayStr && checkOutStr >= weekStartStr) {
                expectedOccupiedThisWeek++;
              }
            }
          }

          // Act: Get dashboard metrics
          const metrics = await dashboardService.getDashboardMetrics(hotelId);

          // Assert: Verify occupancy calculations
          const totalRooms = rooms.length;
          const expectedOccupancyToday = totalRooms > 0 ? (expectedOccupiedToday / totalRooms) * 100 : 0;
          const expectedOccupancyThisWeek = totalRooms > 0 ? (expectedOccupiedThisWeek / totalRooms) * 100 : 0;

          // Verify total rooms count
          expect(metrics.totalRooms).toBe(totalRooms);
          
          // Verify occupancy calculations (allow small floating point differences)
          expect(Math.abs(metrics.occupancyToday - expectedOccupancyToday)).toBeLessThan(0.01);
          expect(Math.abs(metrics.occupancyThisWeek - expectedOccupancyThisWeek)).toBeLessThan(0.01);
          
          // Verify occupancy is within valid range
          expect(metrics.occupancyToday).toBeGreaterThanOrEqual(0);
          expect(metrics.occupancyToday).toBeLessThanOrEqual(100);
          expect(metrics.occupancyThisWeek).toBeGreaterThanOrEqual(0);
          expect(metrics.occupancyThisWeek).toBeLessThanOrEqual(100);
          
          // Verify room status counts
          const expectedDirtyRooms = rooms.filter(r => r.status === 'dirty').length;
          const expectedMaintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
          const expectedOccupiedRooms = rooms.filter(r => r.status === 'occupied').length;
          const expectedAvailableRooms = rooms.filter(r => r.status === 'vacant').length;
          
          expect(metrics.dirtyRoomsCount).toBe(expectedDirtyRooms);
          expect(metrics.maintenanceRoomsCount).toBe(expectedMaintenanceRooms);
          expect(metrics.occupiedRooms).toBe(expectedOccupiedRooms);
          expect(metrics.availableRooms).toBe(expectedAvailableRooms);
        }
      ),
      { numRuns: 50 } // Reduced runs for performance
    );
  }, 120000); // 2 minute timeout for property test

  /**
   * Property 14: Dashboard Revenue Calculation
   * 
   * For any hotel with reservations and service orders, the revenue should be:
   * - revenueToday = sum of totalPrice from checked-in/checked-out reservations with checkInDate = today
   *                  + sum of totalPrice from completed service orders with orderedAt = today
   * - revenueThisMonth = sum of totalPrice from checked-in/checked-out reservations with checkInDate >= month start
   *                      + sum of totalPrice from completed service orders with orderedAt >= month start
   * 
   * Validates: Requirements 5.3, 5.4
   */
  it('Property 14: Dashboard Revenue Calculation', async () => {
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
              status: fc.constantFrom('checked-in', 'checked-out', 'pending', 'confirmed', 'cancelled'),
              totalPrice: fc.float({ min: 50, max: 1000, noNaN: true }),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          serviceOrders: fc.array(
            fc.record({
              serviceOrderId: fc.uuid(),
              reservationId: fc.uuid(),
              serviceId: fc.uuid(),
              orderedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              totalPrice: fc.float({ min: 10, max: 200, noNaN: true }),
              status: fc.constantFrom('completed', 'pending', 'cancelled'),
            }),
            { minLength: 0, maxLength: 8 }
          ),
        }),
        async (testData) => {
          const { hotelId, reservations, serviceOrders } = testData;
          
          // Track for cleanup
          testHotelIds.push(hotelId);

          // Create hotel document
          const hotelDocRef = doc(db, 'hotels', hotelId);
          await setDoc(hotelDocRef, {
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
          });

          // Get today's date and month start for calculations
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

          // Create reservation documents and calculate expected revenue
          let expectedRevenueToday = 0;
          let expectedRevenueThisMonth = 0;
          
          for (const reservation of reservations) {
            const { reservationId, customerId, roomId, checkInDate, status, totalPrice } = reservation;
            
            testReservationIds.push(reservationId);

            const checkInStr = checkInDate.toISOString().split('T')[0];

            const reservationDocRef = doc(db, 'reservations', reservationId);
            await setDoc(reservationDocRef, {
              hotelId: hotelId,
              confirmationNumber: `CONF-${reservationId.slice(0, 8)}`,
              customerId: customerId,
              roomId: roomId,
              roomTypeId: fc.sample(fc.uuid(), 1)[0],
              checkInDate: checkInStr,
              checkOutDate: checkInDate.toISOString().split('T')[0], // Same day for simplicity
              numberOfGuests: 2,
              status: status,
              source: 'direct',
              totalPrice: totalPrice,
              paidAmount: 0,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            } as Reservation);

            // Calculate expected revenue for checked-in/checked-out reservations
            if (status === 'checked-in' || status === 'checked-out') {
              if (checkInStr === todayStr) {
                expectedRevenueToday += totalPrice;
              }
              if (checkInStr >= monthStartStr) {
                expectedRevenueThisMonth += totalPrice;
              }
            }
          }

          // Create service order documents and add to expected revenue
          for (const serviceOrder of serviceOrders) {
            const { serviceOrderId, reservationId, serviceId, orderedAt, totalPrice, status } = serviceOrder;
            
            testServiceOrderIds.push(serviceOrderId);

            const orderedAtStr = orderedAt.toISOString().split('T')[0];

            const serviceOrderDocRef = doc(db, 'serviceOrders', serviceOrderId);
            await setDoc(serviceOrderDocRef, {
              hotelId: hotelId,
              reservationId: reservationId,
              serviceId: serviceId,
              quantity: 1,
              unitPrice: totalPrice,
              totalPrice: totalPrice,
              status: status,
              orderedAt: Timestamp.fromDate(orderedAt),
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            } as ServiceOrder);

            // Calculate expected revenue for completed service orders
            if (status === 'completed') {
              if (orderedAtStr === todayStr) {
                expectedRevenueToday += totalPrice;
              }
              if (orderedAtStr >= monthStartStr) {
                expectedRevenueThisMonth += totalPrice;
              }
            }
          }

          // Act: Get dashboard metrics
          const metrics = await dashboardService.getDashboardMetrics(hotelId);

          // Assert: Verify revenue calculations (allow small floating point differences)
          expect(Math.abs(metrics.revenueToday - expectedRevenueToday)).toBeLessThan(0.01);
          expect(Math.abs(metrics.revenueThisMonth - expectedRevenueThisMonth)).toBeLessThan(0.01);
          
          // Verify revenue is non-negative
          expect(metrics.revenueToday).toBeGreaterThanOrEqual(0);
          expect(metrics.revenueThisMonth).toBeGreaterThanOrEqual(0);
          
          // Verify monthly revenue is at least as much as today's revenue
          expect(metrics.revenueThisMonth).toBeGreaterThanOrEqual(metrics.revenueToday);
        }
      ),
      { numRuns: 50 } // Reduced runs for performance
    );
  }, 120000); // 2 minute timeout for property test
});