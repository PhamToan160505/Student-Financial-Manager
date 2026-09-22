import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../controllers/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import { Mail, Lock, User, Wallet, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import VerifyOtpForm from '../components/auth/VerifyOtpForm';

function PasswordStrengthIndicator({ password }) {
  const criteria = [
    { label: 'Ít nhất 8 ký tự', met: password.length >= 8 },
    { label: 'Ít nhất 1 chữ in hoa', met: /[A-Z]/.test(password) },
    { label: 'Ít nhất 1 chữ thường', met: /[a-z]/.test(password) },
    { label: 'Ít nhất 1 chữ số', met: /[0-9]/.test(password) },
    { label: 'Ít nhất 1 ký tự đặc biệt', met: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`;']/.test(password) }
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5 p-3 bg-neutral-bg/50 rounded-lg border border-neutral-border">
      <p className="text-xs font-semibold text-neutral-maintext mb-2">Yêu cầu mật khẩu:</p>
      {criteria.map((c, i) => (
        <div key={i} className={`flex items-center gap-2 text-xs ${c.met ? 'text-green-600' : 'text-neutral-subtext'}`}>
          {c.met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
          <span>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function LoginPage({ initialMode = 'login' }) {
  const { login, register, completeLogin, rememberDevice, verifyOtp, resendOtp, forgotPassword, resetPassword, verifyResetOtp } = useAuth();
  
  // 'login', 'register', 'verify_otp', 'forgot_email', 'forgot_otp', 'reset_password'
  const [authMode, setAuthMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const savedEmail = localStorage.getItem('rememberedEmail') || '';
  const [rememberMe, setRememberMe] = useState(!!savedEmail);
  
  useEffect(() => {
    // Purge any legacy stored raw password credential from localStorage
    localStorage.removeItem('rememberedPassword');
  }, []);

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: savedEmail,
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

  const isPasswordStrong = (pwd) => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`;']/.test(pwd);
  };

  const validateForm = () => {
    const newErrors = {};
    if (authMode === 'register') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Vui lòng nhập họ tên của bạn';
      } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.fullName)) {
        newErrors.fullName = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
      } else if (formData.fullName.length > 50) {
        newErrors.fullName = 'Họ tên tối đa 50 ký tự';
      }
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (authMode === 'login') {
      if (!formData.password.trim()) {
        newErrors.password = 'Vui lòng nhập mật khẩu hợp lệ (không chứa toàn khoảng trắng)';
      } else if (formData.password.length > 30) {
        newErrors.password = 'Mật khẩu tối đa 30 ký tự';
      }
    }

    if (authMode === 'register' || authMode === 'reset_password') {
      if (!formData.password.trim()) {
        newErrors.password = 'Vui lòng nhập mật khẩu hợp lệ (không chứa toàn khoảng trắng)';
      } else if (formData.password.length > 30) {
        newErrors.password = 'Mật khẩu tối đa 30 ký tự';
      } else if (!isPasswordStrong(formData.password)) {
        newErrors.password = 'Mật khẩu chưa đủ mạnh';
      }
    }
    
    if ((authMode === 'register' || authMode === 'reset_password') && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processLoginSuccess = async (res) => {
    if (rememberMe) {
      try {
        localStorage.setItem('rememberedEmail', formData.email);
        await rememberDevice();
      } catch {
        toast.error('Lỗi khi lưu phiên đăng nhập');
      }
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    localStorage.removeItem('rememberedPassword');
    completeLogin(res.data.token, res.data.user);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await login(formData.email, formData.password);
      if (res.data && res.data.token) {
        await processLoginSuccess(res);
      }
    } catch (err) {
      if (err.response?.data?.requires_verification) {
        toast.error(err.response.data.message || 'Tài khoản chưa xác thực email');
        setAuthMode('verify_otp');
      } else {
        const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra, vui lòng thử lại';
        toast.error(msg);
        setErrors(prev => ({ ...prev, password: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(formData.fullName, formData.email, formData.password);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      switchMode('login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      toast.error(msg);
      setErrors(prev => ({ ...prev, email: msg }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    setLoading(true);
    try {
      if (authMode === 'verify_otp') {
        const res = await verifyOtp(formData.email, otp);
        if (res.data && res.data.token) {
          await processLoginSuccess(res);
        }
      } else if (authMode === 'forgot_otp') {
        const res = await verifyResetOtp(formData.email, otp);
        if (res.success) {
          setFormData(prev => ({ ...prev, currentOtp: otp }));
          setAuthMode('reset_password');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Xác thực OTP thất bại';
      toast.error(msg);
      setErrors(prev => ({ ...prev, otp: msg }));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      if (authMode === 'forgot_otp') {
        await forgotPassword(formData.email);
      } else {
        await resendOtp(formData.email);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setErrors({ email: 'Vui lòng nhập email' });
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(formData.email);
      setFormData(prev => ({ ...prev, currentOtp: '000000' }));
      setAuthMode('reset_password');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Yêu cầu thất bại';
      toast.error(msg);
      setErrors(prev => ({ ...prev, email: msg }));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await resetPassword(formData.email, formData.currentOtp, formData.password);
      if (res.data && res.data.token) {
        await processLoginSuccess(res);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Khôi phục thất bại';
      toast.error(msg);
      setErrors(prev => ({ ...prev, confirmPassword: msg }));
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const switchMode = (mode) => {
    setAuthMode(mode);
    setErrors({});
    if (mode === 'login') {
      navigate('/login', { replace: true });
    } else if (mode === 'register') {
      navigate('/register', { replace: true });
    } else if (mode === 'forgot_email') {
      navigate('/forgot-password', { replace: true });
    }
  };

  return (
    <main id="main-content" className="min-h-[100dvh] overflow-x-hidden bg-neutral-bg p-3 sm:p-5 lg:p-6 font-sans">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-7xl overflow-hidden rounded-[2rem] bg-white/80 shadow-lg sm:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-primary-dark p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border-[70px] border-white/[0.035]" />
          <div className="absolute -bottom-36 -left-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-primary-dark shadow-md">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold tracking-[-0.03em]">Ví Sinh Viên</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Quản lý tài chính</p>
            </div>
          </div>

          <div className="relative max-w-xl py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/75">
              <Sparkles className="h-3.5 w-3.5 text-warning" /> Thiết kế cho nhịp sống sinh viên
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.08] tracking-[-0.055em] xl:text-6xl">
              Hiểu tiền của bạn.<br /><span className="text-[#9DD2C4]">Sống nhẹ đầu hơn.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/65">
              Theo dõi thu chi, đặt hạn mức và dành tiền cho mục tiêu — tất cả trong một không gian rõ ràng, riêng tư.
            </p>

            <div className="mt-9 grid max-w-lg grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <ShieldCheck className="mb-3 h-5 w-5 text-[#9DD2C4]" />
                <p className="text-sm font-bold">Dữ liệu riêng tư</p>
                <p className="mt-1 text-xs leading-5 text-white/50">Thông tin tài chính chỉ thuộc về bạn.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <ArrowRight className="mb-3 h-5 w-5 text-warning" />
                <p className="text-sm font-bold">Bắt đầu trong 1 phút</p>
                <p className="mt-1 text-xs leading-5 text-white/50">Không cần thiết lập phức tạp.</p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-white/40">Một quyết định nhỏ hôm nay tạo nên tự do ngày mai.</p>
        </section>

        <section className="flex min-w-0 items-center justify-center px-4 py-8 sm:px-10 lg:px-12 xl:px-16">
          <div className="min-w-0 w-full max-w-md">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-sm"><Wallet className="h-5 w-5" /></div>
              <div>
                <p className="font-extrabold tracking-tight text-neutral-maintext">Ví Sinh Viên</p>
                <p className="text-xs text-neutral-subtext">Tài chính cá nhân, thật dễ hiểu</p>
              </div>
            </div>

            <div className="mb-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">Chào mừng trở lại</p>
              <h2 className="text-[1.65rem] sm:text-3xl font-extrabold leading-[1.18] tracking-[-0.045em] text-neutral-maintext">
                {authMode === 'register' ? 'Tạo tài khoản của bạn' : 'Tiếp tục hành trình tài chính'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-subtext">Đăng nhập để xem dòng tiền và các mục tiêu của bạn.</p>
            </div>

        <Card className="min-w-0 w-full border-white/80 shadow-md" bodyClassName="!p-0">
          {(authMode === 'verify_otp' || authMode === 'forgot_otp') ? (
              <div className="p-5 sm:p-7">
              <VerifyOtpForm 
                email={formData.email} 
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                onBack={() => switchMode('login')}
                loading={loading}
                error={errors.otp}
              />
            </div>
          ) : authMode === 'forgot_email' ? (
            <div className="p-5 sm:p-7">
              <h2 className="text-xl font-bold text-neutral-maintext mb-2 text-center">Quên mật khẩu</h2>
              <p className="text-sm text-neutral-subtext mb-6 text-center">Nhập email của bạn, chúng tôi sẽ gửi một mã OTP để khôi phục mật khẩu.</p>
              
              <form onSubmit={handleForgotSubmit} className="space-y-5" noValidate>
                <Input
                  id="email"
                  type="email"
                  label="Địa chỉ Email"
                  placeholder="example@gmail.com"
                  icon={Mail}
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
                <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
                  Gửi mã khôi phục
                </Button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => switchMode('login')} className="text-sm text-primary hover:underline">
                    Quay lại Đăng nhập
                  </button>
                </div>
              </form>
            </div>
          ) : authMode === 'reset_password' ? (
            <div className="p-5 sm:p-7">
              <h2 className="text-xl font-bold text-neutral-maintext mb-2 text-center">Tạo mật khẩu mới</h2>
              <form onSubmit={handleResetSubmit} className="space-y-5 mt-6" noValidate>
                <div>
                  <Input
                    id="password"
                    type="password"
                    label="Mật khẩu mới"
                    placeholder="••••••••"
                    icon={Lock}
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    maxLength={30}
                    required
                  />
                  <PasswordStrengthIndicator password={formData.password} />
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  label="Xác nhận mật khẩu mới"
                  placeholder="••••••••"
                  icon={Lock}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  maxLength={30}
                  required
                />
                <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
                  Đổi mật khẩu
                </Button>
              </form>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="grid grid-cols-2 bg-neutral-bg/80 p-1.5 m-2 rounded-xl">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    authMode === 'login'
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-neutral-subtext hover:text-neutral-maintext'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    authMode === 'register'
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-neutral-subtext hover:text-neutral-maintext'
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 sm:p-7 pt-5">
                <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-5 animate-fade-in" noValidate>
                  {authMode === 'register' && (
                    <Input
                      id="fullName"
                      label="Họ và tên sinh viên"
                      placeholder="Nguyễn Văn A"
                      icon={User}
                      value={formData.fullName}
                      onChange={handleChange}
                      error={errors.fullName}
                      maxLength={50}
                      required
                    />
                  )}

                  <Input
                    id="email"
                    name="email"
                    autoComplete="username"
                    type="email"
                    label="Địa chỉ Email"
                    placeholder="example@gmail.com"
                    icon={Mail}
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                  />

                  <div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      label="Mật khẩu"
                      placeholder="••••••••"
                      icon={Lock}
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      maxLength={30}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      required
                      actionRight={
                        authMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => switchMode('forgot_email')}
                            className="text-xs text-primary font-medium hover:underline"
                          >
                            Quên mật khẩu?
                          </button>
                        )
                      }
                    />
                    {authMode === 'register' && <PasswordStrengthIndicator password={formData.password} />}
                  </div>

                  {authMode === 'register' && (
                    <Input
                      id="confirmPassword"
                      type="password"
                      label="Xác nhận mật khẩu"
                      placeholder="••••••••"
                      icon={Lock}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={errors.confirmPassword}
                      maxLength={30}
                      required
                    />
                  )}

                  {authMode === 'login' && (
                    <div className="flex items-center mb-2">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-primary bg-white border-neutral-border rounded focus:ring-primary focus:ring-2"
                      />
                      <label htmlFor="rememberMe" className="ml-2 text-sm text-neutral-subtext cursor-pointer">
                        Ghi nhớ đăng nhập
                      </label>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full justify-center group text-[15px]"
                      loading={loading}
                    >
                      <span>{authMode === 'register' ? 'Đăng ký tài khoản' : 'Đăng nhập'}</span>
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </Card>
            <p className="mt-6 text-center text-[11px] leading-5 text-neutral-subtext">
              Bằng việc tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
