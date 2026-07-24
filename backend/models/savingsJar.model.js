const { pool } = require('../config/db');

/**
 * Savings Jar Model - Database operations for savings_jars table.
 */

async function initTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS savings_jars (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(50),
      color VARCHAR(7),
      target_amount DECIMAL(15,2) NOT NULL,
      target_date DATE NULL,
      current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      status ENUM('active','completed','archived') NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createTableQuery);
  console.log('[Model: SavingsJar] Table "savings_jars" verified/created successfully.');
}

async function create({ userId, name, icon, color, targetAmount, targetDate }) {
  const [result] = await pool.query(
    `INSERT INTO savings_jars (user_id, name, icon, color, target_amount, target_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, name, icon || 'PiggyBank', color || '#2563EB', targetAmount, targetDate || null]
  );
  return result.insertId;
}

async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM savings_jars WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] || null;
}

async function findAllByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM savings_jars WHERE user_id = ? ORDER BY status ASC, created_at DESC',
    [userId]
  );
  return rows;
}

async function update(id, userId, { name, icon, color, targetAmount, targetDate, status, currentAmount }) {
  const fields = [];
  const values = [];

  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
  if (color !== undefined) { fields.push('color = ?'); values.push(color); }
  if (targetAmount !== undefined) { fields.push('target_amount = ?'); values.push(targetAmount); }
  if (targetDate !== undefined) { fields.push('target_date = ?'); values.push(targetDate); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (currentAmount !== undefined) { fields.push('current_amount = ?'); values.push(currentAmount); }

  if (fields.length === 0) return true;

  values.push(id, userId);
  const query = `UPDATE savings_jars SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
}

async function remove(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM savings_jars WHERE id = ? AND user_id = ? AND current_amount = 0',
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function getTotalLockedAmount(userId) {
  const [rows] = await pool.query(
    "SELECT COALESCE(SUM(current_amount), 0) AS total_locked FROM savings_jars WHERE user_id = ? AND status = 'active'",
    [userId]
  );
  return Number(rows[0].total_locked || 0);
}

module.exports = {
  initTable,
  create,
  findByIdAndUserId,
  findAllByUserId,
  update,
  remove,
  getTotalLockedAmount
};
