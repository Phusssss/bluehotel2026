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
import type { Company } from '../types';
import { deepRemoveUndefinedFields } from '../utils/firestore';

/**
 * Input data for creating a company
 */
export type CreateCompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Service class for managing companies in Firestore
 */
export class CompanyService {
  private collectionName = 'companies';

  /**
   * Get all companies for a hotel
   */
  async getCompanies(hotelId: string): Promise<Company[]> {
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
      })) as Company[];
    } catch (error) {
      console.error('Error getting companies:', error);
      throw new Error('Failed to fetch companies');
    }
  }

  /**
   * Get a single company by ID
   */
  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Company;
    } catch (error) {
      console.error('Error getting company:', error);
      throw new Error('Failed to fetch company');
    }
  }

  /**
   * Search companies by name, email, or tax ID
   */
  async searchCompanies(
    hotelId: string,
    searchTerm: string
  ): Promise<Company[]> {
    try {
      // Get all companies for the hotel
      const allCompanies = await this.getCompanies(hotelId);

      // Filter companies based on search term
      const searchLower = searchTerm.toLowerCase();
      return allCompanies.filter((company) => {
        const nameMatch = company.name.toLowerCase().includes(searchLower);
        const emailMatch = company.email.toLowerCase().includes(searchLower);
        const taxIdMatch = company.taxId.toLowerCase().includes(searchLower);

        return nameMatch || emailMatch || taxIdMatch;
      });
    } catch (error) {
      console.error('Error searching companies:', error);
      throw new Error('Failed to search companies');
    }
  }

  /**
   * Get company by tax ID
   */
  async getCompanyByTaxId(
    hotelId: string,
    taxId: string
  ): Promise<Company | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('taxId', '==', taxId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Company;
    } catch (error) {
      console.error('Error getting company by tax ID:', error);
      throw new Error('Failed to fetch company');
    }
  }

  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyInput): Promise<string> {
    try {
      // Validate required fields
      if (!data.name || !data.taxId || !data.address || !data.phone || !data.email) {
        throw new Error('Name, tax ID, address, phone, and email are required');
      }

      // Check if company with same tax ID already exists
      const existingCompany = await this.getCompanyByTaxId(
        data.hotelId,
        data.taxId
      );

      if (existingCompany) {
        throw new Error('Company with this tax ID already exists');
      }

      const now = Timestamp.now();

      const companyData = deepRemoveUndefinedFields({
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(
        collection(db, this.collectionName),
        companyData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  /**
   * Update an existing company
   */
  async updateCompany(id: string, data: Partial<Company>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Company not found');
      }

      // If tax ID is being changed, check for duplicates
      if (data.taxId) {
        const company = docSnap.data() as Company;
        const existingCompany = await this.getCompanyByTaxId(
          company.hotelId,
          data.taxId
        );

        if (existingCompany && existingCompany.id !== id) {
          throw new Error('Company with this tax ID already exists');
        }
      }

      await updateDoc(docRef, deepRemoveUndefinedFields({
        ...data,
        updatedAt: Timestamp.now(),
      }));
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Company not found');
      }

      // Check if company has any linked customers
      const customersQuery = query(
        collection(db, 'customers'),
        where('companyId', '==', id)
      );

      const customersSnapshot = await getDocs(customersQuery);

      if (!customersSnapshot.empty) {
        throw new Error('Cannot delete company with linked customers');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  /**
   * Get total company count for a hotel
   */
  async getTotalCompanyCount(hotelId: string): Promise<number> {
    try {
      const companies = await this.getCompanies(hotelId);
      return companies.length;
    } catch (error) {
      console.error('Error getting total company count:', error);
      throw new Error('Failed to get company count');
    }
  }

  /**
   * Check if company exists by tax ID
   */
  async companyExists(hotelId: string, taxId: string): Promise<boolean> {
    try {
      const company = await this.getCompanyByTaxId(hotelId, taxId);
      return company !== null;
    } catch (error) {
      console.error('Error checking if company exists:', error);
      throw new Error('Failed to check company existence');
    }
  }
}

// Export singleton instance
export const companyService = new CompanyService();
