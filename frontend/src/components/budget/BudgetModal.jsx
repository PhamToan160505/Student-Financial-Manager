import React, { useState, useEffect } from 'react';
import { X, PieChart, AlertCircle, Check } from 'lucide-react';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryEmoji } from '../../utils/emoji';

/**
 * BudgetModal - Modal form for setting or editing monthly category budget limits
 * Enforces validation limits: min 1,000 đ, max 100,000,000,000 đ
 */
export default function BudgetModal({ isOpen, onClose, onSave, categories, selectedCategory, currentMonth }) {
  const [categoryId, setCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedCategory) {
        setCategoryId(String(selectedCategory.category_id));
        setAmountStr(selectedCategory.amount ? String(selectedCategory.amount) : '');
      } else if (categories && categories.length > 0) {
        // Find first unbudgeted category or just first category
        const firstUnbudgeted = categories.find(c => !c.is_budgeted);
        setCategoryId(firstUnbudgeted ? String(firstUnbudgeted.category_id) : String(categories[0].category_id));
        setAmountStr('');
      }
      setError(null);
    }
  }, [isOpen, selectedCategory, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError('Vui lòng chọn danh mục chi tiêu');
      return;
    }

    const numAmount = Number(amountStr.replace(/[^0-9.]/g, ''));
    if (!amountStr || isNaN(numAmount) || numAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }

    if (numAmount < 1000) {
      setError('Hạn mức tối thiểu phải từ 1,000 đ');
      return;
    }

    if (numAmount > 100000000000) {
      setError('Hạn mức tối đa không được vượt quá 100 tỷ đ');
      return;
    }

    setShowConfirm(true);
  };

  const executeSubmit = async () => {
    setShowConfirm(false);
    setSaving(true);
    
    const numAmount = Number(amountStr.replace(/[^0-9.]/g, ''));
    const success = await onSave({
      category_id: Number(categoryId),
      amount: numAmount,
      targetMonth: currentMonth
    });
    setSaving(false);

    if (success) {
      onClose();
    }
  };

  const selectedCatObj = categories?.find(c => String(c.category_id) === String(categoryId));
  const suggestedAmounts = [500000, 1000000, 2000000, 3000000, 5000000];

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-border animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-neutral-bg border-b border-neutral-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-light text-primary">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-maintext text-lg">
                {selectedCategory && selectedCategory.is_budgeted ? 'Chỉnh sửa hạn mức' : 'Thiết lập hạn mức mới'}
              </h3>
              <p className="text-xs text-neutral-subtext">
                Tháng {currentMonth}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-subtext hover:text-neutral-maintext hover:bg-neutral-200/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {error && (
            <div className="p-3.5 rounded-xl bg-danger-light border border-danger/30 text-danger text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-semibold text-neutral-maintext mb-2">
              Danh mục chi tiêu <span className="text-danger">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                const cat = categories?.find(c => String(c.category_id) === e.target.value);
                if (cat && cat.amount) {
                  setAmountStr(String(cat.amount));
                } else if (!selectedCategory || !selectedCategory.is_budgeted) {
                  setAmountStr('');
                }
              }}
              disabled={selectedCategory && selectedCategory.is_budgeted}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-border bg-neutral-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories?.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {getCategoryEmoji(cat.category_icon)} {cat.category_name} {cat.is_budgeted && cat.category_id !== selectedCategory?.category_id ? `(Đã có hạn mức: ${formatCurrency(cat.amount)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-neutral-maintext mb-2">
              Số tiền hạn mức tối đa <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                max="100000000000"
                step="1000"
                placeholder="Ví dụ: 3000000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-3.5 pr-12 py-3 rounded-xl border border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base font-bold text-neutral-maintext"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-neutral-subtext">
                VND
              </span>
            </div>
            {amountStr && !isNaN(Number(amountStr)) && Number(amountStr) > 0 && (
              <p className="mt-1.5 text-xs text-primary font-medium">
                ≈ {formatCurrency(Number(amountStr))}
              </p>
            )}
          </div>

          {/* Suggested Quick Amounts */}
          <div>
            <label className="block text-xs font-medium text-neutral-subtext mb-2">
              Gợi ý nhanh:
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestedAmounts.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountStr(String(val))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    Number(amountStr) === val
                      ? 'bg-primary text-white border-primary'
                      : 'bg-neutral-bg border-neutral-border text-neutral-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {val >= 1000000 ? `${val / 1000000} Tr` : `${val / 1000} K`}
                </button>
              ))}
            </div>
          </div>

          {/* Current Spent Reference if budget exists */}
          {selectedCatObj && (
            <div className="p-3.5 rounded-xl bg-neutral-bg border border-neutral-border/60 text-xs text-neutral-subtext flex items-center justify-between">
              <span>Đã chi trong tháng cho danh mục này:</span>
              <span className="font-bold text-neutral-maintext">{formatCurrency(selectedCatObj.spent || 0)}</span>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-neutral-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : selectedCategory && selectedCategory.is_budgeted ? 'Cập nhật hạn mức' : 'Lưu hạn mức'}
            </Button>
          </div>
          </form>
        </div>
      </div>
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeSubmit}
        title={selectedCategory && selectedCategory.is_budgeted ? 'Cập nhật hạn mức' : 'Thiết lập hạn mức mới'}
        message={selectedCategory && selectedCategory.is_budgeted ? 'Bạn có chắc muốn cập nhật hạn mức chi tiêu này không?' : 'Bạn có chắc muốn thiết lập hạn mức chi tiêu này không?'}
        confirmLabel="Đồng ý"
        cancelLabel="Hủy"
        type="info"
      />
    </>
  );
}
