const { pool } = require('../config/db');

/**
 * Dashboard Model - SQL aggregation queries for dashboard charts and KPI statistics.
 * All queries are strictly parameterized (?) and IDOR protected with WHERE user_id = ?
 */

async function getMonthlySummary({ userId, month }) {
  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
    FROM transactions
    WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
  `;
  const [rows] = await pool.query(query, [userId, month]);
  return rows[0] || { total_income: 0, total_expense: 0, balance: 0 };
}

/**
 * Get expense breakdown grouped by category for Donut Chart
 */
async function getCategoryBreakdown({ userId, month }) {
  const query = `
    SELECT 
      c.id AS category_id,
      COALESCE(c.name, 'Khác') AS category_name,
      COALESCE(c.icon, 'Tag') AS category_icon,
      COALESCE(c.color, '#6B7280') AS category_color,
      SUM(t.amount) AS total_amount
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? 
      AND DATE_FORMAT(t.transaction_date, '%Y-%m') = ?
      AND t.type = 'expense'
    GROUP BY c.id, c.name, c.icon, c.color
    ORDER BY total_amount DESC
  `;
  const [rows] = await pool.query(query, [userId, month]);
  return rows;
}

/**
 * Get daily income vs expense trend for a specific month
 */
async function getDailyTrend({ userId, month }) {
  const query = `
    SELECT 
      DATE_FORMAT(transaction_date, '%Y-%m-%d') AS date_str,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m-%d')
    ORDER BY date_str ASC
  `;
  const [rows] = await pool.query(query, [userId, month]);
  return rows;
}

/**
 * Get monthly income vs expense trend for the last 6 months up to endMonth (YYYY-MM)
 */
async function getSixMonthTrend({ userId, endMonth }) {
  // Compute startMonth (5 months prior to endMonth)
  const [yearStr, monthStr] = endMonth.split('-');
  let startY = Number(yearStr);
  let startM = Number(monthStr) - 5;
  while (startM <= 0) {
    startM += 12;
    startY -= 1;
  }
  const startMonth = `${startY}-${String(startM).padStart(2, '0')}`;

  const query = `
    SELECT 
      DATE_FORMAT(transaction_date, '%Y-%m') AS month_str,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE user_id = ? 
      AND DATE_FORMAT(transaction_date, '%Y-%m') >= ?
      AND DATE_FORMAT(transaction_date, '%Y-%m') <= ?
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
    ORDER BY month_str ASC
  `;
  const [rows] = await pool.query(query, [userId, startMonth, endMonth]);
  return rows;
}

/**
 * Get recent transactions with JOIN categories (Point 3 of Senior Grade requirements)
 */
async function getRecentTransactions({ userId, limit = 6 }) {
  const query = `
    SELECT 
      t.*,
      DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date_str,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.transaction_date DESC, t.created_at DESC
    LIMIT ?
  `;
  // Make sure limit is integer for safety when interpolating/parameterizing
  const safeLimit = Number.isInteger(Number(limit)) ? Number(limit) : 6;
  const [rows] = await pool.query(query, [userId, safeLimit]);
  return rows;
}

module.exports = {
  getMonthlySummary,
  getCategoryBreakdown,
  getDailyTrend,
  getSixMonthTrend,
  getRecentTransactions
};
