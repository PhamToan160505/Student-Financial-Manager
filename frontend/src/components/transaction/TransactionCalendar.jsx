import React from 'react';
import { formatShortCurrency } from '../../utils/formatCurrency';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * TransactionCalendar - 7-column monthly calendar grid showing daily expense/income pills.
 * Clicking a day cell opens the DailyDetailsModal.
 */
export default function TransactionCalendar({ month, groupedByDate, onSelectDay }) {
  // Parse month 'YYYY-MM'
  const [yearStr, monthStr] = (month || new Date().toISOString().slice(0, 7)).split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // 0-indexed

  // First day of month and number of days
  const firstDate = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Convert getDay() (0=Sun, 1=Mon) to Mon=0 ... Sun=6
  const startDayOffset = (firstDate.getDay() + 6) % 7;

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  const daysArray = [];
  // Blank cells before first day
  for (let i = 0; i < startDayOffset; i++) {
    daysArray.push({ type: 'empty', key: `empty-${i}` });
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTransactions = groupedByDate[dateStr] || [];
    
    let dayExpense = 0;
    let dayIncome = 0;
    dayTransactions.forEach(t => {
      if (t.type === 'expense') dayExpense += Number(t.amount);
      if (t.type === 'income') dayIncome += Number(t.amount);
    });

    daysArray.push({
      type: 'day',
      key: dateStr,
      dayNumber: d,
      dateStr,
      transactions: dayTransactions,
      dayExpense,
      dayIncome,
      isToday: dateStr === todayStr
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-border shadow-sm overflow-hidden animate-fadeIn">
      {/* Calendar Header */}
      <div className="px-6 py-4 bg-neutral-bg/60 border-b border-neutral-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-neutral-maintext">
            Bộ Lịch Thu Chi — Tháng {monthStr}/{yearStr}
          </h3>
        </div>
        <p className="text-xs text-neutral-subtext">Nhấp vào ô ngày để xem chi tiết hoặc thêm khoản thu/chi</p>
      </div>

      {/* Weekdays header */}
      <div className="grid grid-cols-7 border-b border-neutral-border bg-neutral-bg/30">
        {WEEK_DAYS.map(day => (
          <div key={day} className="py-2.5 text-center text-xs font-bold text-neutral-subtext uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-neutral-border">
        {daysArray.map(item => {
          if (item.type === 'empty') {
            return <div key={item.key} className="min-h-[105px] sm:min-h-[120px] bg-neutral-bg/20" />;
          }

          const hasTx = item.transactions.length > 0;

          return (
            <div
              key={item.key}
              onClick={() => onSelectDay({ dateStr: item.dateStr, transactions: item.transactions })}
              className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between transition-all cursor-pointer group ${
                item.isToday
                  ? 'bg-primary/5 ring-1 ring-inset ring-primary/40'
                  : 'hover:bg-neutral-bg/60'
              }`}
            >
              {/* Top inside day: Date number + Count dot */}
              <div className="flex items-center justify-between">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 ${
                    item.isToday
                      ? 'bg-primary text-white shadow-sm shadow-primary/30'
                      : 'text-neutral-maintext'
                  }`}
                >
                  {item.dayNumber}
                </span>

                {hasTx && (
                  <span className="text-[10px] font-semibold text-neutral-subtext bg-neutral-bg px-1.5 py-0.5 rounded-md border border-neutral-border">
                    {item.transactions.length} khoản
                  </span>
                )}
              </div>

              {/* Bottom inside day: Expense & Income badges */}
              <div className="space-y-1 mt-2">
                {item.dayExpense > 0 && (
                  <div className="bg-danger-light text-danger text-[11px] font-bold px-1.5 py-0.5 rounded-md border border-danger/20 truncate text-right tabular-nums">
                    -{formatShortCurrency(item.dayExpense)}
                  </div>
                )}
                {item.dayIncome > 0 && (
                  <div className="bg-success-light text-success text-[11px] font-bold px-1.5 py-0.5 rounded-md border border-success/20 truncate text-right tabular-nums">
                    +{formatShortCurrency(item.dayIncome)}
                  </div>
                )}
                {!hasTx && (
                  <div className="text-[11px] text-neutral-subtext/40 text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    + Thêm
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
