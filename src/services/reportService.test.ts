import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportService } from './reportService';
import { getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
  };
});

vi.mock('../config/firebase', () => ({
  db: {},
}));

describe('ReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOccupancyReport', () => {
    it('should return empty array when no rooms exist', async () => {
      // Mock empty rooms collection
      (getDocs as any).mockResolvedValueOnce({
        size: 0,
      });

      const result = await reportService.generateOccupancyReport('hotel-1', {
        startDate: '2024-01-01',
        endDate: '2024-01-03',
      });

      expect(result).toEqual([]);
    });

    it('should calculate occupancy correctly for date range', async () => {
      // Mock rooms collection (2 rooms)
      (getDocs as any)
        .mockResolvedValueOnce({
          size: 2,
        })
        // Mock reservations collection
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'res-1',
              data: () => ({
                id: 'res-1',
                hotelId: 'hotel-1',
                roomId: 'room-1',
                checkInDate: '2024-01-01',
                checkOutDate: '2024-01-03',
                status: 'confirmed',
              }),
            },
          ],
        });

      const result = await reportService.generateOccupancyReport('hotel-1', {
        startDate: '2024-01-01',
        endDate: '2024-01-02',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        totalRooms: 2,
        occupiedRooms: 1,
        occupancyPercentage: 50,
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        totalRooms: 2,
        occupiedRooms: 1,
        occupancyPercentage: 50,
      });
    });
  });

  describe('getOccupancySummary', () => {
    it('should return zero values when no data', async () => {
      // Mock empty rooms collection
      (getDocs as any).mockResolvedValueOnce({
        size: 0,
      });

      const result = await reportService.getOccupancySummary('hotel-1', {
        startDate: '2024-01-01',
        endDate: '2024-01-03',
      });

      expect(result).toEqual({
        averageOccupancy: 0,
        maxOccupancy: 0,
        minOccupancy: 0,
        totalDays: 0,
      });
    });
  });

  describe('generateRevenueReport', () => {
    it('should return zero revenue when no data', async () => {
      // Mock empty reservations, service orders, room types, and services
      (getDocs as any)
        .mockResolvedValueOnce({ docs: [] }) // reservations
        .mockResolvedValueOnce({ docs: [] }) // service orders
        .mockResolvedValueOnce({ docs: [] }) // room types
        .mockResolvedValueOnce({ docs: [] }); // services

      const result = await reportService.generateRevenueReport('hotel-1', {
        startDate: '2024-01-01',
        endDate: '2024-01-03',
      });

      expect(result).toEqual({
        totalRevenue: 0,
        roomRevenue: 0,
        serviceRevenue: 0,
        revenueByRoomType: [],
        revenueByService: [],
      });
    });

    it('should calculate revenue correctly with reservations and services', async () => {
      const mockCheckedOutAt = Timestamp.fromDate(new Date('2024-01-02T12:00:00Z'));
      const mockCompletedAt = Timestamp.fromDate(new Date('2024-01-02T14:00:00Z'));

      // Mock reservations
      (getDocs as any)
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'res-1',
              data: () => ({
                id: 'res-1',
                hotelId: 'hotel-1',
                roomId: 'room-1',
                roomTypeId: 'rt-1',
                totalPrice: 100,
                status: 'checked-out',
                checkedOutAt: mockCheckedOutAt,
              }),
            },
            {
              id: 'res-2',
              data: () => ({
                id: 'res-2',
                hotelId: 'hotel-1',
                roomId: 'room-2',
                roomTypeId: 'rt-2',
                totalPrice: 150,
                status: 'checked-out',
                checkedOutAt: mockCheckedOutAt,
              }),
            },
          ],
        })
        // Mock service orders
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'so-1',
              data: () => ({
                id: 'so-1',
                hotelId: 'hotel-1',
                serviceId: 's-1',
                totalPrice: 50,
                status: 'completed',
                completedAt: mockCompletedAt,
              }),
            },
          ],
        })
        // Mock room types
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'rt-1',
              data: () => ({
                id: 'rt-1',
                name: 'Standard Room',
              }),
            },
            {
              id: 'rt-2',
              data: () => ({
                id: 'rt-2',
                name: 'Deluxe Room',
              }),
            },
          ],
        })
        // Mock services
        .mockResolvedValueOnce({
          docs: [
            {
              id: 's-1',
              data: () => ({
                id: 's-1',
                name: 'Laundry Service',
              }),
            },
          ],
        });

      const result = await reportService.generateRevenueReport('hotel-1', {
        startDate: '2024-01-01',
        endDate: '2024-01-03',
      });

      expect(result.totalRevenue).toBe(300);
      expect(result.roomRevenue).toBe(250);
      expect(result.serviceRevenue).toBe(50);
      expect(result.revenueByRoomType).toHaveLength(2);
      expect(result.revenueByRoomType[0]).toEqual({
        roomTypeId: 'rt-2',
        roomTypeName: 'Deluxe Room',
        revenue: 150,
        reservationCount: 1,
      });
      expect(result.revenueByService).toHaveLength(1);
      expect(result.revenueByService[0]).toEqual({
        serviceId: 's-1',
        serviceName: 'Laundry Service',
        revenue: 50,
        orderCount: 1,
      });
    });

    it('should filter reservations by checkout date within range', async () => {
      const mockCheckedOutAtInRange = Timestamp.fromDate(new Date('2024-01-02T12:00:00Z'));
      const mockCheckedOutAtOutOfRange = Timestamp.fromDate(new Date('2024-01-05T12:00:00Z'));

      // Mock reservations with different checkout dates
      (getDocs as any)
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'res-1',
              data: () => ({
                id: 'res-1',
                hotelId: 'hotel-1',
                roomId: 'room-1',
                roomTypeId: 'rt-1',
                totalPrice: 100,
                status: 'checked-out',
                checkedOutAt: mockCheckedOutAtInRange,
              }),
            },
            {
              id: 'res-2',
              data: () => ({
                id: 'res-2',
                hotelId: 'hotel-1',
                roomId: 'room-2',
                roomTypeId: 'rt-1',
                totalPrice: 150,
                status: 'checked-out',
                checkedOutAt: mockCheckedOutAtOutOfRange, // Outside range
              }),
            },
          ],
        })
        .mockResolvedValueOnce({ docs: [] }) // service orders
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'rt-1',
              data: () => ({
                id: 'rt-1',
                name: 'Standard Room',
              }),
            },
          ],
        })
        .mockResolvedValueOnce({ docs: [] }); // services

      const result = await reportService.generateRevenueReport('hotel-1', {
        startDate: '2024-01-01',
        endDate: '2024-01-03',
      });

      // Should only include the reservation checked out within the date range
      expect(result.roomRevenue).toBe(100);
      expect(result.revenueByRoomType[0].reservationCount).toBe(1);
    });
  });
});