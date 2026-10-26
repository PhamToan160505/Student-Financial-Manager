import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import bankAccountService from '../services/bankAccount.service';

export function useBankAccounts(enabled = true) {
  const [accounts, setAccounts] = useState([]);
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await bankAccountService.getAll();
      if (response.success) {
        setAccounts(response.data.accounts || []);
        setIntegration(response.data.integration || null);
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

  return {
    accounts,
    integration,
    loading,
    connectAccount,
    disconnectAccount
  };
}
