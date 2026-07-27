const { pool } = require('../config/db');

/**
 * Transaction Model - All DB operations for transactions table.
 * Parameterized queries only (?) to prevent SQL Injection.
 * IDOR protection enforced: always filter/check by user_id = req.user.id
 */

async function initTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category_id INT NOT NULL,
      type ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
      amount DECIMAL(15, 2) NOT NULL,
      transaction_date DATE NOT NULL,
      note VARCHAR(255) DEFAULT '',
      merchant VARCHAR(150) DEFAULT '',
      nguon VARCHAR(50) DEFAULT 'manual' COMMENT 'manual = nhập tay, ocr = từ chụp hóa đơn AI',
      receipt_id INT NULL COMMENT 'Liên kết sang bảng receipts khi làm Bước 7 OCR',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createTableQuery);
  console.log('[Model: Transaction] Table "transactions" verified/created successfully.');

  // Create performance optimization compound indexes (Point 4 of Senior Grade requirements)
  try {
    await pool.query(`CREATE INDEX idx_user_date ON transactions(user_id, transaction_date)`);
    console.log('[Model: Transaction] Compound index idx_user_date created.');
  } catch (err) {
    // Index likely already exists (error code ER_DUP_KEYNAME / 1061)
  }

  try {
    await pool.query(`CREATE INDEX idx_user_category ON transactions(user_id, category_id)`);
    console.log('[Model: Transaction] Compound index idx_user_category created.');
  } catch (err) {
    // Index likely already exists
  }
}

/**
 * Find transactions for a specific user with filtering:
 * - month: 'YYYY-MM' (e.g. '2026-07')
 * - type: 'all' | 'expense' | 'income'
 * - categoryId: optional INT
 * - search: optional text for note/merchant
 * Joined with categories table to return category_name, category_icon, category_color
 */
async function findMany({ userId, month, type, categoryId, search }) {
  let query = `
    SELECT 
      t.*,
      DATE_FORMAT(t.transaction_date, '%Y-%m-%d') as transaction_date_str,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params = [userId];

  // Filter by month (if provided, otherwise all or current month can be passed from controller)
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    query += ` AND DATE_FORMAT(t.transaction_date, '%Y-%m') = ?`;
    params.push(month);
  }

  // Filter by type
  if (type && ['expense', 'income'].includes(type)) {
    query += ` AND t.type = ?`;
    params.push(type);
  }

  // Filter by category
  if (categoryId && !isNaN(categoryId)) {
    query += ` AND t.category_id = ?`;
    params.push(Number(categoryId));
  }

  // Filter by search term
  if (search && search.trim() !== '') {
    query += ` AND (t.note LIKE ? OR t.merchant LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern);
  }

  query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;

  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * Get monthly summary (Total Income, Total Expense, Balance) for user in a month
 */
async function getSummary({ userId, month }) {
  let query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
    FROM transactions
    WHERE user_id = ?
  `;
  const params = [userId];

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    query += ` AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`;
    params.push(month);
  }

  const [rows] = await pool.query(query, params);
  return rows[0] || { total_income: 0, total_expense: 0, balance: 0 };
}

/**
 * Get total sum of transactions by type ('income' or 'expense')
 */
async function sumByType({ userId, month, upToMonth, type }) {
  let query = `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions
    WHERE user_id = ? AND type = ?
  `;
  const params = [userId, type];

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    query += ` AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`;
    params.push(month);
  }
  
  if (upToMonth && /^\d{4}-\d{2}$/.test(upToMonth)) {
    query += ` AND DATE_FORMAT(transaction_date, '%Y-%m') <= ?`;
    params.push(upToMonth);
  }

  const [rows] = await pool.query(query, params);
  return Number(rows[0]?.total || 0);
}

/**
 * Check ownership by id and userId before update/delete (IDOR prevention)
 */
async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] || null;
}

/**
 * Fetch a single transaction with joined category info by id+userId.
 * Used after create/update to return the full record without loading all transactions.
 */
async function findById(id, userId) {
  const [rows] = await pool.query(
    `SELECT t.*, 
       DATE_FORMAT(t.transaction_date, '%Y-%m-%d') as transaction_date_str,
       c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ? AND t.user_id = ?`,
    [id, userId]
  );
  return rows[0] || null;
}

async function create({ userId, categoryId, type, amount, transactionDate, note, merchant, nguon = 'manual', receiptId = null }) {
  const [result] = await pool.query(
    `INSERT INTO transactions (user_id, category_id, type, amount, transaction_date, note, merchant, nguon, receipt_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, categoryId, type, amount, transactionDate, note || '', merchant || '', nguon, receiptId]
  );
  return result.insertId;
}

