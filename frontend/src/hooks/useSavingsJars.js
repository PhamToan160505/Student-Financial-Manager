import { useState, useCallback } from 'react';
import api from '../services/api';

export function useSavingsJars() {
  const [jars, setJars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/jars');
      if (response.success) {
        setJars(response.data?.jars || []);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách hũ tiết kiệm');
    } finally {
      setLoading(false);
    }
  }, []);

  const createJar = async (jarData) => {
    const response = await api.post('/jars', jarData);
    if (response.success) {
      await fetchJars();
    }
    return response;
  };

  const updateJar = async (id, jarData) => {
    const response = await api.patch(`/jars/${id}`, jarData);
    if (response.success) {
      await fetchJars();
    }
    return response;
  };

  const deleteJar = async (id) => {
    const response = await api.delete(`/jars/${id}`);
    if (response.success) {
      await fetchJars();
    }
    return response;
  };

  const deposit = async (id, data) => {
    const response = await api.post(`/jars/${id}/deposit`, data);
    if (response.success) {
      await fetchJars();
    }
    return response;
  };

  const withdraw = async (id, data) => {
    const response = await api.post(`/jars/${id}/withdraw`, data);
    if (response.success) {
      await fetchJars();
    }
    return response;
  };

  return {
    jars,
    loading,
    error,
    fetchJars,
    createJar,
    updateJar,
    deleteJar,
    deposit,
    withdraw
  };
}
