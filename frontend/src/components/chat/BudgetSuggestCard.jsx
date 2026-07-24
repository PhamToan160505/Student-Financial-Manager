import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Loader2, PieChart, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * BudgetSuggestCard - Hiển thị thẻ yêu cầu thiết lập ngân sách trước khi ghi giao dịch
 * Human-in-the-loop: Bắt buộc user phải set budget nếu category chưa có.
 *
 * Props:
 *   payload         - { amount, categoryId, categoryName, type, note, date } (giao dịch gốc)
 *   suggestedAmount - số tiền gợi ý (đã làm tròn & cap theo trần thu nhập)
 *   error           - Lỗi từ API (nếu có)
 *   onConfirm       - callback khi user bấm Tạo hạn mức & Ghi giao dịch
 *   onCancel        - callback khi user bấm Hủy
 */
export default function BudgetSuggestCard({ payload, suggestedAmount, error: apiError, onConfirm, onCancel }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [amountStr, setAmountStr] = useState(suggestedAmount ? String(suggestedAmount) : '');
  const [localError, setLocalError] = useState('');

  // Update local error if API error comes in
  useEffect(() => {
    if (apiError) {
      setLocalError(apiError);
      setIsConfirming(false); // Enable buttons again so user can retry
    }
  }, [apiError]);

  const handleConfirm = async () => {
    if (isConfirming || isCancelled) return;
    
    // Client-side validation
    setLocalError('');
    const numAmount = Number(amountStr);
    
    if (!amountStr || isNaN(numAmount) || numAmount <= 0) {
      setLocalError('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }
    
    if (numAmount < 1000) {
      setLocalError('Hạn mức tối thiểu phải từ 1,000 đ');
      return;
    }
    
    setIsConfirming(true); // Disable ngay trước khi gọi API
    
    // Payload for confirmBudget
    try {
      await onConfirm({
        amount: numAmount,
        categoryId: payload.categoryId,
        actionPayload: payload // pass pending transaction back to server
      });
    } finally {
      // Because useChatAdvisor catches errors, it won't throw here.
      // We manually turn off the spinner after the callback finishes.
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    if (isConfirming || isCancelled) return;
    setIsCancelled(true);
    onCancel();
  };

  const formattedTxAmount = Number(payload.amount || 0).toLocaleString('vi-VN');

  return (
    <div style={{
      border: '1.5px solid #fed7aa',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      padding: '14px 16px',
      maxWidth: '340px',
      boxShadow: '0 2px 12px rgba(234,88,12,0.08)',
      fontFamily: 'inherit'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <PieChart size={16} color="#c2410c" />
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#9a3412' }}>
          Yêu cầu thiết lập hạn mức
        </span>
      </div>

      {/* Message */}
      <p style={{ fontSize: '12.5px', color: '#431407', marginBottom: '12px', lineHeight: 1.4 }}>
        Danh mục <b>{payload.categoryName || 'Khác'}</b> chưa có hạn mức tháng này. Bạn cần thiết lập hạn mức để ghi khoản chi <b>{formattedTxAmount}đ</b> này.
      </p>

      {/* Error Message */}
      {localError && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#fee2e2', color: '#b91c1c', padding: '8px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
          <AlertCircle size={14} />
          <span>{localError}</span>
        </div>
      )}

      {/* Input */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9a3412', marginBottom: '4px' }}>
          Số tiền hạn mức (đ)
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="number"
            min="1000"
            step="1000"
            value={amountStr}
            onChange={(e) => {
              setAmountStr(e.target.value);
              if (localError) setLocalError('');
            }}
            disabled={isConfirming || isCancelled}
            placeholder="VD: 1000000"
            style={{
              width: '100%',
              padding: '8px 10px',
              paddingRight: '36px',
              borderRadius: '8px',
              border: '1px solid #fdba74',
              outline: 'none',
              fontSize: '13px',
              fontWeight: 600,
              color: '#431407',
              background: '#fff'
            }}
          />
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#fdba74', fontWeight: 700 }}>
            VND
          </span>
        </div>
        {amountStr && !isNaN(Number(amountStr)) && Number(amountStr) > 0 && (
          <p style={{ marginTop: '4px', fontSize: '11px', color: '#c2410c', fontWeight: 500 }}>
            ≈ {formatCurrency(Number(amountStr))}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleConfirm}
          disabled={isConfirming || isCancelled}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: isConfirming ? '#fdba74' : '#ea580c',
            color: '#fff',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isConfirming || isCancelled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: isCancelled ? 0.5 : 1
          }}
        >
          {isConfirming
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</>
            : <><CheckCircle size={14} /> Tạo & Ghi</>
          }
        </button>

        <button
          onClick={handleCancel}
          disabled={isConfirming || isCancelled}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1.5px solid #fdba74',
            background: '#fff',
            color: '#c2410c',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isConfirming || isCancelled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: isConfirming || isCancelled ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <X size={14} /> Hủy
        </button>
      </div>

      {/* Spinner animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
