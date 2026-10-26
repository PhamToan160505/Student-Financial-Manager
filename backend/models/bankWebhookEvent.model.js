const { pool } = require('../config/db');
const { maskAccountNumber, sanitizePayload } = require('../utils/sepayWebhook');

async function initTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS bank_webhook_events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      provider VARCHAR(30) NOT NULL,
      external_id VARCHAR(100) NOT NULL,
      user_id INT NOT NULL,
      bank_account_id INT NOT NULL,
      transaction_id INT NULL,
      gateway VARCHAR(100) NOT NULL,
      transfer_type ENUM('in', 'out') NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      bank_transaction_at DATETIME NOT NULL,
      reference_code VARCHAR(255) DEFAULT '',
      content TEXT,
      description TEXT,
      balance_after DECIMAL(18, 2) DEFAULT 0,
      payload JSON NOT NULL,
      processing_status ENUM('processing', 'imported') NOT NULL DEFAULT 'processing',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_provider_external (provider, external_id),
      INDEX idx_bank_event_user_date (user_id, bank_transaction_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(query);
  console.log('[Model: BankWebhookEvent] Table "bank_webhook_events" verified/created successfully.');
}

async function importTransaction({ account, payload, normalized }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const sanitizedPayload = sanitizePayload(payload);
    let eventResult;
    try {
      [eventResult] = await connection.query(
        `INSERT INTO bank_webhook_events
         (provider, external_id, user_id, bank_account_id, gateway, transfer_type, amount,
          bank_transaction_at, reference_code, content, description, balance_after, payload)
         VALUES ('sepay', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          normalized.externalId,
          account.user_id,
          account.id,
          normalized.gateway,
          normalized.transferType,
          normalized.amount,
          normalized.transactionDate,
          normalized.referenceCode,
          normalized.content,
          normalized.description,
          normalized.accumulated,
          JSON.stringify(sanitizedPayload)
        ]
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        await connection.rollback();
        return { duplicate: true, transactionId: null };
      }
      throw error;
    }

    const type = normalized.transferType === 'out' ? 'expense' : 'income';
    const [categoryRows] = await connection.query(
      `SELECT id FROM categories
       WHERE user_id IS NULL AND is_default = TRUE AND type = ?
       ORDER BY CASE WHEN name LIKE 'Khác%' THEN 0 ELSE 1 END, id ASC
       LIMIT 1`,
      [type]
    );

    if (!categoryRows[0]) {
      throw new Error(`Không tìm thấy danh mục mặc định cho giao dịch ${type}`);
    }

    const note = (normalized.content || normalized.description || normalized.referenceCode || 'Giao dịch VietinBank')
      .slice(0, 255);
    const merchant = `VietinBank • ${maskAccountNumber(normalized.accountNumber)}`.slice(0, 150);

    const [transactionResult] = await connection.query(
      `INSERT INTO transactions
       (user_id, category_id, type, amount, transaction_date, note, merchant, nguon, receipt_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sepay_vietinbank', NULL)`,
      [
        account.user_id,
        categoryRows[0].id,
        type,
        normalized.amount,
        normalized.transactionDay,
        note,
        merchant
      ]
    );

    await connection.query(
      `UPDATE bank_webhook_events
       SET transaction_id = ?, processing_status = 'imported'
       WHERE id = ?`,
      [transactionResult.insertId, eventResult.insertId]
    );

    await connection.commit();
    return { duplicate: false, transactionId: transactionResult.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  initTable,
  importTransaction
};
