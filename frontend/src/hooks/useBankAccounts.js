import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import bankAccountService from '../services/bankAccount.service';

export function useBankAccounts(enabled = true) {
  const [accounts, setAccounts] = useState([]);
  const [categoryRules, setCategoryRules] = useState([]);
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [response, rulesResponse] = await Promise.all([
        bankAccountService.getAll(),
        bankAccountService.getCategoryRules()
      ]);
      if (response.success) {
        setAccounts(response.data.accounts || []);
        setIntegration(response.data.integration || null);
      }
      if (rulesResponse.success) {
        setCategoryRules(rulesResponse.data.rules || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được liên kết ngân hàng');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const connectAccount = async (data) => {
    const response = await bankAccountService.connect(data);
    if (response.success) {
      toast.success(response.message || 'Đã liên kết VietinBank');
      await fetchAccounts();
    }
    return response;
  };

  const disconnectAccount = async (id) => {
    const response = await bankAccountService.disconnect(id);
    if (response.success) {
      toast.success(response.message || 'Đã ngắt liên kết VietinBank');
      await fetchAccounts();
    }
    return response;
  };

  const saveCategoryRule = async (data) => {
    const response = await bankAccountService.saveCategoryRule(data);
    if (response.success) {
      toast.success(response.message || 'Đã lưu mã phân loại');
      await fetchAccounts();
    }
    return response;
  };

  const deleteCategoryRule = async (id) => {
    const response = await bankAccountService.deleteCategoryRule(id);
    if (response.success) {
      toast.success(response.message || 'Đã xóa mã phân loại');
      await fetchAccounts();
    }
    return response;
  };

  return {
    accounts,
    categoryRules,
    integration,
    loading,
    connectAccount,
    disconnectAccount,
    saveCategoryRule,
    deleteCategoryRule
  };
}
