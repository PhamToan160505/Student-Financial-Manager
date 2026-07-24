import React, { useState } from 'react';
import { CheckCircle, X, Loader2, Receipt } from 'lucide-react';

/**
 * ActionCard - Hiển thị thẻ xác nhận giao dịch do AI đề xuất.
 * Human-in-the-loop: Người dùng phải bấm Xác nhận trước khi giao dịch được tạo thật.
 *
 * Props:
 *   payload    - { amount, categoryId, categoryName, type, note, date }
 *   onConfirm  - callback khi user bấm Xác nhận
 *   onCancel   - callback khi user bấm Hủy
 */
export default function ActionCard({ payload, onConfirm, onCancel }) {
  // [Điểm 4] isConfirming set TRUE ngay khi bấm (trước await) — ngăn double-submit
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const handleConfirm = () => {
    if (isConfirming || isCancelled) return;
    setIsConfirming(true); // Disable ngay trước khi gọi API
    onConfirm(payload);
  };

  const handleCancel = () => {
    if (isConfirming || isCancelled) return;
    setIsCancelled(true);
    onCancel();
  };

  const formattedAmount = Number(payload.amount || 0).toLocaleString('vi-VN');
  const formattedDate = payload.date
    ? new Date(payload.date + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';
  const typeLabel = payload.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
  const typeColor = payload.type === 'income' ? '#16a34a' : '#dc2626';

  return (
    <div style={{
      border: '1.5px solid #e0e7ff',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 100%)',
      padding: '14px 16px',
      maxWidth: '340px',
      boxShadow: '0 2px 12px rgba(79,70,229,0.08)',
      fontFamily: 'inherit'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Receipt size={16} color="#4f46e5" />
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#3730a3' }}>
          Xác nhận giao dịch
        </span>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
        <Row label="Loại" value={<span style={{ color: typeColor, fontWeight: 600 }}>{typeLabel}</span>} />
        <Row label="Số tiền" value={<span style={{ fontWeight: 700, color: typeColor }}>{formattedAmount}đ</span>} />
        <Row label="Danh mục" value={payload.categoryName || 'Khác'} />
        {payload.note && <Row label="Ghi chú" value={payload.note} />}
        {formattedDate && <Row label="Ngày" value={formattedDate} />}
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
            background: isConfirming ? '#a5b4fc' : '#4f46e5',
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
            : <><CheckCircle size={14} /> Xác nhận</>
          }
        </button>

        <button
          onClick={handleCancel}
          disabled={isConfirming || isCancelled}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1.5px solid #e5e7eb',
            background: '#fff',
            color: '#6b7280',
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

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151' }}>
      <span style={{ color: '#6b7280', minWidth: '70px' }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{value}</span>
    </div>
  );
}
