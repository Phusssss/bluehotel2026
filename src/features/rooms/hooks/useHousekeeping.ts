import { useState, useEffect, useCallback } from 'react';
import {
  housekeepingService,
  HousekeepingTaskFilters,
} from '../../../services/housekeepingService';
import { roomService } from '../../../services/roomService';
import type { HousekeepingTask, Room, HotelUser } from '../../../types';
import { useHotel } from '../../../contexts/HotelContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';

/**
 * Custom hook for managing housekeeping tasks
 */
export function useHousekeeping(initialFilters?: HousekeepingTaskFilters) {
  const { currentHotel } = useHotel();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<HotelUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<HousekeepingTaskFilters>(
    initialFilters || {}
  );

  /**
   * Fetch housekeeping tasks from Firestore
   */
  const fetchTasks = useCallback(async () => {
    if (!currentHotel) return;

    setLoading(true);
    setError(null);

    try {
      const data = await housekeepingService.getTasks(
        currentHotel.id,
        filters
      );
      setTasks(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching housekeeping tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [currentHotel, filters]);

  /**
   * Fetch all rooms for the hotel
   */
  const fetchRooms = useCallback(async () => {
    if (!currentHotel) return;

    try {
      const data = await roomService.getRooms(currentHotel.id);
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  }, [currentHotel]);

  /**
   * Fetch hotel staff (users with housekeeping permission)
   */
  const fetchStaff = useCallback(async () => {
    if (!currentHotel) return;

    try {
      const q = query(
        collection(db, 'hotelUsers'),
        where('hotelId', '==', currentHotel.id)
      );
      const snapshot = await getDocs(q);
      const hotelUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HotelUser[];

      setStaff(hotelUsers);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  }, [currentHotel]);

  /**
   * Update filters and trigger refetch
   */
  const updateFilters = useCallback((newFilters: HousekeepingTaskFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Get room by ID
   */
  const getRoomById = useCallback(
    (roomId: string): Room | undefined => {
      return rooms.find((room) => room.id === roomId);
    },
    [rooms]
  );

  /**
   * Assign a task to a staff member
   */
  const assignTask = useCallback(
    async (taskId: string, userId: string) => {
      if (!currentHotel) return;

      try {
        await housekeepingService.assignTask(taskId, userId);
        await fetchTasks();
      } catch (err) {
        console.error('Error assigning task:', err);
        throw err;
      }
    },
    [currentHotel, fetchTasks]
  );

  /**
   * Complete a task and update room status to clean
   */
  const completeTask = useCallback(
    async (taskId: string, roomId: string) => {
      if (!currentHotel) return;

      try {
        // Complete the task
        await housekeepingService.completeTask(taskId);

        // Update room status to vacant (clean)
        await roomService.updateRoomStatus(roomId, 'vacant');

        // Refresh tasks and rooms
        await fetchTasks();
        await fetchRooms();
      } catch (err) {
        console.error('Error completing task:', err);
        throw err;
      }
    },
    [currentHotel, fetchTasks, fetchRooms]
  );

  /**
   * Create a new housekeeping task
   */
  const createTask = useCallback(
    async (
      roomId: string,
      taskType: HousekeepingTask['taskType'],
      priority: HousekeepingTask['priority'] = 'normal',
      notes?: string
    ) => {
      if (!currentHotel) return;

      try {
        await housekeepingService.createTask({
          hotelId: currentHotel.id,
          roomId,
          taskType,
          priority,
          status: 'pending',
          notes,
        });

        await fetchTasks();
      } catch (err) {
        console.error('Error creating task:', err);
        throw err;
      }
    },
    [currentHotel, fetchTasks]
  );

  // Fetch tasks when filters or hotel changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch rooms and staff when hotel changes
  useEffect(() => {
    fetchRooms();
    fetchStaff();
  }, [fetchRooms, fetchStaff]);

  return {
    tasks,
    rooms,
    staff,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    getRoomById,
    assignTask,
    completeTask,
    createTask,
    refresh: fetchTasks,
  };
}
