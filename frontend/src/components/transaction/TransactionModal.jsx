import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { formatCurrency } from '../../utils/formatCurrency';
import { TrendingDown, TrendingUp, Tag, MapPin, FileText, Calendar } from 'lucide-react';

const ICON_EMOJI = {
  Tag: '🏷️', UtensilsCrossed: '🍽️', Home: '🏠', BookOpen: '📚',
  Bus: '🚌', Gamepad2: '🎮', ShoppingBag: '🛍️', Heart: '💊',
  Users: '👨‍👩‍👧', Briefcase: '💼', GraduationCap: '🎓', Gift: '🎁',
  MoreHorizontal: '⋯', Coffee: '☕', Car: '🚗', Music: '🎵'
};

/**
 * TransactionModal - Form modal for creating/editing manual transactions.
 */
export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  initialDate = null,
  categories = []
}) {
  const isEditing = !!initialData;

  const [form, setForm] = useState({
    type: 'expense',
    amountStr: '',
    categoryId: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    note: '',
    merchant: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialData) {
        setForm({
          type: initialData.type || 'expense',
          amountStr: String(initialData.amount || ''),
          categoryId: String(initialData.category_id || ''),
          transactionDate: initialData.transaction_date_str || initialData.transaction_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          note: initialData.note || '',
          merchant: initialData.merchant || ''
        });
      } else {
        const defaultType = 'expense';
        const availableCats = categories.filter(c => c.type === defaultType);
        const defaultCatId = availableCats.length > 0 ? String(availableCats[0].id) : '';

        setForm({
          type: defaultType,
          amountStr: '',
          categoryId: defaultCatId,
          transactionDate: initialDate || new Date().toISOString().slice(0, 10),
          note: '',
          merchant: ''
        });
      }
    }
  }, [isOpen, initialData, initialDate, categories]);

  // Filter categories by selected type
  const typeCategories = categories.filter(c => c.type === form.type);

  // Handle type change and select first category of new type
  const handleTypeChange = (newType) => {
    const available = categories.filter(c => c.type === newType);
    setForm(prev => ({
      ...prev,
      type: newType,
      categoryId: available.length > 0 ? String(available[0].id) : ''
    }));
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, amountStr: raw }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amountStr || Number(form.amountStr) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ (> 0)');
      return;
    }
    if (!form.categoryId) {
      setError('Vui lòng chọn danh mục');
      return;
    }
    if (!form.transactionDate) {
      setError('Vui lòng chọn ngày giao dịch');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit({
        type: form.type,
        amount: Number(form.amountStr),
        categoryId: Number(form.categoryId),
        transactionDate: form.transactionDate,
        note: form.note.trim(),
        merchant: form.merchant.trim()
      });
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
      title={isEditing ? 'Chỉnh sửa giao dịch' : 'Ghi nhận thu chi mới'}
      subtitle={isEditing ? 'Cập nhật lại thông tin khoản tiền' : 'Ghi chép chi tiêu hoặc thu nhập hàng ngày'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Switcher */}
        <div>
          <label className="block text-sm font-medium text-neutral-maintext mb-1.5">
            Loại giao dịch <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-neutral-bg p-1 rounded-2xl border border-neutral-border">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                form.type === 'expense'
                  ? 'bg-white text-danger shadow-sm border border-danger/20'
                  : 'text-neutral-subtext hover:text-neutral-maintext'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                form.type === 'income'
                  ? 'bg-white text-success shadow-sm border border-success/20'
                  : 'text-neutral-subtext hover:text-neutral-maintext'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Thu nhập
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label htmlFor="tx-amount" className="block text-sm font-medium text-neutral-maintext mb-1">
            Số tiền (VNĐ) <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <input
              id="tx-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.amountStr ? Number(form.amountStr).toLocaleString('vi-VN') : ''}
              onChange={handleAmountChange}
              className={`w-full px-4 py-3 text-lg font-bold bg-white border rounded-xl focus:outline-none focus:ring-2 tabular-nums transition-all ${
                form.type === 'expense'
                  ? 'text-danger border-neutral-border focus:ring-danger/20 focus:border-danger'
                  : 'text-success border-neutral-border focus:ring-success/20 focus:border-success'
              }`}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-subtext">
              VNĐ
            </span>
          </div>
          {form.amountStr && Number(form.amountStr) > 0 && (
            <p className="text-xs text-neutral-subtext mt-1">
              Bằng chữ: <strong className="text-neutral-maintext">{formatCurrency(form.amountStr)}</strong>
            </p>
          )}
        </div>

        {/* Category Picker Grid */}
        <div>
          <label className="block text-sm font-medium text-neutral-maintext mb-1.5 flex items-center justify-between">
            <span>Danh mục <span className="text-danger">*</span></span>
            <span className="text-xs text-neutral-subtext font-normal">{typeCategories.length} danh mục</span>
          </label>
          
          {typeCategories.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-neutral-border text-center text-xs text-neutral-subtext bg-neutral-bg/40">
              Chưa có danh mục nào cho loại này. Vui lòng vào tab Danh mục để tạo trước.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 border border-neutral-border rounded-xl bg-neutral-bg/30">
              {typeCategories.map(cat => {
                const isSelected = form.categoryId === String(cat.id);
                const emoji = ICON_EMOJI[cat.icon] || '🏷️';

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, categoryId: String(cat.id) }))}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                      isSelected
                        ? 'bg-white border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'bg-white/80 border-neutral-border/60 hover:bg-white hover:border-neutral-border'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: `${cat.color || '#2563EB'}20` }}
                    >
                      {emoji}
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-maintext truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Date and Merchant Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-date" className="block text-sm font-medium text-neutral-maintext mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Ngày giao dịch <span className="text-danger">*</span>
            </label>
            <input
              id="tx-date"
              type="date"
              value={form.transactionDate}
              onChange={(e) => setForm(p => ({ ...p, transactionDate: e.target.value }))}
              className="w-full px-3.5 py-2 text-sm font-medium bg-white border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="tx-merchant" className="block text-sm font-medium text-neutral-maintext mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Địa điểm / Quán
            </label>
            <input
              id="tx-merchant"
              type="text"
              placeholder="VD: Circle K, Phúc Long..."
              value={form.merchant}
              onChange={(e) => setForm(p => ({ ...p, merchant: e.target.value }))}
              className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="tx-note" className="block text-sm font-medium text-neutral-maintext mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-primary" /> Ghi chú thêm
          </label>
          <input
            id="tx-note"
            type="text"
            placeholder="VD: Mua sách giải tích, ăn trưa với bạn..."
            value={form.note}
            onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
            className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {error && (
          <div className="p-3 bg-danger-light text-danger text-xs font-semibold rounded-xl border border-danger/20">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-neutral-border">
          <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>
            {isEditing ? 'Lưu thay đổi' : 'Ghi nhận'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
