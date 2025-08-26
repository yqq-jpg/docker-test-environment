const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('./config');

// 生成JWT令牌
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiration }
  );
}

// 验证JWT令牌
function verifyToken(req, res, next) {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    return res.status(403).send({
      message: 'No token provided!'
    });
  }

  const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(tokenValue, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized!'
      });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
}

// 验证是否为教师
function isTeacher(req, res, next) {
  if (req.userRole !== 'teacher') {
    return res.status(403).send({
      message: 'Require Teacher Role!'
    });
  }
  next();
}

// 哈希密码
async function hashPassword(password) {
  return await bcrypt.hash(password, 8);
}

// 比较密码
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
  generateToken,
  verifyToken,
  isTeacher,
  hashPassword,
  comparePassword
};