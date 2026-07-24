const transactionModel = require('../models/transaction.model');
const categoryModel = require('../models/category.model');
const receiptModel = require('../models/receipt.model');
const budgetModel = require('../models/budget.model');
const insightCacheModel = require('../models/insightCache.model');
const { getCurrentMonthVN, getCurrentDateVN, getYesterdayVN, subtractOneDayVN } = require('../utils/timezone');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Helper to trigger AI insight cache invalidation when spending changes >= 10%
 */
async function triggerStaleCheck(userId) {
  try {
    const month = getCurrentMonthVN();
    const summary = await transactionModel.getSummary({ userId, month });
    await insightCacheModel.checkAndMarkStaleIfChanged({
      userId,
      month,
      currentSpent: summary.totalExpense || 0
    });
  } catch (err) {
    console.warn('[Transaction Controller] Trigger stale check warning:', err.message);
  }
}

/**
 * Transaction Controller
 * All methods rely on req.user.id (set by verifyToken) to prevent IDOR.
 */

async function getAllTransactions(req, res, next) {
  try {
    const { month, type, categoryId, search } = req.query;

    const transactions = await transactionModel.findMany({
      userId: req.user.id,
      month,
      type,
      categoryId,
      search
    });

    const summary = await transactionModel.getSummary({
      userId: req.user.id,
      month
    });

    return sendSuccess(res, { transactions, summary }, 'Lấy danh sách giao dịch thành công');
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const { month } = req.query;
    const summary = await transactionModel.getSummary({
      userId: req.user.id,
      month
    });
    return sendSuccess(res, summary, 'Lấy tóm tắt giao dịch thành công');
  } catch (err) {
    next(err);
  }
}

/**
 * Shared core logic for creating a transaction.
 * Used by BOTH the manual route (nguon='manual') and AI chat route (nguon='ai_chat').
 *
 * This function contains ALL validation so that /api/chat/confirm-action
 * (which has no express-validator middleware) gets the same protection as the manual route.
 *
 * V1 known limitation: date relatives ("hôm qua tôi mua...") always default to today.
 */
async function createTransactionCore({ userId, categoryId, type, amount, transactionDate, note, merchant, nguon = 'manual' }) {
  const amt = Number(amount);

  // --- Inline validation (mirrors express-validator rules on transaction.routes.js) ---
  if (!amt || isNaN(amt) || amt <= 0) {
    const err = new Error('Số tiền phải là số dương'); err.statusCode = 400; throw err;
  }
  if (amt < 1000) {
    const err = new Error('Số tiền tối thiểu là 1.000đ'); err.statusCode = 400; throw err;
  }
  if (amt > 100_000_000_000) {
    const err = new Error('Số tiền tối đa là 100.000.000.000đ (100 tỷ)'); err.statusCode = 400; throw err;
  }
  if (!['expense', 'income'].includes(type)) {
    const err = new Error('Loại giao dịch phải là expense hoặc income'); err.statusCode = 400; throw err;
  }
  if (!transactionDate || !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
    const err = new Error('Ngày giao dịch phải đúng định dạng YYYY-MM-DD'); err.statusCode = 400; throw err;
  }
  const noteStr = (note || '').toString().slice(0, 255);     // hard cap 255 chars
  const merchantStr = (merchant || '').toString().slice(0, 150); // hard cap 150 chars

  // --- Category validation: exists + belongs to user + type must match ---
  const allCategories = await categoryModel.findByUserId(userId);
  const category = allCategories.find(c => c.id === Number(categoryId));
  if (!category) {
    const err = new Error('Danh mục không hợp lệ hoặc không tồn tại'); err.statusCode = 400; throw err;
  }
  if (category.type !== type) {
    const err = new Error(`Danh mục "${category.name}" là loại "${category.type}", không khớp giao dịch loại "${type}"`);
    err.statusCode = 400; throw err;
  }

  // --- Strict Budget Enforcement: Must have a budget for expense categories ---
  if (type === 'expense') {
    const month = transactionDate.slice(0, 7); // Extract YYYY-MM
    // budgetModel.getBudgetsByMonth returns all expense categories and attaches is_budgeted boolean
    const budgets = await budgetModel.getBudgetsByMonth({ userId, month });
    const hasBudget = budgets.find(b => b.category_id === Number(categoryId) && b.is_budgeted === true);
    if (!hasBudget) {
      const err = new Error(`Vui lòng thiết lập hạn mức ngân sách cho danh mục "${category.name}" trước khi ghi nhận chi tiêu.`);
      err.statusCode = 400; throw err;
    }
  }

  // --- Create + fetch single record (no full-list scan) ---
  const newId = await transactionModel.create({
    userId,
    categoryId: Number(categoryId),
    type,
    amount: amt,
    transactionDate,
    note: noteStr,
    merchant: merchantStr,
    nguon
  });

  const created = await transactionModel.findById(newId, userId);
  await triggerStaleCheck(userId);
  return created;
}

