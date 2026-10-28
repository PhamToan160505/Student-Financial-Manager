const { pool } = require('../config/db');

async function initTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS bank_category_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      code VARCHAR(20) NOT NULL,
      category_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_bank_category_rule_user_code (user_id, code),
      INDEX idx_bank_category_rule_category (category_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(query);
  console.log('[Model: BankCategoryRule] Table "bank_category_rules" verified/created successfully.');
}

async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.code, r.category_id, r.created_at, r.updated_at,
            c.name AS category_name, c.type AS category_type,
            c.icon AS category_icon, c.color AS category_color
     FROM bank_category_rules r
     INNER JOIN categories c ON c.id = r.category_id
     WHERE r.user_id = ?
       AND (c.user_id IS NULL OR c.user_id = ?)
     ORDER BY c.type ASC, r.code ASC`,
    [userId, userId]
  );
  return rows;
}

async function upsert({ userId, code, categoryId }) {
  await pool.query(
    `INSERT INTO bank_category_rules (user_id, code, category_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE category_id = VALUES(category_id), updated_at = CURRENT_TIMESTAMP`,
    [userId, code, categoryId]
  );

  const [rows] = await pool.query(
    'SELECT id FROM bank_category_rules WHERE user_id = ? AND code = ? LIMIT 1',
    [userId, code]
  );
  return rows[0]?.id || null;
}

async function remove(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM bank_category_rules WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows;
}

async function findMatchingCategory(connection, { userId, code, type }) {
  if (!code) return null;

  const [rows] = await connection.query(
    `SELECT c.id, c.name
     FROM bank_category_rules r
     INNER JOIN categories c ON c.id = r.category_id
     WHERE r.user_id = ? AND r.code = ? AND c.type = ?
       AND (c.user_id IS NULL OR c.user_id = ?)
     LIMIT 1`,
    [userId, code, type, userId]
  );
  return rows[0] || null;
}

module.exports = {
  initTable,
  findByUserId,
  upsert,
  remove,
  findMatchingCategory
};
