const { pool } = require('../config/db');

/**
 * Receipt Model - Database operations for receipts table.
 * Strictly uses parameterized queries to prevent SQL injection.
 * Enforces IDOR protection by filtering by user_id = req.user.id.
 */

async function initTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS receipts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      cloudinary_public_id VARCHAR(150) NOT NULL,
      ocr_raw_text TEXT,
      ocr_extracted_amount DECIMAL(15, 2) NULL,
      ocr_extracted_merchant VARCHAR(150) NULL,
      ai_suggested_category_id INT NULL,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createTableQuery);
  console.log('[Model: Receipt] Table "receipts" verified/created successfully.');
}

async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM receipts WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] || null;
}

async function create({
  userId,
  imageUrl,
  cloudinaryPublicId,
  ocrRawText = '',
  ocrExtractedAmount = null,
  ocrExtractedMerchant = '',
  aiSuggestedCategoryId = null
}) {
  const [result] = await pool.query(
    `INSERT INTO receipts (
      user_id, image_url, cloudinary_public_id, ocr_raw_text,
      ocr_extracted_amount, ocr_extracted_merchant, ai_suggested_category_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      imageUrl,
      cloudinaryPublicId,
      ocrRawText,
      ocrExtractedAmount,
      ocrExtractedMerchant,
      aiSuggestedCategoryId
    ]
  );
  return result.insertId;
}

async function remove(id, userId) {
  const [result] = await pool.query(
    'DELETE FROM receipts WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows;
}

module.exports = {
  initTable,
  findByIdAndUserId,
  create,
  remove
};
