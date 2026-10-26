const bankAccountModel = require('../models/bankAccount.model');
const bankWebhookEventModel = require('../models/bankWebhookEvent.model');
const {
  hashAccountNumber,
  verifySePaySignature,
  normalizeSePayPayload,
  isVietinBankGateway
} = require('../utils/sepayWebhook');

function webhookSuccess(res) {
  return res.status(200).json({ success: true });
}

async function receiveSePayWebhook(req, res) {
  const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET || '';
  const accountHashSecret = process.env.BANK_ACCOUNT_HASH_SECRET || '';

  if (!webhookSecret || !accountHashSecret) {
    console.error('[SePay Webhook] Missing SEPAY_WEBHOOK_SECRET or BANK_ACCOUNT_HASH_SECRET');
    return res.status(503).json({ success: false });
  }

  const rawBody = req.body;
  const signature = req.get('X-SePay-Signature');
  const timestamp = req.get('X-SePay-Timestamp');

  if (!verifySePaySignature({ rawBody, signature, timestamp, secret: webhookSecret })) {
    return res.status(401).json({ success: false });
  }

  try {
    const payload = JSON.parse(rawBody.toString('utf8'));
    const normalized = normalizeSePayPayload(payload);

    if (!isVietinBankGateway(normalized.gateway)) {
      console.warn(`[SePay Webhook] Ignored unsupported gateway: ${normalized.gateway}`);
      return webhookSuccess(res);
    }

    const accountHash = hashAccountNumber(normalized.accountNumber, accountHashSecret);
    const account = await bankAccountModel.findActiveByHash('VIETINBANK', accountHash);

    if (!account) {
      console.warn(`[SePay Webhook] No active user mapping for VietinBank account ending ${normalized.accountNumber.slice(-4)}`);
      return webhookSuccess(res);
    }

    const result = await bankWebhookEventModel.importTransaction({ account, payload, normalized });
    console.log(`[SePay Webhook] ${result.duplicate ? 'Duplicate ignored' : 'Imported'}: ${normalized.externalId}`);
    return webhookSuccess(res);
  } catch (error) {
    if (error instanceof SyntaxError || error.statusCode === 400) {
      console.warn('[SePay Webhook] Invalid payload:', error.message);
      return res.status(400).json({ success: false });
    }

    console.error('[SePay Webhook] Processing failed:', error);
    return res.status(500).json({ success: false });
  }
}

module.exports = {
  receiveSePayWebhook
};
