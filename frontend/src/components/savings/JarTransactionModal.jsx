import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';
import { Info, AlertTriangle } from 'lucide-react';

export default function JarTransactionModal({ isOpen, onClose, onSubmit, jar, type, availableBalance }) {
  const [form, setForm] = useState({
    amount: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const isDeposit = type === 'deposit';

  useEffect(() => {
    if (isOpen) {
      setForm({ amount: '', note: '' });
      setApiError('');
      setFieldErrors({});
      setShowConfirm(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const amount = Number(form.amount.toString().replace(/\./g, ''));
    
    if (!amount || amount < 10000) {
      errors.amount = 'Số tiền tối thiểu là 10.000đ';
      toast.error('Số tiền giao dịch tối thiểu là 10.000đ');
    } else if (isDeposit && amount > availableBalance) {
      errors.amount = 'Số tiền gửi vượt quá số dư khả dụng';
      toast.error('Số tiền gửi vượt quá số dư khả dụng');
    } else if (!isDeposit && amount > Number(jar.current_amount)) {
      errors.amount = 'Số tiền rút vượt quá số dư trong hũ';
      toast.error('Số tiền rút vượt quá số dư trong hũ');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const amount = Number(form.amount.toString().replace(/\./g, ''));
    setLoading(true);
    setApiError('');
    setFieldErrors({});
    try {
      await onSubmit(jar.id, { amount, note: form.note });
      setShowConfirm(false);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Có lỗi xảy ra');
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (!jar) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isDeposit ? 'Gửi tiền vào Hũ' : 'Rút tiền khỏi Hũ'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {apiError && (
          <div className="p-3 bg-danger-light text-danger text-sm rounded-xl border border-danger/20 font-medium">
            {apiError}
          </div>
        )}

        <div className={`p-3 rounded-xl text-center ${isDeposit && Number(availableBalance) === 0 ? 'bg-danger-light' : 'bg-neutral-bg'}`}>
          <p className="text-sm text-neutral-subtext mb-1">
            {isDeposit ? 'Số dư khả dụng hiện tại' : 'Số dư trong hũ hiện tại'}
          </p>
          <p className={`text-xl font-bold tabular-nums ${
            isDeposit
              ? (Number(availableBalance) === 0 ? 'text-danger' : 'text-primary')
              : 'text-success'
          }`}>
            {isDeposit
              ? Number(availableBalance).toLocaleString('vi-VN')
              : Number(jar.current_amount).toLocaleString('vi-VN')} đ
          </p>
          {isDeposit && Number(availableBalance) === 0 && (
            <p className="text-xs text-danger mt-1 font-medium">
              Không còn số dư khả dụng — ngân sách và hũ đã được phân bổ hết
            </p>
          )}
        </div>

        <Input
          label="Số tiền (VNĐ)"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={form.amount ? form.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setForm({ ...form, amount: val });
            if (fieldErrors.amount) setFieldErrors({ ...fieldErrors, amount: null });
          }}
          error={fieldErrors.amount}
          required
        />

        <Input
          label="Ghi chú (Không bắt buộc)"
          placeholder="VD: Tiền thưởng Tết, Rút mua gấp..."
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <div className="flex gap-3 pt-4 border-t border-neutral-border">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Hủy
          </Button>
          <Button type="submit" variant={isDeposit ? 'primary' : 'outline'} className={`flex-1 ${!isDeposit ? 'border-danger text-danger hover:bg-danger-light' : ''}`} loading={loading}>
            {isDeposit ? 'Gửi tiền' : 'Rút tiền'}
          </Button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={isDeposit ? 'Xác nhận gửi tiền' : 'Xác nhận rút tiền'}
        message={
          isDeposit
            ? `Bạn có chắc chắn muốn gửi ${Number(form.amount.toString().replace(/\./g, '')).toLocaleString('vi-VN')}đ vào hũ "${jar.name}" không?`
            : `Bạn có chắc chắn muốn rút ${Number(form.amount.toString().replace(/\./g, '')).toLocaleString('vi-VN')}đ khỏi hũ "${jar.name}" không?`
        }
        confirmLabel={isDeposit ? 'Xác nhận gửi' : 'Xác nhận rút'}
        confirmVariant={isDeposit ? 'primary' : 'danger'}
        icon={isDeposit ? Info : AlertTriangle}
        loading={loading}
      />
    </Modal>
  );
}
