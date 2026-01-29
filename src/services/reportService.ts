import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Reservation, ServiceOrder, RoomType } from '../types';

/**
 * Occupancy report data for a single date
 */
export interface OccupancyReportData {
  date: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyPercentage: number;
}

/**
 * Filters for occupancy report
 */
export interface OccupancyReportFilters {
  startDate: string;
  endDate: string;
}

/**
 * Revenue report data
 */
export interface RevenueReportData {
  totalRevenue: number;
  roomRevenue: number;
  serviceRevenue: number;
  revenueByRoomType: Array<{
    roomTypeId: string;
    roomTypeName: string;
    revenue: number;
    reservationCount: number;
  }>;
  revenueByService: Array<{
    serviceId: string;
    serviceName: string;
    revenue: number;
    orderCount: number;
  }>;
}

/**
 * Filters for revenue report
 */
export interface RevenueReportFilters {
  startDate: string;
  endDate: string;
}

/**
 * Reservation report data
 */
export interface ReservationReportData {
  bookingsBySource: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  cancellationsAndNoShows: Array<{
    date: string;
    cancelled: number;
    noShows: number;
    total: number;
  }>;
  summary: {
    totalBookings: number;
    totalCancellations: number;
    totalNoShows: number;
    cancellationRate: number;
    noShowRate: number;
  };
}

/**
 * Filters for reservation report
 */
export interface ReservationReportFilters {
  startDate: string;
  endDate: string;
}

/**
 * Service class for generating reports
 */
export class ReportService {
  /**
   * Generate occupancy report for a date range
   */
  async generateOccupancyReport(
    hotelId: string,
    filters: OccupancyReportFilters
  ): Promise<OccupancyReportData[]> {
    try {
      // Get total rooms for the hotel
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('hotelId', '==', hotelId)
      );
      const roomsSnapshot = await getDocs(roomsQuery);
      const totalRooms = roomsSnapshot.size;

      if (totalRooms === 0) {
        return [];
      }

      // Get all reservations that might overlap with the date range
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('hotelId', '==', hotelId),
        where('status', 'in', ['confirmed', 'checked-in', 'checked-out'])
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      // Generate report data for each date in the range
      const reportData: OccupancyReportData[] = [];
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);

