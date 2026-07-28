import React from 'react';
import { AlertTriangle, ShieldCheck, Wallet, PieChart, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * BudgetSummary - Displays overall monthly budget KPIs and intelligent warning alerts
 */
export default function BudgetSummary({ summary, warnings, loading }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-neutral-border p-5" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-neutral-border p-4.5" />
          ))}
        </div>
      </div>
    );
  }

  const totalBudget = Number(summary?.total_budget || 0);
  const totalSpentBudgeted = Number(summary?.total_spent_budgeted || 0);
  const remaining = Number(summary?.remaining || 0);
  const percentOverall = totalBudget > 0 ? Math.round((totalSpentBudgeted / totalBudget) * 100) : 0;

  // Determine highest alert severity among warnings
  const hasOverBudget = warnings?.some(w => w.percent_used >= 100);
  const hasNearBudget = warnings?.some(w => w.percent_used >= 80 && w.percent_used < 100);

  return (
    <div className="space-y-5">
      {/* 1. Intelligent Warning Banner */}
      {warnings && warnings.length > 0 ? (
        <div className={`p-4.5 rounded-2xl border flex items-start gap-3.5 transition-all shadow-sm ${
          hasOverBudget 
            ? 'bg-danger-light border-danger text-danger' 
            : 'bg-warning-light border-warning text-warning-dark'
        }`}>
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1.5 flex-1">
            <h4 className="font-bold text-base leading-snug">
              {hasOverBudget 
                ? `Cảnh báo: Có ${warnings.filter(w => w.percent_used >= 100).length} danh mục đã vượt hạn mức ngân sách!` 
                : `Chú ý: Có ${warnings.length} danh mục đã chi tiêu trên 80% hạn mức!`}
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {warnings.map(w => (
                <span 
                  key={w.category_id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white shadow-2xs border ${
                    w.percent_used >= 100 ? 'border-danger text-danger' : 'border-warning text-warning-dark'
                  }`}
                >
                  <span>{w.category_name}</span>
                  <span className="font-bold">{w.percent_used >= 100 ? `(Vượt hạn mức)` : `(${w.percent_used}%)`}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : totalBudget > 0 ? (
        <div className="p-4 rounded-2xl border border-success/30 bg-success-light text-success flex items-center gap-3 shadow-2xs">
          <ShieldCheck className="w-6 h-6 shrink-0" />
          <span className="font-medium text-sm sm:text-base">
            Khả năng kiểm soát chi tiêu tốt! Các danh mục đều nằm trong hạn mức an toàn (&lt; 80%).
          </span>
        </div>
      ) : null}

      {/* 2. Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-subtext mb-2">
            <span className="text-sm font-medium">Tổng hạn mức thiết lập</span>
            <div className="p-2 rounded-xl bg-primary-light text-primary">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-neutral-maintext tracking-tight">
              {formatCurrency(totalBudget)}
            </p>
            <p className="text-xs text-neutral-subtext mt-1">
              Cho các danh mục đang giám sát
            </p>
          </div>
        </div>

        {/* Total Spent in Budget Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-subtext mb-2">
            <span className="text-sm font-medium">Đã chi TÍNH ĐẾN HÔM NAY</span>
            <div className={`p-2 rounded-xl ${
              percentOverall >= 100 ? 'bg-danger-light text-danger' : percentOverall >= 80 ? 'bg-warning-light text-warning-dark' : 'bg-primary-light text-primary'
            }`}>
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className={`text-xl sm:text-2xl font-bold tracking-tight ${
                percentOverall >= 100 ? 'text-danger' : percentOverall >= 80 ? 'text-warning-dark' : 'text-neutral-maintext'
              }`}>
                {formatCurrency(totalSpentBudgeted)}
              </p>
              {totalBudget > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                  {percentOverall}%
                </span>
              )}
            </div>
            {/* Minimal Progress Bar for Overall */}
            {totalBudget > 0 && (
              <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    percentOverall >= 100 ? 'bg-danger' : percentOverall >= 80 ? 'bg-warning' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(percentOverall, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Remaining Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-subtext mb-2">
            <span className="text-sm font-medium">Ngân sách còn lại</span>
            <div className={`p-2 rounded-xl ${remaining < 0 ? 'bg-danger-light text-danger' : 'bg-success-light text-success'}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className={`text-xl sm:text-2xl font-bold tracking-tight ${
              remaining < 0 ? 'text-danger' : 'text-success'
            }`}>
              {remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
            </p>
            <p className="text-xs text-neutral-subtext mt-1">
              {remaining < 0 ? 'Đã chi vượt hạn mức tổng' : 'Hạn mức khả dụng cho đến hết tháng'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
