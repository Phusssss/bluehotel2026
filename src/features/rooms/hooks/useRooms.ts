import { useState, useEffect, useCallback } from 'react';
import { roomService, RoomFilters } from '../../../services/roomService';
import { roomTypeService } from '../../../services/roomTypeService';
import type { Room, RoomType } from '../../../types';
import { useHotel } from '../../../contexts/HotelContext';

/**
 * Custom hook for managing rooms
 */
export function useRooms(initialFilters?: RoomFilters) {
  const { currentHotel } = useHotel();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<RoomFilters>(initialFilters || {});

  /**
   * Fetch rooms from Firestore
   */
  const fetchRooms = useCallback(async () => {
    if (!currentHotel) return;

    setLoading(true);
    setError(null);

    try {
      const data = await roomService.getRooms(currentHotel.id, filters);
      setRooms(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [currentHotel, filters]);

  /**
   * Fetch room types from Firestore
   */
  const fetchRoomTypes = useCallback(async () => {
    if (!currentHotel) return;

    try {
      const data = await roomTypeService.getRoomTypes(currentHotel.id);
      setRoomTypes(data);
    } catch (err) {
      console.error('Error fetching room types:', err);
    }
  }, [currentHotel]);

  /**
   * Update filters and trigger refetch
   */
  const updateFilters = useCallback((newFilters: RoomFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Get room type name by ID
   */
  const getRoomTypeName = useCallback(
    (roomTypeId: string): string => {
      const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
      return roomType?.name || 'Unknown';
    },
    [roomTypes]
  );

  /**
   * Update room status
   */
  const updateRoomStatus = useCallback(
    async (roomId: string, status: Room['status']) => {
      if (!currentHotel) return;

      try {
        await roomService.updateRoomStatus(roomId, status);
        await fetchRooms();
      } catch (err) {
        console.error('Error updating room status:', err);
        throw err;
      }
    },
    [currentHotel, fetchRooms]
  );

  /**
   * Get unique floor numbers from rooms
   */
  const getUniqueFloors = useCallback((): number[] => {
    const floors = new Set<number>();
    rooms.forEach((room) => floors.add(room.floor));
    return Array.from(floors).sort((a, b) => a - b);
  }, [rooms]);

  // Fetch rooms when filters or hotel changes
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Fetch room types when hotel changes
  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  return {
    rooms,
    roomTypes,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    getRoomTypeName,
    updateRoomStatus,
    getUniqueFloors,
    refresh: fetchRooms,
  };
}
