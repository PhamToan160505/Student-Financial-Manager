const bankAccountModel = require('../models/bankAccount.model');
const { sendSuccess, sendError } = require('../utils/response');
const { normalizeAccountNumber, hashAccountNumber } = require('../utils/sepayWebhook');

const BANK_CODE = 'VIETINBANK';
const BANK_NAME = 'VietinBank';

function getHashSecret() {
  return process.env.BANK_ACCOUNT_HASH_SECRET || '';
}

async function getBankAccounts(req, res, next) {
  try {
    const accounts = await bankAccountModel.findByUserId(req.user.id);
    return sendSuccess(res, {
      accounts,
      integration: {
        bankCode: BANK_CODE,
        bankName: BANK_NAME,
        webhookPath: '/api/webhooks/sepay',
        ready: Boolean(getHashSecret() && process.env.SEPAY_WEBHOOK_SECRET)
      }
    }, 'Lấy thông tin liên kết ngân hàng thành công');
  } catch (error) {
    next(error);
  }
}

async function connectBankAccount(req, res, next) {
  try {
    const secret = getHashSecret();
    if (!secret) {
      return sendError(res, 'Backend chưa cấu hình BANK_ACCOUNT_HASH_SECRET', 503);
    }

    const accountNumber = normalizeAccountNumber(req.body.accountNumber);
    const label = String(req.body.label || '').trim().slice(0, 100);
    const accountNumberHash = hashAccountNumber(accountNumber, secret);

    const id = await bankAccountModel.connect({
      userId: req.user.id,
      bankCode: BANK_CODE,
      bankName: BANK_NAME,
      accountNumberHash,
      accountNumberLast4: accountNumber.slice(-4),
      label
    });

    const accounts = await bankAccountModel.findByUserId(req.user.id);
    const account = accounts.find(item => item.id === id) || null;
    return sendSuccess(res, { account }, 'Đã liên kết tài khoản VietinBank', 201);
  } catch (error) {
    if (error.code === 'BANK_ACCOUNT_ALREADY_LINKED') {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
}

async function disconnectBankAccount(req, res, next) {
  try {
    const affectedRows = await bankAccountModel.deactivate(req.params.id, req.user.id);
    if (!affectedRows) {
      return sendError(res, 'Không tìm thấy liên kết ngân hàng', 404);
    }
    return sendSuccess(res, null, 'Đã ngắt liên kết VietinBank');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBankAccounts,
  connectBankAccount,
  disconnectBankAccount
};
