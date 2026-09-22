const categoryModel = require('../models/category.model');
const budgetModel = require('../models/budget.model');
const transactionModel = require('../models/transaction.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Category Controller
 * All handlers use req.user.id (set by verifyToken) — never trust client-supplied user_id
 */

async function getAllCategories(req, res, next) {
  try {
    const categories = await categoryModel.findByUserId(req.user.id);

    // Split into expense/income for convenience
    const expense = categories.filter(c => c.type === 'expense');
    const income = categories.filter(c => c.type === 'income');

    return sendSuccess(res, { categories, expense, income }, 'Lấy danh sách danh mục thành công');
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, type, icon, color } = req.body;

    const newId = await categoryModel.create({
      userId: req.user.id,
      name,
      type,
      icon,
      color
    });

    // Fetch the newly created category to return full data
    const [created] = (await categoryModel.findByUserId(req.user.id)).filter(c => c.id === newId);

    return sendSuccess(res, { category: created }, 'Tạo danh mục mới thành công!', 201);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
      const { name, icon, color } = req.body;

      // Check ownership first — prevents IDOR
      const existing = await categoryModel.findByIdAndUserId(id, req.user.id);
    if (!existing) {
      return sendError(res, 'Không tìm thấy danh mục hoặc bạn không có quyền chỉnh sửa danh mục này', 404);
    }

    if (existing.is_default) {
      return sendError(res, 'Không thể sửa danh mục mặc định của hệ thống', 403);
    }

    const affectedRows = await categoryModel.update(id, req.user.id, { name, icon, color });
    if (!affectedRows) {
      return sendError(res, 'Cập nhật danh mục thất bại', 400);
    }

    return sendSuccess(res, null, 'Cập nhật danh mục thành công!');
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    // Check ownership — prevents IDOR and prevents deleting system defaults
    const existing = await categoryModel.findByIdAndUserId(id, req.user.id);
    if (!existing) {
      return sendError(res, 'Không tìm thấy danh mục hoặc bạn không có quyền xóa danh mục này', 404);
    }

    if (existing.is_default) {
      return sendError(res, 'Không thể xóa danh mục mặc định của hệ thống', 403);
    }

    const hasBudgets = await budgetModel.checkCategoryHasBudgets({ categoryId: id });
    if (hasBudgets) {
      return sendError(res, 'Danh mục này đã từng được thiết lập hạn mức ngân sách. Không thể xóa để bảo toàn lịch sử dữ liệu tài chính!', 400);
    }
    
    const hasTransactions = await transactionModel.checkCategoryHasTransactions(id);
    if (hasTransactions) {
      return sendError(res, 'Danh mục này đã có giao dịch. Không thể xóa để bảo toàn lịch sử dữ liệu tài chính!', 400);
    }

    const affectedRows = await categoryModel.remove(id, req.user.id);
    if (!affectedRows) {
      return sendError(res, 'Xóa danh mục thất bại', 400);
    }

    return sendSuccess(res, null, 'Xóa danh mục thành công!');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
