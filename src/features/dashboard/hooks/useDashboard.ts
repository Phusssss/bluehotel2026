import { useState, useEffect } from 'react';
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

  const fetchMetrics = async () => {
    if (!currentHotel) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardMetrics(currentHotel.id);
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [currentHotel?.id]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  };
}
