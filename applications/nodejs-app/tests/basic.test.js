// tests/basic.test.js - 基础功能测试（不含E2E）
const request = require('supertest');
const app = require('../backend/app');

describe('学生教师门户基础测试', () => {
    let studentUser, teacherUser;
    let studentToken, teacherToken;
    let createdCourseId;

    beforeAll(async () => {
        // 创建测试用户
        const timestamp = Date.now();
        
        studentUser = {
            username: `basic_student_${timestamp}`,
            password: 'test123456',
            email: `basic_student_${timestamp}@test.com`,
            role: 'student'
        };

        teacherUser = {
            username: `basic_teacher_${timestamp}`,
            password: 'test123456',
            email: `basic_teacher_${timestamp}@test.com`,
            role: 'teacher'
        };
    });

    describe('应用程序启动测试', () => {
        test('应用应该能够启动并响应请求', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
        });

        test('API健康检查', async () => {
            const response = await request(app)
                .get('/api/user')
                .expect(403); // 应该返回403因为没有token
        });
    });

    describe('用户注册登录流程', () => {
        test('学生注册 -> 登录 -> 获取信息流程', async () => {
            // 1. 注册学生
            await request(app)
                .post('/api/register')
                .send(studentUser)
                .expect(201);

            // 2. 登录学生
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    username: studentUser.username,
                    password: studentUser.password
                })
                .expect(200);

            expect(loginResponse.body).toHaveProperty('accessToken');
            studentToken = loginResponse.body.accessToken;

            // 3. 获取用户信息
            const userResponse = await request(app)
                .get('/api/user')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(userResponse.body.username).toBe(studentUser.username);
            expect(userResponse.body.role).toBe('student');
        });

        test('教师注册 -> 登录 -> 创建课程流程', async () => {
            // 1. 注册教师
            await request(app)
                .post('/api/register')
                .send(teacherUser)
                .expect(201);

            // 2. 登录教师
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    username: teacherUser.username,
                    password: teacherUser.password
                })
                .expect(200);

            teacherToken = loginResponse.body.accessToken;

            // 3. 创建课程
            const courseData = {
                name: '基础测试课程',
                description: '这是基础测试创建的课程'
            };

            const courseResponse = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(courseData)
                .expect(201);

            expect(courseResponse.body.message).toBe('Course created successfully!');
            createdCourseId = courseResponse.body.courseId;
        });

        test('应该拒绝重复用户名', async () => {
            const response = await request(app)
                .post('/api/register')
                .send(studentUser)
                .expect(400);

            expect(response.body.message).toBe('Username already exists!');
        });

        test('应该拒绝错误密码', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    username: studentUser.username,
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.message).toBe('Invalid password!');
        });
    });

    describe('课程管理测试', () => {
        test('学生应该能查看课程列表', async () => {
            const response = await request(app)
                .get('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('学生不应该能创建课程', async () => {
            const courseData = {
                name: '学生尝试创建的课程',
                description: '这应该被拒绝'
            };

            const response = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(courseData)
                .expect(403);

            expect(response.body.message).toBe('Require Teacher Role!');
        });
    });

    describe('选课功能测试', () => {
        test('学生应该能成功选课', async () => {
            expect(createdCourseId).toBeDefined();
            expect(studentToken).toBeDefined();

            const response = await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: createdCourseId })
                .expect(201);

            expect(response.body.message).toBe('Enrolled successfully!');
        });

        test('不应该允许重复选课', async () => {
            const response = await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: createdCourseId })
                .expect(400);

            expect(response.body.message).toBe('Already enrolled in this course!');
        });

        test('学生应该能查看选课记录', async () => {
            const response = await request(app)
                .get('/api/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('安全性测试', () => {
        test('应该拒绝没有token的受保护请求', async () => {
            await request(app)
                .get('/api/user')
                .expect(403);

            await request(app)
                .get('/api/courses')
                .expect(403);

            await request(app)
                .post('/api/enroll')
                .send({ courseId: 1 })
                .expect(403);
        });

        test('应该拒绝无效的token', async () => {
            await request(app)
                .get('/api/user')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
        });
    });

    // 清理测试数据
    afterAll(async () => {
        if (global.testConnection) {
            try {
                // 清理测试数据
                await global.testConnection.execute(
                    "DELETE FROM enrollments WHERE student_id IN (SELECT id FROM users WHERE username LIKE 'basic_%')"
                );
                await global.testConnection.execute(
                    "DELETE FROM courses WHERE teacher_id IN (SELECT id FROM users WHERE username LIKE 'basic_%')"
                );
                await global.testConnection.execute(
                    "DELETE FROM users WHERE username LIKE 'basic_%'"
                );
            } catch (error) {
                console.error('清理测试数据失败:', error);
            }
        }
    });
});