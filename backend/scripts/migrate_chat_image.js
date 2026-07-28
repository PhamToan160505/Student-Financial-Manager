const { pool } = require('../config/db');

async function migrate() {
  try {
    const query = `ALTER TABLE chat_messages ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;`;
    await pool.query(query);
    console.log('Successfully added image_url to chat_messages');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column image_url already exists, skipping...');
    } else {
      console.error('Migration failed:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
