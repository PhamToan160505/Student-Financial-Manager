import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakBadge({ streakData, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-neutral-border rounded-xl px-3 py-2 flex items-center gap-2 animate-pulse h-[38px] w-[140px]">
        <div className="w-4 h-4 bg-neutral-border rounded-full" />
        <div className="flex-1 bg-neutral-border h-4 rounded" />
      </div>
    );
  }

  if (!streakData) return null;

  const { currentStreak, isActiveToday } = streakData;

  if (currentStreak === 0) {
    return (
      <div className="bg-white border border-neutral-border shadow-sm rounded-xl px-3 py-1.5 flex items-center gap-2">
        <Flame className="w-4 h-4 text-neutral-subtext" />
        <span className="text-xs font-medium text-neutral-subtext">Bắt đầu chuỗi ghi chép hôm nay!</span>
      </div>
    );
  }

  return (
    <div className={`border shadow-sm rounded-xl px-3 py-1.5 flex items-center gap-2 transition-colors ${
      isActiveToday 
        ? 'bg-orange-50 border-orange-200 text-orange-600' 
        : 'bg-white border-warning/30 text-warning'
    }`}>
      <Flame className={`w-4 h-4 ${isActiveToday ? 'fill-orange-500' : ''}`} />
      <div className="flex flex-col">
        <span className="text-xs font-bold">{currentStreak} ngày liên tiếp</span>
        {!isActiveToday && (
          <span className="text-[10px] leading-tight opacity-80">Ghi hôm nay để giữ chuỗi!</span>
        )}
      </div>
    </div>
  );
}
