import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDocs } from 'firebase/firestore';
import { dashboardService } from '../../../services/dashboardService';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('../../../config/firebase', () => ({
  db: {},
}));

/**
 * Dashboard Unit Tests - Edge Cases
 * 
 * Tests edge cases for dashboard calculations including:
 * - No reservations
 * - No rooms
 * - Empty collections
 * - Invalid data scenarios
 * 
 * Validates: Requirements 5.1-5.9
 */
describe('Dashboard Unit Tests - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear service cache before each test
    dashboardService.clearAllCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test with no reservations
   * Should return zero values for reservation-related metrics
   */
  it('should handle hotel with no reservations', async () => {
    const hotelId = 'test-hotel-no-reservations';
    
    // Mock Firestore responses
    const mockRoomsSnapshot = {
      docs: [
        {
          id: 'room1',
          data: () => ({
            hotelId,
            roomNumber: '101',
            roomTypeId: 'standard',
            floor: 1,
            status: 'vacant',
          }),
        },
        {
          id: 'room2',
          data: () => ({
            hotelId,
            roomNumber: '102',
            roomTypeId: 'standard',
            floor: 1,
            status: 'dirty',
          }),
        },
        {
          id: 'room3',
          data: () => ({
            hotelId,
            roomNumber: '103',
            roomTypeId: 'deluxe',
            floor: 1,
            status: 'maintenance',
          }),
        },
      ],
    };

    const mockReservationsSnapshot = {
      docs: [], // No reservations
    };

    const mockServiceOrdersSnapshot = {
      docs: [], // No service orders
    };

    vi.mocked(getDocs).mockImplementation((query) => {
      // Determine which collection is being queried based on call order
      const callCount = vi.mocked(getDocs).mock.calls.length;
      if (callCount === 1) return Promise.resolve(mockRoomsSnapshot as any);
      if (callCount === 2) return Promise.resolve(mockReservationsSnapshot as any);
      if (callCount === 3) return Promise.resolve(mockServiceOrdersSnapshot as any);
      return Promise.resolve({ docs: [] } as any);
    });

    // Act
    const metrics = await dashboardService.getDashboardMetrics(hotelId);

    // Assert
    expect(metrics).toEqual({
      // Occupancy should be 0 with no reservations
      occupancyToday: 0,
      occupancyThisWeek: 0,
      
      // Revenue should be 0 with no reservations or service orders
      revenueToday: 0,
      revenueThisMonth: 0,
      
      // Check-ins/outs should be 0 with no reservations
      checkInsToday: 0,
      checkOutsToday: 0,
      
      // Room counts based on mock data
      totalRooms: 3,
      occupiedRooms: 0, // No rooms with 'occupied' status
      availableRooms: 1, // One room with 'vacant' status
      dirtyRoomsCount: 1, // One room with 'dirty' status
      maintenanceRoomsCount: 1, // One room with 'maintenance' status
    });

    // Verify Firestore was called correctly
    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  /**
   * Test with no rooms
   * Should return zero values for room-related metrics and handle division by zero
   */
  it('should handle hotel with no rooms', async () => {
    const hotelId = 'test-hotel-no-rooms';
    
    // Mock Firestore responses
    const mockRoomsSnapshot = {
      docs: [], // No rooms
    };

    const mockReservationsSnapshot = {
      docs: [
        {
          id: 'reservation1',
          data: () => ({
            hotelId,
            customerId: 'customer1',
            roomId: 'nonexistent-room',
            checkInDate: new Date().toISOString().split('T')[0], // Today
            checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            status: 'checked-in',
            totalPrice: 100,
          }),
        },
      ],
    };

    const mockServiceOrdersSnapshot = {
      docs: [
        {
          id: 'order1',
          data: () => ({
            hotelId,
            reservationId: 'reservation1',
            serviceId: 'service1',
            totalPrice: 25,
            status: 'completed',
            orderedAt: {
              toDate: () => new Date(), // Today
            },
          }),
        },
      ],
    };

    vi.mocked(getDocs).mockImplementation((query) => {
      const callCount = vi.mocked(getDocs).mock.calls.length;
      if (callCount === 1) return Promise.resolve(mockRoomsSnapshot as any);
      if (callCount === 2) return Promise.resolve(mockReservationsSnapshot as any);
      if (callCount === 3) return Promise.resolve(mockServiceOrdersSnapshot as any);
      return Promise.resolve({ docs: [] } as any);
    });

    // Act
    const metrics = await dashboardService.getDashboardMetrics(hotelId);

    // Assert
    expect(metrics).toEqual({
      // Occupancy should be 0 when there are no rooms (avoid division by zero)
      occupancyToday: 0,
      occupancyThisWeek: 0,
      
      // Revenue should still be calculated from reservations and service orders
      revenueToday: 125, // 100 from reservation + 25 from service order
      revenueThisMonth: 125,
      
      // Check-ins/outs should be 0 (no pending/confirmed reservations for today)
      checkInsToday: 0,
      checkOutsToday: 0,
      
      // All room counts should be 0
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      dirtyRoomsCount: 0,
      maintenanceRoomsCount: 0,
    });

    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  /**
   * Test with completely empty hotel (no rooms, no reservations, no service orders)
   */
  it('should handle completely empty hotel', async () => {
    const hotelId = 'test-hotel-empty';
    
    // Mock empty responses for all collections
    const mockEmptySnapshot = { docs: [] };

    vi.mocked(getDocs).mockResolvedValue(mockEmptySnapshot as any);

    // Act
    const metrics = await dashboardService.getDashboardMetrics(hotelId);

    // Assert - all metrics should be zero
    expect(metrics).toEqual({
      occupancyToday: 0,
      occupancyThisWeek: 0,
      revenueToday: 0,
      revenueThisMonth: 0,
      checkInsToday: 0,
      checkOutsToday: 0,
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      dirtyRoomsCount: 0,
      maintenanceRoomsCount: 0,
    });

    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  /**
   * Test with invalid/malformed data
   */
  it('should handle invalid reservation data gracefully', async () => {
    const hotelId = 'test-hotel-invalid-data';
    
    const mockRoomsSnapshot = {
      docs: [
        {
          id: 'room1',
          data: () => ({
            hotelId,
            roomNumber: '101',
            roomTypeId: 'standard',
            floor: 1,
            status: 'vacant',
          }),
        },
      ],
    };

    const mockReservationsSnapshot = {
      docs: [
        {
          id: 'reservation1',
          data: () => ({
            hotelId,
            customerId: 'customer1',
            roomId: 'room1',
            checkInDate: 'invalid-date', // Invalid date format
            checkOutDate: null, // Null date
            status: 'checked-in',
            totalPrice: 'not-a-number', // Invalid price
          }),
        },
        {
          id: 'reservation2',
          data: () => ({
            hotelId,
            // Missing required fields
            status: 'pending',
          }),
        },
      ],
    };

    const mockServiceOrdersSnapshot = {
      docs: [
        {
          id: 'order1',
          data: () => ({
            hotelId,
            totalPrice: null, // Invalid price
            status: 'completed',
            orderedAt: {
              toDate: () => {
                throw new Error('Invalid date'); // Simulate invalid date conversion
              },
            },
          }),
        },
      ],
    };

    vi.mocked(getDocs).mockImplementation((query) => {
      const callCount = vi.mocked(getDocs).mock.calls.length;
      if (callCount === 1) return Promise.resolve(mockRoomsSnapshot as any);
      if (callCount === 2) return Promise.resolve(mockReservationsSnapshot as any);
      if (callCount === 3) return Promise.resolve(mockServiceOrdersSnapshot as any);
      return Promise.resolve({ docs: [] } as any);
    });

    // Act & Assert - should throw error due to invalid data
    await expect(dashboardService.getDashboardMetrics(hotelId)).rejects.toThrow('Failed to fetch dashboard metrics');

    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  /**
   * Test with edge case data that should be handled gracefully
   */
  it('should handle edge case data gracefully', async () => {
    const hotelId = 'test-hotel-edge-cases';
    
    const mockRoomsSnapshot = {
      docs: [
        {
          id: 'room1',
          data: () => ({
            hotelId,
            roomNumber: '101',
            roomTypeId: 'standard',
            floor: 1,
            status: 'vacant',
          }),
        },
      ],
    };

    const mockReservationsSnapshot = {
      docs: [
        {
          id: 'reservation1',
          data: () => ({
            hotelId,
            customerId: 'customer1',
            roomId: 'room1',
            checkInDate: new Date().toISOString().split('T')[0], // Today
            checkOutDate: new Date().toISOString().split('T')[0], // Same day (edge case)
            status: 'checked-in',
            totalPrice: 0, // Zero price (edge case)
          }),
        },
        {
          id: 'reservation2',
          data: () => ({
            hotelId,
            customerId: 'customer2',
            roomId: 'nonexistent-room', // Room doesn't exist
            checkInDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
            checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            status: 'checked-in',
            totalPrice: 100,
          }),
        },
      ],
    };

    const mockServiceOrdersSnapshot = {
      docs: [
        {
          id: 'order1',
          data: () => ({
            hotelId,
            totalPrice: 0, // Zero price (edge case)
            status: 'completed',
            orderedAt: {
              toDate: () => new Date(), // Today
            },
          }),
        },
      ],
    };

    vi.mocked(getDocs).mockImplementation((query) => {
      const callCount = vi.mocked(getDocs).mock.calls.length;
      if (callCount === 1) return Promise.resolve(mockRoomsSnapshot as any);
      if (callCount === 2) return Promise.resolve(mockReservationsSnapshot as any);
      if (callCount === 3) return Promise.resolve(mockServiceOrdersSnapshot as any);
      return Promise.resolve({ docs: [] } as any);
    });

    // Act - should handle edge cases without throwing
    const metrics = await dashboardService.getDashboardMetrics(hotelId);

    // Assert - should handle edge cases gracefully
    expect(metrics).toBeDefined();
    expect(metrics.totalRooms).toBe(1);
    expect(metrics.availableRooms).toBe(1);
    expect(metrics.occupancyToday).toBeGreaterThanOrEqual(0);
    expect(metrics.occupancyToday).toBeLessThanOrEqual(100);
    expect(metrics.revenueToday).toBeGreaterThanOrEqual(0);
    expect(metrics.revenueThisMonth).toBeGreaterThanOrEqual(0);

    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  /**
   * Test caching behavior
   */
  it('should use cached data when available', async () => {
    const hotelId = 'test-hotel-cache';
    
    const mockSnapshot = { docs: [] };
    vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

    // First call - should hit database
    const metrics1 = await dashboardService.getDashboardMetrics(hotelId);
    expect(getDocs).toHaveBeenCalledTimes(3);

    // Reset mock call count
    vi.mocked(getDocs).mockClear();

    // Second call within cache duration - should use cache
    const metrics2 = await dashboardService.getDashboardMetrics(hotelId);
    expect(getDocs).not.toHaveBeenCalled(); // Should not call database
    expect(metrics2).toEqual(metrics1); // Should return same data
  });

  /**
   * Test cache clearing
   */
  it('should clear cache and fetch fresh data', async () => {
    const hotelId = 'test-hotel-cache-clear';
    
    const mockSnapshot = { docs: [] };
    vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

    // First call
    await dashboardService.getDashboardMetrics(hotelId);
    expect(getDocs).toHaveBeenCalledTimes(3);

    // Clear cache
    dashboardService.clearCache(hotelId);
    vi.mocked(getDocs).mockClear();

    // Second call after cache clear - should hit database again
    await dashboardService.getDashboardMetrics(hotelId);
    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  /**
   * Test error handling
   */
  it('should handle Firestore errors gracefully', async () => {
    const hotelId = 'test-hotel-error';
    
    // Mock Firestore error
    const firestoreError = new Error('Firestore connection failed');
    vi.mocked(getDocs).mockRejectedValue(firestoreError);

    // Act & Assert
    await expect(dashboardService.getDashboardMetrics(hotelId)).rejects.toThrow('Failed to fetch dashboard metrics');
  });
});