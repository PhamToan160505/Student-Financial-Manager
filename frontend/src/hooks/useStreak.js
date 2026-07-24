import { useState, useEffect, useCallback } from 'react';
import transactionService from '../services/transaction.service';
import toast from 'react-hot-toast';

export function useStreak() {
  const [streakData, setStreakData] = useState({ currentStreak: 0, isActiveToday: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStreak = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionService.getStreak();
      if (res.success) {
        setStreakData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải chuỗi ngày');
      // No need to spam toast for streak failure, just log or fail silently for UX
      console.warn('Failed to load streak:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return { streakData, loading, error, refetchStreak: fetchStreak };
}
