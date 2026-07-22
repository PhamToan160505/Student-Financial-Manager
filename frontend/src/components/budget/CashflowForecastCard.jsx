import React from 'react';

/**
 * CashflowForecastCard - Displays mathematical cashflow forecast,
 * weighted burn rates, and runway days before budget depletion.
 * Adheres strictly to Flat Clean Design without glassmorphism.
 */
function CashflowForecastCard({ forecast, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-border p-5 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return null;
  }

  const {
    status,
    warningMessage,
    runwayDays,
    forecastTotalMonthlySpend,
    budgetTotalUsed,
    budgetSource,
    burnRates,
    remainingDaysInMonth,
    currentDay,
    totalDays
  } = forecast;

  // Determine alert styles according to strict tokens (--color-*-light and exact text/border colors)
  let badgeBg = 'bg-success-light';
  let badgeText = 'text-success';
  let badgeBorder = 'border-success/30';
  let statusText = 'Ổn định';

  if (status === 'danger') {
    badgeBg = 'bg-danger-light';
    badgeText = 'text-danger';
    badgeBorder = 'border-danger/30';
    statusText = 'Nguy cơ thâm hụt';
  } else if (status === 'caution') {
    badgeBg = 'bg-warning-light';
    badgeText = 'text-warning';
    badgeBorder = 'border-warning/30';
    statusText = 'Chú ý ngân sách';
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-border p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-maintext flex items-center gap-2">
            <span>📈 Dự Báo Dòng Tiền & Tốc Độ Chi Tiêu</span>
          </h3>
          <p className="text-xs text-neutral-subtext mt-0.5">
            Ngày {currentDay}/{totalDays} — Còn lại {remainingDaysInMonth} ngày trong tháng
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeBg} ${badgeText} ${badgeBorder} self-start sm:self-center`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          {statusText}
        </span>
      </div>

      {/* Warning/Status Alert Box */}
      <div className={`p-3 rounded-lg border text-sm mb-4 font-medium flex items-start gap-2.5 ${badgeBg} ${badgeText} ${badgeBorder}`}>
        <span className="text-base mt-0.5 shrink-0">
          {status === 'danger' ? '🚨' : status === 'caution' ? '⚠️' : '💡'}
        </span>
        <span className="leading-relaxed">{warningMessage}</span>
      </div>

      {/* 3 Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-neutral-bg rounded-lg border border-neutral-border/60">
          <p className="text-xs font-medium text-neutral-subtext">Tốc độ chi tiêu gia quyền/ngày</p>
          <p className="text-lg font-bold text-neutral-maintext mt-1">
            {burnRates?.combinedWeightedDaily?.toLocaleString('vi-VN')} đ
          </p>
          <p className="text-[11px] text-neutral-subtext mt-1">
            (60% gần đây: {burnRates?.recent7DayAverage?.toLocaleString('vi-VN')} đ | 40% cả tháng)
          </p>
        </div>

        <div className="p-3.5 bg-neutral-bg rounded-lg border border-neutral-border/60">
          <p className="text-xs font-medium text-neutral-subtext">Dự báo tổng chi hết tháng</p>
          <p className="text-lg font-bold text-neutral-maintext mt-1">
            {forecastTotalMonthlySpend?.toLocaleString('vi-VN')} đ
          </p>
          <p className="text-[11px] text-neutral-subtext mt-1">
            {budgetSource !== 'none'
              ? `So với ${budgetSource === 'budget' ? 'ngân sách' : 'thu nhập'}: ${budgetTotalUsed?.toLocaleString('vi-VN')} đ`
              : 'Chưa thiết lập ngân sách tháng này'}
          </p>
        </div>

        <div className="p-3.5 bg-neutral-bg rounded-lg border border-neutral-border/60">
          <p className="text-xs font-medium text-neutral-subtext">Thời gian cạn kiệt (Runway)</p>
          <p className={`text-lg font-bold mt-1 ${status === 'danger' ? 'text-danger' : 'text-neutral-maintext'}`}>
            {runwayDays === null || budgetSource === 'none'
              ? 'Chưa có ngân sách'
              : runwayDays >= 999
              ? 'An toàn (> 30 ngày)'
              : `${runwayDays} ngày nữa`}
          </p>
          <p className="text-[11px] text-neutral-subtext mt-1">
            {runwayDays !== null && budgetSource !== 'none' && runwayDays < remainingDaysInMonth
              ? '⚠️ Hết tiền trước khi qua tháng mới'
              : '✅ Đủ tài chính đến hết tháng'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CashflowForecastCard;
