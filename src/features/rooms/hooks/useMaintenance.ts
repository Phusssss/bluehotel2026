import { useState, useEffect, useCallback } from 'react';
import { useHotel } from '../../../contexts/HotelContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  maintenanceService,
  type MaintenanceTicketFilters,
  type CreateMaintenanceTicketInput,
} from '../../../services/maintenanceService';
import { roomService } from '../../../services/roomService';
import type { MaintenanceTicket, Room } from '../../../types';

/**
 * Custom hook for managing maintenance tickets
 */
export function useMaintenance() {
  const { currentHotel } = useHotel();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<MaintenanceTicketFilters>({});

  /**
   * Load maintenance tickets
   */
  const loadTickets = useCallback(async () => {
    if (!currentHotel) return;

    setLoading(true);
    setError(null);

    try {
      const ticketsData = await maintenanceService.getTickets(
        currentHotel.id,
        filters
      );
      setTickets(ticketsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentHotel, filters]);

  /**
   * Load rooms for dropdown selections
   */
  const loadRooms = useCallback(async () => {
    if (!currentHotel) return;

    try {
      const roomsData = await roomService.getRooms(currentHotel.id);
      setRooms(roomsData);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  }, [currentHotel]);

  /**
   * Load data on mount and when dependencies change
   */
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  /**
   * Create a new maintenance ticket
   */
  const createTicket = useCallback(
    async (data: Omit<CreateMaintenanceTicketInput, 'hotelId' | 'reportedBy'>) => {
      if (!currentHotel || !user) {
        throw new Error('Hotel or user not available');
      }

      const ticketData: CreateMaintenanceTicketInput = {
        ...data,
        hotelId: currentHotel.id,
        reportedBy: user.uid,
      };

      const ticketId = await maintenanceService.createTicket(ticketData);
      await loadTickets(); // Refresh the list
      return ticketId;
    },
    [currentHotel, user, loadTickets]
  );

  /**
   * Update a maintenance ticket
   */
  const updateTicket = useCallback(
    async (id: string, data: Partial<MaintenanceTicket>) => {
      await maintenanceService.updateTicket(id, data);
      await loadTickets(); // Refresh the list
    },
    [loadTickets]
  );

  /**
   * Assign a ticket to a staff member
   */
  const assignTicket = useCallback(
    async (id: string, assignedTo: string) => {
      await maintenanceService.assignTicket(id, assignedTo);
      await loadTickets(); // Refresh the list
    },
    [loadTickets]
  );

  /**
   * Resolve a maintenance ticket
   */
  const resolveTicket = useCallback(
    async (id: string) => {
      await maintenanceService.resolveTicket(id);
      await loadTickets(); // Refresh the list
    },
    [loadTickets]
  );

  /**
   * Close a maintenance ticket
   */
  const closeTicket = useCallback(
    async (id: string) => {
      await maintenanceService.closeTicket(id);
      await loadTickets(); // Refresh the list
    },
    [loadTickets]
  );

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: MaintenanceTicketFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await Promise.all([loadTickets(), loadRooms()]);
  }, [loadTickets, loadRooms]);

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
   * Get tickets by status
   */
  const getTicketsByStatus = useCallback(
    (status: MaintenanceTicket['status']): MaintenanceTicket[] => {
      return tickets.filter((ticket) => ticket.status === status);
    },
    [tickets]
  );

  /**
   * Get tickets by priority
   */
  const getTicketsByPriority = useCallback(
    (priority: MaintenanceTicket['priority']): MaintenanceTicket[] => {
      return tickets.filter((ticket) => ticket.priority === priority);
    },
    [tickets]
  );

  return {
    // Data
    tickets,
    rooms,
    loading,
    error,
    filters,

    // Actions
    createTicket,
    updateTicket,
    assignTicket,
    resolveTicket,
    closeTicket,
    updateFilters,
    resetFilters,
    refresh,

    // Helpers
    getRoomById,
    getTicketsByStatus,
    getTicketsByPriority,
  };
}