const crypto = require('crypto');

const MAX_CLOCK_SKEW_SECONDS = 5 * 60;

function normalizeAccountNumber(value) {
  return String(value || '').replace(/[\s-]/g, '');
}

function maskAccountNumber(value) {
  const normalized = normalizeAccountNumber(value);
  if (!normalized) return '';
  return `****${normalized.slice(-4)}`;
}

function hashAccountNumber(value, secret) {
  const normalized = normalizeAccountNumber(value);
  if (!normalized || !secret) {
    throw new Error('Không thể tạo mã định danh tài khoản ngân hàng');
  }

  return crypto
    .createHmac('sha256', secret)
    .update(normalized)
    .digest('hex');
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifySePaySignature({ rawBody, signature, timestamp, secret, nowMs = Date.now() }) {
  if (!Buffer.isBuffer(rawBody) || !secret || !signature || !timestamp) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isInteger(timestampNumber)) return false;

  const nowSeconds = Math.floor(nowMs / 1000);
  if (Math.abs(nowSeconds - timestampNumber) > MAX_CLOCK_SKEW_SECONDS) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(`${timestampNumber}.${rawBody.toString('utf8')}`)
    .digest('hex')}`;

  return safeCompare(expected, signature);
}

function normalizeSePayPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createValidationError('Payload webhook không hợp lệ');
  }

  const externalId = String(payload.id ?? '').trim();
  const gateway = String(payload.gateway || '').trim();
  const accountNumber = normalizeAccountNumber(payload.accountNumber);
  const transferType = String(payload.transferType || '').trim().toLowerCase();
  const amount = Number(payload.transferAmount);
  const transactionDate = String(payload.transactionDate || '').trim();

  if (!/^\d+$/.test(externalId)) {
    throw createValidationError('Thiếu ID giao dịch SePay hợp lệ');
  }
  if (!gateway || gateway.length > 100) {
    throw createValidationError('Tên ngân hàng không hợp lệ');
  }
  if (!/^\d{8,20}$/.test(accountNumber)) {
    throw createValidationError('Số tài khoản ngân hàng không hợp lệ');
  }
  if (!['in', 'out'].includes(transferType)) {
    throw createValidationError('Loại giao dịch SePay không hợp lệ');
  }
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000_000) {
    throw createValidationError('Số tiền giao dịch SePay không hợp lệ');
  }
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(transactionDate)) {
    throw createValidationError('Thời gian giao dịch SePay không hợp lệ');
  }

  return {
    externalId,
    gateway,
    accountNumber,
    transferType,
    amount,
    transactionDate,
    transactionDay: transactionDate.slice(0, 10),
    subAccount: cleanOptionalText(payload.subAccount, 250),
    code: cleanOptionalText(payload.code, 250),
    content: cleanOptionalText(payload.content, 1000),
    description: cleanOptionalText(payload.description, 1000),
    accumulated: normalizeOptionalMoney(payload.accumulated),
    referenceCode: cleanOptionalText(payload.referenceCode, 255)
  };
}

function isVietinBankGateway(gateway) {
  const normalized = String(gateway || '').replace(/[\s_-]/g, '').toLowerCase();
  return normalized === 'vietinbank' || normalized === 'icb';
}

function sanitizePayload(payload) {
  return {
    ...payload,
    accountNumber: maskAccountNumber(payload.accountNumber)
  };
}

function cleanOptionalText(value, maxLength) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLength);
}

function normalizeOptionalMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.min(amount, 100_000_000_000_000);
}

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  MAX_CLOCK_SKEW_SECONDS,
  normalizeAccountNumber,
  maskAccountNumber,
  hashAccountNumber,
  verifySePaySignature,
  normalizeSePayPayload,
  isVietinBankGateway,
  sanitizePayload
};
