import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { deepRemoveUndefinedFields } from '../utils/firestore';
import type { Service } from '../types';

/**
 * Input data for creating a service
 */
export type CreateServiceInput = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Service class for managing services in Firestore
 */
export class ServiceService {
  private collectionName = 'services';

  /**
   * Get all services for a hotel
   */
  async getServices(hotelId: string): Promise<Service[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
    } catch (error) {
      console.error('Error getting services:', error);
      throw new Error('Failed to fetch services');
    }
  }

  /**
   * Get active services for a hotel
   */
  async getActiveServices(hotelId: string): Promise<Service[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('active', '==', true),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
    } catch (error) {
      console.error('Error getting active services:', error);
      throw new Error('Failed to fetch active services');
    }
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(id: string): Promise<Service | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Service;
    } catch (error) {
      console.error('Error getting service:', error);
      throw new Error('Failed to fetch service');
    }
  }

  /**
   * Create a new service
   */
  async createService(data: CreateServiceInput): Promise<string> {
    try {
      // Validate required fields
      if (!data.name || !data.price) {
        throw new Error('Name and price are required');
      }

      const now = Timestamp.now();

      const serviceData = deepRemoveUndefinedFields({
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(
        collection(db, this.collectionName),
        serviceData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Update an existing service
   */
  async updateService(id: string, data: Partial<Service>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Service not found');
      }

      await updateDoc(docRef, deepRemoveUndefinedFields({
        ...data,
        updatedAt: Timestamp.now(),
      }));
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Delete a service
   */
  async deleteService(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Service not found');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  /**
   * Toggle service active status
   */
  async toggleServiceStatus(id: string, active: boolean): Promise<void> {
    try {
      await this.updateService(id, { active });
    } catch (error) {
      console.error('Error toggling service status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceService = new ServiceService();
