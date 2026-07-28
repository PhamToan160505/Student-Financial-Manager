import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function BudgetWarningBanner({ warnings, totalBudget }) {
  if (!warnings || warnings.length === 0) {
    if (totalBudget > 0) {
      return (
        <div className="p-4 rounded-2xl border border-success/30 bg-success-light text-success flex items-center gap-3 shadow-2xs">
          <ShieldCheck className="w-6 h-6 shrink-0" />
          <span className="font-medium text-sm sm:text-base">
            Khả năng kiểm soát chi tiêu tốt! Các quỹ đều nằm trong hạn mức an toàn (&lt; 80%).
          </span>
        </div>
      );
    }
    return null;
  }

  const hasOverBudget = warnings.some(w => w.percent_used > 100);

  return (
    <div className={`p-4.5 rounded-2xl border flex items-start gap-3.5 transition-all shadow-sm ${
      hasOverBudget 
        ? 'bg-danger-light border-danger text-danger' 
        : 'bg-warning-light border-warning text-warning-dark'
    }`}>
      <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 animate-bounce" />
      <div className="space-y-1.5 flex-1">
        <h4 className="font-bold text-base leading-snug">
          {hasOverBudget 
            ? `Cảnh báo: Có ${warnings.filter(w => w.percent_used > 100).length} quỹ đã vượt hạn mức ngân sách!` 
            : `Chú ý: Có ${warnings.length} quỹ sắp đầy hoặc đã đạt mức ngân sách (từ 80% - 100%)!`}
        </h4>
        <div className="flex flex-wrap gap-2 pt-1">
          {warnings.map(w => (
            <span 
              key={w.category_id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white shadow-2xs border ${
                w.percent_used > 100 ? 'border-danger text-danger' : 'border-warning text-warning-dark'
              }`}
            >
              <span>{w.category_name}</span>
              <span className="font-bold">{w.percent_used > 100 ? `(Vượt hạn mức)` : `(${w.percent_used}%)`}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
