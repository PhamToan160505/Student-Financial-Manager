const { pool } = require('../config/db');

/**
 * Jar Transaction Model - Database operations for jar_transactions table.
 */

async function initTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS jar_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      jar_id INT NOT NULL,
      user_id INT NOT NULL,
      type ENUM('deposit','withdraw') NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      note VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jar_id) REFERENCES savings_jars(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createTableQuery);
  console.log('[Model: JarTransaction] Table "jar_transactions" verified/created successfully.');
}

async function create({ jarId, userId, type, amount, note }) {
  const [result] = await pool.query(
    `INSERT INTO jar_transactions (jar_id, user_id, type, amount, note)
     VALUES (?, ?, ?, ?, ?)`,
    [jarId, userId, type, amount, note || '']
  );
  return result.insertId;
}

async function getMonthlyDepositForJar(jarId, monthStr) {
  // monthStr is expected to be 'YYYY-MM'
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END), 0) AS total 
     FROM jar_transactions 
     WHERE jar_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?`,
    [jarId, monthStr]
  );
  return Number(rows[0].total || 0);
}

async function findByJarId(jarId, userId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT id, type, amount, note, created_at
     FROM jar_transactions
     WHERE jar_id = ? AND user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [jarId, userId, limit]
  );
  return rows;
}

module.exports = {
  initTable,
  create,
  getMonthlyDepositForJar,
  findByJarId
};
