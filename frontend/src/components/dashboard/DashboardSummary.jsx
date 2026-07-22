import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * DashboardSummary - 4 KPI Cards displaying Total Income, Total Expense, Net Balance, and Savings Rate.
 * Strictly adheres to White/Blue/Green/Red color palette and division by zero edge case rules.
 */
export default function DashboardSummary({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-4.5 rounded-2xl border border-neutral-border h-28" />
        ))}
      </div>
    );
  }

  const income = Number(summary?.total_income || 0);
  const expense = Number(summary?.total_expense || 0);
  const balance = Number(summary?.balance || 0);
  const savingsRate = summary?.savings_rate; // can be null or number

  // Render percentage change badge
  const renderChangeBadge = (changeObj, isInverse = false) => {
    if (!changeObj) return null;
    if (changeObj.is_new) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md mt-1.5 border border-primary/20">
          +100% (Tháng đầu ghi nhận)
        </span>
      );
    }
    const val = Number(changeObj.value || 0);
    if (val === 0) {
      return (
        <span className="inline-flex items-center text-[11px] font-medium text-neutral-subtext mt-1.5">
          Tương đương tháng trước
        </span>
      );
    }
    const isUp = val > 0;
    // For income: up is good (green), down is bad (red)
    // For expense (isInverse): up is bad (red), down is good (green)
    const isGood = isInverse ? !isUp : isUp;

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md mt-1.5 border ${
          isGood
            ? 'text-success bg-success-light border-success/20'
            : 'text-danger bg-danger-light border-danger/20'
        }`}
      >
        {isUp ? <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> : <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
        {isUp ? `+${val}%` : `${val}%`} <span className="font-normal opacity-80 ml-0.5">so tháng trước</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Income */}
      <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider">Tổng Thu Nhập</p>
            <p className="text-xl font-bold text-success mt-1 tabular-nums">+{formatCurrency(income)}</p>
          </div>
          <div className="p-3 bg-success-light rounded-xl text-success shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div>{renderChangeBadge(summary?.income_change, false)}</div>
      </div>

      {/* 2. Total Expense */}
      <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider">Tổng Chi Tiêu</p>
            <p className="text-xl font-bold text-danger mt-1 tabular-nums">-{formatCurrency(expense)}</p>
          </div>
          <div className="p-3 bg-danger-light rounded-xl text-danger shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
        <div>{renderChangeBadge(summary?.expense_change, true)}</div>
      </div>

      {/* 3. Net Balance */}
      <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
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
        <p className="text-[11px] text-neutral-subtext mt-2 font-medium">
          {balance >= 0 ? '✨ Dòng tiền dương, quản lý tốt' : '⚠️ Chi đang vượt thu'}
        </p>
      </div>

      {/* 4. Savings Rate */}
      <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider">Tỷ Lệ Tiết Kiệm</p>
            {savingsRate === null || savingsRate === undefined ? (
              <p className="text-base font-bold text-neutral-subtext mt-1.5">Chưa có dữ liệu</p>
            ) : (
              <p className={`text-xl font-bold mt-1 tabular-nums ${savingsRate >= 20 ? 'text-primary' : savingsRate >= 0 ? 'text-success' : 'text-danger'}`}>
                {savingsRate}%
              </p>
            )}
          </div>
          <div className="p-3 bg-primary-light rounded-xl text-primary shrink-0">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[11px] text-neutral-subtext mt-2 font-medium">
          {savingsRate === null || savingsRate === undefined
            ? 'Cần ghi nhận thu nhập để tính'
            : savingsRate >= 20
            ? '🎯 Đạt mục tiêu tiết kiệm chuẩn (> 20%)'
            : '💡 Tiết kiệm = (Thu - Chi) / Thu'}
        </p>
      </div>
    </div>
  );
}
