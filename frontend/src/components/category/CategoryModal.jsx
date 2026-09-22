import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import ConfirmModal from '../common/ConfirmModal';

const TYPE_OPTIONS = [
  { value: 'expense', label: '💸 Chi tiêu' },
  { value: 'income', label: '💰 Thu nhập' }
];

const COLOR_OPTIONS = [
  '#176B5B', '#3A7D6B', '#C0524E', '#C9773A',
  '#71659A', '#B05D76', '#3D8290', '#B27A27',
  '#66736E', '#23845F', '#B65A52', '#7E913F',
  '#566A96', '#39745B', '#A64E68', '#A9822F',
  '#3F778E', '#586965', '#795B8F', '#34796F'
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
  { name: 'Coffee', label: '☕' },
  { name: 'Car', label: '🚗' },
  { name: 'Music', label: '🎵' },
  { name: 'Wifi', label: '📶' },
  { name: 'Smartphone', label: '📱' },
  { name: 'Zap', label: '⚡' },
  { name: 'Droplets', label: '💧' },
  { name: 'Plane', label: '✈️' },
  { name: 'Dumbbell', label: '🏋️' },
  { name: 'Scissors', label: '✂️' },
  { name: 'Baby', label: '👶' },
  { name: 'MoreHorizontal', label: '⋯' },
];

/**
 * CategoryModal — used for both Create and Edit category operations.
 */
export default function CategoryModal({ isOpen, onClose, onSubmit, initialData = null, existingCategories = [] }) {
  const isEditing = !!initialData;

  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    icon: 'Tag',
    color: '#176B5B'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Derived state for used colors and icons based on ALL categories (global uniqueness)
  // User exception: 'MoreHorizontal' icon and '#6b7280' color are allowed to be duplicated (for 'Khác' category)
  const otherCategories = existingCategories.filter(c => c.id !== initialData?.id);
  const usedColors = otherCategories
    .map(c => c.color.toLowerCase())
    .filter(color => color !== '#6b7280');
  const usedIcons = otherCategories
    .map(c => c.icon)
    .filter(icon => icon !== 'MoreHorizontal');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setShowConfirm(false);
      if (initialData) {
        setForm({
          name: initialData.name || '',
          type: initialData.type || 'expense',
          icon: initialData.icon || 'Tag',
          color: initialData.color || '#176B5B'
        });
      } else {
        const usedC = existingCategories.map(c => c.color.toLowerCase()).filter(c => c !== '#6b7280');
        const usedI = existingCategories.map(c => c.icon).filter(i => i !== 'MoreHorizontal');
        const firstAvailColor = COLOR_OPTIONS.find(c => !usedC.includes(c.toLowerCase())) || COLOR_OPTIONS[0];
        const firstAvailIcon = ICON_OPTIONS.find(i => !usedI.includes(i.name))?.name || ICON_OPTIONS[0].name;
        setForm({ name: '', type: 'expense', icon: firstAvailIcon, color: firstAvailColor });
      }
    }
  }, [isOpen, initialData, existingCategories]);

  const handleTypeChange = (newType) => {
    // Uniqueness is global, so used colors/icons are the same regardless of type
    let newColor = form.color;
    if (usedColors.includes(newColor.toLowerCase())) {
      newColor = COLOR_OPTIONS.find(c => !usedColors.includes(c.toLowerCase())) || COLOR_OPTIONS[0];
    }
    
    let newIcon = form.icon;
    if (usedIcons.includes(newIcon)) {
      newIcon = ICON_OPTIONS.find(i => !usedIcons.includes(i.name))?.name || ICON_OPTIONS[0].name;
    }
    
    setForm(p => ({ ...p, type: newType, color: newColor, icon: newIcon }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }
    if (name.length < 5) {
      setError('Tên danh mục phải từ 5 ký tự trở lên');
      return;
    }
    if (!/^[a-zA-ZÀ-ỹ0-9\s]+$/.test(name)) {
      setError('Tên danh mục không được chứa ký tự đặc biệt');
      return;
    }
    
    // Check for duplicates
    // Name duplicate is still per-type (Expense can have a name, Income can have same name, e.g. Khác)
    const isNameDuplicate = existingCategories.some(c => c.type === form.type && c.name.toLowerCase() === name.toLowerCase() && c.id !== initialData?.id);
    if (isNameDuplicate) {
      setError('Tên danh mục này đã tồn tại trong cùng loại, vui lòng chọn tên khác');
      return;
    }
    // Color and Icon are GLOBAL (across both), except #6b7280 and MoreHorizontal
    if (usedColors.includes(form.color.toLowerCase()) && form.color.toLowerCase() !== '#6b7280') {
      setError('Màu sắc này đã được sử dụng ở Thu nhập hoặc Chi tiêu, vui lòng chọn màu khác');
      return;
    }
    if (usedIcons.includes(form.icon) && form.icon !== 'MoreHorizontal') {
      setError('Icon này đã được sử dụng ở Thu nhập hoặc Chi tiêu, vui lòng chọn icon khác');
      return;
    }

    setShowConfirm(true);
  };

  const executeSubmit = async () => {
    setShowConfirm(false);
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
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
      subtitle={isEditing ? `Đang sửa: ${initialData?.name}` : 'Tạo danh mục chi tiêu hoặc thu nhập riêng'}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                  onClick={() => handleTypeChange(opt.value)}
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
            {COLOR_OPTIONS.map(c => {
              const isUsed = usedColors.includes(c.toLowerCase());
              return (
                <button
                  key={c}
                  type="button"
                  disabled={isUsed}
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-full transition-transform ${isUsed ? 'opacity-20 cursor-not-allowed' : 'hover:scale-110'} ${form.color === c ? 'ring-2 ring-offset-2 ring-neutral-maintext scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              );
            })}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-neutral-maintext mb-1.5">Icon đại diện</label>
          <div className="flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map(opt => {
              const isUsed = usedIcons.includes(opt.name);
              return (
                <button
                  key={opt.name}
                  type="button"
                  disabled={isUsed}
                  onClick={() => setForm(p => ({ ...p, icon: opt.name }))}
                  className={`w-10 h-10 text-lg rounded-xl flex items-center justify-center transition-all ${isUsed ? 'opacity-20 cursor-not-allowed bg-neutral-bg' : 'hover:scale-110'} ${
                    form.icon === opt.name
                      ? 'ring-2 ring-offset-1 bg-primary-light'
                      : 'hover:bg-neutral-bg'
                  }`}
                  style={form.icon === opt.name ? { ringColor: form.color } : {}}
                  title={opt.name}
                >
                  {opt.label}
                </button>
              );
            })}
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
    <ConfirmModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={executeSubmit}
      title={isEditing ? 'Lưu thay đổi' : 'Thêm danh mục mới'}
      message={isEditing ? 'Bạn có chắc muốn lưu các thay đổi này không?' : 'Bạn có chắc muốn thêm danh mục này không?'}
      confirmLabel="Đồng ý"
    />
    </>
  );
}
