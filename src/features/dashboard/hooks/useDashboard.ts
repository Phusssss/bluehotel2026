import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardMetrics } from '../../../services/dashboardService';
import { useHotel } from '../../../contexts/HotelContext';

/**
 * Custom hook for dashboard metrics
 */
export function useDashboard() {
  const { currentHotel } = useHotel();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async (showLoading = true) => {
    if (!currentHotel) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const data = await dashboardService.getDashboardMetrics(currentHotel.id);
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentHotel]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refresh = useCallback(async () => {
    if (currentHotel) {
      // Clear cache before refreshing
      dashboardService.clearCache(currentHotel.id);
      await fetchMetrics(false); // Don't show loading spinner for refresh
    }
  }, [currentHotel, fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh,
  };
}
