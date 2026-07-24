const { pool } = require('./config/db.js');
async function run() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens (id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL, token_hash VARCHAR(255) NOT NULL, expires_at DATETIME NOT NULL, revoked BOOLEAN DEFAULT FALSE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
    console.log('Table created!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
