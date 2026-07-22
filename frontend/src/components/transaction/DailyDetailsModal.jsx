import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import TransactionItem from './TransactionItem';
import { Plus, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * DailyDetailsModal - Shows transactions for a specific date selected from the calendar.
 */
export default function DailyDetailsModal({
  isOpen,
  onClose,
  dateInfo,
  onEditTransaction,
  onDeleteTransaction,
  onAddForDate
}) {
  if (!isOpen || !dateInfo) return null;

  const { dateStr, transactions = [] } = dateInfo;

  // Format date DD/MM/YYYY
  const formattedDate = dateStr ? dateStr.split('-').reverse().join('/') : '';

  // Calculate daily totals
  let totalExpense = 0;
  let totalIncome = 0;
  transactions.forEach(t => {
    if (t.type === 'expense') totalExpense += Number(t.amount);
    if (t.type === 'income') totalIncome += Number(t.amount);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sổ thu chi ngày ${formattedDate}`}
      subtitle={`${transactions.length} khoản thu chi trong ngày`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Daily summary header */}
        <div className="grid grid-cols-2 gap-3 bg-neutral-bg p-3.5 rounded-2xl border border-neutral-border">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-success-light text-success rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-neutral-subtext uppercase">Thu nhập ngày</p>
              <p className="text-sm font-bold text-success tabular-nums">+{formatCurrency(totalIncome)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-danger-light text-danger rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-neutral-subtext uppercase">Chi tiêu ngày</p>
              <p className="text-sm font-bold text-danger tabular-nums">-{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>

        {/* Transactions list */}
        {transactions.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-neutral-border rounded-2xl bg-neutral-bg/30">
            <Calendar className="w-10 h-10 text-neutral-subtext/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-maintext">Chưa có khoản thu/chi nào trong ngày này</p>
            <p className="text-xs text-neutral-subtext mt-0.5">Nhấp nút bên dưới để thêm ngay</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {transactions.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onEdit={(tx) => {
                  onClose();
                  onEditTransaction(tx);
                }}
                onDelete={(tx) => {
                  onClose();
                  onDeleteTransaction(tx);
                }}
              />
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2 border-t border-neutral-border">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={onClose}
          >
            Đóng
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            className="flex-1"
            onClick={() => {
              onClose();
              onAddForDate(dateStr);
            }}
          >
            Thêm khoản thu/chi ngày này
          </Button>
        </div>
      </div>
    </Modal>
  );
}