      for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Count occupied rooms for this date
        const occupiedRooms = this.countOccupiedRoomsForDate(reservations, dateStr);
        const occupancyPercentage = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        reportData.push({
          date: dateStr,
          totalRooms,
          occupiedRooms,
          occupancyPercentage: Math.round(occupancyPercentage * 100) / 100, // Round to 2 decimal places
        });
      }

      return reportData;
    } catch (error) {
      console.error('Error generating occupancy report:', error);
      throw new Error('Failed to generate occupancy report');
    }
  }

  /**
   * Count occupied rooms for a specific date
   */
  private countOccupiedRoomsForDate(reservations: Reservation[], date: string): number {
    const occupiedRooms = new Set<string>();

    reservations.forEach((reservation) => {
      // Check if the reservation covers this date
      // A room is occupied on a date if: checkInDate <= date < checkOutDate
      if (reservation.checkInDate <= date && reservation.checkOutDate > date) {
        occupiedRooms.add(reservation.roomId);
      }
    });

    return occupiedRooms.size;
  }

  /**
   * Get occupancy summary for a date range
   */
  async getOccupancySummary(
    hotelId: string,
    filters: OccupancyReportFilters
  ): Promise<{
    averageOccupancy: number;
    maxOccupancy: number;
    minOccupancy: number;
    totalDays: number;
  }> {
    try {
      const reportData = await this.generateOccupancyReport(hotelId, filters);
      
      if (reportData.length === 0) {
        return {
          averageOccupancy: 0,
          maxOccupancy: 0,
          minOccupancy: 0,
          totalDays: 0,
        };
      }

      const occupancyPercentages = reportData.map(data => data.occupancyPercentage);
      const averageOccupancy = occupancyPercentages.reduce((sum, percentage) => sum + percentage, 0) / occupancyPercentages.length;
      const maxOccupancy = Math.max(...occupancyPercentages);
      const minOccupancy = Math.min(...occupancyPercentages);

      return {
        averageOccupancy: Math.round(averageOccupancy * 100) / 100,
        maxOccupancy: Math.round(maxOccupancy * 100) / 100,
        minOccupancy: Math.round(minOccupancy * 100) / 100,
        totalDays: reportData.length,
      };
    } catch (error) {
      console.error('Error getting occupancy summary:', error);
      throw new Error('Failed to get occupancy summary');
    }
  }

  /**
   * Generate revenue report for a date range
   */
  async generateRevenueReport(
    hotelId: string,
    filters: RevenueReportFilters
  ): Promise<RevenueReportData> {
    try {
      // Get all reservations in the date range that have been checked out (revenue realized)
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('hotelId', '==', hotelId),
        where('status', '==', 'checked-out')
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const allReservations = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      // Filter reservations by checkout date within the range
      const reservations = allReservations.filter(reservation => {
        if (!reservation.checkedOutAt) return false;
        const checkoutDate = reservation.checkedOutAt.toDate().toISOString().split('T')[0];
        return checkoutDate >= filters.startDate && checkoutDate <= filters.endDate;
      });

      // Get all service orders in the date range that have been completed
      const serviceOrdersQuery = query(
        collection(db, 'serviceOrders'),
        where('hotelId', '==', hotelId),
        where('status', '==', 'completed')
      );
      const serviceOrdersSnapshot = await getDocs(serviceOrdersQuery);
      const allServiceOrders = serviceOrdersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceOrder[];

      // Filter service orders by completion date within the range
      const serviceOrders = allServiceOrders.filter(order => {
        if (!order.completedAt) return false;
        const completionDate = order.completedAt.toDate().toISOString().split('T')[0];
        return completionDate >= filters.startDate && completionDate <= filters.endDate;
      });

      // Get room types for mapping
      const roomTypesQuery = query(
        collection(db, 'roomTypes'),
        where('hotelId', '==', hotelId)
      );
      const roomTypesSnapshot = await getDocs(roomTypesQuery);
      const roomTypes = roomTypesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RoomType[];
      const roomTypeMap = new Map(roomTypes.map(rt => [rt.id, rt]));

      // Get services for mapping
      const servicesQuery = query(
        collection(db, 'services'),
        where('hotelId', '==', hotelId)
      );
      const servicesSnapshot = await getDocs(servicesQuery);
      const services = servicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
      const serviceMap = new Map(services.map(s => [s.id, s]));

      // Calculate room revenue by room type
      const roomRevenueByType = new Map<string, { revenue: number; count: number }>();
      let totalRoomRevenue = 0;

      reservations.forEach(reservation => {
        const revenue = reservation.totalPrice || 0;
        totalRoomRevenue += revenue;

        const existing = roomRevenueByType.get(reservation.roomTypeId) || { revenue: 0, count: 0 };
        roomRevenueByType.set(reservation.roomTypeId, {
          revenue: existing.revenue + revenue,
          count: existing.count + 1,
        });
      });

      // Calculate service revenue by service
      const serviceRevenueByService = new Map<string, { revenue: number; count: number }>();
      let totalServiceRevenue = 0;

      serviceOrders.forEach(order => {
        const revenue = order.totalPrice || 0;
        totalServiceRevenue += revenue;

        const existing = serviceRevenueByService.get(order.serviceId) || { revenue: 0, count: 0 };
        serviceRevenueByService.set(order.serviceId, {
          revenue: existing.revenue + revenue,
          count: existing.count + 1,
        });
      });

      // Build revenue by room type array
      const revenueByRoomType = Array.from(roomRevenueByType.entries()).map(([roomTypeId, data]) => {
        const roomType = roomTypeMap.get(roomTypeId);
        return {
          roomTypeId,
          roomTypeName: roomType?.name || 'Unknown Room Type',
          revenue: Math.round(data.revenue * 100) / 100,
          reservationCount: data.count,
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // Build revenue by service array
      const revenueByService = Array.from(serviceRevenueByService.entries()).map(([serviceId, data]) => {
        const service = serviceMap.get(serviceId);
        return {
          serviceId,
          serviceName: service?.name || 'Unknown Service',
          revenue: Math.round(data.revenue * 100) / 100,
          orderCount: data.count,
        };
      }).sort((a, b) => b.revenue - a.revenue);

      const totalRevenue = totalRoomRevenue + totalServiceRevenue;

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        roomRevenue: Math.round(totalRoomRevenue * 100) / 100,
        serviceRevenue: Math.round(totalServiceRevenue * 100) / 100,
        revenueByRoomType,
        revenueByService,
      };
    } catch (error) {
      console.error('Error generating revenue report:', error);
      throw new Error('Failed to generate revenue report');
    }
  }

  /**
   * Generate reservation report for a date range
   */
  async generateReservationReport(
    hotelId: string,
    filters: ReservationReportFilters
  ): Promise<ReservationReportData> {
    try {
      // Get all reservations in the date range (by creation date)
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('hotelId', '==', hotelId)
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const allReservations = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      // Filter reservations by creation date within the range
      const reservations = allReservations.filter(reservation => {
        const creationDate = reservation.createdAt.toDate().toISOString().split('T')[0];
        return creationDate >= filters.startDate && creationDate <= filters.endDate;
      });

      // Calculate bookings by source
      const sourceCount = new Map<string, number>();
      const totalBookings = reservations.length;

      reservations.forEach(reservation => {
        const source = reservation.source || 'unknown';
        sourceCount.set(source, (sourceCount.get(source) || 0) + 1);
      });

      const bookingsBySource = Array.from(sourceCount.entries()).map(([source, count]) => ({
        source: this.formatSourceName(source),
        count,
        percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 10000) / 100 : 0,
      })).sort((a, b) => b.count - a.count);

      // Calculate cancellations and no-shows by date
      const cancellationsByDate = new Map<string, { cancelled: number; noShows: number }>();
      let totalCancellations = 0;
      let totalNoShows = 0;

      reservations.forEach(reservation => {
        const creationDate = reservation.createdAt.toDate().toISOString().split('T')[0];
        
        if (reservation.status === 'cancelled') {
          totalCancellations++;
          const existing = cancellationsByDate.get(creationDate) || { cancelled: 0, noShows: 0 };
          cancellationsByDate.set(creationDate, {
            ...existing,
            cancelled: existing.cancelled + 1,
          });
        } else if (reservation.status === 'no-show') {
          totalNoShows++;
          const existing = cancellationsByDate.get(creationDate) || { cancelled: 0, noShows: 0 };
          cancellationsByDate.set(creationDate, {
            ...existing,
            noShows: existing.noShows + 1,
          });
        }
      });

      // Build cancellations and no-shows array
      const cancellationsAndNoShows = Array.from(cancellationsByDate.entries()).map(([date, data]) => ({
        date,
        cancelled: data.cancelled,
        noShows: data.noShows,
        total: data.cancelled + data.noShows,
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate rates
      const cancellationRate = totalBookings > 0 ? Math.round((totalCancellations / totalBookings) * 10000) / 100 : 0;
      const noShowRate = totalBookings > 0 ? Math.round((totalNoShows / totalBookings) * 10000) / 100 : 0;

      return {
        bookingsBySource,
        cancellationsAndNoShows,
        summary: {
          totalBookings,
          totalCancellations,
          totalNoShows,
          cancellationRate,
          noShowRate,
        },
      };
    } catch (error) {
      console.error('Error generating reservation report:', error);
      throw new Error('Failed to generate reservation report');
    }
  }

  /**
   * Format source name for display
   */
  private formatSourceName(source: string): string {
    const sourceMap: Record<string, string> = {
      'direct': 'Direct Booking',
      'booking.com': 'Booking.com',
      'airbnb': 'Airbnb',
      'phone': 'Phone',
      'walk-in': 'Walk-in',
      'other': 'Other',
      'unknown': 'Unknown',
    };
    return sourceMap[source] || source;
  }
}

// Export singleton instance
export const reportService = new ReportService();