/**
 * Update transaction (double check user_id = ? inside SQL for safety)
 */
async function update(id, userId, { categoryId, type, amount, transactionDate, note, merchant }) {
  const [result] = await pool.query(
    `UPDATE transactions 
     SET category_id = ?, type = ?, amount = ?, transaction_date = ?, note = ?, merchant = ?
     WHERE id = ? AND user_id = ?`,
    [categoryId, type, amount, transactionDate, note || '', merchant || '', id, userId]
  );
  return result.affectedRows;
}

/**
 * Delete transaction (double check user_id = ? inside SQL for safety)
 */
async function remove(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows;
}

/**
 * Check if any transaction references a given receipt ID (for audit trail protection)
 */
async function countByReceiptId(receiptId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) as cnt FROM transactions WHERE receipt_id = ?',
    [receiptId]
  );
  return rows[0] ? rows[0].cnt : 0;
}

/**
 * Lấy các giao dịch chi tiêu trong X tháng gần đây để tính Quick-add templates bằng JS
 */
async function getRawTransactionsForQuickAdd(userId, monthsBack = 3) {
  const query = `
    SELECT 
      t.category_id,
      t.amount,
      t.note,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? 
      AND t.type = 'expense'
      AND t.transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
  `;
  const [rows] = await pool.query(query, [userId, monthsBack]);
  return rows;
}

/**
 * Lấy tổng chi tiêu theo từng danh mục trong 1 tháng
 */
async function getCategoryTotalsForQuickAdd(userId, month) {
  const query = `
    SELECT 
      t.category_id,
      SUM(t.amount) as total_amount,
      COUNT(t.id) as frequency,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? 
      AND t.type = 'expense'
      AND DATE_FORMAT(t.transaction_date, '%Y-%m') = ?
    GROUP BY t.category_id, c.name, c.icon, c.color
    ORDER BY frequency DESC
    LIMIT 5
  `;
  const [rows] = await pool.query(query, [userId, month]);
  return rows;
}

/**
 * Lấy danh sách các ngày có giao dịch, định dạng 'YYYY-MM-DD', sắp xếp giảm dần.
 * Dùng để tính Streak.
 */
async function getDistinctTransactionDates(userId) {
  const query = `
    SELECT DISTINCT DATE_FORMAT(transaction_date, '%Y-%m-%d') as date_str
    FROM transactions
    WHERE user_id = ?
    ORDER BY date_str DESC
  `;
  const [rows] = await pool.query(query, [userId]);
  return rows.map(r => r.date_str);
}

/**
 * Check if a category has any transactions
 * Used to enforce strict audit trail integrity when user tries to delete a custom category
 */
async function checkCategoryHasTransactions(categoryId) {
  const query = `SELECT id FROM transactions WHERE category_id = ? LIMIT 1`;
  const [rows] = await pool.query(query, [categoryId]);
  return rows.length > 0;
}

module.exports = {
  initTable,
  findMany,
  getSummary,
  sumByType,
  findByIdAndUserId,
  findById,
  create,
  update,
  remove,
  countByReceiptId,
  getRawTransactionsForQuickAdd,
  getCategoryTotalsForQuickAdd,
  getDistinctTransactionDates,
  checkCategoryHasTransactions
};
