import React from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const ICON_EMOJI = {
  Tag: '🏷️', UtensilsCrossed: '🍽️', Home: '🏠', BookOpen: '📚',
  Bus: '🚌', Gamepad2: '🎮', ShoppingBag: '🛍️', Heart: '💊',
  Users: '👨‍👩‍👧', Briefcase: '💼', GraduationCap: '🎓', Gift: '🎁',
  MoreHorizontal: '⋯', Coffee: '☕', Car: '🚗', Music: '🎵'
};

function getCategoryEmoji(iconStr) {
  if (!iconStr) return '🏷️';
  if (ICON_EMOJI[iconStr]) return ICON_EMOJI[iconStr];
  if (iconStr.length <= 4 && !/^[a-zA-Z0-9]+$/.test(iconStr)) {
    if (iconStr === 'Ă' || iconStr === '?' || iconStr === '') return '🏷️';
    return iconStr;
  }
  return '🏷️';
}

/**
 * BudgetCard - Displays budget limit, spent amount, capped progress bar, and intelligent alerts
 * Cap progress bar width at 100% while displaying true overflow percentage
 */
export default function BudgetCard({ item, onEdit, onDelete }) {
  const emoji = getCategoryEmoji(item.category_icon);
  const color = item.category_color || '#2563EB';

  // If budget limit has NOT been set yet for this category
  if (!item.is_budgeted) {
    return (
      <div className="bg-white p-4.5 rounded-2xl border border-dashed border-neutral-300 hover:border-primary transition-all shadow-2xs flex flex-col justify-between h-full group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-neutral-100"
                style={{ backgroundColor: `${color}15` }}
              >
                {emoji}
              </span>
              <div>
                <h4 className="font-bold text-neutral-maintext text-base leading-snug">
                  {item.category_name}
                </h4>
                <p className="text-xs text-neutral-subtext">
                  Danh mục chi tiêu
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Chưa thiết lập
            </span>
          </div>

          <div className="mt-2 py-2 px-3 rounded-xl bg-neutral-bg flex items-center justify-between text-sm">
            <span className="text-neutral-subtext">Đã chi trong tháng:</span>
            <span className="font-bold text-neutral-maintext">{formatCurrency(item.spent)}</span>
          </div>
        </div>

        <button
          onClick={() => onEdit(item)}
          className="mt-4 w-full py-2 px-3 rounded-xl border border-primary text-primary bg-primary-light hover:bg-primary hover:text-white transition-all text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          Thiết lập hạn mức
        </button>
      </div>
    );
  }

  // If budget limit IS set
  const { amount, spent, remaining, percent_used } = item;
  const isOver = percent_used >= 100;
  const isWarning = percent_used >= 80 && percent_used < 100;

  // Determine progress bar fill and width (cap width strictly at 100%)
  const barColor = isOver ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-primary';
  const cappedWidth = Math.min(percent_used, 100);

  return (
    <div className={`bg-white p-4.5 rounded-2xl border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between h-full ${
      isOver ? 'border-danger/40 ring-1 ring-danger/20' : isWarning ? 'border-warning/40' : 'border-neutral-border'
    }`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-neutral-100"
              style={{ backgroundColor: `${color}15` }}
            >
              {emoji}
            </span>
            <div>
              <h4 className="font-bold text-neutral-maintext text-base leading-snug">
                {item.category_name}
              </h4>
              <p className="text-xs text-neutral-subtext">
                Hạn mức: {formatCurrency(amount)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              title="Chỉnh sửa hạn mức"
              className="p-1.5 rounded-lg text-neutral-subtext hover:text-primary hover:bg-primary-light transition-all cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item)}
              title="Xóa hạn mức"
              className="p-1.5 rounded-lg text-neutral-subtext hover:text-danger hover:bg-danger-light transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Spent vs Remaining text */}
        <div className="flex items-baseline justify-between text-sm mt-3 mb-1.5">
          <div>
            <span className="text-neutral-subtext text-xs">Đã chi: </span>
            <span className={`font-bold ${isOver ? 'text-danger' : isWarning ? 'text-warning' : 'text-neutral-maintext'}`}>
              {formatCurrency(spent)}
            </span>
          </div>

          <div className="text-right">
            {isOver ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-danger-light text-danger">
                Vượt {percent_used - 100}% ({formatCurrency(Math.abs(remaining))})
              </span>
            ) : isWarning ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-warning-light text-warning">
                {percent_used}% (Còn {formatCurrency(remaining)})
              </span>
            ) : (
              <span className="text-xs font-medium text-neutral-subtext">
                {percent_used}% (Còn {formatCurrency(remaining)})
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar (Width strictly capped at 100%) */}
        <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${barColor}`}
            style={{ width: `${cappedWidth}%` }}
          />
        </div>
      </div>

      {/* Footer message if applicable */}
      <div className="mt-3 pt-2.5 border-t border-neutral-border/60 flex items-center justify-between text-xs text-neutral-subtext">
        <span>Tình trạng:</span>
        <span className={`font-semibold ${isOver ? 'text-danger' : isWarning ? 'text-warning' : 'text-success'}`}>
          {isOver ? 'Đã vượt quá hạn mức' : isWarning ? 'Sắp chạm ngưỡng hạn mức' : 'An toàn'}
        </span>
      </div>
    </div>
  );
}
