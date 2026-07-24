import { useState, useEffect, useCallback } from 'react';
import transactionService from '../services/transaction.service';
import toast from 'react-hot-toast';

export function useQuickAdd(refreshTrigger) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionService.getQuickTemplates();
      if (res.success) {
        setTemplates(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải giao dịch nhanh');
      toast.error('Không thể tải các mẫu giao dịch nhanh');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, refreshTrigger]);

  return { templates, loading, error, refetchQuickAdd: fetchTemplates };
}
