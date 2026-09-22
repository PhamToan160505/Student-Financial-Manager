import React from 'react';
import { useQuickAdd } from '../../hooks/useQuickAdd';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryEmoji } from '../../utils/emoji';
import { Zap } from 'lucide-react';

export default function QuickAddChips({ onSelectTemplate, refreshTrigger }) {
  const { templates, loading } = useQuickAdd(refreshTrigger);

  if (loading) {
    return (
      <div className="flex items-center gap-2 overflow-hidden animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 w-24 bg-neutral-border rounded-full shrink-0" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-1.5 text-xs font-bold text-primary shrink-0 mr-1">
        <Zap className="w-4 h-4 fill-primary" />
        Ghi nhanh:
      </div>
      {templates.map((tpl, idx) => (
        <button
          key={idx}
          onClick={() => onSelectTemplate(tpl)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-neutral-border/70 rounded-xl text-xs font-semibold hover:border-primary/30 hover:text-primary hover:bg-primary-light transition-colors"
          title={`Gợi ý: ${tpl.suggestedNote || 'Không có ghi chú'}`}
        >
          <span className="flex items-center gap-1.5">
            <span className="text-sm">{getCategoryEmoji(tpl.categoryIcon)}</span>
            <span>{tpl.categoryName}</span>
          </span>
          <span className="text-neutral-subtext">~{formatCurrency(tpl.suggestedAmount)}</span>
        </button>
      ))}
    </div>
  );
}
