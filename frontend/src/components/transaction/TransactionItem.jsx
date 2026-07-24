import React from 'react';
import { Pencil, Trash2, MapPin, Calendar, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryEmoji } from '../../utils/emoji';

export default function TransactionItem({ transaction, onEdit, onDelete }) {
  const isIncome = transaction.type === 'income';
  const emoji = getCategoryEmoji(transaction.category_icon);
  const dateStr = transaction.transaction_date_str || transaction.transaction_date?.slice(0, 10);

  // Format date DD/MM/YYYY
  const formattedDate = dateStr ? dateStr.split('-').reverse().join('/') : '';

  return (
    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-neutral-border hover:border-primary/40 hover:shadow-sm transition-all group">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
          style={{ backgroundColor: `${transaction.category_color || '#2563EB'}18` }}
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-maintext truncate">
              {transaction.category_name || 'Khác'}
            </span>
            <span className="text-xs text-neutral-subtext flex items-center gap-1 shrink-0">
              • <Calendar className="w-3 h-3" /> {formattedDate}
            </span>
          </div>
          
          {(transaction.merchant || transaction.note) && (
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-subtext truncate">
              {transaction.merchant && (
                <span className="flex items-center gap-1 truncate text-neutral-maintext font-medium">
                  <MapPin className="w-3 h-3 text-primary shrink-0" /> {transaction.merchant}
                </span>
              )}
              {transaction.note && (
                <span className="flex items-center gap-1 truncate">
                  <FileText className="w-3 h-3 shrink-0" /> {transaction.note}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 ml-3">
        <div className="text-right">
          <p className={`text-base font-bold tabular-nums ${isIncome ? 'text-success' : 'text-danger'}`}>
            {isIncome ? `+${formatCurrency(transaction.amount)}` : `-${formatCurrency(transaction.amount)}`}
          </p>
          <span className="text-[10px] uppercase font-semibold text-neutral-subtext">
            {isIncome ? 'Thu nhập' : 'Chi tiêu'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 rounded-lg text-neutral-subtext hover:text-primary hover:bg-primary-light transition-colors"
            title="Chỉnh sửa"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(transaction)}
            className="p-1.5 rounded-lg text-neutral-subtext hover:text-danger hover:bg-danger-light transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
