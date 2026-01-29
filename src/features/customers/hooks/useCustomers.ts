import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../../../services/customerService';
import type { Customer, CreateCustomerInput } from '../../../types';
import { useHotel } from '../../../contexts/HotelContext';

/**
 * Custom hook for managing customers
 */
export function useCustomers() {
  const { currentHotel } = useHotel();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all customers for the current hotel
   */
  const fetchCustomers = useCallback(async () => {
    if (!currentHotel) return;

    setLoading(true);
    setError(null);

    try {
      const data = await customerService.getCustomers(currentHotel.id);
      setCustomers(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [currentHotel]);

  /**
   * Search customers by name, email, or phone
   */
  const searchCustomers = useCallback(
    async (searchTerm: string) => {
      if (!currentHotel) return;

      setLoading(true);
      setError(null);

      try {
        if (!searchTerm.trim()) {
          // If search term is empty, fetch all customers
          const data = await customerService.getCustomers(currentHotel.id);
          setCustomers(data);
        } else {
          const data = await customerService.searchCustomers(
            currentHotel.id,
            searchTerm
          );
          setCustomers(data);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error searching customers:', err);
      } finally {
        setLoading(false);
      }
    },
    [currentHotel]
  );

  /**
   * Create a new customer
   */
  const createCustomer = useCallback(
    async (data: Omit<CreateCustomerInput, 'hotelId'>) => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      const customerId = await customerService.createCustomer({
        ...data,
        hotelId: currentHotel.id,
      });

      // Refresh the customer list
      await fetchCustomers();

      return customerId;
    },
    [currentHotel, fetchCustomers]
  );

  /**
   * Update an existing customer
   */
  const updateCustomer = useCallback(
    async (id: string, data: Partial<Customer>) => {
      await customerService.updateCustomer(id, data);

      // Refresh the customer list
      await fetchCustomers();
    },
    [fetchCustomers]
  );

  /**
   * Delete a customer
   */
  const deleteCustomer = useCallback(
    async (id: string) => {
      await customerService.deleteCustomer(id);

      // Refresh the customer list
      await fetchCustomers();
    },
    [fetchCustomers]
  );

  /**
   * Get customer by ID
   */
  const getCustomerById = useCallback(
    async (id: string) => {
      return await customerService.getCustomerById(id);
    },
    []
  );

  // Fetch customers on mount and when hotel changes
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
  };
}
