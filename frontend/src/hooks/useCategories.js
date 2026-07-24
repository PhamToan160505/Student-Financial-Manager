import { useState, useEffect, useCallback } from 'react';
import categoryService from '../services/category.service';
import toast from 'react-hot-toast';

/**
 * Controller Hook: useCategories
 * Manages all category state: loading, error, data, and CRUD actions.
 * Pages/Components import this hook — never call categoryService directly.
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [expense, setExpense] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoryService.getAll();
      if (res.success) {
        setCategories(res.data.categories);
        setExpense(res.data.expense);
        setIncome(res.data.income);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không tải được danh mục';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (data) => {
    try {
      const res = await categoryService.create(data);
      if (res.success) {
        toast.success(res.message || 'Tạo danh mục thành công!');
        await fetchCategories();
        return res.data.category;
      }
      throw new Error(res.message);
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    }
  };

  const updateCategory = async (id, data) => {
    try {
      const res = await categoryService.update(id, data);
      if (res.success) {
        toast.success(res.message || 'Cập nhật danh mục thành công!');
        await fetchCategories();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    }
  };

  const removeCategory = async (id) => {
    try {
      const res = await categoryService.remove(id);
      if (res.success) {
        toast.success(res.message || 'Xóa danh mục thành công!');
        await fetchCategories();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    }
  };

  return {
    categories,
    expense,
    income,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    removeCategory
  };
}
