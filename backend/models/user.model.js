const { pool } = require('../config/db');

/**
 * User Model - Handles all database operations related to the 'users' table.
 * All queries strictly use parameterized statements (?) to prevent SQL Injection.
 */

async function initTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(query);
  console.log('[Model: User] Table "users" verified/created successfully.');
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  // Exclude password_hash when querying by ID for safety
  const [rows] = await pool.query('SELECT id, full_name, email, created_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ fullName, email, passwordHash }) {
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
    [fullName, email, passwordHash]
  );
  return result.insertId;
}

module.exports = {
  initTable,
  findByEmail,
  findById,
  create
};
