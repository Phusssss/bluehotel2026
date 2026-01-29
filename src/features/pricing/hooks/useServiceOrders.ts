import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHotel } from '../../../contexts/HotelContext';
import {
  serviceOrderService,
  CreateServiceOrderInput,
} from '../../../services/serviceOrderService';
import type { ServiceOrder } from '../../../types';

export interface UseServiceOrdersResult {
  loading: boolean;
  error: Error | null;
  createServiceOrder: (data: Omit<CreateServiceOrderInput, 'hotelId'>) => Promise<void>;
  updateServiceOrderStatus: (id: string, status: ServiceOrder['status']) => Promise<void>;
  cancelServiceOrder: (id: string) => Promise<void>;
  getServiceOrdersByReservation: (reservationId: string) => Promise<ServiceOrder[]>;
  calculateReservationCharges: (reservationId: string) => Promise<{
    roomCharge: number;
    serviceCharges: number;
    total: number;
  }>;
}

export function useServiceOrders(): UseServiceOrdersResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { currentHotel } = useHotel();
  const { t } = useTranslation('pricing');

  const createServiceOrder = useCallback(
    async (data: Omit<CreateServiceOrderInput, 'hotelId'>) => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      try {
        setLoading(true);
        setError(null);

        const orderData: CreateServiceOrderInput = {
          ...data,
          hotelId: currentHotel.id,
        };

        await serviceOrderService.createServiceOrder(orderData);
        message.success(t('serviceOrders.success.created'));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        message.error(error.message || t('serviceOrders.errors.createFailed'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentHotel, t]
  );

  const updateServiceOrderStatus = useCallback(
    async (id: string, status: ServiceOrder['status']) => {
      try {
        setLoading(true);
        setError(null);
        await serviceOrderService.updateServiceOrderStatus(id, status);
        message.success(t('serviceOrders.success.updated'));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        message.error(error.message || t('serviceOrders.errors.updateFailed'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const cancelServiceOrder = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        await serviceOrderService.cancelServiceOrder(id);
        message.success(t('serviceOrders.success.cancelled'));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        message.error(error.message || t('serviceOrders.errors.cancelFailed'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const getServiceOrdersByReservation = useCallback(
    async (reservationId: string): Promise<ServiceOrder[]> => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      try {
        setLoading(true);
        setError(null);
        const orders = await serviceOrderService.getServiceOrdersByReservation(
          currentHotel.id,
          reservationId
        );
        return orders;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        message.error(t('serviceOrders.errors.loadFailed'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentHotel, t]
  );

  const calculateReservationCharges = useCallback(
    async (reservationId: string) => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      try {
        setLoading(true);
        setError(null);
        const charges = await serviceOrderService.calculateReservationCharges(
          currentHotel.id,
          reservationId
        );
        return charges;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentHotel]
  );

  return {
    loading,
    error,
    createServiceOrder,
    updateServiceOrderStatus,
    cancelServiceOrder,
    getServiceOrdersByReservation,
    calculateReservationCharges,
  };
}
