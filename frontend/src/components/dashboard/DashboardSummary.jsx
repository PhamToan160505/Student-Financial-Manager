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
      {/* Phân bổ số dư lũy kế */}
      {availableBalanceData && (
        <section className="overflow-hidden rounded-[1.4rem] border border-white/90 bg-white/90 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-primary-light text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="mb-0.5 text-xs font-semibold text-neutral-subtext">Tổng số dư thực tế</p>
                  <p className="truncate text-2xl font-extrabold tracking-[-0.035em] text-neutral-maintext tabular-nums sm:text-3xl" title={formatCurrency(availableBalanceData.total_actual_balance)}>
                    {formatCurrency(availableBalanceData.total_actual_balance)}
                  </p>
                </div>
              </div>
              {availableBalanceData.available_balance <= 0 && (
                <div className="flex max-w-xs items-start gap-2 text-xs leading-5 text-neutral-subtext">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Toàn bộ số dư đã được phân bổ vào ngân sách hoặc hũ tiết kiệm.</span>
                </div>
              )}
            </div>

            <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-bg" aria-label="Tỷ lệ phân bổ số dư">
              {pAvail > 0 && <div style={{ width: `${pAvail}%` }} className="h-full bg-primary transition-[width] duration-500" title="Số dư khả dụng" />}
              {pBudget > 0 && <div style={{ width: `${pBudget}%` }} className="h-full bg-warning transition-[width] duration-500" title="Ngân sách chưa tiêu" />}
              {pLocked > 0 && <div style={{ width: `${pLocked}%` }} className="h-full bg-neutral-subtext/35 transition-[width] duration-500" title="Đã khóa trong hũ" />}
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-neutral-border/70 pt-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-neutral-border/70">
              <div className="min-w-0 sm:pr-5">
                <p className="flex items-center gap-2 text-xs font-medium text-neutral-subtext">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> Số dư khả dụng
                </p>
                <p className="mt-1 truncate text-base font-bold text-neutral-maintext tabular-nums" title={formatCurrency(availableBalanceData.available_balance)}>
                  {formatCurrency(availableBalanceData.available_balance)}
                </p>
              </div>
              <div className="min-w-0 sm:px-5">
                <p className="flex items-center gap-2 text-xs font-medium text-neutral-subtext">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-warning" /> Ngân sách còn lại
                </p>
                <p className="mt-1 truncate text-base font-bold text-neutral-maintext tabular-nums" title={formatCurrency(availableBalanceData.total_remaining_budgets)}>
                  {formatCurrency(availableBalanceData.total_remaining_budgets)}
                </p>
              </div>
              <div className="min-w-0 sm:pl-5">
                <p className="flex items-center gap-2 text-xs font-medium text-neutral-subtext">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-neutral-subtext/45" /> Trong hũ tiết kiệm
                </p>
                <p className="mt-1 truncate text-base font-bold text-neutral-maintext tabular-nums" title={formatCurrency(availableBalanceData.total_locked_in_jars)}>
                  {formatCurrency(availableBalanceData.total_locked_in_jars)}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3 KPI Cards theo tháng */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Total Income */}
        <div className="bg-white/90 p-5 rounded-[1.35rem] border border-white/80 shadow-sm flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-subtext tracking-wide pt-1">Tổng thu nhập</p>
              <div className="p-2 bg-success-light rounded-xl text-success shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-bold text-success tabular-nums truncate" title={`+${formatCurrency(income)}`}>+{formatCurrency(income)}</p>
          </div>
          <div className="mt-3">{renderChangeBadge(summary?.income_change, false)}</div>
        </div>

        {/* 2. Total Expense */}
        <div className="bg-white/90 p-5 rounded-[1.35rem] border border-white/80 shadow-sm flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-subtext tracking-wide pt-1">Tổng chi tiêu</p>
              <div className="p-2 bg-danger-light rounded-xl text-danger shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-bold text-danger tabular-nums truncate" title={`-${formatCurrency(expense)}`}>-{formatCurrency(expense)}</p>
          </div>
          <div className="mt-3">{renderChangeBadge(summary?.expense_change, true)}</div>
        </div>

        {/* 3. Savings Rate */}
        <div className="bg-white/90 p-5 rounded-[1.35rem] border border-white/80 shadow-sm flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-subtext tracking-wide pt-1">Tỷ lệ tiết kiệm</p>
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
