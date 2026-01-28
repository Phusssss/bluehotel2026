import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  orderBy,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MaintenanceTicket } from '../types';
import { removeUndefinedFields } from '../utils/firestore';
import { roomService } from './roomService';

/**
 * Filters for querying maintenance tickets
 */
export interface MaintenanceTicketFilters {
  status?: MaintenanceTicket['status'];
  priority?: MaintenanceTicket['priority'];
  assignedTo?: string;
  reportedBy?: string;
  roomId?: string;
}

/**
 * Input data for creating a maintenance ticket
 */
export type CreateMaintenanceTicketInput = Omit<
  MaintenanceTicket,
  'id' | 'createdAt' | 'resolvedAt'
>;

/**
 * Service class for managing maintenance tickets in Firestore
 */
export class MaintenanceService {
  private collectionName = 'maintenanceTickets';

  /**
   * Get all maintenance tickets for a hotel with optional filters
   */
  async getTickets(
    hotelId: string,
    filters?: MaintenanceTicketFilters
  ): Promise<MaintenanceTicket[]> {
    try {
      let q: Query<DocumentData> = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId)
      );

      // Apply filters
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      if (filters?.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      if (filters?.reportedBy) {
        q = query(q, where('reportedBy', '==', filters.reportedBy));
      }
      if (filters?.roomId) {
        q = query(q, where('roomId', '==', filters.roomId));
      }

      // Order by priority and creation date
      q = query(q, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MaintenanceTicket[];
    } catch (error) {
      console.error('Error getting maintenance tickets:', error);
      throw new Error('Failed to fetch maintenance tickets');
    }
  }

  /**
   * Get a single maintenance ticket by ID
   */
  async getTicketById(id: string): Promise<MaintenanceTicket | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as MaintenanceTicket;
    } catch (error) {
      console.error('Error getting maintenance ticket:', error);
      throw new Error('Failed to fetch maintenance ticket');
    }
  }

  /**
   * Create a new maintenance ticket and mark room as under maintenance
   */
  async createTicket(data: CreateMaintenanceTicketInput): Promise<string> {
    try {
      const now = Timestamp.now();

      const ticketData = removeUndefinedFields({
        ...data,
        status: data.status || 'open',
        priority: data.priority || 'normal',
        createdAt: now,
      });

      const docRef = await addDoc(
        collection(db, this.collectionName),
        ticketData
      );

      // Mark room as under maintenance (Requirement 8.7)
      await roomService.updateRoomStatus(data.roomId, 'maintenance');

      return docRef.id;
    } catch (error) {
      console.error('Error creating maintenance ticket:', error);
      throw error;
    }
  }

  /**
   * Update an existing maintenance ticket
   */
  async updateTicket(
    id: string,
    data: Partial<MaintenanceTicket>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Maintenance ticket not found');
      }

      await updateDoc(docRef, removeUndefinedFields(data));
    } catch (error) {
      console.error('Error updating maintenance ticket:', error);
      throw error;
    }
  }

  /**
   * Assign a ticket to a staff member or contractor
   */
  async assignTicket(id: string, assignedTo: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Maintenance ticket not found');
      }

      await updateDoc(docRef, {
        assignedTo,
        status: 'in-progress',
      });
    } catch (error) {
      console.error('Error assigning maintenance ticket:', error);
      throw error;
    }
  }

  /**
   * Resolve a maintenance ticket and update room status to clean
   */
  async resolveTicket(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Maintenance ticket not found');
      }

      const ticket = docSnap.data() as MaintenanceTicket;
      const now = Timestamp.now();

      await updateDoc(docRef, {
        status: 'resolved',
        resolvedAt: now,
      });

      // Update room status to clean when ticket is resolved (Requirement 8.8)
      await roomService.updateRoomStatus(ticket.roomId, 'vacant');
    } catch (error) {
      console.error('Error resolving maintenance ticket:', error);
      throw error;
    }
  }

  /**
   * Close a maintenance ticket
   */
  async closeTicket(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Maintenance ticket not found');
      }

      await updateDoc(docRef, {
        status: 'closed',
      });
    } catch (error) {
      console.error('Error closing maintenance ticket:', error);
      throw error;
    }
  }

  /**
   * Get open tickets
   */
  async getOpenTickets(hotelId: string): Promise<MaintenanceTicket[]> {
    return this.getTickets(hotelId, { status: 'open' });
  }

  /**
   * Get in-progress tickets
   */
  async getInProgressTickets(hotelId: string): Promise<MaintenanceTicket[]> {
    return this.getTickets(hotelId, { status: 'in-progress' });
  }

  /**
   * Get resolved tickets
   */
  async getResolvedTickets(hotelId: string): Promise<MaintenanceTicket[]> {
    return this.getTickets(hotelId, { status: 'resolved' });
  }

  /**
   * Get closed tickets
   */
  async getClosedTickets(hotelId: string): Promise<MaintenanceTicket[]> {
    return this.getTickets(hotelId, { status: 'closed' });
  }

  /**
   * Get tickets by priority
   */
  async getTicketsByPriority(
    hotelId: string,
    priority: MaintenanceTicket['priority']
  ): Promise<MaintenanceTicket[]> {
    return this.getTickets(hotelId, { priority });
  }

  /**
   * Get tickets assigned to a specific user
   */
  async getTicketsByAssignee(
    hotelId: string,
    assignedTo: string
  ): Promise<MaintenanceTicket[]> {
    return this.getTickets(hotelId, { assignedTo });
  }

  /**
   * Get tickets for a specific room
   */
  async getTicketsByRoom(
    hotelId: string,
    roomId: string
  ): Promise<MaintenanceTicket[]> {
    return this.getTickets(hotelId, { roomId });
  }
}

// Export singleton instance
export const maintenanceService = new MaintenanceService();