const mysql = require('mysql2/promise');

// Only load environment variables from .env file if not in test environment
if (process.env.NODE_ENV !== 'test') {
    require('dotenv').config();
}

// Set up a MySQL connection pool using environment variables for configuration
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'career_connect',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;