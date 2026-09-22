import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { getCategoryEmoji } from '../../utils/emoji';
import { Calendar } from 'lucide-react';

const COLOR_OPTIONS = [
  '#176B5B', '#3A7D6B', '#C0524E', '#C9773A',
  '#71659A', '#B05D76', '#3D8290', '#B27A27',
  '#66736E', '#23845F', '#B65A52', '#7E913F',
  '#566A96', '#39745B', '#A64E68', '#A9822F',
  '#3F778E', '#586965', '#795B8F', '#34796F'
];

const ICON_OPTIONS = [
  { name: 'PiggyBank', label: '🐷' },
  { name: 'Laptop', label: '💻' },
  { name: 'Car', label: '🚗' },
  { name: 'Home', label: '🏠' },
  { name: 'Plane', label: '✈️' },
  { name: 'Heart', label: '❤️' },
  { name: 'GraduationCap', label: '🎓' },
  { name: 'Smartphone', label: '📱' },
  { name: 'Gamepad2', label: '🎮' },
  { name: 'Music', label: '🎵' },
  { name: 'Camera', label: '📷' },
  { name: 'Gift', label: '🎁' },
  { name: 'ShoppingBag', label: '🛍️' },
  { name: 'Coffee', label: '☕' },
  { name: 'Briefcase', label: '💼' },
  { name: 'Umbrella', label: '☂️' }
];

