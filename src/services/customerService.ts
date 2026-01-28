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
import type { Customer, CreateCustomerInput, Reservation } from '../types';
import { removeUndefinedFields } from '../utils/firestore';

/**
 * Service class for managing customers in Firestore
 */
export class CustomerService {
  private collectionName = 'customers';

  /**
   * Get all customers for a hotel
   */
  async getCustomers(hotelId: string): Promise<Customer[]> {
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
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Customer;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw new Error('Failed to fetch customer');
    }
  }

  /**
   * Search customers by name, email, or phone
   */
  async searchCustomers(
    hotelId: string,
    searchTerm: string
  ): Promise<Customer[]> {
    try {
      // Get all customers for the hotel
      const allCustomers = await this.getCustomers(hotelId);

      // Filter customers based on search term
      const searchLower = searchTerm.toLowerCase();
      return allCustomers.filter((customer) => {
        const nameMatch = customer.name.toLowerCase().includes(searchLower);
        const emailMatch = customer.email.toLowerCase().includes(searchLower);
        const phoneMatch = customer.phone.toLowerCase().includes(searchLower);

        return nameMatch || emailMatch || phoneMatch;
      });
    } catch (error) {
      console.error('Error searching customers:', error);
      throw new Error('Failed to search customers');
    }
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(
    hotelId: string,
    email: string
  ): Promise<Customer | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('email', '==', email)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Customer;
    } catch (error) {
      console.error('Error getting customer by email:', error);
      throw new Error('Failed to fetch customer');
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerInput): Promise<string> {
    try {
      // Validate required fields
      if (!data.name || !data.email || !data.phone) {
        throw new Error('Name, email, and phone are required');
      }

      // Check if customer with same email already exists
      const existingCustomer = await this.getCustomerByEmail(
        data.hotelId,
        data.email
      );

      if (existingCustomer) {
        throw new Error('Customer with this email already exists');
      }

      const now = Timestamp.now();

      const customerData = removeUndefinedFields({
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(
        collection(db, this.collectionName),
        customerData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Customer not found');
      }

      // If email is being changed, check for duplicates
      if (data.email) {
        const customer = docSnap.data() as Customer;
        const existingCustomer = await this.getCustomerByEmail(
          customer.hotelId,
          data.email
        );

        if (existingCustomer && existingCustomer.id !== id) {
          throw new Error('Customer with this email already exists');
        }
      }

      await updateDoc(docRef, removeUndefinedFields({
        ...data,
        updatedAt: Timestamp.now(),
      }));
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Customer not found');
      }

      // Check if customer has any reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('customerId', '==', id)
      );

      const reservationsSnapshot = await getDocs(reservationsQuery);

      if (!reservationsSnapshot.empty) {
        throw new Error('Cannot delete customer with existing reservations');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Get customer booking history
   */
  async getCustomerBookingHistory(customerId: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, 'reservations'),
        where('customerId', '==', customerId),
        orderBy('checkInDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];
    } catch (error) {
      console.error('Error getting customer booking history:', error);
      throw new Error('Failed to fetch booking history');
    }
  }

  /**
   * Get customers by company
   */
  async getCustomersByCompany(
    hotelId: string,
    companyId: string
  ): Promise<Customer[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('companyId', '==', companyId),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers by company:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  /**
   * Get total customer count for a hotel
   */
  async getTotalCustomerCount(hotelId: string): Promise<number> {
    try {
      const customers = await this.getCustomers(hotelId);
      return customers.length;
    } catch (error) {
      console.error('Error getting total customer count:', error);
      throw new Error('Failed to get customer count');
    }
  }

  /**
   * Check if customer exists by email
   */
  async customerExists(hotelId: string, email: string): Promise<boolean> {
    try {
      const customer = await this.getCustomerByEmail(hotelId, email);
      return customer !== null;
    } catch (error) {
      console.error('Error checking if customer exists:', error);
      throw new Error('Failed to check customer existence');
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();
