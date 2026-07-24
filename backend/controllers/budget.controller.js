const budgetModel = require('../models/budget.model');
const insightCacheModel = require('../models/insightCache.model');
const categoryModel = require('../models/category.model');
const transactionModel = require('../models/transaction.model');
const balanceService = require('../services/balance.service');
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
 * Core logic for upserting a budget with full validation and income limits.
 * Single Source of Truth for both BudgetModal (UI) and BudgetSuggestCard (AI Chat).
 */
async function upsertBudgetCore({ userId, categoryId, amount, month }) {
  const numAmount = Number(amount);
  
  // 1. Basic validation
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    throw Object.assign(new Error('Số tiền hạn mức phải là số dương lớn hơn 0'), { statusCode: 400 });
  }
  if (numAmount < 1000) {
    throw Object.assign(new Error('Hạn mức tối thiểu phải từ 1,000 đ'), { statusCode: 400 });
  }
  if (numAmount > 100000000000) {
    throw Object.assign(new Error('Hạn mức tối đa không được vượt quá 100 tỷ đ'), { statusCode: 400 });
  }

  // 2. IDOR protection & category validation: Must belong to user (or system default) and must be type 'expense'
  const category = await categoryModel.findByIdAndUserId(categoryId, userId);
  let isValidCategory = false;
  
  if (category) {
    isValidCategory = category.type === 'expense';
  } else {
    // Check if it's a default category
    const allCategories = await categoryModel.findByUserId(userId);
    const defaultCat = allCategories.find(c => c.id === categoryId);
    if (defaultCat && defaultCat.type === 'expense') {
      isValidCategory = true;
    }
  }

  if (!isValidCategory) {
    throw Object.assign(new Error('Danh mục không hợp lệ hoặc không phải là danh mục chi tiêu'), { statusCode: 400 });
  }

  // 3. Unified Available Balance Validation (chỉ áp dụng khi TĂNG ngân sách)
  // Đọc giá trị CŨ TRƯỚC - quan trọng để tính đúng delta, phải xảy ra TRƯỚC khi ghi DB
  const budgets = await budgetModel.getBudgetsByMonth({ userId, month });
  const currentCat = budgets.find(b => b.category_id === Number(categoryId));

  let currentAmount = 0;
  let spent = 0;
  if (currentCat) {
    currentAmount = currentCat.is_budgeted ? currentCat.amount : 0;
    spent = currentCat.spent || 0;
  }

  // Nếu GIẢM hoặc GIỮ NGUYÊN hạn mức → luôn cho phép, không cần check số dư.
  // Lý do: giảm hạn mức = trả lại tiền tự do → không bao giờ có lý do chặn.
  if (numAmount <= currentAmount) {
    await budgetModel.upsert({ userId, categoryId: Number(categoryId), amount: numAmount, month });
    await insightCacheModel.markStale({ userId, month });
    return;
  }

  // Chỉ khi TĂNG ngân sách mới cần check số dư khả dụng.
  // getAvailableBalance() được gọi SAU KHI đã đọc currentAmount (giá trị cũ) → đúng thứ tự.
  const balanceData = await balanceService.getAvailableBalance(userId, month);

  // maxAllowed = availableBalance + MAX(currentAmount, spent)
  // Vì: newRemaining - oldRemaining <= availableBalance
  // → MAX(0, newAmount - spent) - MAX(0, currentAmount - spent) <= availableBalance
  // → newAmount <= availableBalance + MAX(currentAmount, spent)
  const maxAllowedForThisCategory = balanceData.available_balance + Math.max(currentAmount, spent);

  if (numAmount > maxAllowedForThisCategory) {
    throw Object.assign(
      new Error(`Ngân sách vượt quá số dư khả dụng. Bạn chỉ có thể đặt tối đa ${maxAllowedForThisCategory.toLocaleString('vi-VN')}đ cho danh mục này.`),
      { statusCode: 400, data: { maxAllowed: maxAllowedForThisCategory } }
    );
  }

  // 4. Perform upsert
  await budgetModel.upsert({
    userId,
    categoryId: Number(categoryId),
    amount: numAmount,
    month
  });

  // 5. Trigger insights stale check
  await insightCacheModel.markStale({ userId, month });
}

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

    await upsertBudgetCore({
      userId,
      categoryId: Number(category_id),
      amount: Number(amount),
      month
    });

    res.status(200).json({
      success: true,
      message: 'Thiết lập hạn mức ngân sách thành công'
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message, data: err.data });
    next(err);
  }
};

exports.upsertBudgetCore = upsertBudgetCore;

/**
 * Delete a budget limit by budget ID
 */
exports.deleteBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 1. Fetch budget to get category_id and month
    const [budgetRows] = await require('../config/db').pool.query(
      'SELECT category_id, month FROM budgets WHERE id = ? AND user_id = ?',
      [Number(id), userId]
    );

    if (!budgetRows || budgetRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hạn mức ngân sách hoặc không có quyền xóa'
      });
    }

    const { category_id, month } = budgetRows[0];

    // 2. Check if there are any expenses in this category for this month
    const totalSpent = await transactionModel.sumByType({ 
      userId, 
      month, 
      type: 'expense',
      categoryId: category_id 
    });

    // But wait, sumByType might not support categoryId out of the box...
    // Let's write a direct query just in case, to be absolutely safe and isolated.
    const [expenseRows] = await require('../config/db').pool.query(
      `SELECT SUM(amount) as spent 
       FROM transactions 
       WHERE user_id = ? AND category_id = ? AND type = 'expense' 
       AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
      [userId, category_id, month]
    );

    const spent = Number(expenseRows[0]?.spent || 0);

    if (spent > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa hạn mức ngân sách vì đã có phát sinh chi tiêu trong tháng này. Bạn chỉ có thể chỉnh sửa lại số tiền.'
      });
    }

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
