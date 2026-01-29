import { useState, useEffect, useCallback } from 'react';
import { companyService, type CreateCompanyInput } from '../../../services/companyService';
import type { Company } from '../../../types';
import { useHotel } from '../../../contexts/HotelContext';

/**
 * Custom hook for managing companies
 */
export function useCompanies() {
  const { currentHotel } = useHotel();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all companies for the current hotel
   */
  const fetchCompanies = useCallback(async () => {
    if (!currentHotel) return;

    setLoading(true);
    setError(null);

    try {
      const data = await companyService.getCompanies(currentHotel.id);
      setCompanies(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  }, [currentHotel]);

  /**
   * Search companies by name, email, or tax ID
   */
  const searchCompanies = useCallback(
    async (searchTerm: string) => {
      if (!currentHotel) return;

      setLoading(true);
      setError(null);

      try {
        if (!searchTerm.trim()) {
          // If search term is empty, fetch all companies
          const data = await companyService.getCompanies(currentHotel.id);
          setCompanies(data);
        } else {
          const data = await companyService.searchCompanies(
            currentHotel.id,
            searchTerm
          );
          setCompanies(data);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error searching companies:', err);
      } finally {
        setLoading(false);
      }
    },
    [currentHotel]
  );

  /**
   * Create a new company
   */
  const createCompany = useCallback(
    async (data: Omit<CreateCompanyInput, 'hotelId'>) => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      const companyId = await companyService.createCompany({
        ...data,
        hotelId: currentHotel.id,
      });

      // Refresh the company list
      await fetchCompanies();

      return companyId;
    },
    [currentHotel, fetchCompanies]
  );

  /**
   * Update an existing company
   */
  const updateCompany = useCallback(
    async (id: string, data: Partial<Company>) => {
      await companyService.updateCompany(id, data);

      // Refresh the company list
      await fetchCompanies();
    },
    [fetchCompanies]
  );

  /**
   * Delete a company
   */
  const deleteCompany = useCallback(
    async (id: string) => {
      await companyService.deleteCompany(id);

      // Refresh the company list
      await fetchCompanies();
    },
    [fetchCompanies]
  );

  /**
   * Get company by ID
   */
  const getCompanyById = useCallback(
    async (id: string) => {
      return await companyService.getCompanyById(id);
    },
    []
  );

  // Fetch companies on mount and when hotel changes
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    searchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
  };
}
