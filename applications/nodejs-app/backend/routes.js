const express = require('express');
const controllers = require('./controllers');
const auth = require('./auth');

const router = express.Router();

router.post('/register', controllers.register);
router.post('/login', controllers.login);

router.get('/user', auth.verifyToken, controllers.getUserInfo);

router.post('/courses', auth.verifyToken, auth.isTeacher, controllers.createCourse);
router.get('/courses', auth.verifyToken, controllers.getCourses);
router.get('/courses/:id', auth.verifyToken, controllers.getCourse);

router.post('/enroll', auth.verifyToken, controllers.enrollCourse);
router.get('/enrollments', auth.verifyToken, controllers.getEnrollments);
router.put('/grade/:id', auth.verifyToken, auth.isTeacher, controllers.updateEnrollmentStatus);

module.exports = router;