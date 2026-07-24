import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * CashflowForecastCard - Displays user-friendly budget execution progress.
 * Technical details (Runway, Burn rate) are hidden in a collapsible section.
 */
function CashflowForecastCard({ forecast, loading }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-border p-5 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-2 bg-gray-200 rounded-full"></div>
          <div className="h-2 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return null;
  }

  const {
    runwayDays,
    forecastTotalMonthlySpend,
    budgetTotalUsed,
    budgetSource,
    burnRates,
    remainingDaysInMonth,
    currentDay,
    totalDays,
    totalSpentSoFar
  } = forecast;

  // Render when no budget is configured
  if (budgetSource === 'none' || budgetTotalUsed === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-border p-5 shadow-sm hover:shadow transition-shadow">
        <h3 className="text-base font-semibold text-neutral-maintext flex items-center gap-2 mb-3">
          <span>🎯 Tiến độ thực hiện ngân sách tháng</span>
        </h3>
        <div className="p-3 bg-neutral-bg rounded-lg border border-neutral-border/60 text-sm text-neutral-subtext">
          Bạn chưa thiết lập ngân sách hay thu nhập trong tháng này. Vui lòng thiết lập để theo dõi tiến độ chi tiêu!
        </div>
      </div>
    );
  }

  // Calculate percentages
  const timePercent = Math.round((currentDay / totalDays) * 100);
  const budgetPercent = Math.round((totalSpentSoFar / budgetTotalUsed) * 100);
  const diff = budgetPercent - timePercent;

  let diffMsg = '';
  let diffColorText = '';
  let diffColorBg = '';

  if (diff <= -10) {
    diffColorText = 'text-success';
    diffColorBg = 'bg-success';
    diffMsg = 'Bạn đang chi thấp hơn tiến độ khá nhiều — đang tiết kiệm tốt!';
  } else if (diff <= 10) {
    diffColorText = 'text-primary';
    diffColorBg = 'bg-primary';
    diffMsg = 'Bạn đang chi đúng tiến độ tháng này.';
  } else if (diff <= 25) {
    diffColorText = 'text-warning';
    diffColorBg = 'bg-warning';
    diffMsg = `Bạn đang chi nhanh hơn tiến độ khoảng ${diff}% — chú ý nhé.`;
  } else {
    diffColorText = 'text-danger';
    diffColorBg = 'bg-danger';
    diffMsg = `Bạn đang chi nhanh hơn tiến độ khá nhiều (${diff}%) — có nguy cơ vượt ngân sách trước cuối tháng.`;
  }

  // User-friendly text for Runway
  let runwayMsg = '';
  if (totalSpentSoFar >= budgetTotalUsed) {
    runwayMsg = 'Bạn đã chi vượt quá tổng ngân sách tháng này. Hãy xem lại các danh mục đang vượt mức bên dưới.';
  } else if (runwayDays >= 999 || runwayDays >= remainingDaysInMonth) {
    runwayMsg = 'Với tốc độ hiện tại, bạn còn dư dả — không có nguy cơ hết ngân sách trước cuối tháng.';
  } else {
    runwayMsg = `Với tốc độ hiện tại, bạn chỉ còn đủ dùng khoảng ${runwayDays} ngày nữa (sẽ cạn kiệt trước cuối tháng).`;
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-border p-5 shadow-sm hover:shadow transition-shadow">
      <h3 className="text-base font-semibold text-neutral-maintext flex items-center gap-2 mb-5">
        <span>🎯 Tiến độ thực hiện ngân sách tháng</span>
      </h3>

      <div className="space-y-5 mb-5">
        {/* Time Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-neutral-subtext font-medium">Đã qua {currentDay}/{totalDays} ngày</span>
            <span className="font-bold text-neutral-maintext">{timePercent}%</span>
          </div>
          <div className="w-full bg-neutral-border/50 rounded-full h-2.5">
            <div className="bg-neutral-maintext h-2.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, timePercent))}%` }}></div>
          </div>
        </div>

        {/* Budget Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-neutral-subtext font-medium">Ngân sách đã dùng</span>
            <span className={`font-bold ${diffColorText}`}>{budgetPercent}%</span>
          </div>
          <div className="w-full bg-neutral-border/50 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${diffColorBg}`} style={{ width: `${Math.min(100, Math.max(0, budgetPercent))}%` }}></div>
          </div>
        </div>
      </div>

      <div className={`p-3.5 rounded-lg border text-sm font-medium flex items-start gap-2.5 ${diffColorBg.replace('bg-', 'bg-')}-light ${diffColorText} border-current/20`}>
        <span className="text-base mt-0.5 shrink-0">
          {diff <= -10 ? '✅' : diff <= 10 ? '👌' : diff <= 25 ? '⚠️' : '🚨'}
        </span>
        <span className="leading-relaxed">{diffMsg}</span>
      </div>

      {/* Collapsible Details */}
      <div className="mt-4 border-t border-neutral-border/50 pt-3">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-subtext hover:text-neutral-maintext transition-colors w-full justify-center"
        >
          Xem chi tiết dự báo {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="p-3 bg-neutral-bg rounded-lg border border-neutral-border/60">
              <p className="text-xs font-medium text-neutral-subtext mb-1">Dự báo chi tiêu</p>
              <p className="text-sm text-neutral-maintext">
                Dự kiến TỔNG CHI đến hết tháng: khoảng <span className="font-bold">{forecastTotalMonthlySpend?.toLocaleString('vi-VN')} đ</span>.
              </p>
            </div>
            <div className="p-3 bg-neutral-bg rounded-lg border border-neutral-border/60">
              <p className="text-xs font-medium text-neutral-subtext mb-1">Đánh giá tốc độ chi</p>
              <p className="text-sm text-neutral-maintext">
                {runwayMsg}
              </p>
            </div>
            <div className="p-3 bg-neutral-bg rounded-lg border border-neutral-border/60 md:col-span-2">
              <p className="text-xs font-medium text-neutral-subtext mb-1">Số liệu tham khảo</p>
              <div className="text-xs text-neutral-subtext flex flex-col sm:flex-row sm:gap-4 gap-1">
                <p>Tổng chi tiêu thực tế hiện tại: {totalSpentSoFar?.toLocaleString('vi-VN')} đ.</p>
                <p>Tốc độ chi tiêu trung bình: {burnRates?.combinedWeightedDaily?.toLocaleString('vi-VN')} đ/ngày.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CashflowForecastCard;