export default function JarModal({ isOpen, onClose, onSubmit, initialData = null, existingJars = [] }) {
  const isEditing = !!initialData;

  const [isDuplicateName, setIsDuplicateName] = useState(false);

  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    displayTargetDate: '',
    icon: 'PiggyBank',
    color: '#176B5B'
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setApiError('');
      setFieldErrors({});
      if (initialData) {
        const rawDate = initialData.target_date ? initialData.target_date.split('T')[0] : '';
        let displayDate = '';
        if (rawDate) {
          const parts = rawDate.split('-');
          displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        setForm({
          name: initialData.name || '',
          targetAmount: initialData.target_amount || '',
          targetDate: rawDate,
          displayTargetDate: displayDate,
          icon: initialData.icon || 'PiggyBank',
          color: initialData.color || '#176B5B'
        });
      } else {
        setForm({ name: '', targetAmount: '', targetDate: '', displayTargetDate: '', icon: 'PiggyBank', color: '#176B5B' });
      }
      setIsDuplicateName(false);
    }
  }, [isOpen, initialData]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const dateInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const nameVal = form.name.trim();
    if (!nameVal) {
      errors.name = 'Vui lòng nhập tên hũ';
    } else if (nameVal.length < 3 || nameVal.length > 50) {
      errors.name = 'Tên hũ phải từ 3 đến 50 ký tự';
    } else if (/[^a-zA-Z0-9\sA-ZÀ-Ỹà-ỹ]/.test(nameVal)) {
      errors.name = 'Tên hũ không được chứa ký tự đặc biệt';
    }

    const amount = Number(form.targetAmount.toString().replace(/\./g, ''));
    if (!amount || amount <= 0) {
      errors.targetAmount = 'Vui lòng nhập số tiền mục tiêu hợp lệ';
    } else if (amount < 50000) {
      errors.targetAmount = 'Số tiền mục tiêu tối thiểu là 50.000 VNĐ';
    } else if (amount > 10000000000) {
      errors.targetAmount = 'Số tiền mục tiêu quá lớn (tối đa 10 tỷ VNĐ)';
    }

    if (form.targetDate) {
      const parts = form.targetDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const selectedDate = new Date(year, month - 1, day);
        selectedDate.setHours(0, 0, 0, 0);

        if (
          selectedDate.getFullYear() !== year ||
          selectedDate.getMonth() !== month - 1 ||
          selectedDate.getDate() !== day
        ) {
          errors.targetDate = 'Ngày không hợp lệ (kiểm tra lại ngày/tháng)';
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const maxDate = new Date();
          maxDate.setHours(0, 0, 0, 0);
          maxDate.setFullYear(maxDate.getFullYear() + 3);

          if (selectedDate < today) {
            errors.targetDate = 'Hạn chót không được ở quá khứ';
          } else if (selectedDate > maxDate) {
            errors.targetDate = 'Hạn chót không được quá 3 năm trong tương lai';
          }
        }
      } else {
        errors.targetDate = 'Định dạng ngày không hợp lệ';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!isEditing) {
      const duplicate = existingJars.some(j => j.name.trim().toLowerCase() === nameVal.toLowerCase());
      setIsDuplicateName(duplicate);
    } else {
      setIsDuplicateName(false);
    }

    setShowConfirm(true);
  };

  const executeSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    setApiError('');
    setFieldErrors({});
    try {
      const amount = Number(form.targetAmount.toString().replace(/\./g, ''));
      await onSubmit({
        ...form,
        targetAmount: amount,
        targetDate: form.targetDate || null
      });
      // Do not call onClose() here. Let the parent (SavingsJarsPage) call it after toast.
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Sửa Hũ Tiết Kiệm' : 'Tạo Hũ Mới'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col" noValidate>
        {apiError && (
          <div className="p-3 bg-danger-light text-danger text-sm rounded-xl border border-danger/20 font-medium">
            {apiError}
          </div>
        )}

        <Input
          label="Tên hũ"
          placeholder="VD: Mua Laptop, Quỹ dự phòng..."
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value });
            if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
          }}
          error={fieldErrors.name}
          required
        />

        <div className="relative">
          <Input
            label="Mục tiêu số tiền (VNĐ)"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={form.targetAmount ? form.targetAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setForm({ ...form, targetAmount: val });
              if (fieldErrors.targetAmount) setFieldErrors({ ...fieldErrors, targetAmount: null });
            }}
            error={fieldErrors.targetAmount}
            required
          />
        </div>

        <div className="relative" onClick={() => dateInputRef.current?.showPicker()}>
          <Input
            label="Hạn chót (Không bắt buộc)"
            type="text"
            placeholder="Chọn ngày từ lịch..."
            value={form.displayTargetDate || ''}
            readOnly
            className="cursor-pointer bg-white"
            error={fieldErrors.targetDate}
            rightElement={
              <div className="flex items-center justify-center w-8 h-8 pointer-events-none">
                <Calendar className="w-4 h-4 text-neutral-subtext" />
              </div>
            }
          />
          <input
            ref={dateInputRef}
            type="date"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
            style={{ top: '24px' }}
            onChange={(e) => {
              const dateStr = e.target.value;
              if (dateStr) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  const display = `${parts[2]}/${parts[1]}/${parts[0]}`;
                  setForm({ ...form, targetDate: dateStr, displayTargetDate: display });
                }
              } else {
                setForm({ ...form, targetDate: '', displayTargetDate: '' });
              }
              if (fieldErrors.targetDate) setFieldErrors({ ...fieldErrors, targetDate: null });
            }}
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-semibold text-neutral-maintext mb-2">Chọn Biểu tượng</label>
          <div className="grid grid-cols-8 gap-2">
            {ICON_OPTIONS.map((opt) => (
              <button
                key={opt.name}
                type="button"
                onClick={() => setForm({ ...form, icon: opt.name })}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                  form.icon === opt.name 
                    ? 'ring-2 ring-primary ring-offset-1 shadow-sm' 
                    : 'hover:bg-neutral-bg opacity-70 hover:opacity-100'
                }`}
                style={form.icon === opt.name ? { backgroundColor: `${form.color}20` } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-semibold text-neutral-maintext mb-2">Chọn Màu sắc</label>
          <div className="grid grid-cols-10 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                className={`w-6 h-6 rounded-full transition-all ${
                  form.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110 shadow-sm' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-border mt-6">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Hủy
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Xác nhận
          </Button>
        </div>
      </form>
    </Modal>
    
    <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Xác nhận" size="sm">
      <div className="space-y-6 pt-2">
        {isDuplicateName ? (
          <div className="text-warning-darker bg-warning-light/50 p-4 rounded-xl border border-warning/30 font-medium leading-relaxed">
            <span className="block mb-2">⚠️ <strong>Hũ "{form.name}" đã có rồi!</strong></span>
            Bạn có muốn tạo tiếp một hũ mới trùng tên không?
          </div>
        ) : (
          <p className="text-neutral-maintext leading-relaxed">
            Bạn có chắc chắn muốn {isEditing ? 'cập nhật' : 'tạo'} hũ tiết kiệm <strong>{form.name}</strong> với mục tiêu <strong>{form.targetAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ</strong> không?
          </p>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">Hủy</Button>
          <Button variant="primary" onClick={executeSubmit} loading={loading} className="flex-1">Đồng ý</Button>
        </div>
      </div>
    </Modal>
    </>
  );
}
