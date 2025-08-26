-- 基于你的SQL结构创建数据库和测试数据

CREATE DATABASE IF NOT EXISTS web3;
USE web3;

-- 用户表（学生和老师）
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher') NOT NULL,
  email VARCHAR(100)
);

-- 课程表
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  teacher_id INT NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- 学生选课表
CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  status ENUM('pending', 'passed', 'failed') DEFAULT 'pending',
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  UNIQUE KEY unique_enrollment (student_id, course_id)
);

-- 插入测试数据

-- 插入老师用户
INSERT INTO users (username, password, role, email) VALUES 
('teacher_zhang', '$2b$10$example_hashed_password1', 'teacher', 'zhang@school.edu'),
('teacher_li', '$2b$10$example_hashed_password2', 'teacher', 'li@school.edu'),
('teacher_wang', '$2b$10$example_hashed_password3', 'teacher', 'wang@school.edu');

-- 插入学生用户
INSERT INTO users (username, password, role, email) VALUES 
('student_001', '$2b$10$example_hashed_password4', 'student', 'student001@school.edu'),
('student_002', '$2b$10$example_hashed_password5', 'student', 'student002@school.edu'),
('student_003', '$2b$10$example_hashed_password6', 'student', 'student003@school.edu'),
('student_004', '$2b$10$example_hashed_password7', 'student', 'student004@school.edu'),
('student_005', '$2b$10$example_hashed_password8', 'student', 'student005@school.edu');

-- 插入课程数据
INSERT INTO courses (name, description, teacher_id) VALUES 
('JavaScript基础', '学习JavaScript编程基础知识，包括变量、函数、对象等', 1),
('React开发', '学习使用React框架开发现代Web应用程序', 1),
('Node.js后端开发', '学习使用Node.js和Express构建后端API服务', 2),
('数据库设计', '学习MySQL数据库设计和SQL语言基础', 2),
('Web前端设计', '学习HTML、CSS和响应式设计原理', 3),
('项目管理', '学习软件项目管理方法和敏捷开发流程', 3);

-- 插入选课记录
INSERT INTO enrollments (student_id, course_id, status) VALUES 
-- student_001的选课记录
(4, 1, 'passed'),
(4, 2, 'pending'),
(4, 3, 'pending'),

-- student_002的选课记录
(5, 1, 'passed'),
(5, 4, 'passed'),
(5, 5, 'pending'),

-- student_003的选课记录
(6, 2, 'pending'),
(6, 3, 'pending'),

-- student_004的选课记录
(7, 1, 'failed'),
(7, 5, 'pending'),
(7, 6, 'pending'),

-- student_005的选课记录
(8, 4, 'passed'),
(8, 6, 'pending');