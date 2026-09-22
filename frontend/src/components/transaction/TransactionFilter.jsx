import React from 'react';
import { Search, Calendar as CalendarIcon, List, X } from 'lucide-react';
import MonthPicker from '../common/MonthPicker';

import StreakBadge from './StreakBadge';

export default function TransactionFilter({ filters, setFilters, viewMode, setViewMode, categories = [], streakData, streakLoading }) {
  const handleTypeChange = (type) => {
    setFilters(prev => ({ ...prev, type, categoryId: '' }));
  };

  const filteredCategories = categories.filter(c => {
    if (filters.type === 'all') return true;
    return c.type === filters.type;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Top row: Month + Streak + View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-border pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <MonthPicker
              value={filters.month}
              onChange={(val) => setFilters(prev => ({ ...prev, month: val }))}
              className="text-sm font-medium bg-neutral-bg border border-neutral-border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all whitespace-nowrap"
            />
          </div>
          <StreakBadge streakData={streakData} loading={streakLoading} />
        </div>

        {/* View mode switcher */}
        <div className="bg-neutral-bg p-1 rounded-xl border border-neutral-border inline-flex items-center">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-primary shadow-sm'
                : 'text-neutral-subtext hover:text-neutral-maintext'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Danh sách</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-primary shadow-sm'
                : 'text-neutral-subtext hover:text-neutral-maintext'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Bộ Lịch</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Type tabs, Category select, and Search input */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Type tabs */}
        <div className="flex items-center gap-1 bg-neutral-bg p-1 rounded-xl border border-neutral-border">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'expense', label: '💸 Chi tiêu' },
            { value: 'income', label: '💰 Thu nhập' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => handleTypeChange(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filters.type === tab.value
                  ? 'bg-white text-neutral-maintext shadow-sm'
                  : 'text-neutral-subtext hover:text-neutral-maintext'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          {/* Category Select */}
          <div className="relative shrink-0">
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
              className="text-xs font-medium bg-neutral-bg border border-neutral-border rounded-xl px-3 py-2 pr-8 text-neutral-maintext focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="">📂 Tất cả danh mục</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-subtext absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo địa điểm, ghi chú..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full text-xs bg-neutral-bg border border-neutral-border rounded-xl pl-9 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-subtext hover:text-neutral-maintext p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
