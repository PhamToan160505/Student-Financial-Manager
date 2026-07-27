import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboard.service';
import toast from 'react-hot-toast';

/**
 * Controller Hook: useDashboard
 * Manages statistics data, cashflow forecast, AI advisory, loading, error, and month selection.
 */
export function useDashboard() {
  const [stats, setStats] = useState({
    summary: {
      total_income: 0,
      total_expense: 0,
      balance: 0,
      savings_rate: null,
      income_change: { value: 0, is_new: false },
      expense_change: { value: 0, is_new: false }
    },
    categoryBreakdown: [],
    dailyTrend: [],
    sixMonthTrend: [],
    recentTransactions: []
  });

  const [forecast, setForecast] = useState(null);
  const [insight, setInsight] = useState(null);

  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchStatsAndForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, forecastRes] = await Promise.all([
        dashboardService.getStats(month),
        dashboardService.getForecast(month)
      ]);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (forecastRes.success && forecastRes.data) {
        setForecast(forecastRes.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không tải được thống kê Dashboard';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [month]);

  const fetchInsight = useCallback(async () => {
    setInsightLoading(true);
    try {
      const res = await dashboardService.getInsight(month);
      if (res.success && res.data) {
        setInsight(res.data);
      }
    } catch (err) {
      console.warn('[useDashboard] Insight fetch warning:', err.message);
    } finally {
      setInsightLoading(false);
    }
  }, [month]);

  const fetchAvailableBalance = useCallback(async () => {
    try {
      const res = await dashboardService.getAvailableBalance(month);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[useDashboard] Available balance fetch warning:', err.message);
    }
    return null;
  }, [month]);

  const fetchAll = useCallback(async () => {
    fetchStatsAndForecast();
    fetchInsight();
  }, [fetchStatsAndForecast, fetchInsight]);

  useEffect(() => {
    fetchAll();
    
    // Auto-refresh when AI Chat creates budget/transaction
    const handleUpdate = () => fetchAll();
    window.addEventListener('financial-data-updated', handleUpdate);
    return () => window.removeEventListener('financial-data-updated', handleUpdate);
  }, [fetchAll]);

  return {
    stats,
    forecast,
    insight,
    loading,
    insightLoading,
    error,
    month,
    setMonth,
    refetch: fetchAll,
    refetchInsight: fetchInsight,
    fetchAvailableBalance
  };
}
