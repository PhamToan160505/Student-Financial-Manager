const { pool } = require('../config/db');

/**
 * Insight Cache Model - Manages persistent MySQL cache (`ai_insights_cache`)
 * to optimize Groq AI quota (`openai/gpt-oss-120b`) and prevent unnecessary calls.
 */
const insightCacheModel = {
  /**
   * Initialize table with spent_snapshot and stale trigger flags
   */
  initTable: async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS ai_insights_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        month VARCHAR(7) NOT NULL,
        cached_json JSON NOT NULL,
        spent_snapshot DECIMAL(15,2) NOT NULL DEFAULT 0,
        is_stale BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_month (user_id, month),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    const [result] = await pool.query(query);
    console.log('[Model: InsightCache] Table "ai_insights_cache" verified/created successfully.');
    return result;
  },

  /**
   * Get cached insights for a user and month
   */
  getCache: async ({ userId, month }) => {
    const query = `
      SELECT id, user_id, month, cached_json, spent_snapshot, is_stale, created_at, updated_at
      FROM ai_insights_cache
      WHERE user_id = ? AND month = ?
    `;
    const [rows] = await pool.query(query, [userId, month]);
    if (rows.length === 0) return null;
    const row = rows[0];
    let parsedJson = row.cached_json;
    if (typeof parsedJson === 'string') {
      try { parsedJson = JSON.parse(parsedJson); } catch (e) { parsedJson = {}; }
    }
    return {
      id: row.id,
      userId: row.user_id,
      month: row.month,
      cachedJson: parsedJson,
      spentSnapshot: Number(row.spent_snapshot || 0),
      isStale: Boolean(row.is_stale),
      updatedAt: row.updated_at
    };
  },

  /**
   * Save or update AI insight cache
   */
  setCache: async ({ userId, month, cachedJson, spentSnapshot }) => {
    const jsonStr = typeof cachedJson === 'string' ? cachedJson : JSON.stringify(cachedJson);
    const query = `
      INSERT INTO ai_insights_cache (user_id, month, cached_json, spent_snapshot, is_stale)
      VALUES (?, ?, ?, ?, FALSE)
      ON DUPLICATE KEY UPDATE
        cached_json = VALUES(cached_json),
        spent_snapshot = VALUES(spent_snapshot),
        is_stale = FALSE,
        updated_at = CURRENT_TIMESTAMP
    `;
    const [result] = await pool.query(query, [userId, month, jsonStr, spentSnapshot || 0]);
    return result;
  },

  /**
   * Mark cache as stale for a user and month (e.g. when budget changes)
   */
  markStale: async ({ userId, month }) => {
    const query = `
      UPDATE ai_insights_cache
      SET is_stale = TRUE
      WHERE user_id = ? AND month = ?
    `;
    const [result] = await pool.query(query, [userId, month]);
    return result;
  },

  /**
   * Check if spending changed by >= 10% since cache creation, mark stale if so
   */
  checkAndMarkStaleIfChanged: async ({ userId, month, currentSpent }) => {
    const cached = await insightCacheModel.getCache({ userId, month });
    if (!cached) return false;
    if (cached.isStale) return true;

    const snap = cached.spentSnapshot;
    const curr = Number(currentSpent || 0);

    // If snapshot was 0 and now we spent > 0, or percentage change >= 10%
    let changedSignificantly = false;
    if (snap === 0 && curr > 0) {
      changedSignificantly = true;
    } else if (snap > 0) {
      const pctDiff = Math.abs(curr - snap) / snap;
      if (pctDiff >= 0.10) {
        changedSignificantly = true;
      }
    }

    if (changedSignificantly) {
      console.log(`[Model: InsightCache] Spending changed significantly (snapshot: ${snap}, current: ${curr}). Marking cache stale for user ${userId}, month ${month}.`);
      await insightCacheModel.markStale({ userId, month });
      return true;
    }
    return false;
  }
};

module.exports = insightCacheModel;
