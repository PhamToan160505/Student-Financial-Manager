const transactionModel = require('../models/transaction.model');
const budgetModel = require('../models/budget.model');
const { getCurrentMonthVN, getCurrentDayVN, getDaysInMonthVN, getCurrentDateVN } = require('../utils/timezone');

/**
 * Forecast Service - Calculates mathematical burn rates and cashflow runway
 * using exact weighted recent trends without AI hallucination.
 */
const forecastService = {
  /**
   * Calculate Cashflow Forecast for a specific user and month
   * @param {number} userId - ID of user
   * @param {string} [month] - Format YYYY-MM
   */
  calculateForecast: async (userId, month) => {
    const currentMonth = getCurrentMonthVN();
    const targetMonth = (month && /^\d{4}-\d{2}$/.test(month)) ? month : currentMonth;

    const isCurrentMonth = (targetMonth === currentMonth);
    const D_total = getDaysInMonthVN(targetMonth);
    // If checking past month, D_current is D_total. If future month, 1. If current month, exact today day.
    const D_current = isCurrentMonth ? getCurrentDayVN() : (targetMonth < currentMonth ? D_total : 1);

    // 1. Fetch all transactions for this month to get S_total (expense) and total income
    const allTransactions = await transactionModel.findMany({ userId, month: targetMonth });
    let S_total = 0;
    let totalIncome = 0;

    allTransactions.forEach(t => {
      if (t.type === 'expense') {
        S_total += Number(t.amount || 0);
      } else if (t.type === 'income') {
        totalIncome += Number(t.amount || 0);
      }
    });

    // 2. Fetch B_total according to strict priority logic (Point 1 V3)
    const budgets = await budgetModel.getBudgetsByMonth({ userId, month: targetMonth });
    let totalConfiguredBudget = 0;
    budgets.forEach(b => {
      if (b.is_budgeted) {
        totalConfiguredBudget += Number(b.amount || 0);
      }
    });

    let B_total = 0;
    let budgetSource = 'none'; // 'budget' | 'income' | 'none'
    let budgetMessage = '';

    if (totalConfiguredBudget > 0) {
      B_total = totalConfiguredBudget;
      budgetSource = 'budget';
    } else if (totalIncome > 0) {
      B_total = totalIncome;
      budgetSource = 'income';
    } else {
      B_total = 0;
      budgetSource = 'none';
      budgetMessage = 'Bạn chưa thiết lập ngân sách hay thu nhập tháng này, vui lòng bổ sung để tính toán thời gian cạn kiệt tiền (Runway).';
    }

    // 3. Calculate Simple Daily Burn Rate (R_simple)
    const R_simple = D_current > 0 ? S_total / D_current : 0;

    // 4. Calculate Recent 7-Day Trend Burn Rate (R_recent)
    const T_recent = Math.min(7, D_current);
    let S_recent = 0;
    if (T_recent > 0 && allTransactions.length > 0) {
      const todayDateStr = getCurrentDateVN();
      // Calculate start date of 7-day window
      const todayDateObj = new Date(`${todayDateStr}T00:00:00.000Z`);
      const startDateObj = new Date(todayDateObj.getTime() - (T_recent - 1) * 24 * 3600 * 1000);
      const startDateStr = startDateObj.toISOString().slice(0, 10);

      allTransactions.forEach(t => {
        if (t.type === 'expense') {
          const tDate = t.transactionDate ? t.transactionDate.slice(0, 10) : '';
          if (tDate >= startDateStr && tDate <= todayDateStr) {
            S_recent += Number(t.amount || 0);
          }
        }
      });
    }
    const R_recent = T_recent > 0 ? S_recent / T_recent : 0;

    // 5. Calculate Combined Weighted Burn Rate (R_combined)
    // If D_current > 7, weight 0.6 to recent habit, 0.4 to simple average. Otherwise R_simple.
    let R_combined = R_simple;
    if (D_current > 7) {
      R_combined = 0.6 * R_recent + 0.4 * R_simple;
    }

    // 6. Forecast Total Monthly Spend (S_forecast)
    const remainingDaysInMonth = Math.max(0, D_total - D_current);
    const S_forecast = S_total + R_combined * remainingDaysInMonth;

    // 7. Calculate Runway Days (floor(F_remain / R_combined))
    let runwayDays = null;
    const F_remain = B_total - S_total;

    if (budgetSource !== 'none') {
      if (F_remain <= 0) {
        runwayDays = 0;
      } else if (R_combined > 0) {
        runwayDays = Math.floor(F_remain / R_combined);
      } else {
        runwayDays = 999; // Not spending right now
      }
    }

    // 8. Determine Status & Warnings
    let status = 'safe'; // 'safe' | 'caution' | 'danger'
    let warningMessage = 'Dòng tiền chi tiêu đang trong tầm kiểm soát ổn định.';

    if (budgetSource === 'none') {
      status = 'safe';
      warningMessage = budgetMessage;
    } else if (runwayDays !== null && runwayDays < remainingDaysInMonth && remainingDaysInMonth > 0) {
      status = 'danger';
      warningMessage = `CẢNH BÁO ĐỎ: Với tốc độ chi tiêu hiện tại (${Math.round(R_combined).toLocaleString('vi-VN')} đ/ngày), bạn sẽ hết tiền trong khoảng ${runwayDays} ngày nữa, trước khi hết tháng!`;
    } else if (S_forecast > B_total) {
      status = 'caution';
      warningMessage = `CHÚ Ý: Dự báo tổng chi cả tháng (${Math.round(S_forecast).toLocaleString('vi-VN')} đ) có nguy cơ vượt quá ${budgetSource === 'budget' ? 'hạn mức ngân sách' : 'tổng thu nhập'} (${Math.round(B_total).toLocaleString('vi-VN')} đ).`;
    }

    return {
      month: targetMonth,
      currentDay: D_current,
      totalDays: D_total,
      remainingDaysInMonth,
      totalSpentSoFar: Math.round(S_total),
      totalIncomeSoFar: Math.round(totalIncome),
      configuredBudget: Math.round(totalConfiguredBudget),
      budgetTotalUsed: Math.round(B_total),
      budgetSource, // 'budget' | 'income' | 'none'
      budgetMessage,
      burnRates: {
        simpleDailyAverage: Math.round(R_simple),
        recent7DayAverage: Math.round(R_recent),
        combinedWeightedDaily: Math.round(R_combined)
      },
      forecastTotalMonthlySpend: Math.round(S_forecast),
      runwayDays,
      status,
      warningMessage
    };
  }
};

module.exports = forecastService;
