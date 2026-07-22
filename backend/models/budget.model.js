const { pool } = require('../config/db');

/**
 * Budget Model - Manages monthly spending limits by category
 * Enforces compound unique constraint (user_id, category_id, month)
 */
const budgetModel = {
  /**
   * Initialize budgets table and unique index
   */
  async initTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        month VARCHAR(7) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_category_month (user_id, category_id, month),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(createTableQuery);
    console.log('[Model: Budget] Table "budgets" verified/created successfully.');
  },

  /**
   * Upsert (Insert or Update if exists) monthly budget for a category
   */
  async upsert({ userId, categoryId, amount, month }) {
    const query = `
      INSERT INTO budgets (user_id, category_id, amount, month)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        amount = VALUES(amount),
        updated_at = CURRENT_TIMESTAMP
    `;
    const [result] = await pool.query(query, [userId, categoryId, amount, month]);
    return result;
  },

  /**
   * Get all expense categories along with their budget and spent amount for a specific month.
   * Categories without a budget have is_budgeted = false and amount = null.
   */
  async getBudgetsByMonth({ userId, month }) {
    const query = `
      SELECT 
        c.id AS category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        b.id AS budget_id,
        b.amount AS budget_amount,
        COALESCE(t_sum.spent, 0) AS spent
      FROM categories c
      LEFT JOIN budgets b ON b.category_id = c.id AND b.user_id = ? AND b.month = ?
      LEFT JOIN (
        SELECT category_id, COALESCE(SUM(amount), 0) AS spent
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
        GROUP BY category_id
      ) t_sum ON t_sum.category_id = c.id
      WHERE c.type = 'expense' AND (c.user_id = ? OR c.is_default = 1)
      ORDER BY (b.id IS NOT NULL) DESC, t_sum.spent DESC, c.name ASC
    `;

    const [rows] = await pool.query(query, [userId, month, userId, month, userId]);

    return rows.map(row => {
      const spent = Number(row.spent || 0);
      if (row.budget_amount !== null && row.budget_amount !== undefined) {
        const amount = Number(row.budget_amount);
        const remaining = amount - spent;
        const percentUsed = amount > 0 ? Math.round((spent / amount) * 100) : (spent > 0 ? 100 : 0);
        return {
          id: row.budget_id,
          category_id: row.category_id,
          category_name: row.category_name,
          category_icon: row.category_icon,
          category_color: row.category_color,
          is_budgeted: true,
          amount,
          spent,
          remaining,
          percent_used: percentUsed
        };
      } else {
        return {
          id: null,
          category_id: row.category_id,
          category_name: row.category_name,
          category_icon: row.category_icon,
          category_color: row.category_color,
          is_budgeted: false,
          amount: null,
          spent,
          remaining: null,
          percent_used: null
        };
      }
    });
  },

  /**
   * Delete a budget limit by budget id and user id
   */
  async deleteBudget({ id, userId }) {
    const query = `DELETE FROM budgets WHERE id = ? AND user_id = ?`;
    const [result] = await pool.query(query, [id, userId]);
    return result.affectedRows > 0;
  },

  /**
   * Check if a category has any historical or active budget records
   * Used to enforce strict audit trail integrity when user tries to delete a custom category
   */
  async checkCategoryHasBudgets({ categoryId }) {
    const query = `SELECT id FROM budgets WHERE category_id = ? LIMIT 1`;
    const [rows] = await pool.query(query, [categoryId]);
    return rows.length > 0;
  }
};

module.exports = budgetModel;
