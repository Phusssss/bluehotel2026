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
import type { HousekeepingTask } from '../types';
import { deepRemoveUndefinedFields } from '../utils/firestore';

/**
 * Filters for querying housekeeping tasks
 */
export interface HousekeepingTaskFilters {
  status?: HousekeepingTask['status'];
  assignedTo?: string;
  taskType?: HousekeepingTask['taskType'];
  priority?: HousekeepingTask['priority'];
}

/**
 * Input data for creating a housekeeping task
 */
export type CreateHousekeepingTaskInput = Omit<
  HousekeepingTask,
  'id' | 'createdAt' | 'completedAt'
>;

/**
 * Service class for managing housekeeping tasks in Firestore
 */
export class HousekeepingService {
  private collectionName = 'housekeepingTasks';

  /**
   * Get all housekeeping tasks for a hotel with optional filters
   */
  async getTasks(
    hotelId: string,
    filters?: HousekeepingTaskFilters
  ): Promise<HousekeepingTask[]> {
    try {
      let q: Query<DocumentData> = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId)
      );

      // Apply filters
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      if (filters?.taskType) {
        q = query(q, where('taskType', '==', filters.taskType));
      }
      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }

      // Order by priority and creation date
      q = query(q, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HousekeepingTask[];
    } catch (error) {
      console.error('Error getting housekeeping tasks:', error);
      throw new Error('Failed to fetch housekeeping tasks');
    }
  }

  /**
   * Get a single housekeeping task by ID
   */
  async getTaskById(id: string): Promise<HousekeepingTask | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as HousekeepingTask;
    } catch (error) {
      console.error('Error getting housekeeping task:', error);
      throw new Error('Failed to fetch housekeeping task');
    }
  }

  /**
   * Create a new housekeeping task
   */
  async createTask(data: CreateHousekeepingTaskInput): Promise<string> {
    try {
      const now = Timestamp.now();

      const taskData = deepRemoveUndefinedFields({
        ...data,
        status: data.status || 'pending',
        priority: data.priority || 'normal',
        createdAt: now,
      });

      const docRef = await addDoc(
        collection(db, this.collectionName),
        taskData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating housekeeping task:', error);
      throw error;
    }
  }

  /**
   * Update an existing housekeeping task
   */
  async updateTask(
    id: string,
    data: Partial<HousekeepingTask>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Housekeeping task not found');
      }

      await updateDoc(docRef, deepRemoveUndefinedFields(data));
    } catch (error) {
      console.error('Error updating housekeeping task:', error);
      throw error;
    }
  }

  /**
   * Assign a task to a staff member
   */
  async assignTask(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Housekeeping task not found');
      }

      await updateDoc(docRef, {
        assignedTo: userId,
        status: 'in-progress',
      });
    } catch (error) {
      console.error('Error assigning housekeeping task:', error);
      throw error;
    }
  }

  /**
   * Complete a housekeeping task and update room status
   */
  async completeTask(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Housekeeping task not found');
      }

      const now = Timestamp.now();

      await updateDoc(docRef, {
        status: 'completed',
        completedAt: now,
      });
    } catch (error) {
      console.error('Error completing housekeeping task:', error);
      throw error;
    }
  }

  /**
   * Get pending tasks (rooms requiring cleaning)
   */
  async getPendingTasks(hotelId: string): Promise<HousekeepingTask[]> {
    return this.getTasks(hotelId, { status: 'pending' });
  }

  /**
   * Get in-progress tasks
   */
  async getInProgressTasks(hotelId: string): Promise<HousekeepingTask[]> {
    return this.getTasks(hotelId, { status: 'in-progress' });
  }

  /**
   * Get completed tasks
   */
  async getCompletedTasks(hotelId: string): Promise<HousekeepingTask[]> {
    return this.getTasks(hotelId, { status: 'completed' });
  }

  /**
   * Get tasks assigned to a specific user
   */
  async getTasksByUser(
    hotelId: string,
    userId: string
  ): Promise<HousekeepingTask[]> {
    return this.getTasks(hotelId, { assignedTo: userId });
  }
}

// Export singleton instance
export const housekeepingService = new HousekeepingService();
