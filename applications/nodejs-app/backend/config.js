module.exports = {
    database: {
        host: process.env.DB_HOST || 'mysql',
        user: process.env.DB_USER || 'testuser', 
        password: process.env.DB_PASSWORD || 'test123',
        database: process.env.DB_NAME || 'web3',
        port: 3306
    },
    jwtSecret: 'web3-secret-key',
    jwtExpiration: '1h'
};