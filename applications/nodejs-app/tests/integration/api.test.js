// tests/integration/api.test.js - API集成测试
const request = require('supertest');
const app = require('../../backend/app');

describe('API集成测试', () => {
    let studentToken, teacherToken;
    let studentUser, teacherUser;
    let createdCourseId;

    beforeAll(async () => {
        // 创建测试学生用户
        studentUser = await createTestUser('student', '_api');
        const studentResponse = await request(app)
            .post('/api/register')
            .send(studentUser)
            .expect(201);

        const studentLogin = await request(app)
            .post('/api/login')
            .send({
                username: studentUser.username,
                password: studentUser.password
            })
            .expect(200);

        studentToken = studentLogin.body.accessToken;

        // 创建测试教师用户
        teacherUser = await createTestUser('teacher', '_api');
        const teacherResponse = await request(app)
            .post('/api/register')
            .send(teacherUser)
            .expect(201);

        const teacherLogin = await request(app)
            .post('/api/login')
            .send({
                username: teacherUser.username,
                password: teacherUser.password
            })
            .expect(200);

        teacherToken = teacherLogin.body.accessToken;
    });

    describe('用户认证API', () => {
        test('POST /api/register - 应该成功注册新用户', async () => {
            const newUser = await createTestUser('student', '_register');

            const response = await request(app)
                .post('/api/register')
                .send(newUser)
                .expect(201);

            expect(response.body.message).toBe('User registered successfully!');
        });

        test('POST /api/register - 应该拒绝重复用户名', async () => {
            const response = await request(app)
                .post('/api/register')
                .send(studentUser)
                .expect(400);

            expect(response.body.message).toBe('Username already exists!');
        });

        test('POST /api/login - 应该成功登录有效用户', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    username: studentUser.username,
                    password: studentUser.password
                })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body.username).toBe(studentUser.username);
            expect(response.body.role).toBe(studentUser.role);
        });

        test('POST /api/login - 应该拒绝错误密码', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    username: studentUser.username,
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.message).toBe('Invalid password!');
        });

        test('POST /api/login - 应该拒绝不存在的用户', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    username: 'nonexistentuser',
                    password: 'password123'
                })
                .expect(404);

            expect(response.body.message).toBe('User not found!');
        });
    });

    describe('用户信息API', () => {
        test('GET /api/user - 应该返回当前用户信息', async () => {
            const response = await request(app)
                .get('/api/user')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.username).toBe(studentUser.username);
            expect(response.body.role).toBe(studentUser.role);
            expect(response.body).not.toHaveProperty('password');
        });

        test('GET /api/user - 应该拒绝未认证请求', async () => {
            const response = await request(app)
                .get('/api/user')
                .expect(403);

            expect(response.body.message).toBe('No token provided!');
        });
    });

    describe('课程管理API', () => {
        test('POST /api/courses - 教师应该能创建课程', async () => {
            const courseData = {
                name: 'API测试课程',
                description: '这是一个API测试创建的课程'
            };

            const response = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send(courseData)
                .expect(201);

            expect(response.body.message).toBe('Course created successfully!');
            expect(response.body.courseId).toBeDefined();
            createdCourseId = response.body.courseId;
        });

        test('POST /api/courses - 学生不应该能创建课程', async () => {
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

        test('GET /api/courses - 应该返回课程列表', async () => {
            const response = await request(app)
                .get('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('GET /api/courses/:id - 应该返回单个课程信息', async () => {
            if (!createdCourseId) {
                throw new Error('需要先创建课程才能测试这个端点');
            }

            const response = await request(app)
                .get(`/api/courses/${createdCourseId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.id).toBe(createdCourseId);
            expect(response.body.name).toBe('API测试课程');
        });
    });

    describe('选课功能API', () => {
        test('POST /api/enroll - 学生应该能选课', async () => {
            if (!createdCourseId) {
                throw new Error('需要先创建课程才能测试选课功能');
            }

            const response = await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: createdCourseId })
                .expect(201);

            expect(response.body.message).toBe('Enrolled successfully!');
        });

        test('POST /api/enroll - 不应该允许重复选课', async () => {
            if (!createdCourseId) {
                throw new Error('需要先创建课程才能测试选课功能');
            }

            const response = await request(app)
                .post('/api/enroll')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: createdCourseId })
                .expect(400);

            expect(response.body.message).toBe('Already enrolled in this course!');
        });

        test('GET /api/enrollments - 学生应该能查看自己的选课', async () => {
            const response = await request(app)
                .get('/api/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });

        test('GET /api/enrollments - 教师应该能查看课程选课情况', async () => {
            if (!createdCourseId) {
                throw new Error('需要先创建课程才能测试这个功能');
            }

            const response = await request(app)
                .get(`/api/enrollments?courseId=${createdCourseId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('错误处理', () => {
        test('应该正确处理不存在的路由', async () => {
            const response = await request(app)
                .get('/api/nonexistent-endpoint')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBeGreaterThanOrEqual(404);
        });

        test('应该正确处理无效的JSON数据', async () => {
            const response = await request(app)
                .post('/api/register')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
        });
    });
});