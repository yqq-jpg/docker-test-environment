// tests/setup.js - 修复后的测试环境设置
const mysql = require('mysql2/promise');

// 测试超时时间
jest.setTimeout(30000);

// 全局测试数据库连接
global.testConnection = null;

// 在所有测试开始前执行
beforeAll(async () => {
    try {
        // 根据环境选择数据库连接配置
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost', // 修改为localhost
            user: process.env.DB_USER || 'testuser',
            password: process.env.DB_PASSWORD || 'test123',
            database: process.env.DB_NAME || 'web3',
            port: process.env.DB_PORT || 3306
        };

        console.log('尝试连接数据库:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port
        });

        // 连接到测试数据库
        global.testConnection = await mysql.createConnection(dbConfig);
        
        // 测试连接
        await global.testConnection.execute('SELECT 1');
        console.log('测试数据库连接成功');
        
        // 清理测试数据 - 删除测试用户
        await global.testConnection.execute(
            "DELETE FROM enrollments WHERE student_id IN (SELECT id FROM users WHERE username LIKE 'test_%' OR username LIKE 'basic_%')"
        );
        await global.testConnection.execute(
            "DELETE FROM courses WHERE teacher_id IN (SELECT id FROM users WHERE username LIKE 'test_%' OR username LIKE 'basic_%')"
        );
        await global.testConnection.execute(
            "DELETE FROM users WHERE username LIKE 'test_%' OR username LIKE 'basic_%'"
        );

        console.log('测试环境清理完成');
    } catch (error) {
        console.error('测试环境设置失败:', error.message);
        console.error('请检查：');
        console.error('1. MySQL数据库是否已启动');
        console.error('2. 数据库连接参数是否正确');
        console.error('3. 数据库和表是否已创建');
        
        // 如果数据库连接失败，跳过需要数据库的测试
        global.skipDatabaseTests = true;
    }
});

// 在所有测试结束后执行
afterAll(async () => {
    if (global.testConnection) {
        try {
            // 清理测试数据
            await global.testConnection.execute(
                "DELETE FROM enrollments WHERE student_id IN (SELECT id FROM users WHERE username LIKE 'test_%' OR username LIKE 'basic_%')"
            );
            await global.testConnection.execute(
                "DELETE FROM courses WHERE teacher_id IN (SELECT id FROM users WHERE username LIKE 'test_%' OR username LIKE 'basic_%')"
            );
            await global.testConnection.execute(
                "DELETE FROM users WHERE username LIKE 'test_%' OR username LIKE 'basic_%'"
            );
            
            await global.testConnection.end();
            console.log('测试数据库连接已关闭');
        } catch (error) {
            console.error('清理测试环境失败:', error);
        }
    }
});

// 全局测试工具函数
global.createTestUser = async (role = 'student', suffix = '') => {
    const timestamp = Date.now();
    const user = {
        username: `test_${role}_${timestamp}${suffix}`,
        password: 'test123456',
        email: `test_${role}_${timestamp}${suffix}@test.com`,
        role: role
    };
    return user;
};

// 等待函数
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 检查是否跳过数据库测试的辅助函数
global.shouldSkipDatabaseTest = () => {
    if (global.skipDatabaseTests) {
        console.warn('跳过数据库相关测试 - 数据库连接失败');
        return true;
    }
    return false;
};