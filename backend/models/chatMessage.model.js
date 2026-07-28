const { pool } = require('../config/db');

/**
 * Chat Message Model - Manages persistent chat history (`chat_messages`)
 * with strict user IDOR filtering.
 */
const chatMessageModel = {
  /**
   * Initialize table for storing chat advisor history
   */
  initTable: async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_created (user_id, created_at DESC),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    const [result] = await pool.query(query);
    
    // Auto-migrate for existing databases (like on Render)
    try {
      await pool.query("ALTER TABLE chat_messages ADD COLUMN image_url TEXT DEFAULT NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        try {
          await pool.query("ALTER TABLE chat_messages MODIFY COLUMN image_url TEXT DEFAULT NULL");
        } catch(e) {}
      }
    }
    
    console.log('[Model: ChatMessage] Table "chat_messages" verified/created successfully.');
    return result;
  },

  /**
   * Get recent conversation history for a user (IDOR protected)
   * Returns in ascending chronological order
   */
  getRecentHistory: async (userId, limit = 30) => {
    const query = `
      SELECT id, user_id, role, content, image_url, created_at
      FROM chat_messages
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(query, [userId, Number(limit)]);
    // Reverse to return from oldest to newest in the requested window
    return rows.reverse().map(row => {
      let parsedImageUrl = row.image_url;
      try {
        if (parsedImageUrl && parsedImageUrl.startsWith('[')) {
          parsedImageUrl = JSON.parse(parsedImageUrl);
        } else if (parsedImageUrl) {
          parsedImageUrl = [parsedImageUrl]; // convert single URL to array
        }
      } catch (e) {
        // keep as is if it fails
      }
      return {
        id: row.id,
        role: row.role,
        content: row.content,
        imageUrls: parsedImageUrl || [],
        createdAt: row.created_at
      };
    });
  },

  /**
   * Add a message to chat history (IDOR protected by associating userId)
   */
  addMessage: async ({ userId, role, content, imageUrls = [] }) => {
    const serializedImages = imageUrls && imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;
    const query = `
      INSERT INTO chat_messages (user_id, role, content, image_url)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [userId, role, content, serializedImages]);
    return result.insertId;
  },

  /**
   * Clear all chat history for a specific user (IDOR protected)
   */
  clearHistory: async (userId) => {
    const query = `
      DELETE FROM chat_messages
      WHERE user_id = ?
    `;
    const [result] = await pool.query(query, [userId]);
    return result.affectedRows;
  }
};

module.exports = chatMessageModel;
