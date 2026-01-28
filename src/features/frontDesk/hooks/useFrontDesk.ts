import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { reservationService } from '../../../services/reservationService';
import { customerService } from '../../../services/customerService';
import { roomService } from '../../../services/roomService';
import { roomTypeService } from '../../../services/roomTypeService';
import { useHotel } from '../../../contexts/HotelContext';
import type { Reservation, Customer, Room, RoomType } from '../../../types';
import dayjs from 'dayjs';

/**
 * Extended reservation interface with enriched details
 * Includes customer name, room number, and room type name for display
 */
export interface ReservationWithDetails extends Reservation {
  customerName?: string;
  roomNumber?: string;
  roomTypeName?: string;
}

/**
 * Return type for useFrontDesk hook
 */
export interface UseFrontDeskResult {
  arrivals: ReservationWithDetails[];
  inHouse: ReservationWithDetails[];
  departures: ReservationWithDetails[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  checkIn: (id: string) => Promise<void>;
  checkOut: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing front desk operations
 * Handles arrivals, in-house guests, and departures for the current hotel
 * 
 * @returns {UseFrontDeskResult} Front desk data and operations
 */
export function useFrontDesk(): UseFrontDeskResult {
  const [arrivals, setArrivals] = useState<ReservationWithDetails[]>([]);
  const [inHouse, setInHouse] = useState<ReservationWithDetails[]>([]);
  const [departures, setDepartures] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentHotel } = useHotel();
  const { t } = useTranslation('frontDesk');

  /**
   * Enrich reservations with customer, room, and room type details
   * Uses parallel fetching and Map lookups for optimal performance
   * 
   * @param reservations - Array of reservations to enrich
   * @returns Promise resolving to enriched reservations
   */
  const enrichReservations = async (
    reservations: Reservation[]
  ): Promise<ReservationWithDetails[]> => {
    if (!currentHotel) return [];

    try {
      // Fetch all customers, rooms, and room types in parallel
      const [customers, rooms, roomTypes] = await Promise.all([
        customerService.getCustomers(currentHotel.id),
        roomService.getRooms(currentHotel.id),
        roomTypeService.getRoomTypes(currentHotel.id),
      ]);

      // Create lookup maps for faster access
      const customerMap = new Map<string, Customer>();
      customers.forEach((c) => customerMap.set(c.id, c));

      const roomMap = new Map<string, Room>();
      rooms.forEach((r) => roomMap.set(r.id, r));

      const roomTypeMap = new Map<string, RoomType>();
      roomTypes.forEach((rt) => roomTypeMap.set(rt.id, rt));

      // Enrich reservations with details
      return reservations.map((reservation) => {
        const customer = customerMap.get(reservation.customerId);
        const room = roomMap.get(reservation.roomId);
        const roomType = roomTypeMap.get(reservation.roomTypeId);

        return {
          ...reservation,
          customerName: customer?.name,
          roomNumber: room?.roomNumber,
          roomTypeName: roomType?.name,
        };
      });
    } catch (err) {
      console.error('Error enriching reservations:', err);
      return reservations;
    }
  };

  /**
   * Fetch and process front desk data
   * Fetches all reservations once and filters client-side to avoid complex Firestore indexes
   */
  const fetchData = useCallback(async () => {
    if (!currentHotel) {
      setArrivals([]);
      setInHouse([]);
      setDepartures([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const today = dayjs().format('YYYY-MM-DD');

      // Fetch all reservations once and filter client-side to avoid complex Firestore indexes
      // This is more efficient than multiple queries with range filters
      const allReservations = await reservationService.getReservations(currentHotel.id);

      // Filter arrivals: pending/confirmed reservations with check-in today
      const arrivalsFiltered = allReservations.filter(
        (r) =>
          r.checkInDate === today &&
          (r.status === 'pending' || r.status === 'confirmed')
      );

      // Filter in-house: all checked-in guests
      const inHouseData = allReservations.filter((r) => r.status === 'checked-in');

      // Filter departures: checked-in guests with checkout today
      const departuresData = inHouseData.filter((r) => r.checkOutDate === today);

      // Enrich all data with customer, room, and room type details
      const [enrichedArrivals, enrichedInHouse, enrichedDepartures] = await Promise.all([
        enrichReservations(arrivalsFiltered),
        enrichReservations(inHouseData),
        enrichReservations(departuresData),
      ]);

      // Sort arrivals by check-in time (using createdAt as proxy for expected time)
      enrichedArrivals.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeA - timeB;
      });

      // Sort departures by checkout time (using createdAt as proxy for expected time)
      enrichedDepartures.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeA - timeB;
      });

      setArrivals(enrichedArrivals);
      setInHouse(enrichedInHouse);
      setDepartures(enrichedDepartures);
    } catch (err) {
      const error = err as Error;
      setError(error);
      message.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [currentHotel, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Refresh all front desk data
   */
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Check in a guest
   * Updates reservation status to checked-in and room status to occupied
   * 
   * @param id - Reservation ID
   */
  const checkIn = useCallback(
    async (id: string) => {
      try {
        await reservationService.checkIn(id);
        message.success(t('messages.checkInSuccess'));
        await refresh();
      } catch (err) {
        message.error(t('messages.checkInError'));
        throw err;
      }
    },
    [refresh, t]
  );

  /**
   * Check out a guest
   * Updates reservation status to checked-out and room status to dirty
   * Creates a housekeeping task for room cleaning
   * 
   * @param id - Reservation ID
   */
  const checkOut = useCallback(
    async (id: string) => {
      try {
        await reservationService.checkOut(id);
        message.success(t('messages.checkOutSuccess'));
        await refresh();
      } catch (err) {
        message.error(t('messages.checkOutError'));
        throw err;
      }
    },
    [refresh, t]
  );

  return {
    arrivals,
    inHouse,
    departures,
    loading,
    error,
    refresh,
    checkIn,
    checkOut,
  };
}
