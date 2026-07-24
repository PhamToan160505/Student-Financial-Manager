const { pool } = require('./config/db.js');
async function run() {
  try {
    console.log('Adding OTP columns to users table...');
    // We can try to add them without IF NOT EXISTS. If it fails due to Duplicate column, we ignore it.
    const columns = [
      "email_verified BOOLEAN DEFAULT FALSE",
      "otp_code_hash VARCHAR(255) NULL",
      "otp_expires_at DATETIME NULL",
      "otp_purpose ENUM('register','reset_password') NULL",
      "otp_attempts INT DEFAULT 0"
    ];
    for (const col of columns) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col}`);
        console.log(`Added column: ${col}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists, skipping: ${col}`);
        } else {
          throw err;
        }
      }
    }
    
    // Set existing users to verified so they don't get locked out
    await pool.query(`UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE`);
    console.log('Table updated!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
run();
