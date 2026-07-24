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
      // Set token to localStorage so subsequent API calls (like remember-device) can use it
      localStorage.setItem('token', res.data.token);
      // Return data but DO NOT set user state yet (to hold UI at LoginPage for RememberMe modal)
      return res;
    }
    throw new Error(res.message || 'Đăng nhập thất bại');
  };

  const completeLogin = (token, user) => {
    setToken(token);
    setUser(user);
    toast.success('Đăng nhập thành công!');
  };

  const register = async (fullName, email, password) => {
    const res = await authService.register({ fullName, email, password });
    if (res.success) {
      toast.success(res.message || 'Đăng ký thành công!');
      return res;
    }
    throw new Error(res.message || 'Đăng ký thất bại');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Server logout failed:', err);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Đã đăng xuất khỏi tài khoản');
  };

  const rememberDevice = async () => {
    return await authService.rememberDevice();
  };

  const verifyOtp = async (email, otp) => {
    const res = await authService.verifyOtp({ email, otp });
    if (res.success && res.data?.token) {
      localStorage.setItem('token', res.data.token);
      return res;
    }
    throw new Error(res.message || 'Xác thực OTP thất bại');
  };

  const resendOtp = async (email) => {
    const res = await authService.resendOtp({ email });
    if (res.success) {
      toast.success(res.message || 'Đã gửi lại mã OTP');
      return res;
    }
    throw new Error(res.message || 'Gửi lại OTP thất bại');
  };

  const forgotPassword = async (email) => {
    const res = await authService.forgotPassword({ email });
    if (res.success) {
      toast.success(res.message || 'Mã khôi phục đã được gửi');
      return res;
    }
    throw new Error(res.message || 'Yêu cầu thất bại');
  };

  const verifyResetOtp = async (email, otp) => {
    const res = await authService.verifyResetOtp({ email, otp });
    if (res.success) return res;
    throw new Error(res.message || 'Xác thực OTP thất bại');
  };

  const resetPassword = async (email, otp, newPassword) => {
    const res = await authService.resetPassword({ email, otp, newPassword });
    if (res.success && res.data?.token) {
      localStorage.setItem('token', res.data.token);
      return res;
    }
    throw new Error(res.message || 'Khôi phục thất bại');
  };

  const updateProfile = async (formData) => {
    const res = await authService.updateProfile(formData);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      toast.success(res.message || 'Cập nhật hồ sơ thành công');
      return res;
    }
    throw new Error(res.message || 'Cập nhật thất bại');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    completeLogin,
    register,
    logout,
    rememberDevice,
    verifyOtp,
    resendOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    updateProfile,
    updateUser: setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
