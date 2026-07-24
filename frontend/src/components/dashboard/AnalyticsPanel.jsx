import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PieChart as PieChartIcon, BarChart2, Plus, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryEmoji } from '../../utils/emoji';

const BreakdownTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const emoji = getCategoryEmoji(data.category_icon);
    return (
      <div className="bg-white p-3 rounded-xl border border-neutral-border shadow-md">
        <p className="text-xs font-bold text-neutral-maintext flex items-center gap-1.5">
          <span>{emoji}</span>
          <span>{data.category_name}</span>
        </p>
        <p className="text-sm font-bold text-danger mt-1">
          {formatCurrency(data.total_amount)}
        </p>
        <p className="text-[11px] text-neutral-subtext">
          Chiếm {data.percent}% tổng chi tiêu
        </p>
      </div>
    );
  }
  return null;
};

const TrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedLabel = label ? `Tháng ${label.split('-')[1]}/${label.split('-')[0]}` : label;
    const expenseItem = payload.find(p => p.dataKey === 'expense');
    const incomeItem = payload.find(p => p.dataKey === 'income');

    return (
      <div className="bg-white p-3.5 rounded-xl border border-neutral-border shadow-md min-w-[170px]">
        <p className="text-xs font-bold text-neutral-subtext uppercase pb-1.5 border-b border-neutral-border/60 mb-2 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-primary" /> {formattedLabel}
        </p>
        <div className="space-y-1.5">
          {incomeItem && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-success font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" /> Thu nhập:
              </span>
              <span className="font-bold text-success tabular-nums">+{formatCurrency(incomeItem.value)}</span>
            </div>
          )}
          {expenseItem && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-danger font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-danger" /> Chi tiêu:
              </span>
              <span className="font-bold text-danger tabular-nums">-{formatCurrency(expenseItem.value)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Format Y-Axis numbers in Millions (Triệu / Tr.) or thousands (k)
 */
function formatYAxisTrieu(val) {
  const num = Number(val || 0);
  if (num === 0) return '0';
  if (num >= 1000000) {
    const trieu = num / 1000000;
    return `${Number.isInteger(trieu) ? trieu : trieu.toFixed(1)} Tr.`;
  }
  if (num >= 1000) {
    return `${Math.round(num / 1000)}k`;
  }
  return `${num}`;
}

/**
 * AnalyticsPanel - Unified MoMo-inspired spending analysis widget.
 * Features rounded pill toggles ('breakdown' | 'trend'), CSS variable-driven smart bar coloring,
 * and expandable detailed category breakdown. Strictly uses props without self-fetching.
 */
export default function AnalyticsPanel({
  categoryBreakdown = [],
  sixMonthTrend = [],
  selectedMonth,
  onAddTransaction
}) {
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' | 'trend'
  const [showDetails, setShowDetails] = useState(false);

  // ---------------------------------------------------------------------------
  // Tab 1: Breakdown Calculations
  // ---------------------------------------------------------------------------
  // Calculate total expense first
  const totalBreakdownExpense = categoryBreakdown.reduce(
    (sum, item) => sum + Number(item.total_amount || 0),
    0
  );

  // Sort by amount descending
  const sortedBreakdown = [...categoryBreakdown].sort(
    (a, b) => Number(b.total_amount || 0) - Number(a.total_amount || 0)
  );

  // Take top 10 categories
  const top10 = sortedBreakdown.slice(0, 10);
  const others = sortedBreakdown.slice(10);

  // Group others into a single category if they exist
  let finalBreakdown = [...top10];
  if (others.length > 0) {
    const othersTotal = others.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    finalBreakdown.push({
      category_name: 'Khác',
      category_icon: '📦',
      category_color: '#cbd5e1', // A neutral grey color for "Others"
      total_amount: othersTotal
    });
  }

  const fallbackColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  const formattedBreakdown = finalBreakdown.map((item, index) => ({
    ...item,
    category_color: item.category_color || fallbackColors[index % fallbackColors.length],
    total_amount: Number(item.total_amount),
    percent: totalBreakdownExpense > 0
      ? Math.round((Number(item.total_amount) / totalBreakdownExpense) * 100)
      : 0
  })).filter(item => item.total_amount > 0); // Only keep items with > 0 amount

  const hasBreakdownData = formattedBreakdown.length > 0 && totalBreakdownExpense > 0;

  // ---------------------------------------------------------------------------
  // Tab 2: 3-Month Trend Calculations
  // ---------------------------------------------------------------------------
  // Generate the 3-month window ending at selectedMonth ([month-2, month-1, selectedMonth])
  const now = new Date();
  const fallbackMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selYearStr, selMonthStr] = (selectedMonth || fallbackMonth).split('-');
  
  const monthList = [2, 1, 0].map(offset => {
    let y = Number(selYearStr);
    let m = Number(selMonthStr) - offset;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    return `${y}-${String(m).padStart(2, '0')}`;
  });

  const formattedTrend = monthList.map(mStr => {
    const found = sixMonthTrend.find(item => item.month_str === mStr);
    const shortLabel = `T${Number(mStr.slice(5, 7))}`;
    const isCurrent = mStr === selectedMonth;

    return {
      month_str: mStr,
      shortLabel,
      isCurrent,
      income: found ? Number(found.income || 0) : 0,
      expense: found ? Number(found.expense || 0) : 0
    };
  });

  const hasTrendData = formattedTrend.some(d => d.income > 0 || d.expense > 0);

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-border shadow-sm">
      {/* 1. Header Khối + Pill Toggle (Chuẩn MoMo) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-border pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-neutral-maintext flex items-center gap-2">
            {activeTab === 'breakdown' ? (
              <PieChartIcon className="w-5 h-5 text-primary" />
            ) : (
              <BarChart2 className="w-5 h-5 text-primary" />
            )}
            Phân Tích Chi Tiêu
          </h3>
          <p className="text-xs text-neutral-subtext mt-0.5">
            {activeTab === 'breakdown'
              ? 'Cơ cấu và tỷ trọng chi tiêu theo danh mục'
              : 'So sánh xu hướng thu chi trong 3 tháng gần nhất'}
          </p>
        </div>

        {/* Pill Toggles */}
        <div className="bg-neutral-bg p-1 rounded-full border border-neutral-border inline-flex items-center gap-1 shadow-2xs">
          <button
            onClick={() => { setActiveTab('breakdown'); setShowDetails(false); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all ${
              activeTab === 'breakdown'
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'text-neutral-subtext font-medium hover:text-neutral-maintext'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Phân bổ</span>
          </button>
          <button
            onClick={() => { setActiveTab('trend'); setShowDetails(false); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all ${
              activeTab === 'trend'
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'text-neutral-subtext font-medium hover:text-neutral-maintext'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Xu hướng</span>
          </button>
        </div>
      </div>

      {/* 2. Content Section */}
      {activeTab === 'breakdown' ? (
        // =====================================================================
        // TAB 1: PHÂN BỔ (DONUT CHART + LEGEND + ACCORDION)
        // =====================================================================
        !hasBreakdownData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-neutral-bg rounded-2xl flex items-center justify-center mb-3 border border-neutral-border">
              <PieChartIcon className="w-6 h-6 text-neutral-subtext/40" />
            </div>
            <p className="text-sm font-bold text-neutral-maintext">Chưa có khoản chi tiêu nào trong tháng này</p>
            <p className="text-xs text-neutral-subtext max-w-xs mt-1 mb-4">
              Ghi nhận giao dịch chi tiêu đầu tiên để xem cơ cấu phân bổ dòng tiền bạn nhé!
            </p>
            <Button variant="primary" size="sm" icon={Plus} onClick={onAddTransaction}>
              Thêm khoản thu/chi
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Donut & Top Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
              {/* Donut Chart: 6 cols */}
              <div className="md:col-span-6 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedBreakdown}
                      dataKey="total_amount"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={1}
                      minAngle={8}
                    >
                      {formattedBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.category_color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<BreakdownTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List (Top 4 Categories): 6 cols */}
              <div className="md:col-span-6 space-y-3">
                <p className="text-xs font-bold text-neutral-subtext uppercase tracking-wider mb-1">
                  Top Danh Mục Chi Tiêu Trong Tháng
                </p>
                {formattedBreakdown.slice(0, 4).map(item => {
                  const emoji = getCategoryEmoji(item.category_icon);
                  return (
                    <div
                      key={item.category_id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-bg/50 border border-neutral-border/60 hover:bg-neutral-bg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.category_color || 'var(--color-primary)' }}
                        />
                        <span className="text-base shrink-0">{emoji}</span>
                        <span className="text-xs font-semibold text-neutral-maintext truncate">
                          {item.category_name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-bold text-neutral-maintext tabular-nums">
                          {formatCurrency(item.total_amount)}
                        </p>
                        <span className="text-[10px] font-bold text-danger">
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expandable Accordion for full Category Breakdown Details */}
            <div className="border-t border-neutral-border pt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-bg/30 hover:bg-neutral-bg/70 border border-neutral-border/50 text-xs font-bold text-primary transition-all"
              >
                <span>Chi tiết từng danh mục ({formattedBreakdown.length})</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1 animate-fadeIn">
                  {formattedBreakdown.map(item => {
                    const emoji = getCategoryEmoji(item.category_icon);
                    return (
                      <div
                        key={item.category_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-neutral-border hover:border-primary/40 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs"
                            style={{ backgroundColor: `${item.category_color || 'var(--color-primary)'}18` }}
                          >
                            {emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-neutral-maintext truncate">
                              {item.category_name}
                            </p>
                            <div className="w-full bg-neutral-bg rounded-full h-1.5 mt-1.5 overflow-hidden border border-neutral-border/30">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${item.percent}%`,
                                  backgroundColor: item.category_color || 'var(--color-primary)'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-bold text-danger tabular-nums">
                            -{formatCurrency(item.total_amount)}
                          </p>
                          <p className="text-xs font-semibold text-neutral-subtext mt-0.5">
                            Chiếm {item.percent}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        // =====================================================================
        // TAB 2: XU HƯỚNG (3-MONTH BAR CHART WITH SMART HIGHLIGHTING)
        // =====================================================================
        !hasTrendData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-neutral-bg rounded-2xl flex items-center justify-center mb-3 border border-neutral-border">
              <BarChart2 className="w-6 h-6 text-neutral-subtext/40" />
            </div>
            <p className="text-sm font-bold text-neutral-maintext">Chưa có dữ liệu xu hướng trong 3 tháng qua</p>
            <p className="text-xs text-neutral-subtext max-w-xs mt-1 mb-4">
              Biểu đồ sẽ tự động so sánh xu hướng thu chi khi bạn ghi nhận các khoản thu/chi hàng tháng!
            </p>
            <Button variant="primary" size="sm" icon={Plus} onClick={onAddTransaction}>
              Thêm khoản thu/chi
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral-border, #F3F4F6)" />
                  <XAxis
                    dataKey="shortLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--color-neutral-subtext, #6B7280)', fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-neutral-subtext, #6B7280)' }}
                    tickFormatter={(val) => formatYAxisTrieu(val)}
                  />
                  <Tooltip content={<TrendTooltip />} />

                  {/* Expense Bar with Token-driven Smart Highlighting */}
                  <Bar dataKey="expense" name="Chi tiêu" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {formattedTrend.map((entry, index) => (
                      <Cell
                        key={`cell-exp-${index}`}
                        fill={entry.isCurrent ? 'var(--color-primary, #2563EB)' : 'var(--color-primary-light, #93C5FD)'}
                      />
                    ))}
                  </Bar>

                  {/* Income Bar (Optional visual comparison next to expense) */}
                  <Bar dataKey="income" name="Thu nhập" fill="var(--color-success, #10B981)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Smart Highlighting Legend & Guide */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-neutral-border/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-primary shrink-0" />
                <span className="text-xs font-bold text-neutral-maintext">Chi tiêu tháng {selectedMonth?.slice(5, 7)} (Hiện tại)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-primary-light shrink-0" />
                <span className="text-xs font-medium text-neutral-subtext">Chi tiêu 2 tháng trước</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-success shrink-0" />
                <span className="text-xs font-semibold text-neutral-maintext">Thu nhập</span>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
