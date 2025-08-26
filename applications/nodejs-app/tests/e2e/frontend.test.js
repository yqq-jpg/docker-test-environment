// tests/e2e/frontend.test.js - 端到端测试
const puppeteer = require('puppeteer');

describe('前端端到端测试', () => {
    let browser;
    let page;
    const APP_URL = 'http://localhost:3000';

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true, // 在CI环境中使用headless模式
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        page = await browser.newPage();
        
        // 设置视口大小
        await page.setViewport({ width: 1280, height: 720 });
        
        // 增加超时时间
        page.setDefaultTimeout(10000);
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async () => {
        await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    });

    describe('页面加载和导航', () => {
        test('应该加载主页', async () => {
            await page.waitForSelector('header h1');
            const title = await page.$eval('header h1', el => el.textContent);
            expect(title).toBe('Student-Teacher Portal');
        });

        test('应该显示正确的导航链接', async () => {
            await page.waitForSelector('#auth-links');
            
            const loginLink = await page.$('#login-link');
            const registerLink = await page.$('#register-link');
            
            expect(loginLink).toBeTruthy();
            expect(registerLink).toBeTruthy();
        });
    });

    describe('用户注册流程', () => {
        test('应该成功注册新用户', async () => {
            // 点击注册链接
            await page.click('#register-link');
            await page.waitForSelector('#register-section', { visible: true });

            // 填写注册表单
            const timestamp = Date.now();
            await page.type('#register-username', `e2e_student_${timestamp}`);
            await page.type('#register-password', 'test123456');
            await page.type('#register-email', `e2e_test_${timestamp}@example.com`);
            await page.select('#register-role', 'student');

            // 提交表单
            await page.click('#register-form button[type="submit"]');
            
            // 等待响应并检查alert
            page.on('dialog', async dialog => {
                expect(dialog.message()).toContain('Registration successful');
                await dialog.accept();
            });

            // 应该跳转到登录页面
            await page.waitForSelector('#login-section', { visible: true, timeout: 5000 });
        });

        test('应该拒绝无效的注册数据', async () => {
            await page.click('#register-link');
            await page.waitForSelector('#register-section', { visible: true });

            // 只填写用户名，其他必填字段留空
            await page.type('#register-username', 'incomplete_user');

            // 尝试提交
            await page.click('#register-form button[type="submit"]');

            // 表单验证应该阻止提交
            const isStillOnRegisterPage = await page.$('#register-section.hidden') === null;
            expect(isStillOnRegisterPage).toBe(true);
        });
    });

    describe('用户登录流程', () => {
        let testUser;

        beforeAll(async () => {
            // 通过API创建测试用户
            testUser = {
                username: `e2e_login_${Date.now()}`,
                password: 'test123456',
                email: 'e2e_login@test.com',
                role: 'student'
            };

            // 使用fetch在浏览器环境中创建用户
            await page.evaluate(async (user) => {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
                return response.json();
            }, testUser);
        });

        test('应该成功登录已注册用户', async () => {
            // 点击登录链接
            await page.click('#login-link');
            await page.waitForSelector('#login-section', { visible: true });

            // 填写登录表单
            await page.type('#login-username', testUser.username);
            await page.type('#login-password', testUser.password);

            // 提交登录表单
            await page.click('#login-form button[type="submit"]');

            // 等待登录成功，应该显示用户仪表板
            await page.waitForSelector('#student-section', { visible: true, timeout: 5000 });
            
            // 检查用户名显示
            const displayedUsername = await page.$eval('#username-display', el => el.textContent);
            expect(displayedUsername).toBe(testUser.username);
        });

        test('应该拒绝错误的登录凭据', async () => {
            await page.click('#login-link');
            await page.waitForSelector('#login-section', { visible: true });

            await page.type('#login-username', testUser.username);
            await page.type('#login-password', 'wrongpassword');

            // 监听alert对话框
            let alertMessage = '';
            page.once('dialog', async dialog => {
                alertMessage = dialog.message();
                await dialog.accept();
            });

            await page.click('#login-form button[type="submit"]');
            
            // 等待alert出现
            await sleep(1000);
            expect(alertMessage).toContain('Login failed');
        });
    });

    describe('学生功能测试', () => {
        let studentUser, teacherUser, testCourseId;

        beforeAll(async () => {
            // 创建测试用户和课程
            const timestamp = Date.now();
            
            studentUser = {
                username: `e2e_student_func_${timestamp}`,
                password: 'test123456',
                email: `e2e_student_func_${timestamp}@test.com`,
                role: 'student'
            };

            teacherUser = {
                username: `e2e_teacher_func_${timestamp}`,
                password: 'test123456',
                email: `e2e_teacher_func_${timestamp}@test.com`,
                role: 'teacher'
            };

            // 通过API创建用户和课程
            await page.evaluate(async (users) => {
                // 注册学生
                await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(users.student)
                });

                // 注册教师
                await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(users.teacher)
                });

                // 教师登录
                const teacherLogin = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: users.teacher.username,
                        password: users.teacher.password
                    })
                });
                const teacherData = await teacherLogin.json();

                // 创建测试课程
                const courseResponse = await fetch('/api/courses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${teacherData.accessToken}`
                    },
                    body: JSON.stringify({
                        name: 'E2E测试课程',
                        description: '端到端测试创建的课程'
                    })
                });
                const courseData = await courseResponse.json();
                return courseData.courseId;
            }, { student: studentUser, teacher: teacherUser });
        });

        test('学生应该能查看可选课程列表', async () => {
            // 学生登录
            await page.click('#login-link');
            await page.waitForSelector('#login-section', { visible: true });
            await page.type('#login-username', studentUser.username);
            await page.type('#login-password', studentUser.password);
            await page.click('#login-form button[type="submit"]');

            // 等待学生页面加载
            await page.waitForSelector('#student-section', { visible: true });
            await page.waitForSelector('#available-courses .course-card', { timeout: 5000 });

            // 检查是否有课程显示
            const courseCards = await page.$$('#available-courses .course-card');
            expect(courseCards.length).toBeGreaterThan(0);

            // 检查课程卡片内容
            const courseTitle = await page.$eval('#available-courses .course-card h3', el => el.textContent);
            expect(courseTitle).toBeTruthy();
        });

        test('学生应该能成功选课', async () => {
            // 确保已登录
            await page.waitForSelector('#available-courses .enroll-btn');

            // 点击第一个选课按钮
            const enrollButton = await page.$('#available-courses .enroll-btn');
            
            // 监听alert
            let alertMessage = '';
            page.once('dialog', async dialog => {
                alertMessage = dialog.message();
                await dialog.accept();
            });

            await enrollButton.click();
            
            // 等待响应
            await sleep(2000);
            expect(alertMessage).toContain('Enrolled successfully');

            // 检查选课记录是否出现
            await page.waitForSelector('#student-enrollments tr', { timeout: 5000 });
            const enrollmentRows = await page.$$('#student-enrollments tr');
            expect(enrollmentRows.length).toBeGreaterThan(0);
        });
    });

    describe('响应式设计测试', () => {
        test('应该在移动设备上正确显示', async () => {
            // 设置移动设备视口
            await page.setViewport({ width: 375, height: 667 });
            await page.reload({ waitUntil: 'networkidle0' });

            // 检查页面是否正确渲染
            const header = await page.$('header');
            expect(header).toBeTruthy();

            const nav = await page.$('.nav');
            expect(nav).toBeTruthy();

            // 恢复桌面视口
            await page.setViewport({ width: 1280, height: 720 });
        });
    });
});