async function createTransaction(req, res, next) {
  try {
    const { categoryId, type, amount, transactionDate, note, merchant } = req.body;
    // express-validator already ran for this route — just call the shared core
    const created = await createTransactionCore({
      userId: req.user.id,
      categoryId,
      type,
      amount,
      transactionDate,
      note,
      merchant,
      nguon: 'manual'
    });
    return sendSuccess(res, { transaction: created }, 'Tạo giao dịch thành công!', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
}

async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { categoryId, type, amount, transactionDate, note, merchant } = req.body;

    // Check ownership
    const existing = await transactionModel.findByIdAndUserId(id, req.user.id);
    if (!existing) {
      return sendError(res, 'Không tìm thấy giao dịch hoặc bạn không có quyền sửa', 404);
    }

    // Check category validity
    const allCategories = await categoryModel.findByUserId(req.user.id);
    const catExists = allCategories.find(c => c.id === Number(categoryId));
    if (!catExists) {
      return sendError(res, 'Danh mục được chọn không hợp lệ', 400);
    }

    // --- Strict Budget Enforcement on Update ---
    if (type === 'expense') {
      const month = transactionDate.slice(0, 7);
      const budgets = await budgetModel.getBudgetsByMonth({ userId: req.user.id, month });
      const hasBudget = budgets.find(b => b.category_id === Number(categoryId) && b.is_budgeted === true);
      if (!hasBudget) {
        return sendError(res, `Vui lòng thiết lập hạn mức ngân sách cho danh mục "${catExists.name}" trước khi ghi nhận chi tiêu.`, 400);
      }
    }

    const affectedRows = await transactionModel.update(id, req.user.id, {
      categoryId: Number(categoryId),
      type,
      amount: Number(amount),
      transactionDate,
      note,
      merchant
    });

    if (!affectedRows) {
      return sendError(res, 'Cập nhật giao dịch thất bại', 400);
    }

    // Trigger AI insight cache stale check
    await triggerStaleCheck(req.user.id);

    return sendSuccess(res, null, 'Cập nhật giao dịch thành công!');
  } catch (err) {
    next(err);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;

    // Check ownership before delete
    const existing = await transactionModel.findByIdAndUserId(id, req.user.id);
    if (!existing) {
      return sendError(res, 'Không tìm thấy giao dịch hoặc bạn không có quyền xóa', 404);
    }

    const affectedRows = await transactionModel.remove(id, req.user.id);
    if (!affectedRows) {
      return sendError(res, 'Xóa giao dịch thất bại', 400);
    }

    // Trigger AI insight cache stale check
    await triggerStaleCheck(req.user.id);

    return sendSuccess(res, null, 'Xóa giao dịch thành công!');
  } catch (err) {
    next(err);
  }
}

/**
 * Create transaction specifically from AI OCR receipt scan (Point 5 & 4)
 */
