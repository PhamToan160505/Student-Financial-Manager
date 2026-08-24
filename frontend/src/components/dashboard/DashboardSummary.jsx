import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * DashboardSummary - 4 KPI Cards displaying Total Income, Total Expense, Net Balance, and Savings Rate.
 * Strictly adheres to White/Blue/Green/Red color palette and division by zero edge case rules.
 */
export default function DashboardSummary({ summary, loading, availableBalanceData }) {
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
          Tháng đầu ghi nhận
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
    const isGood = isInverse ? !isUp : isUp;
    const diffAmount = changeObj.diff_amount || 0;
    const absDiff = Math.abs(diffAmount);

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md mt-1.5 border ${
          isGood
            ? 'text-success bg-success-light border-success/20'
            : 'text-danger bg-danger-light border-danger/20'
        }`}
      >
        {isUp ? <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> : <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
        {isUp ? '+' : '-'}{formatCurrency(absDiff)}
        <span className="font-normal opacity-80">so tháng trước</span>
      </span>
    );
  };

  // Calculate percentages for the stacked bar
  let pLocked = 0, pBudget = 0, pAvail = 0;
  if (availableBalanceData) {
    const locked = Math.max(0, availableBalanceData.total_locked_in_jars);
    const budget = Math.max(0, availableBalanceData.total_remaining_budgets);
    const avail = Math.max(0, availableBalanceData.available_balance);
    const totalPositive = locked + budget + avail;
    if (totalPositive > 0) {
      pLocked = (locked / totalPositive) * 100;
      pBudget = (budget / totalPositive) * 100;
      pAvail = 100 - pLocked - pBudget;
    }
  }

  return (
    <div className="space-y-4">
      {/* 0. Banner Phân bổ Số dư (Lũy kế toàn thời gian) */}
      {availableBalanceData && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-neutral-bg border border-blue-100/80 p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Top row: Label + Total */}
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shrink-0 shadow-sm">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-primary tracking-wider uppercase mb-0.5">
                  <b>Tổng số dư thực tế</b>
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-primary">
                  {formatCurrency(availableBalanceData.total_actual_balance)}
                </p>
              </div>
            </div>

            {/* Middle: Stacked Bar */}
            <div className="h-3 sm:h-4 w-full rounded-full overflow-hidden flex bg-neutral-bg/50 border border-white/20">
              {pAvail > 0 && <div style={{ width: `${pAvail}%` }} className="bg-primary h-full transition-all" title="Số dư khả dụng" />}
              {pBudget > 0 && <div style={{ width: `${pBudget}%` }} className="bg-blue-400 h-full transition-all" title="Ngân sách chưa tiêu" />}
              {pLocked > 0 && <div style={{ width: `${pLocked}%` }} className="bg-slate-400 h-full transition-all" title="Đã khóa trong hũ" />}
            </div>

            {/* Bottom: 3 Columns Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-white/70 backdrop-blur-sm p-3.5 sm:p-4 rounded-xl border border-white shadow-sm mt-1">
              {/* Col 1 */}
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary shrink-0 mt-0.5 shadow-sm"></div>
                <div>
                  <p className="text-[11px] text-neutral-subtext font-medium uppercase tracking-wider">Số dư khả dụng</p>
                  <p className="text-sm font-bold text-primary">
                    {availableBalanceData.available_balance > 0 ? '+' : ''}{formatCurrency(availableBalanceData.available_balance)}
                  </p>
                </div>
              </div>
              {/* Col 2 */}
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-400 shrink-0 mt-0.5 shadow-sm"></div>
                <div>
                  <p className="text-[11px] text-neutral-subtext font-medium uppercase tracking-wider">Ngân sách chưa tiêu</p>
                  <p className="text-sm font-bold text-neutral-maintext">{formatCurrency(availableBalanceData.total_remaining_budgets)}</p>
                </div>
              </div>
              {/* Col 3 */}
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-400 shrink-0 mt-0.5 shadow-sm"></div>
                <div>
                  <p className="text-[11px] text-neutral-subtext font-medium uppercase tracking-wider">Đã khóa trong hũ</p>
                  <p className="text-sm font-bold text-neutral-maintext">{formatCurrency(availableBalanceData.total_locked_in_jars)}</p>
                </div>
              </div>
            </div>

            {/* Note if available <= 0 */}
            {availableBalanceData.available_balance <= 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-subtext bg-neutral-bg/50 p-2 rounded-lg w-fit">
                <Info className="w-4 h-4 shrink-0" />
                <span>Toàn bộ số dư đã có kế hoạch rõ ràng — không có gì bất thường.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3 KPI Cards theo tháng */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Total Income */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider pt-1">Tổng Thu Nhập</p>
              <div className="p-2 bg-success-light rounded-xl text-success shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-bold text-success tabular-nums truncate" title={`+${formatCurrency(income)}`}>+{formatCurrency(income)}</p>
          </div>
          <div className="mt-3">{renderChangeBadge(summary?.income_change, false)}</div>
        </div>

        {/* 2. Total Expense */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider pt-1">Tổng Chi Tiêu</p>
              <div className="p-2 bg-danger-light rounded-xl text-danger shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-bold text-danger tabular-nums truncate" title={`-${formatCurrency(expense)}`}>-{formatCurrency(expense)}</p>
          </div>
          <div className="mt-3">{renderChangeBadge(summary?.expense_change, true)}</div>
        </div>

        {/* 3. Savings Rate */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-subtext uppercase tracking-wider pt-1">Tỷ Lệ Tiết Kiệm</p>
              <div className="p-2 bg-primary-light rounded-xl text-primary shrink-0">
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            {savingsRate === null || savingsRate === undefined ? (
              <p className="text-base font-bold text-neutral-subtext">Chưa có dữ liệu</p>
            ) : (
              <p className={`text-xl font-bold tabular-nums truncate ${savingsRate >= 20 ? 'text-primary' : savingsRate >= 0 ? 'text-success' : 'text-danger'}`} title={`${savingsRate}%`}>
                {savingsRate}%
              </p>
            )}
          </div>
          <p className="text-[11px] text-neutral-subtext mt-3 font-medium">
            {savingsRate === null || savingsRate === undefined
              ? 'Cần ghi nhận thu nhập để tính'
              : savingsRate >= 20
              ? '🎯 Đạt mục tiêu tiết kiệm chuẩn (> 20%)'
              : '💡 Tiết kiệm = (Thu - Chi) / Thu'}
          </p>
        </div>
      </div>
    </div>
  );
}
