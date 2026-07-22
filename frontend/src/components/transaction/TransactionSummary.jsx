import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * TransactionSummary Card - Displays Total Income, Total Expense, and Net Balance for the selected month.
 */
export default function TransactionSummary({ summary, loading }) {
  const income = Number(summary?.total_income || 0);
  const expense = Number(summary?.total_expense || 0);
  const balance = Number(summary?.balance || 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-neutral-border h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Income */}
      <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider">Tổng Thu Nhập</p>
          <p className="text-xl font-bold text-success mt-1 tabular-nums">+{formatCurrency(income)}</p>
        </div>
        <div className="p-3 bg-success-light rounded-xl text-success shrink-0">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>

      {/* Total Expense */}
      <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider">Tổng Chi Tiêu</p>
          <p className="text-xl font-bold text-danger mt-1 tabular-nums">-{formatCurrency(expense)}</p>
        </div>
        <div className="p-3 bg-danger-light rounded-xl text-danger shrink-0">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

      {/* Net Balance */}
      <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider">Số Dư Thực Tế</p>
          <p className={`text-xl font-bold mt-1 tabular-nums ${balance >= 0 ? 'text-primary' : 'text-danger'}`}>
            {balance >= 0 ? `+${formatCurrency(balance)}` : formatCurrency(balance)}
          </p>
        </div>
        <div className={`p-3 rounded-xl shrink-0 ${balance >= 0 ? 'bg-primary-light text-primary' : 'bg-danger-light text-danger'}`}>
          <Wallet className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
