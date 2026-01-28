import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { reservationService } from '../../../services/reservationService';
import { useHotel } from '../../../contexts/HotelContext';
import type { Reservation, ReservationFilters } from '../../../types';

export interface UseReservationsResult {
  reservations: Reservation[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  checkIn: (id: string) => Promise<void>;
  checkOut: (id: string) => Promise<void>;
}

export function useReservations(filters?: ReservationFilters): UseReservationsResult {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentHotel } = useHotel();
  const { t } = useTranslation('reservations');

  const fetchReservations = useCallback(async () => {
    if (!currentHotel) {
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await reservationService.getReservations(currentHotel.id, filters);
      setReservations(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      message.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [currentHotel, filters, t]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const refresh = useCallback(async () => {
    await fetchReservations();
  }, [fetchReservations]);

  const updateReservation = useCallback(async (id: string, data: Partial<Reservation>) => {
    try {
      await reservationService.updateReservation(id, data);
      message.success(t('messages.updateSuccess'));
      await refresh();
    } catch (err) {
      message.error(t('messages.updateError'));
      throw err;
    }
  }, [refresh, t]);

  const cancelReservation = useCallback(async (id: string) => {
    try {
      await reservationService.cancelReservation(id);
      message.success(t('messages.cancelSuccess'));
      await refresh();
    } catch (err) {
      message.error(t('messages.cancelError'));
      throw err;
    }
  }, [refresh, t]);

  const checkIn = useCallback(async (id: string) => {
    try {
      await reservationService.checkIn(id);
      message.success(t('messages.checkInSuccess'));
      await refresh();
    } catch (err) {
      message.error(t('messages.checkInError'));
      throw err;
    }
  }, [refresh, t]);

  const checkOut = useCallback(async (id: string) => {
    try {
      await reservationService.checkOut(id);
      message.success(t('messages.checkOutSuccess'));
      await refresh();
    } catch (err) {
      message.error(t('messages.checkOutError'));
      throw err;
    }
  }, [refresh, t]);

  return {
    reservations,
    loading,
    error,
    refresh,
    updateReservation,
    cancelReservation,
    checkIn,
    checkOut,
  };
}
