// backend/db.js 修改建议
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || (process.env.NODE_ENV === 'test' ? 'localhost' : 'mysql'),
    user: process.env.DB_USER || 'testuser',
    password: process.env.DB_PASSWORD || 'test123',
    database: process.env.DB_NAME || 'web3',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = {
    query: async (sql, params) => {
        try {
            const [rows] = await pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Database query error:', error.message);
            throw error;
        }
    }
};