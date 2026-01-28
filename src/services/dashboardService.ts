import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Reservation, Room, ServiceOrder } from '../types';

/**
 * Dashboard metrics interface
 */
export interface DashboardMetrics {
  // Occupancy metrics
  occupancyToday: number;
  occupancyThisWeek: number;
  
  // Revenue metrics
  revenueToday: number;
  revenueThisMonth: number;
  
  // Check-in/out counts
  checkInsToday: number;
  checkOutsToday: number;
  
  // Room status counts
  dirtyRoomsCount: number;
  maintenanceRoomsCount: number;
  
  // Additional metrics
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
}

/**
 * Service class for calculating dashboard metrics
 */
export class DashboardService {
  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Get start of current week (Monday) in YYYY-MM-DD format
   */
  private getWeekStartDate(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0];
  }

  /**
   * Get start of current month in YYYY-MM-DD format
   */
  private getMonthStartDate(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  }

  /**
   * Calculate occupancy percentage for a date range
   */
  private async calculateOccupancy(
    hotelId: string,
    startDate: string,
    endDate: string,
    totalRooms: number
  ): Promise<number> {
    if (totalRooms === 0) return 0;

    try {
      // Get all active reservations that overlap with the date range
      const q = query(
        collection(db, 'reservations'),
        where('hotelId', '==', hotelId),
        where('status', 'in', ['confirmed', 'checked-in'])
      );

      const snapshot = await getDocs(q);
      const reservations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      // Filter reservations that overlap with the date range
      const overlappingReservations = reservations.filter((reservation) => {
        return (
          reservation.checkInDate <= endDate &&
          reservation.checkOutDate >= startDate
        );
      });

      // Calculate total room-nights
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const totalRoomNights = totalRooms * days;
      let occupiedRoomNights = 0;

      // Count occupied room-nights
      for (const reservation of overlappingReservations) {
        const resStart = new Date(Math.max(new Date(reservation.checkInDate).getTime(), start.getTime()));
        const resEnd = new Date(Math.min(new Date(reservation.checkOutDate).getTime(), end.getTime()));
        const resNights = Math.ceil((resEnd.getTime() - resStart.getTime()) / (1000 * 60 * 60 * 24));
        occupiedRoomNights += Math.max(0, resNights);
      }

      return totalRoomNights > 0 ? (occupiedRoomNights / totalRoomNights) * 100 : 0;
    } catch (error) {
      console.error('Error calculating occupancy:', error);
      return 0;
    }
  }

  /**
   * Calculate revenue for a date range
   */
  private async calculateRevenue(
    hotelId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      let totalRevenue = 0;

      // Get reservations revenue (checked-in or checked-out within date range)
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('hotelId', '==', hotelId),
        where('status', 'in', ['checked-in', 'checked-out'])
      );

      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      // Filter by date range (check-in date within range)
      reservations.forEach((reservation) => {
        if (
          reservation.checkInDate >= startDate &&
          reservation.checkInDate <= endDate
        ) {
          totalRevenue += reservation.totalPrice;
        }
      });

      // Get service orders revenue
      const serviceOrdersQuery = query(
        collection(db, 'serviceOrders'),
        where('hotelId', '==', hotelId),
        where('status', '==', 'completed')
      );

      const serviceOrdersSnapshot = await getDocs(serviceOrdersQuery);
      const serviceOrders = serviceOrdersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceOrder[];

      // Filter by date range (ordered date within range)
      serviceOrders.forEach((order) => {
        const orderDate = order.orderedAt.toDate().toISOString().split('T')[0];
        if (orderDate >= startDate && orderDate <= endDate) {
          totalRevenue += order.totalPrice;
        }
      });

      return totalRevenue;
    } catch (error) {
      console.error('Error calculating revenue:', error);
      return 0;
    }
  }

  /**
   * Get all dashboard metrics for a hotel
   */
  async getDashboardMetrics(hotelId: string): Promise<DashboardMetrics> {
    try {
      const today = this.getTodayDate();
      const weekStart = this.getWeekStartDate();
      const monthStart = this.getMonthStartDate();

      // Get all rooms for the hotel
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('hotelId', '==', hotelId)
      );
      const roomsSnapshot = await getDocs(roomsQuery);
      const rooms = roomsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];

      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter((room) => room.status === 'occupied').length;
      const dirtyRoomsCount = rooms.filter((room) => room.status === 'dirty').length;
      const maintenanceRoomsCount = rooms.filter((room) => room.status === 'maintenance').length;
      const availableRooms = rooms.filter((room) => room.status === 'vacant').length;

      // Calculate occupancy
      const occupancyToday = await this.calculateOccupancy(hotelId, today, today, totalRooms);
      const occupancyThisWeek = await this.calculateOccupancy(hotelId, weekStart, today, totalRooms);

      // Calculate revenue
      const revenueToday = await this.calculateRevenue(hotelId, today, today);
      const revenueThisMonth = await this.calculateRevenue(hotelId, monthStart, today);

      // Get check-ins and check-outs for today
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('hotelId', '==', hotelId)
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      const checkInsToday = reservations.filter(
        (r) => r.checkInDate === today && (r.status === 'confirmed' || r.status === 'pending')
      ).length;

      const checkOutsToday = reservations.filter(
        (r) => r.checkOutDate === today && r.status === 'checked-in'
      ).length;

      return {
        occupancyToday,
        occupancyThisWeek,
        revenueToday,
        revenueThisMonth,
        checkInsToday,
        checkOutsToday,
        dirtyRoomsCount,
        maintenanceRoomsCount,
        totalRooms,
        occupiedRooms,
        availableRooms,
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
