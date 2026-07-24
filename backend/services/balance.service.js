const transactionModel = require('../models/transaction.model');
const savingsJarModel = require('../models/savingsJar.model');
const budgetModel = require('../models/budget.model');
const { getCurrentMonthVN } = require('../utils/timezone');

/**
 * Tính Số dư khả dụng (Available Balance) - NGUỒN CHÂN LÝ DUY NHẤT
 * Công thức: Tổng thu ALL TIME - Tổng chi ALL TIME - Tiền khóa trong Hũ - Ngân sách còn lại tháng này
 *
 * Lưu ý về getBudgetsByMonth: hàm này dùng LEFT JOIN query trên bảng transactions để tính
 * "spent per category". Đây KHÔNG phải là bản sao bug mà là query duy nhất hỗ trợ phân tách
 * theo từng category — transactionModel.sumByType() không hỗ trợ filter theo categoryId.
 * Hai query đi qua cùng bảng transactions nên không thể lệch số.
 */
async function getAvailableBalance(userId, month = getCurrentMonthVN()) {
  // 1. Tổng thu và tổng chi (ALL TIME)
  const totalIncome = await transactionModel.sumByType({ userId, type: 'income' });
  const totalExpense = await transactionModel.sumByType({ userId, type: 'expense' });
  const actualBalance = totalIncome - totalExpense;

  // 2. Tổng tiền đang khóa trong hũ tiết kiệm
  const totalLockedInJars = await savingsJarModel.getTotalLockedAmount(userId);

  // 3. Tổng ngân sách còn lại của tháng hiện tại
  const budgets = await budgetModel.getBudgetsByMonth({ userId, month });
  let totalRemainingBudgets = 0;
  
  budgets.forEach(b => {
    if (b.is_budgeted) {
      // Quan trọng: Phải chặn ở 0, nếu chi vượt ngân sách thì không tính số âm
      const remaining = Math.max(0, b.amount - b.spent);
      totalRemainingBudgets += remaining;
    }
  });

  // 4. Số dư khả dụng
  const availableBalance = actualBalance - totalLockedInJars - totalRemainingBudgets;

  return {
    total_actual_balance: actualBalance,
    total_locked_in_jars: totalLockedInJars,
    total_remaining_budgets: totalRemainingBudgets,
    available_balance: availableBalance
  };
}

module.exports = {
  getAvailableBalance
};
