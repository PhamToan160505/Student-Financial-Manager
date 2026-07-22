import React from 'react';
import { ArrowLeftRight, Plus, ChevronRight, Calendar, MapPin, FileText } from 'lucide-react';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatCurrency';

const ICON_EMOJI = {
  Tag: '🏷️', UtensilsCrossed: '🍽️', Home: '🏠', BookOpen: '📚',
  Bus: '🚌', Gamepad2: '🎮', ShoppingBag: '🛍️', Heart: '💊',
  Users: '👨‍👩‍👧', Briefcase: '💼', GraduationCap: '🎓', Gift: '🎁',
  MoreHorizontal: '⋯', Coffee: '☕', Car: '🚗', Music: '🎵'
};

export default function RecentTransactions({ transactions = [], onNavigateToAll, onAddTransaction }) {
  const hasData = transactions.length > 0;

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between border-b border-neutral-border pb-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-neutral-maintext flex items-center gap-2">
              <ArrowLeftRight className="w-4.5 h-4.5 text-primary" />
              Giao Dịch Gần Đây
            </h3>
            <p className="text-xs text-neutral-subtext mt-0.5">Các khoản thu chi mới được ghi nhận nhất</p>
          </div>
          {hasData && (
            <button
              onClick={onNavigateToAll}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark p-1.5 rounded-lg hover:bg-primary-light transition-all"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 bg-neutral-bg rounded-2xl flex items-center justify-center mb-3 border border-neutral-border">
              <ArrowLeftRight className="w-6 h-6 text-neutral-subtext/40" />
            </div>
            <p className="text-sm font-bold text-neutral-maintext">Chưa có giao dịch nào được ghi chép</p>
            <p className="text-xs text-neutral-subtext max-w-xs mt-1 mb-4">
              Khởi đầu quản lý tài chính ngay hôm nay bằng cách thêm khoản thu hoặc chi tiêu đầu tiên!
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={onAddTransaction}
            >
              Thêm khoản thu/chi
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {transactions.map(tx => {
              const isIncome = tx.type === 'income';
              const emoji = ICON_EMOJI[tx.category_icon] || '🏷️';
              const dateStr = tx.transaction_date_str || tx.transaction_date?.slice(0, 10);
              const formattedDate = dateStr ? dateStr.split('-').reverse().join('/') : '';

              return (
                <div
                  key={tx.id}
                  onClick={onNavigateToAll}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-neutral-border hover:border-primary/40 hover:bg-neutral-bg/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs"
                      style={{ backgroundColor: `${tx.category_color || '#2563EB'}18` }}
                    >
                      {emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-maintext truncate">
                          {tx.category_name || 'Khác'}
                        </span>
                        <span className="text-xs text-neutral-subtext flex items-center gap-1 shrink-0">
                          • <Calendar className="w-3 h-3" /> {formattedDate}
                        </span>
                      </div>
                      
                      {(tx.merchant || tx.note) && (
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-subtext truncate">
                          {tx.merchant && (
                            <span className="flex items-center gap-1 truncate text-neutral-maintext font-medium">
                              <MapPin className="w-3 h-3 text-primary shrink-0" /> {tx.merchant}
                            </span>
                          )}
                          {tx.note && (
                            <span className="flex items-center gap-1 truncate">
                              <FileText className="w-3 h-3 shrink-0" /> {tx.note}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold tabular-nums ${isIncome ? 'text-success' : 'text-danger'}`}>
                      {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                    </p>
                    <span className="text-[10px] uppercase font-semibold text-neutral-subtext">
                      {isIncome ? 'Thu nhập' : 'Chi tiêu'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
