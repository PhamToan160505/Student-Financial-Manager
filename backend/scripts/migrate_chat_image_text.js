const { pool } = require('../config/db');

async function migrate() {
  try {
    const query = `ALTER TABLE chat_messages MODIFY COLUMN image_url TEXT DEFAULT NULL;`;
    await pool.query(query);
    console.log('Successfully modified image_url to TEXT in chat_messages');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
