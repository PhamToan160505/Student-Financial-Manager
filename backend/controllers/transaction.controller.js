const transactionModel = require('../models/transaction.model');
const categoryModel = require('../models/category.model');
const receiptModel = require('../models/receipt.model');
const insightCacheModel = require('../models/insightCache.model');
const { getCurrentMonthVN } = require('../utils/timezone');
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

async function createTransaction(req, res, next) {
  try {
    const { categoryId, type, amount, transactionDate, note, merchant } = req.body;

    // Verify category exists and either belongs to user or is system default
    const category = await categoryModel.findByIdAndUserId(categoryId, req.user.id);
    if (!category) {
      // check if it is system default
      const allCategories = await categoryModel.findByUserId(req.user.id);
      const exists = allCategories.find(c => c.id === Number(categoryId));
      if (!exists) {
        return sendError(res, 'Danh mục không hợp lệ hoặc không tồn tại', 400);
      }
    }

    const newId = await transactionModel.create({
      userId: req.user.id,
      categoryId: Number(categoryId),
      type,
      amount: Number(amount),
      transactionDate,
      note,
      merchant
    });

    // Fetch the created transaction with joined category info
    const allRecent = await transactionModel.findMany({ userId: req.user.id });
    const created = allRecent.find(t => t.id === newId);

    // Trigger AI insight cache stale check
    await triggerStaleCheck(req.user.id);

    return sendSuccess(res, { transaction: created }, 'Tạo giao dịch thành công!', 201);
  } catch (err) {
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

module.exports = {
  getAllTransactions,
  getSummary,
  createTransaction,
  createTransactionFromReceipt,
  updateTransaction,
  deleteTransaction
};
