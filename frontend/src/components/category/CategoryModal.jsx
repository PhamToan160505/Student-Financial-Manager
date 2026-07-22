import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

const TYPE_OPTIONS = [
  { value: 'expense', label: '💸 Chi tiêu' },
  { value: 'income', label: '💰 Thu nhập' }
];

const COLOR_OPTIONS = [
  '#2563EB', '#16A34A', '#DC2626', '#F97316',
  '#8B5CF6', '#EC4899', '#06B6D4', '#D97706',
  '#6B7280', '#10B981', '#EF4444', '#84CC16'
];

const ICON_OPTIONS = [
  { name: 'Tag', label: '🏷️' },
  { name: 'UtensilsCrossed', label: '🍽️' },
  { name: 'Home', label: '🏠' },
  { name: 'BookOpen', label: '📚' },
  { name: 'Bus', label: '🚌' },
  { name: 'Gamepad2', label: '🎮' },
  { name: 'ShoppingBag', label: '🛍️' },
  { name: 'Heart', label: '💊' },
  { name: 'Users', label: '👨‍👩‍👧' },
  { name: 'Briefcase', label: '💼' },
  { name: 'GraduationCap', label: '🎓' },
  { name: 'Gift', label: '🎁' },
  { name: 'MoreHorizontal', label: '⋯' },
  { name: 'Coffee', label: '☕' },
  { name: 'Car', label: '🚗' },
  { name: 'Music', label: '🎵' }
];

/**
 * CategoryModal — used for both Create and Edit category operations.
 */
export default function CategoryModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const isEditing = !!initialData;

  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    icon: 'Tag',
    color: '#2563EB'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialData) {
        setForm({
          name: initialData.name || '',
          type: initialData.type || 'expense',
          icon: initialData.icon || 'Tag',
          color: initialData.color || '#2563EB'
        });
      } else {
        setForm({ name: '', type: 'expense', icon: 'Tag', color: '#2563EB' });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
      subtitle={isEditing ? `Đang sửa: ${initialData?.name}` : 'Tạo danh mục chi tiêu hoặc thu nhập riêng'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Input
          id="cat-name"
          label="Tên danh mục"
          placeholder="VD: Cà phê buổi sáng..."
          value={form.name}
          onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
          error={error}
          required
        />

        {/* Type (only for new categories) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-neutral-maintext mb-1.5">Loại danh mục <span className="text-danger">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: opt.value }))}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                    form.type === opt.value
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-neutral-subtext border-neutral-border hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-neutral-maintext mb-1.5">Màu sắc</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(p => ({ ...p, color: c }))}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-neutral-maintext scale-110' : ''}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-neutral-maintext mb-1.5">Icon đại diện</label>
          <div className="flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map(opt => (
              <button
                key={opt.name}
                type="button"
                onClick={() => setForm(p => ({ ...p, icon: opt.name }))}
                className={`w-10 h-10 text-lg rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                  form.icon === opt.name
                    ? 'ring-2 ring-offset-1 bg-primary-light'
                    : 'hover:bg-neutral-bg'
                }`}
                style={form.icon === opt.name ? { ringColor: form.color } : {}}
                title={opt.name}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border border-neutral-border rounded-xl p-3 flex items-center gap-3 bg-neutral-bg/40">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${form.color}20` }}>
            {ICON_OPTIONS.find(o => o.name === form.icon)?.label || '🏷️'}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: form.color }}>{form.name || 'Tên danh mục...'}</p>
            <p className="text-xs text-neutral-subtext">{form.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>
            {isEditing ? 'Lưu thay đổi' : 'Thêm danh mục'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
