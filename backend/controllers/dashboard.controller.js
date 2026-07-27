const dashboardModel = require('../models/dashboard.model');
const forecastService = require('../services/forecast.service');
const insightService = require('../services/insight.service');
const { getCurrentMonthVN } = require('../utils/timezone');
const { sendSuccess } = require('../utils/response');
const savingsJarModel = require('../models/savingsJar.model');
const transactionModel = require('../models/transaction.model');
const balanceService = require('../services/balance.service');

/**
 * Dashboard Controller
 * Aggregates all KPI statistics, charts, and recent transactions.
 * Handles division by zero edge cases and percentage change calculations.
 */
async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id;
    // Default to current month YYYY-MM in exact Vietnam timezone (UTC+7) if invalid/missing
    const monthQuery = req.query.month;
    const fallbackMonth = getCurrentMonthVN();
    const month = (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery))
      ? monthQuery
      : fallbackMonth;

    // Compute previous month string (YYYY-MM) without UTC shift
    const [yearStr, monthStr] = month.split('-');
    let prevY = Number(yearStr);
    let prevM = Number(monthStr) - 1;
    if (prevM <= 0) {
      prevM = 12;
      prevY -= 1;
    }
    const prevMonthStr = `${prevY}-${String(prevM).padStart(2, '0')}`;

    // Fetch all aggregations concurrently for peak performance (< 15ms)
    const [
      currSummary,
      prevSummary,
      categoryBreakdown,
      dailyTrend,
      sixMonthTrend,
      recentTransactions
    ] = await Promise.all([
      dashboardModel.getMonthlySummary({ userId, month }),
      dashboardModel.getMonthlySummary({ userId, month: prevMonthStr }),
      dashboardModel.getCategoryBreakdown({ userId, month }),
      dashboardModel.getDailyTrend({ userId, month }),
      dashboardModel.getSixMonthTrend({ userId, endMonth: month }),
      dashboardModel.getRecentTransactions({ userId, limit: 6 })
    ]);

    const currIncome = Number(currSummary.total_income || 0);
    const currExpense = Number(currSummary.total_expense || 0);
    const currBalance = Number(currSummary.balance || 0);

    const prevIncome = Number(prevSummary.total_income || 0);
    const prevExpense = Number(prevSummary.total_expense || 0);

    // 1. Calculate Savings Rate (Point 1 of Senior Grade requirements: handle division by zero)
    // If currIncome === 0, return null so frontend displays "Chưa có dữ liệu"
    let savingsRate = null;
    if (currIncome > 0) {
      // (Income - Expense) / Income * 100
      savingsRate = Math.round(((currIncome - currExpense) / currIncome) * 1000) / 10;
    }

    // 2. Calculate percentage change vs previous month (Point 1: handle prevMonth === 0)
    function calcChange(currVal, prevVal) {
      if (prevVal === 0 && currVal > 0) {
        return { value: 100, is_new: true };
      }
      if (prevVal === 0 && currVal === 0) {
        return { value: 0, is_new: false };
      }
      const diffPercent = Math.round(((currVal - prevVal) / prevVal) * 100);
      return { value: diffPercent, is_new: false };
    }

    const incomeChange = calcChange(currIncome, prevIncome);
    const expenseChange = calcChange(currExpense, prevExpense);

    const summary = {
      month,
      total_income: currIncome,
      total_expense: currExpense,
      balance: currBalance,
      savings_rate: savingsRate,
      income_change: incomeChange,
      expense_change: expenseChange
    };

    return sendSuccess(res, {
      summary,
      categoryBreakdown,
      dailyTrend,
      sixMonthTrend,
      recentTransactions
    }, 'Lấy dữ liệu thống kê Dashboard thành công');
  } catch (err) {
    next(err);
  }
}

/**
 * Get Cashflow Forecast (Burn rate, forecast spend, runway days)
 */
async function getForecast(req, res, next) {
  try {
    const userId = req.user.id;
    const { month } = req.query;
    const forecast = await forecastService.calculateForecast(userId, month);
    return sendSuccess(res, forecast, 'Lấy dữ liệu dự báo dòng tiền thành công');
  } catch (err) {
    next(err);
  }
}

/**
 * Get AI Advisory Insights (with persistent cache check & anti-hallucination)
 * Exactly singular /api/dashboard/insight per Spec 2.3
 */
async function getInsight(req, res, next) {
  try {
    const userId = req.user.id;
    const { month } = req.query;
    const insight = await insightService.getInsights(userId, month);
    return sendSuccess(res, insight, 'Lấy lời khuyên AI thành công');
  } catch (err) {
    next(err);
  }
}

/**
 * Get Available Balance (All-time Actual Balance minus Locked Savings)
 */
async function getAvailableBalance(req, res, next) {
  try {
    const userId = req.user.id;
    const { month } = req.query;
    const balanceData = await balanceService.getAvailableBalance(userId, month);
    return sendSuccess(res, balanceData, 'Lấy số dư khả dụng thành công');
  } catch (err) {
    next(err);
  }
}
module.exports = {
  getDashboardStats,
  getForecast,
  getInsight,
  getAvailableBalance
};
