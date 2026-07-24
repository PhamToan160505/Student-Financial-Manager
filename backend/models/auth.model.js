const { pool } = require('../config/db');

async function initTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(query);
  console.log('[Model: Auth] Table "refresh_tokens" verified/created successfully.');
}

async function createRefreshToken(userId, tokenHash, expiresAt) {
  const [result] = await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
  return result.insertId;
}

async function findValidRefreshToken(tokenHash) {
  const [rows] = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = ?',
    [tokenHash]
  );
  return rows[0] || null;
}

async function revokeToken(id) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = ?', [id]);
}

async function revokeAllForUser(userId) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?', [userId]);
}

async function extendTokenExpiry(tokenHash, newExpiresAt) {
  await pool.query(
    'UPDATE refresh_tokens SET expires_at = ? WHERE token_hash = ?',
    [newExpiresAt, tokenHash]
  );
}

async function cleanupExpiredTokens() {
  // Lazy cleanup of tokens that are expired or revoked
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE');
  } catch (err) {
    console.error('[Model: Auth] Cleanup error:', err.message);
  }
}

module.exports = {
  initTable,
  createRefreshToken,
  findValidRefreshToken,
  revokeToken,
  revokeAllForUser,
  extendTokenExpiry,
  cleanupExpiredTokens
};
