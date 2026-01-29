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
  private cache = new Map<string, { data: DashboardMetrics; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
   * Check if cached data is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.CACHE_DURATION;
  }

  /**
   * Get cached data if valid
   */
  private getCachedData(cacheKey: string): DashboardMetrics | null {
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }
    return null;
  }

  /**
   * Cache data
   */
  private setCachedData(cacheKey: string, data: DashboardMetrics): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Calculate simple occupancy based on current room status
   */
  // private calculateSimpleOccupancy(rooms: Room[]): number {
  //   if (rooms.length === 0) return 0;
  //   const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
  //   return (occupiedRooms / rooms.length) * 100;
  // }

  /**
   * Get all dashboard metrics for a hotel (optimized version)
   */
  async getDashboardMetrics(hotelId: string): Promise<DashboardMetrics> {
    const cacheKey = `dashboard_${hotelId}`;
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const today = this.getTodayDate();
      const weekStart = this.getWeekStartDate();
      const monthStart = this.getMonthStartDate();

      // Execute all queries in parallel for better performance
      const [roomsSnapshot, reservationsSnapshot, serviceOrdersSnapshot] = await Promise.all([
        // Get all rooms
        getDocs(query(
          collection(db, 'rooms'),
          where('hotelId', '==', hotelId)
        )),
        
        // Get reservations (get all for this hotel, filter in memory to avoid index issues)
        getDocs(query(
          collection(db, 'reservations'),
          where('hotelId', '==', hotelId)
        )),
        
        // Get service orders for this hotel (simplified query to avoid index requirement)
        getDocs(query(
          collection(db, 'serviceOrders'),
          where('hotelId', '==', hotelId),
          where('status', '==', 'completed')
        ))
      ]);

      // Process rooms data
      const rooms = roomsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];

      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter((room) => room.status === 'occupied').length;
      const dirtyRoomsCount = rooms.filter((room) => room.status === 'dirty').length;
      const maintenanceRoomsCount = rooms.filter((room) => room.status === 'maintenance').length;
      const availableRooms = rooms.filter((room) => room.status === 'vacant').length;

      // Process reservations data (filter to recent ones for performance)
      const allReservations = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      // Filter reservations to only recent ones for performance
      const reservations = allReservations.filter(reservation => 
        reservation.checkInDate >= monthStart || 
        reservation.checkOutDate >= monthStart ||
        reservation.status === 'checked-in'
      );

      // Calculate metrics from reservations
      let revenueToday = 0;
      let revenueThisMonth = 0;
      let checkInsToday = 0;
      let checkOutsToday = 0;
      let occupiedRoomsToday = 0;
      let occupiedRoomsThisWeek = 0;

      reservations.forEach((reservation) => {
        // Revenue calculations
        if (reservation.status === 'checked-in' || reservation.status === 'checked-out') {
          if (reservation.checkInDate === today) {
            revenueToday += reservation.totalPrice;
          }
          if (reservation.checkInDate >= monthStart) {
            revenueThisMonth += reservation.totalPrice;
          }
        }

        // Check-ins and check-outs for today
        if (reservation.checkInDate === today && 
            (reservation.status === 'confirmed' || reservation.status === 'pending')) {
          checkInsToday++;
        }
        
        if (reservation.checkOutDate === today && reservation.status === 'checked-in') {
          checkOutsToday++;
        }

        // Simple occupancy calculation based on active reservations
        if (reservation.status === 'checked-in') {
          if (reservation.checkInDate <= today && reservation.checkOutDate > today) {
            occupiedRoomsToday++;
          }
          if (reservation.checkInDate <= today && reservation.checkOutDate >= weekStart) {
            occupiedRoomsThisWeek++;
          }
        }
      });

      // Add service orders revenue (filter by date in JavaScript to avoid index requirement)
      const serviceOrders = serviceOrdersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceOrder[];

      serviceOrders.forEach((order) => {
        const orderDate = order.orderedAt.toDate().toISOString().split('T')[0];
        // Only include orders from this month or later for performance
        if (orderDate >= monthStart) {
          if (orderDate === today) {
            revenueToday += order.totalPrice;
          }
          if (orderDate >= monthStart) {
            revenueThisMonth += order.totalPrice;
          }
        }
      });

      // Calculate occupancy percentages (simplified)
      const occupancyToday = totalRooms > 0 ? (occupiedRoomsToday / totalRooms) * 100 : 0;
      const occupancyThisWeek = totalRooms > 0 ? (occupiedRoomsThisWeek / totalRooms) * 100 : 0;

      const metrics: DashboardMetrics = {
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

      // Cache the results
      this.setCachedData(cacheKey, metrics);

      return metrics;
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  /**
   * Clear cache for a specific hotel
   */
  clearCache(hotelId: string): void {
    const cacheKey = `dashboard_${hotelId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
