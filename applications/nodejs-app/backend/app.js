const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const path = require('path');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, '../frontend')));

// API路由
app.use('/api', routes);

// 前端路由 - 修复方案
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 捕获其他所有路由，发送到前端
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

module.exports = app;