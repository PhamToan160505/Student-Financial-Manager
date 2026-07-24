import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import { Mail, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';

export default function VerifyOtpForm({ email, onVerify, onResend, onBack, loading, error }) {
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (!value) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = '';
      setOtpValues(newOtpValues);
      return;
    }

    // Handle single char (always take the last typed numeric character)
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.charAt(value.length - 1);
    setOtpValues(newOtpValues);

    // Auto-focus next
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all filled
    if (index === 5 && newOtpValues.every(val => val !== '')) {
      onVerify(newOtpValues.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        // focus previous if empty and hitting backspace
        inputRefs.current[index - 1]?.focus();
      } else {
        // clear current
        const newOtpValues = [...otpValues];
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtpValues = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtpValues[i] = pastedData[i];
    }
    setOtpValues(newOtpValues);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      onVerify(newOtpValues.join(''));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length === 6) {
      onVerify(fullOtp);
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      onResend();
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const isComplete = otpValues.every(val => val !== '');

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-light text-primary rounded-full mb-3">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-maintext mb-2">Xác thực Email</h2>
        <p className="text-sm text-neutral-subtext">
          Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến email <br />
          <span className="font-medium text-neutral-maintext">{email}</span>
        </p>
      </div>

      <div className="space-y-4 text-center">
        <label className="block text-sm font-medium text-neutral-maintext mb-2 text-center">
          Nhập mã OTP
        </label>
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {otpValues.map((val, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              value={val}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              readOnly={loading}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white border border-neutral-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50 disabled:bg-neutral-bg text-neutral-maintext shadow-sm read-only:opacity-70 read-only:bg-neutral-bg"
              autoComplete="off"
            />
          ))}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500 font-medium text-center">{error}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full justify-center group mt-4"
        disabled={!isComplete || loading}
        loading={loading}
      >
        <span>Xác nhận</span>
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>

      <div className="flex flex-col gap-3 mt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleResend}
          disabled={countdown > 0 || loading}
          className="w-full justify-center text-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${countdown > 0 ? '' : 'text-primary'}`} />
          {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã OTP'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={loading}
          className="w-full justify-center text-sm text-neutral-subtext"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Đăng nhập
        </Button>
      </div>
    </form>
  );
}
