const { pool } = require('../config/db');

async function initTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      bank_code VARCHAR(30) NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      account_number_hash CHAR(64) NOT NULL,
      account_number_last4 CHAR(4) NOT NULL,
      label VARCHAR(100) DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_bank_account (bank_code, account_number_hash),
      INDEX idx_bank_account_user (user_id, is_active),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(query);
  console.log('[Model: BankAccount] Table "bank_accounts" verified/created successfully.');
}

async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT id, bank_code, bank_name, account_number_last4, label, is_active, created_at, updated_at
     FROM bank_accounts
     WHERE user_id = ? AND is_active = TRUE
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function findActiveByHash(bankCode, accountNumberHash) {
  const [rows] = await pool.query(
    `SELECT id, user_id, bank_code, bank_name, account_number_last4, label
     FROM bank_accounts
     WHERE bank_code = ? AND account_number_hash = ? AND is_active = TRUE
     LIMIT 1`,
    [bankCode, accountNumberHash]
  );
  return rows[0] || null;
}

async function connect({ userId, bankCode, bankName, accountNumberHash, accountNumberLast4, label }) {
  const [existingRows] = await pool.query(
    `SELECT id, user_id FROM bank_accounts
     WHERE bank_code = ? AND account_number_hash = ? LIMIT 1`,
    [bankCode, accountNumberHash]
  );

  const existing = existingRows[0];
  if (existing && Number(existing.user_id) !== Number(userId)) {
    const error = new Error('Tài khoản ngân hàng này đã được liên kết với một người dùng khác');
    error.code = 'BANK_ACCOUNT_ALREADY_LINKED';
    throw error;
  }

  if (existing) {
    await pool.query(
      `UPDATE bank_accounts
       SET bank_name = ?, account_number_last4 = ?, label = ?, is_active = TRUE
       WHERE id = ? AND user_id = ?`,
      [bankName, accountNumberLast4, label || '', existing.id, userId]
    );
    return existing.id;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO bank_accounts
       (user_id, bank_code, bank_name, account_number_hash, account_number_last4, label)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, bankCode, bankName, accountNumberHash, accountNumberLast4, label || '']
    );
    return result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const conflict = new Error('Tài khoản ngân hàng này đã được liên kết');
      conflict.code = 'BANK_ACCOUNT_ALREADY_LINKED';
      throw conflict;
    }
    throw error;
  }
}

async function deactivate(id, userId) {
  const [result] = await pool.query(
    `UPDATE bank_accounts SET is_active = FALSE
     WHERE id = ? AND user_id = ? AND is_active = TRUE`,
    [id, userId]
  );
  return result.affectedRows;
}

module.exports = {
  initTable,
  findByUserId,
  findActiveByHash,
  connect,
  deactivate
};
