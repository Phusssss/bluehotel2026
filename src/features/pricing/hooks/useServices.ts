import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHotel } from '../../../contexts/HotelContext';
import { serviceService, CreateServiceInput } from '../../../services/serviceService';
import type { Service } from '../../../types';

export interface UseServicesResult {
  services: Service[];
  loading: boolean;
  error: Error | null;
  createService: (data: CreateServiceInput) => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string, active: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useServices(): UseServicesResult {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentHotel } = useHotel();
  const { t } = useTranslation('pricing');

  const loadServices = useCallback(async () => {
    if (!currentHotel) {
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await serviceService.getServices(currentHotel.id);
      setServices(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      message.error(t('services.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [currentHotel, t]);

  const createService = useCallback(
    async (data: CreateServiceInput) => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      try {
        const serviceData = {
          ...data,
          hotelId: currentHotel.id,
        };

        await serviceService.createService(serviceData);
        message.success(t('services.success.created'));
        await loadServices();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        message.error(error.message || t('services.errors.createFailed'));
        throw error;
      }
    },
    [currentHotel, t, loadServices]
  );

  const updateService = useCallback(
    async (id: string, data: Partial<Service>) => {
      try {
        await serviceService.updateService(id, data);
        message.success(t('services.success.updated'));
        await loadServices();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        message.error(error.message || t('services.errors.updateFailed'));
        throw error;
      }
    },
    [t, loadServices]
  );

  const deleteService = useCallback(
    async (id: string) => {
      try {
        await serviceService.deleteService(id);
        message.success(t('services.success.deleted'));
        await loadServices();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        message.error(error.message || t('services.errors.deleteFailed'));
        throw error;
      }
    },
    [t, loadServices]
  );

  const toggleServiceStatus = useCallback(
    async (id: string, active: boolean) => {
      try {
        await serviceService.toggleServiceStatus(id, active);
        message.success(
          active
            ? t('services.success.activated')
            : t('services.success.deactivated')
        );
        await loadServices();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        message.error(error.message || t('services.errors.toggleFailed'));
        throw error;
      }
    },
    [t, loadServices]
  );

  const refresh = useCallback(async () => {
    await loadServices();
  }, [loadServices]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    refresh,
  };
}
