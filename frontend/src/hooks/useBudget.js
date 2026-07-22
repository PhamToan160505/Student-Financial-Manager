import { useState, useCallback, useEffect } from 'react';
import budgetService from '../services/budget.service';
import dashboardService from '../services/dashboard.service';
import toast from 'react-hot-toast';

/**
 * useBudget hook - Controller layer coordinating budget state, cashflow forecast, and API calls
 */
export default function useBudget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [budgets, setBudgets] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [summary, setSummary] = useState({
    total_budget: 0,
    total_spent_budgeted: 0,
    total_spent_all: 0,
    remaining: 0
  });
  const [forecast, setForecast] = useState(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, forecastRes] = await Promise.all([
        budgetService.getBudgetsByMonth(month),
        dashboardService.getForecast(month)
      ]);

      if (res && res.success) {
        setBudgets(res.data.budgets || []);
        setWarnings(res.data.warnings || []);
        setSummary(res.data.summary || {
          total_budget: 0,
          total_spent_budgeted: 0,
          total_spent_all: 0,
          remaining: 0
        });
      }

      if (forecastRes && forecastRes.success) {
        setForecast(forecastRes.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lấy dữ liệu ngân sách thất bại';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const upsertBudget = async ({ category_id, amount, targetMonth }) => {
    try {
      const payload = {
        category_id,
        amount,
        month: targetMonth || month
      };
      const res = await budgetService.upsertBudget(payload);
      toast.success(res.message || 'Thiết lập hạn mức ngân sách thành công');
      await fetchBudgets();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Thiết lập hạn mức ngân sách thất bại';
      toast.error(msg);
      return false;
    }
  };

  const deleteBudget = async (id) => {
    try {
      const res = await budgetService.deleteBudget(id);
      toast.success(res.message || 'Xóa hạn mức ngân sách thành công');
      await fetchBudgets();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Xóa hạn mức ngân sách thất bại';
      toast.error(msg);
      return false;
    }
  };

  return {
    loading,
    error,
    month,
    setMonth,
    budgets,
    warnings,
    summary,
    forecast,
    fetchBudgets,
    upsertBudget,
    deleteBudget
  };
}
