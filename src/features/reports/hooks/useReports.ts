import { useState, useCallback } from 'react';
import { reportService, type OccupancyReportData, type OccupancyReportFilters, type RevenueReportData, type RevenueReportFilters, type ReservationReportData, type ReservationReportFilters } from '../../../services/reportService';
import { useHotel } from '../../../contexts/HotelContext';

/**
 * Custom hook for managing reports
 */
export function useReports() {
  const { currentHotel } = useHotel();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Generate occupancy report
   */
  const generateOccupancyReport = useCallback(
    async (filters: OccupancyReportFilters): Promise<OccupancyReportData[]> => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      setLoading(true);
      setError(null);

      try {
        const reportData = await reportService.generateOccupancyReport(currentHotel.id, filters);
        return reportData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate occupancy report');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentHotel]
  );

  /**
   * Get occupancy summary
   */
  const getOccupancySummary = useCallback(
    async (filters: OccupancyReportFilters) => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      setLoading(true);
      setError(null);

      try {
        const summary = await reportService.getOccupancySummary(currentHotel.id, filters);
        return summary;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get occupancy summary');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentHotel]
  );

  /**
   * Generate revenue report
   */
  const generateRevenueReport = useCallback(
    async (filters: RevenueReportFilters): Promise<RevenueReportData> => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      setLoading(true);
      setError(null);

      try {
        const reportData = await reportService.generateRevenueReport(currentHotel.id, filters);
        return reportData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate revenue report');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentHotel]
  );

  /**
   * Generate reservation report
   */
  const generateReservationReport = useCallback(
    async (filters: ReservationReportFilters): Promise<ReservationReportData> => {
      if (!currentHotel) {
        throw new Error('No hotel selected');
      }

      setLoading(true);
      setError(null);

      try {
        const reportData = await reportService.generateReservationReport(currentHotel.id, filters);
        return reportData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate reservation report');
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
    generateOccupancyReport,
    getOccupancySummary,
    generateRevenueReport,
    generateReservationReport,
  };
}