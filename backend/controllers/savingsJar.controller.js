const savingsJarModel = require('../models/savingsJar.model');
const jarTransactionModel = require('../models/jarTransaction.model');
const transactionModel = require('../models/transaction.model');
const balanceService = require('../services/balance.service');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Controller cho Hũ tiết kiệm (Savings Jars)
 */

// Lấy tất cả hũ và tính toán on-the-fly cảnh báo định kỳ
async function getAllJars(req, res, next) {
  try {
    const userId = req.user.id;
    const jars = await savingsJarModel.findAllByUserId(userId);
    
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Enrich data
    const enrichedJars = await Promise.all(jars.map(async (jar) => {
      let warningLevel = 0; // 0: OK, 1: Nhắc nhẹ, 2: Cảnh báo gắt
      let monthlyTarget = 0;
      let monthlyDeposited = 0;
      let monthlyMissing = 0;
      let hasTargetDate = false;

      if (jar.target_date && jar.status !== 'completed' && jar.status !== 'archived') {
        const targetDate = new Date(jar.target_date);
        
        // Tính số tháng còn lại
        let monthsLeft = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
        if (targetDate.getDate() >= today.getDate()) {
            monthsLeft += 1;
        }

        if (monthsLeft >= 2) {
          hasTargetDate = true;
          const missingAmount = Number(jar.target_amount) - Number(jar.current_amount);
          
          if (missingAmount > 0) {
            monthlyTarget = Math.ceil(missingAmount / monthsLeft);
            monthlyDeposited = await jarTransactionModel.getMonthlyDepositForJar(jar.id, currentMonthStr);
            monthlyMissing = monthlyTarget - monthlyDeposited;
            
            if (monthlyMissing > 0) {
              // Tính số ngày còn lại trong tháng
              const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              const daysLeftInMonth = lastDayOfMonth - today.getDate();
              
              if (daysLeftInMonth <= 7) { // Cảnh báo gắt nếu còn <= 7 ngày
                warningLevel = 2;
              } else {
                warningLevel = 1;
              }
            }
          }
        }
      }

      return {
        ...jar,
        monthly_target: monthlyTarget,
        monthly_deposited: monthlyDeposited,
        monthly_missing: monthlyMissing,
        warning_level: warningLevel,
        has_long_term_target: hasTargetDate
      };
    }));

    return sendSuccess(res, { jars: enrichedJars }, 'Lấy danh sách hũ thành công');
  } catch (error) {
    next(error);
  }
}

async function createJar(req, res, next) {
  try {
    const { name, icon, color, targetAmount, targetDate } = req.body;
    
    if (!name || !targetAmount) {
      return sendError(res, 'Vui lòng nhập tên và số tiền mục tiêu', 400);
    }
    
    const jarId = await savingsJarModel.create({
      userId: req.user.id,
      name,
      icon,
      color,
      targetAmount,
      targetDate: targetDate || null
    });
    
    return sendSuccess(res, { jarId }, 'Tạo hũ tiết kiệm thành công', 201);
  } catch (error) {
    next(error);
  }
}

async function updateJar(req, res, next) {
  try {
    const { id } = req.params;
    const { name, icon, color, targetAmount, targetDate, status } = req.body;
    const userId = req.user.id;

    const jar = await savingsJarModel.findByIdAndUserId(id, userId);
    if (!jar) return sendError(res, 'Không tìm thấy hũ tiết kiệm', 404);

    let newStatus = status || jar.status;
    
    // Nếu update targetAmount mà currentAmount >= targetAmount thì auto complete
    if (targetAmount !== undefined) {
      if (Number(jar.current_amount) >= Number(targetAmount) && newStatus === 'active') {
        newStatus = 'completed';
      }
    }

    await savingsJarModel.update(id, userId, {
      name, icon, color, targetAmount, targetDate, status: newStatus
    });

    return sendSuccess(res, null, 'Cập nhật hũ thành công');
  } catch (error) {
    next(error);
  }
}

async function deleteJar(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const jar = await savingsJarModel.findByIdAndUserId(id, userId);
    if (!jar) return sendError(res, 'Không tìm thấy hũ', 404);

    if (Number(jar.current_amount) > 0) {
      return sendError(res, 'Chỉ có thể xóa hũ khi số dư bằng 0', 400);
    }

    await savingsJarModel.remove(id, userId);
    return sendSuccess(res, null, 'Xóa hũ thành công');
  } catch (error) {
    next(error);
  }
}

async function deposit(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) return sendError(res, 'Số tiền gửi phải lớn hơn 0', 400);

    const jar = await savingsJarModel.findByIdAndUserId(id, userId);
    if (!jar) return sendError(res, 'Không tìm thấy hũ', 404);

    if (jar.status !== 'active') return sendError(res, 'Hũ này không còn hoạt động', 400);

    // Kiểm tra số dư khả dụng (Available Balance) đồng bộ với toàn hệ thống
    const balanceData = await balanceService.getAvailableBalance(userId);

    if (amount > balanceData.available_balance) {
      return sendError(res, 'Số tiền gửi vượt quá số dư khả dụng', 400);
    }

    // Thực hiện nạp
    await jarTransactionModel.create({ jarId: id, userId, type: 'deposit', amount, note });
    
    let newAmount = Number(jar.current_amount) + Number(amount);
    let newStatus = jar.status;
    if (newAmount >= Number(jar.target_amount)) {
      newStatus = 'completed';
    }

    await savingsJarModel.update(id, userId, { currentAmount: newAmount, status: newStatus });
    
    return sendSuccess(res, { newAmount, status: newStatus }, 'Gửi tiền vào hũ thành công');
  } catch (error) {
    next(error);
  }
}

async function withdraw(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) return sendError(res, 'Số tiền rút phải lớn hơn 0', 400);

    const jar = await savingsJarModel.findByIdAndUserId(id, userId);
    if (!jar) return sendError(res, 'Không tìm thấy hũ', 404);

    if (amount > Number(jar.current_amount)) {
      return sendError(res, 'Số tiền rút vượt quá số dư trong hũ', 400);
    }

    // Thực hiện rút
    await jarTransactionModel.create({ jarId: id, userId, type: 'withdraw', amount, note });
    
    let newAmount = Number(jar.current_amount) - Number(amount);
    
    await savingsJarModel.update(id, userId, { currentAmount: newAmount });
    
    return sendSuccess(res, { newAmount }, 'Rút tiền khỏi hũ thành công');
  } catch (error) {
    next(error);
  }
}

async function getJarHistory(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const jar = await savingsJarModel.findByIdAndUserId(id, userId);
    if (!jar) return sendError(res, 'Không tìm thấy hũ', 404);
    const transactions = await jarTransactionModel.findByJarId(id, userId);
    return sendSuccess(res, { jar, transactions }, 'Lấy lịch sử giao dịch hũ thành công');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllJars,
  createJar,
  updateJar,
  deleteJar,
  deposit,
  withdraw,
  getJarHistory
};