async function createTransactionFromReceipt(req, res, next) {
  try {
    const { receiptId, categoryId, type = 'expense', amount, transactionDate, note, merchant, isModifiedByUser } = req.body;

    if (!receiptId) {
      return sendError(res, 'ID hóa đơn không được để trống', 400);
    }

    // Verify IDOR ownership of receipt
    const receipt = await receiptModel.findByIdAndUserId(Number(receiptId), req.user.id);
    if (!receipt) {
      return sendError(res, 'Không tìm thấy hóa đơn hoặc bạn không có quyền truy cập', 404);
    }

    // Verify category validity
    const category = await categoryModel.findByIdAndUserId(categoryId, req.user.id);
    if (!category) {
      const allCategories = await categoryModel.findByUserId(req.user.id);
      const exists = allCategories.find(c => c.id === Number(categoryId));
      if (!exists) {
        return sendError(res, 'Danh mục không hợp lệ hoặc không tồn tại', 400);
      }
    }

    // Audit trail flag (Point 4): 'ai' if untouched, 'manual' if user edited
    const nguon = isModifiedByUser ? 'manual' : 'ai';

    const newId = await transactionModel.create({
      userId: req.user.id,
      categoryId: Number(categoryId),
      type,
      amount: Number(amount),
      transactionDate,
      note: note || '',
      merchant: merchant || '',
      nguon,
      receiptId: Number(receiptId)
    });

    const allRecent = await transactionModel.findMany({ userId: req.user.id });
    const created = allRecent.find(t => t.id === newId);

    // Trigger AI insight cache stale check
    await triggerStaleCheck(req.user.id);

    return sendSuccess(res, { transaction: created }, 'Tạo giao dịch từ hóa đơn thành công!', 201);
  } catch (err) {
    next(err);
  }
}

async function getQuickTemplates(req, res, next) {
  try {
    const month = req.query.month || getCurrentMonthVN();
    const rows = await transactionModel.getCategoryTotalsForQuickAdd(req.user.id, month);
    
    const templates = rows.map(r => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryIcon: r.category_icon,
      categoryColor: r.category_color,
      suggestedAmount: Number(r.total_amount),
      suggestedNote: '',
      frequency: Number(r.frequency)
    }));

    return sendSuccess(res, templates, 'Lấy templates giao dịch nhanh thành công');
  } catch (err) {
    next(err);
  }
}

async function getStreak(req, res, next) {
  try {
    const dates = await transactionModel.getDistinctTransactionDates(req.user.id);
    
    const today = getCurrentDateVN();
    const yesterday = getYesterdayVN();
    
    // Bỏ qua các giao dịch trong tương lai để không làm nhiễu streak hiện tại
    const validDates = dates.filter(d => d <= today);
    
    let currentStreak = 0;
    let isActiveToday = false;
    
    if (validDates.length === 0) {
      return sendSuccess(res, { currentStreak: 0, isActiveToday: false }, 'Lấy chuỗi thành công');
    }
    
    if (validDates[0] === today) {
      isActiveToday = true;
    } else if (validDates[0] === yesterday) {
      isActiveToday = false;
    } else {
      return sendSuccess(res, { currentStreak: 0, isActiveToday: false }, 'Lấy chuỗi thành công');
    }
    
    let expectedDate = validDates[0];
    
    for (let i = 0; i < validDates.length; i++) {
      if (validDates[i] === expectedDate) {
        currentStreak++;
        expectedDate = subtractOneDayVN(expectedDate);
      } else {
        break;
      }
    }
    
    return sendSuccess(res, { currentStreak, isActiveToday }, 'Lấy chuỗi thành công');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTransactions,
  getSummary,
  createTransaction,
  createTransactionFromReceipt,
  updateTransaction,
  deleteTransaction,
  createTransactionCore, // exported for use by chat.controller.js (ai_chat flow)
  getQuickTemplates,
  getStreak
};
