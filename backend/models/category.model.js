const { pool } = require('../config/db');

/**
 * Category Model - All DB operations for categories table.
 * Parameterized queries only (?) to prevent SQL Injection.
 * IDOR protection enforced at query level: always filter by user_id = req.user.id
 */

// === INITIALIZATION ===

async function initTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL COMMENT 'NULL = system default visible to all; INT = user-specific private category',
      name VARCHAR(100) NOT NULL,
      type ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
      icon VARCHAR(50) DEFAULT 'Tag',
      color VARCHAR(20) DEFAULT '#2563EB',
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createTableQuery);
  console.log('[Model: Category] Table "categories" verified/created successfully.');
  await seedDefaultCategories();
}

/**
 * Seed system-default categories (user_id = NULL, is_default = TRUE)
 * Only inserts if no default categories exist yet.
 */
async function seedDefaultCategories() {
  const [existing] = await pool.query('SELECT id FROM categories WHERE is_default = TRUE LIMIT 1');
  if (existing.length > 0) return; // Already seeded

  const defaults = [
    // Expense categories
    { name: 'Ăn uống', type: 'expense', icon: 'UtensilsCrossed', color: '#F97316' },
    { name: 'Tiền nhà / Ký túc xá', type: 'expense', icon: 'Home', color: '#8B5CF6' },
    { name: 'Học phí / Sách vở', type: 'expense', icon: 'BookOpen', color: '#2563EB' },
    { name: 'Di chuyển', type: 'expense', icon: 'Bus', color: '#06B6D4' },
    { name: 'Giải trí', type: 'expense', icon: 'Gamepad2', color: '#EC4899' },
    { name: 'Mua sắm', type: 'expense', icon: 'ShoppingBag', color: '#EF4444' },
    { name: 'Y tế / Sức khoẻ', type: 'expense', icon: 'Heart', color: '#10B981' },
    { name: 'Khác (Chi)', type: 'expense', icon: 'MoreHorizontal', color: '#6B7280' },
    // Income categories
    { name: 'Chu cấp gia đình', type: 'income', icon: 'Users', color: '#16A34A' },
    { name: 'Lương làm thêm / Freelance', type: 'income', icon: 'Briefcase', color: '#2563EB' },
    { name: 'Học bổng', type: 'income', icon: 'GraduationCap', color: '#D97706' },
    { name: 'Thưởng / Quà tặng', type: 'income', icon: 'Gift', color: '#EC4899' },
    { name: 'Khác (Thu)', type: 'income', icon: 'MoreHorizontal', color: '#6B7280' },
  ];

  const insertQuery = `
    INSERT INTO categories (user_id, name, type, icon, color, is_default)
    VALUES (NULL, ?, ?, ?, ?, TRUE)
  `;
  for (const cat of defaults) {
    await pool.query(insertQuery, [cat.name, cat.type, cat.icon, cat.color]);
  }
  console.log('[Model: Category] Default categories seeded successfully.');
}

// === CRUD OPERATIONS ===

/**
 * Get all categories visible to a specific user:
 * - System defaults (user_id IS NULL)
 * - User's own custom categories (user_id = userId)
 * IDOR: Only pass req.user.id here, never trust client body
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM categories
     WHERE user_id IS NULL OR user_id = ?
     ORDER BY type ASC, is_default DESC, name ASC`,
    [userId]
  );
  return rows;
}

/**
 * Find a single category by id and userId — for ownership check before update/delete
 */
async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] || null;
}

async function create({ userId, name, type, icon, color }) {
  const [result] = await pool.query(
    `INSERT INTO categories (user_id, name, type, icon, color, is_default)
     VALUES (?, ?, ?, ?, ?, FALSE)`,
    [userId, name, type, icon || 'Tag', color || '#2563EB']
  );
  return result.insertId;
}

/**
 * Update only user-owned, non-default categories (double IDOR guard at SQL level)
 */
async function update(id, userId, { name, icon, color }) {
  const [result] = await pool.query(
    `UPDATE categories SET name = ?, icon = ?, color = ?
     WHERE id = ? AND user_id = ? AND is_default = FALSE`,
    [name, icon, color, id, userId]
  );
  return result.affectedRows;
}

/**
 * Delete only user-owned, non-default categories
 */
async function remove(id, userId) {
  const [result] = await pool.query(
    `DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = FALSE`,
    [id, userId]
  );
  return result.affectedRows;
}

module.exports = {
  initTable,
  findByUserId,
  findByIdAndUserId,
  create,
  update,
  remove
};
