import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Check auth status on app startup if token exists
  useEffect(() => {
    async function checkCurrentAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authService.getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('[AuthContext] Token verification failed or expired:', err.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkCurrentAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.success && res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      toast.success(res.message || 'Đăng nhập thành công!');
      return res;
    }
    throw new Error(res.message || 'Đăng nhập thất bại');
  };

  const register = async (fullName, email, password) => {
    const res = await authService.register({ fullName, email, password });
    if (res.success) {
      toast.success(res.message || 'Đăng ký thành công!');
      return res;
    }
    throw new Error(res.message || 'Đăng ký thất bại');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Đã đăng xuất khỏi tài khoản');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
