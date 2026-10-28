const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const {
  normalizeAccountNumber,
  maskAccountNumber,
  hashAccountNumber,
  verifySePaySignature,
  normalizeSePayPayload,
  isVietinBankGateway,
  extractCategoryCode,
  sanitizePayload
} = require('../utils/sepayWebhook');

const samplePayload = {
  id: 92704,
  gateway: 'VietinBank',
  transactionDate: '2026-10-26 10:30:00',
  accountNumber: '123456789012',
  subAccount: '',
  code: null,
  content: 'Thanh toan tien an',
  transferType: 'out',
  description: 'CHI TIEU THE',
  transferAmount: 45000,
  accumulated: 5000000,
  referenceCode: 'FT2612345678'
};

test('normalizes, masks and hashes a bank account consistently', () => {
  assert.equal(normalizeAccountNumber('1234 5678-9012'), '123456789012');
  assert.equal(maskAccountNumber('123456789012'), '****9012');
  assert.equal(
    hashAccountNumber('1234 5678-9012', 'hash-secret'),
    hashAccountNumber('123456789012', 'hash-secret')
  );
});

test('verifies a valid SePay HMAC signature and rejects tampering', () => {
  const secret = 'webhook-secret';
  const timestamp = 1792985400;
  const rawBody = Buffer.from(JSON.stringify(samplePayload));
  const signature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex')}`;

  assert.equal(verifySePaySignature({
    rawBody,
    signature,
    timestamp,
    secret,
    nowMs: timestamp * 1000
  }), true);

  assert.equal(verifySePaySignature({
    rawBody: Buffer.from(`${rawBody.toString('utf8')} `),
    signature,
    timestamp,
    secret,
    nowMs: timestamp * 1000
  }), false);
});

test('rejects an expired SePay signature', () => {
  const rawBody = Buffer.from(JSON.stringify(samplePayload));
  assert.equal(verifySePaySignature({
    rawBody,
    signature: 'sha256=invalid',
    timestamp: 1000,
    secret: 'webhook-secret',
    nowMs: 2000 * 1000
  }), false);
});

test('normalizes a valid VietinBank transaction payload', () => {
  const result = normalizeSePayPayload(samplePayload);
  assert.equal(result.externalId, '92704');
  assert.equal(result.transactionDay, '2026-10-26');
  assert.equal(result.transferType, 'out');
  assert.equal(result.amount, 45000);
  assert.equal(isVietinBankGateway(result.gateway), true);
  assert.equal(isVietinBankGateway('ICB'), true);
});

test('rejects invalid amount and removes the full account number from stored payload', () => {
  assert.throws(
    () => normalizeSePayPayload({ ...samplePayload, transferAmount: -1 }),
    /Số tiền/
  );

  const sanitized = sanitizePayload(samplePayload);
  assert.equal(sanitized.accountNumber, '****9012');
  assert.equal(JSON.stringify(sanitized).includes('123456789012'), false);
});

test('extracts only an exact category code immediately after SEVQR', () => {
  assert.equal(extractCategoryCode('SEVQR E'), 'E');
  assert.equal(extractCategoryCode('thanh toan SEVQR mua1 an trua'), 'MUA1');
  assert.equal(extractCategoryCode('SEVQR-M'), 'M');
  assert.equal(extractCategoryCode('chuyen tien an em'), '');
  assert.equal(extractCategoryCode('SEVQR'), '');
});
