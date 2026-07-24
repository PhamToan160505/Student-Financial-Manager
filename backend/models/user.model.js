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
      email_verified BOOLEAN DEFAULT FALSE,
      otp_code_hash VARCHAR(255) NULL,
      otp_expires_at DATETIME NULL,
      otp_purpose ENUM('register','reset_password') NULL,
      otp_attempts INT DEFAULT 0,
      avatar_url VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(query);

  // Alter table if avatar_url column is missing (for existing dbs)
  try {
    await pool.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) NULL");
  } catch (err) {
    // Column might already exist, ignore error (ER_DUP_FIELDNAME)
  }
  console.log('[Model: User] Table "users" verified/created successfully.');
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  // Exclude password_hash when querying by ID for safety
  const [rows] = await pool.query('SELECT id, full_name, email, avatar_url, created_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ fullName, email, passwordHash }) {
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
    [fullName, email, passwordHash]
  );
  return result.insertId;
}

async function updateOtp(email, otpHash, expiresAt, purpose) {
  await pool.query(
    'UPDATE users SET otp_code_hash = ?, otp_expires_at = ?, otp_purpose = ?, otp_attempts = 0 WHERE email = ?',
    [otpHash, expiresAt, purpose, email]
  );
}

async function verifyEmail(email) {
  await pool.query('UPDATE users SET email_verified = TRUE WHERE email = ?', [email]);
}

async function clearOtp(email) {
  await pool.query(
    'UPDATE users SET otp_code_hash = NULL, otp_expires_at = NULL, otp_purpose = NULL, otp_attempts = 0 WHERE email = ?',
    [email]
  );
}

async function incrementOtpAttempts(email) {
  await pool.query('UPDATE users SET otp_attempts = otp_attempts + 1 WHERE email = ?', [email]);
}

async function updatePassword(email, newPasswordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [newPasswordHash, email]);
}

async function updateProfile(id, fullName, avatarUrl) {
  if (avatarUrl) {
    await pool.query('UPDATE users SET full_name = ?, avatar_url = ? WHERE id = ?', [fullName, avatarUrl, id]);
  } else {
    await pool.query('UPDATE users SET full_name = ? WHERE id = ?', [fullName, id]);
  }
  return findById(id);
}

module.exports = {
  initTable,
  findByEmail,
  findById,
  create,
  updateOtp,
  verifyEmail,
  clearOtp,
  incrementOtpAttempts,
  updatePassword,
  updateProfile
};
