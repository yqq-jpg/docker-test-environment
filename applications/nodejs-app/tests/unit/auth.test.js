// tests/unit/auth.test.js - 认证功能单元测试
const auth = require('../../backend/auth');
const jwt = require('jsonwebtoken');

describe('认证模块单元测试', () => {
    const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'student'
    };

    describe('密码哈希功能', () => {
        test('应该成功哈希密码', async () => {
            const password = 'testpassword123';
            const hashedPassword = await auth.hashPassword(password);
            
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(0);
        });

        test('应该能验证正确密码', async () => {
            const password = 'testpassword123';
            const hashedPassword = await auth.hashPassword(password);
            const isValid = await auth.comparePassword(password, hashedPassword);
            
            expect(isValid).toBe(true);
        });

        test('应该拒绝错误密码', async () => {
            const password = 'testpassword123';
            const wrongPassword = 'wrongpassword';
            const hashedPassword = await auth.hashPassword(password);
            const isValid = await auth.comparePassword(wrongPassword, hashedPassword);
            
            expect(isValid).toBe(false);
        });
    });

    describe('JWT令牌功能', () => {
        test('应该成功生成JWT令牌', () => {
            const token = auth.generateToken(mockUser);
            
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        test('生成的令牌应该包含正确的用户信息', () => {
            const token = auth.generateToken(mockUser);
            const decoded = jwt.decode(token);
            
            expect(decoded.id).toBe(mockUser.id);
            expect(decoded.username).toBe(mockUser.username);
            expect(decoded.role).toBe(mockUser.role);
            expect(decoded.exp).toBeDefined();
        });

        test('应该能验证有效的令牌', (done) => {
            const token = auth.generateToken(mockUser);
            const mockReq = {
                headers: { authorization: `Bearer ${token}` }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            const mockNext = jest.fn();

            auth.verifyToken(mockReq, mockRes, mockNext);

            setTimeout(() => {
                expect(mockNext).toHaveBeenCalled();
                expect(mockReq.userId).toBe(mockUser.id);
                expect(mockReq.userRole).toBe(mockUser.role);
                done();
            }, 100);
        });

        test('应该拒绝无效的令牌', () => {
            const mockReq = {
                headers: { authorization: 'Bearer invalid_token' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            const mockNext = jest.fn();

            auth.verifyToken(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('角色验证功能', () => {
        test('教师角色应该通过教师验证', () => {
            const mockReq = { userRole: 'teacher' };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            const mockNext = jest.fn();

            auth.isTeacher(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('学生角色应该被教师验证拒绝', () => {
            const mockReq = { userRole: 'student' };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            const mockNext = jest.fn();

            auth.isTeacher(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });
    });
});