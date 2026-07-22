import { useState, useEffect, useCallback, useMemo } from 'react';
import transactionService from '../services/transaction.service';
import toast from 'react-hot-toast';

/**
 * Controller Hook: useTransactions
 * Manages all transaction state: loading, error, data, summary, filters, and viewMode.
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7), // default current month YYYY-MM
    type: 'all', // 'all' | 'expense' | 'income'
    categoryId: '',
    search: ''
  });

  // View mode: 'list' or 'calendar'
  const [viewMode, setViewMode] = useState('list');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        month: filters.month,
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.search.trim() !== '' && { search: filters.search.trim() })
      };

      const res = await transactionService.getAll(params);
      if (res.success) {
        setTransactions(res.data.transactions || []);
        setSummary(res.data.summary || { total_income: 0, total_expense: 0, balance: 0 });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không tải được danh sách giao dịch';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters.month, filters.type, filters.categoryId, filters.search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Group transactions by date for Calendar and Day view
  const groupedByDate = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const dateStr = t.transaction_date_str || t.transaction_date.slice(0, 10);
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(t);
    });
    return map;
  }, [transactions]);

  const createTransaction = async (data) => {
    const res = await transactionService.create(data);
    if (res.success) {
      toast.success(res.message || 'Thêm giao dịch thành công!');
      await fetchTransactions();
      return res.data.transaction;
    }
    throw new Error(res.message);
  };

  const updateTransaction = async (id, data) => {
    const res = await transactionService.update(id, data);
    if (res.success) {
      toast.success(res.message || 'Cập nhật giao dịch thành công!');
      await fetchTransactions();
    } else {
      throw new Error(res.message);
    }
  };

  const removeTransaction = async (id) => {
    const res = await transactionService.remove(id);
    if (res.success) {
      toast.success(res.message || 'Xóa giao dịch thành công!');
      await fetchTransactions();
    } else {
      throw new Error(res.message);
    }
  };

  return {
    transactions,
    summary,
    groupedByDate,
    loading,
    error,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
    removeTransaction
  };
}
