import React, { useState } from 'react';
import { useAuth } from '../controllers/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import { Mail, Lock, User, Wallet, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (isRegistering && !formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên của bạn';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (isRegistering && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (isRegistering && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isRegistering) {
        await register(formData.fullName, formData.email, formData.password);
        // Switch to login tab after successful registration and prefill email
        setIsRegistering(false);
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-bg via-white to-primary-light/40 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-maintext tracking-tight">
            Quản Lý Tài Chính
          </h1>
          <p className="text-sm text-neutral-subtext mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Dành riêng cho sinh viên & freelancer</span>
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-neutral-border/80 p-0 overflow-hidden">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 bg-neutral-bg/80 p-1.5 border-b border-neutral-border m-2 rounded-xl">
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setErrors({}); }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                !isRegistering
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-neutral-subtext hover:text-neutral-maintext'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setErrors({}); }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                isRegistering
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-neutral-subtext hover:text-neutral-maintext'
              }`}
            >
              Đăng ký tài khoản
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isRegistering && (
              <Input
                id="fullName"
                label="Họ và tên sinh viên"
                placeholder="Nguyễn Văn A"
                icon={User}
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                required
              />
            )}

            <Input
              id="email"
              type="email"
              label="Địa chỉ Email"
              placeholder="student@example.edu.vn"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <Input
              id="password"
              type="password"
              label="Mật khẩu"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            {isRegistering && (
              <Input
                id="confirmPassword"
                type="password"
                label="Xác nhận mật khẩu"
                placeholder="••••••••"
                icon={Lock}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
              >
                <span>{isRegistering ? 'Tạo tài khoản ngay' : 'Đăng nhập vào hệ thống'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>

          {/* Security badge in card footer */}
          <div className="px-6 py-3.5 bg-neutral-bg/60 border-t border-neutral-border/60 flex items-center justify-center gap-2 text-xs text-neutral-subtext">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Mã hóa Bcrypt • Bảo mật JWT Stateless • Rate Limit</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
