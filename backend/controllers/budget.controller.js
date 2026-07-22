const budgetModel = require('../models/budget.model');
const insightCacheModel = require('../models/insightCache.model');
const { getCurrentMonthVN } = require('../utils/timezone');

/**
 * Get all budgets, spending progress, warnings, and summary for a specific month
 */
exports.getBudgets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const monthQuery = req.query.month;
    const month = (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery))
      ? monthQuery
      : getCurrentMonthVN();

    const allCategories = await budgetModel.getBudgetsByMonth({ userId, month });

    let totalBudget = 0;
    let totalSpentBudgeted = 0;
    let totalSpentAll = 0;
    const warnings = [];

    allCategories.forEach(item => {
      totalSpentAll += item.spent;
      if (item.is_budgeted) {
        totalBudget += item.amount;
        totalSpentBudgeted += item.spent;

        if (item.percent_used >= 80) {
          warnings.push(item);
        }
      }
    });

    // Sort warnings by highest percentage first
    warnings.sort((a, b) => b.percent_used - a.percent_used);

    res.status(200).json({
      success: true,
      data: {
        month,
        budgets: allCategories,
        warnings,
        summary: {
          total_budget: totalBudget,
          total_spent_budgeted: totalSpentBudgeted,
          total_spent_all: totalSpentAll,
          remaining: totalBudget - totalSpentBudgeted
        }
      },
      message: 'Lấy dữ liệu hạn mức ngân sách thành công'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create or update (upsert) a monthly budget limit for a specific category
 */
exports.upsertBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category_id, amount } = req.body;
    const month = (req.body.month && /^\d{4}-\d{2}$/.test(req.body.month))
      ? req.body.month
      : getCurrentMonthVN();

    await budgetModel.upsert({
      userId,
      categoryId: Number(category_id),
      amount: Number(amount),
      month
    });

    // Mark AI insights cache stale since budget / financial limits changed
    await insightCacheModel.markStale({ userId, month });

    res.status(200).json({
      success: true,
      message: 'Thiết lập hạn mức ngân sách thành công'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a budget limit by budget ID
 */
exports.deleteBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await budgetModel.deleteBudget({ id: Number(id), userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hạn mức ngân sách hoặc không có quyền xóa'
      });
    }

    // Mark current month AI insights cache stale
    const currentMonth = getCurrentMonthVN();
    await insightCacheModel.markStale({ userId, month: currentMonth });

    res.status(200).json({
      success: true,
      message: 'Xóa hạn mức ngân sách thành công'
    });
  } catch (err) {
    next(err);
  }
};
