const db = require('./db');
const auth = require('./auth');

// 用户注册
async function register(req, res) {
    try {
        const { username, password, role, email } = req.body;
        const users = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length > 0) {
            return res.status(400).send({ message: 'Username already exists!' });
        }

        const hashedPassword = await auth.hashPassword(password);

        const result = await db.query(
            'INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, role, email]
        );

        res.status(201).send({ message: 'User registered successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

// 用户登录
async function login(req, res) {
    try {
        const { username, password } = req.body;
        const users = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(404).send({ message: 'User not found!' });
        }

        const user = users[0];
        const passwordIsValid = await auth.comparePassword(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).send({ message: 'Invalid password!' });
        }

        // 生成令牌
        const token = auth.generateToken(user);

        res.status(200).send({
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

// 获取当前用户信息
async function getUserInfo(req, res) {
    try {
        const userId = req.userId;

        const users = await db.query('SELECT id, username, role, email FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).send({ message: 'User not found!' });
        }

        res.status(200).send(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

// 创建课程（仅限教师）
async function createCourse(req, res) {
    try {
        const { name, description } = req.body;
        const teacherId = req.userId;

        const result = await db.query(
            'INSERT INTO courses (name, description, teacher_id) VALUES (?, ?, ?)',
            [name, description, teacherId]
        );

        res.status(201).send({
            message: 'Course created successfully!',
            courseId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

// 获取课程列表
async function getCourses(req, res) {
    try {
        let courses;
        if (req.userRole === 'teacher') {
            // 教师只能看到自己创建的课程
            courses = await db.query(
                `SELECT c.*, u.username as teacher_name 
         FROM courses c 
         JOIN users u ON c.teacher_id = u.id 
         WHERE c.teacher_id = ?`,
                [req.userId]
            );
        } else {
            // 学生可以看到所有课程
            courses = await db.query(
                `SELECT c.*, u.username as teacher_name 
         FROM courses c 
         JOIN users u ON c.teacher_id = u.id`
            );
        }

        res.status(200).send(courses);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

// 获取单个课程
async function getCourse(req, res) {
    try {
        const courseId = req.params.id;

        const courses = await db.query(
            `SELECT c.*, u.username as teacher_name 
       FROM courses c 
       JOIN users u ON c.teacher_id = u.id 
       WHERE c.id = ?`,
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).send({ message: 'Course not found!' });
        }

        res.status(200).send(courses[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

// 学生选课
async function enrollCourse(req, res) {
    try {
        const studentId = req.userId;
        const { courseId } = req.body;
        const courses = await db.query('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (courses.length === 0) {
            return res.status(404).send({ message: 'Course not found!' });
        }
        const enrollments = await db.query(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
            [studentId, courseId]
        );

        if (enrollments.length > 0) {
            return res.status(400).send({ message: 'Already enrolled in this course!' });
        }

        await db.query(
            'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, "pending")',
            [studentId, courseId]
        );

        res.status(201).send({ message: 'Enrolled successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

async function getEnrollments(req, res) {
    try {
        let enrollments;
        if (req.userRole === 'student') {
            enrollments = await db.query(
                `SELECT e.*, c.name as course_name, c.description, u.username as teacher_name
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         JOIN users u ON c.teacher_id = u.id
         WHERE e.student_id = ?`,
                [req.userId]
            );
        } else if (req.userRole === 'teacher') {
            const courseId = req.query.courseId;
            if (!courseId) {
                return res.status(400).send({ message: 'Course ID is required!' });
            }

            const courses = await db.query(
                'SELECT * FROM courses WHERE id = ? AND teacher_id = ?',
                [courseId, req.userId]
            );

            if (courses.length === 0) {
                return res.status(403).send({ message: 'Not authorized to access this course!' });
            }

            enrollments = await db.query(
                `SELECT e.*, u.username as student_name
         FROM enrollments e
         JOIN users u ON e.student_id = u.id
         WHERE e.course_id = ?`,
                [courseId]
            );
        }

        res.status(200).send(enrollments);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

async function updateEnrollmentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const teacherId = req.userId;

        const enrollments = await db.query(
            `SELECT e.*, c.teacher_id
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.id = ?`,
            [id]
        );

        if (enrollments.length === 0) {
            return res.status(404).send({ message: 'Enrollment not found!' });
        }

        const enrollment = enrollments[0];

        if (enrollment.teacher_id !== teacherId) {
            return res.status(403).send({ message: 'Not authorized to update this enrollment!' });
        }

        await db.query(
            'UPDATE enrollments SET status = ? WHERE id = ?',
            [status, id]
        );

        res.status(200).send({ message: 'Enrollment status updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

module.exports = {
    register,
    login,
    getUserInfo,
    createCourse,
    getCourses,
    getCourse,
    enrollCourse,
    getEnrollments,
    updateEnrollmentStatus
};