const mysql = require('mysql2/promise');
const env = require('./env');

/**
 * Create MySQL connection pool.
 * Using parameterized queries via pool.query('SELECT * FROM table WHERE id = ?', [id])
 * completely prevents SQL Injection.
 */
const pool = mysql.createPool({
  host: env.DB.HOST,
  port: env.DB.PORT,
  user: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,
  waitForConnections: true,
  connectionLimit: env.DB.CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

/**
 * Test database connection on server startup.
 */
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL pool (Database: ${env.DB.NAME})`);
    connection.release();
  } catch (error) {
    // If error is Unknown Database (ER_BAD_DB_ERROR), automatically create it
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`[Database] Database '${env.DB.NAME}' not found. Attempting to create automatically...`);
      try {
        const tempConn = await mysql.createConnection({
          host: env.DB.HOST,
          port: env.DB.PORT,
          user: env.DB.USER,
          password: env.DB.PASSWORD
        });
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB.NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`[Database] Successfully created database '${env.DB.NAME}'!`);
        await tempConn.end();

        // Recheck connection with pool
        const connection = await pool.getConnection();
        console.log(`[Database] Successfully connected to MySQL pool (Database: ${env.DB.NAME})`);
        connection.release();
        return;
      } catch (createErr) {
        console.error(`[Database] Failed to auto-create database '${env.DB.NAME}':`, createErr.message);
      }
    }

    console.error(`[Database] Warning: Failed to connect to MySQL database '${env.DB.NAME}'.`);
    console.error(`[Database] Error message: ${error.message}`);
    console.error(`[Database] Please verify MySQL is running and DB credentials in .env are correct.`);
  }
}

module.exports = {
  pool,
  testDbConnection
};
