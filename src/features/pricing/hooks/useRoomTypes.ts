import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHotel } from '../../../contexts/HotelContext';
import { roomTypeService } from '../../../services/roomTypeService';
import type { RoomType, CreateRoomTypeInput } from '../../../types';

export interface UseRoomTypesResult {
  roomTypes: RoomType[];
  loading: boolean;
  error: Error | null;
  createRoomType: (data: CreateRoomTypeInput) => Promise<void>;
  updateRoomType: (id: string, data: Partial<RoomType>) => Promise<void>;
  deleteRoomType: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRoomTypes(): UseRoomTypesResult {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentHotel } = useHotel();
  const { t } = useTranslation('pricing');

  const loadRoomTypes = useCallback(async () => {
    if (!currentHotel) {
      setRoomTypes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await roomTypeService.getRoomTypes(currentHotel.id);
      setRoomTypes(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      message.error(t('roomTypes.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [currentHotel, t]);

  const createRoomType = useCallback(
    async (data: CreateRoomTypeInput) => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      try {
        const roomTypeData = {
          ...data,
          hotelId: currentHotel.id,
        };

        await roomTypeService.createRoomType(roomTypeData);
        message.success(t('roomTypes.success.created'));
        await loadRoomTypes();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        message.error(error.message || t('roomTypes.errors.createFailed'));
        throw error;
      }
    },
    [currentHotel, t, loadRoomTypes]
  );

  const updateRoomType = useCallback(
    async (id: string, data: Partial<RoomType>) => {
      try {
        await roomTypeService.updateRoomType(id, data);
        message.success(t('roomTypes.success.updated'));
        await loadRoomTypes();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        message.error(error.message || t('roomTypes.errors.updateFailed'));
        throw error;
      }
    },
    [t, loadRoomTypes]
  );

  const deleteRoomType = useCallback(
    async (id: string) => {
      try {
        await roomTypeService.deleteRoomType(id);
        message.success(t('roomTypes.success.deleted'));
        await loadRoomTypes();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        message.error(error.message || t('roomTypes.errors.deleteFailed'));
        throw error;
      }
    },
    [t, loadRoomTypes]
  );

  const refresh = useCallback(async () => {
    await loadRoomTypes();
  }, [loadRoomTypes]);

  useEffect(() => {
    loadRoomTypes();
  }, [loadRoomTypes]);

  return {
    roomTypes,
    loading,
    error,
    createRoomType,
    updateRoomType,
    deleteRoomType,
    refresh,
  };
}