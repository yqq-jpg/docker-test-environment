# 🐳 Docker Test Environment

> 一个基于 **Docker + Node.js** 搭建的简单 Web 前端小项目和测试环境蓝图。  
> 适合用于学习 Docker、环境搭建、测试环境管理以及求职作品展示。

---

## 📌 项目介绍

本项目通过 **Docker Compose** 一键启动完整的测试环境，包括：

- 🌐 **Nginx Web 服务器**  
- 🗄️ **MySQL 数据库**  
- 🐘 **PostgreSQL 数据库**  
- 🍃 **MongoDB 数据库**  
- 🚀 **Redis 缓存**  
- 💻 一个简单的 **Node.js 前端小项目**（存放在 `applications` 文件夹中）

特点：

- 环境可复现：`docker-compose up -d` 即可拉起完整环境  
- 多服务支持：一次性运行多种数据库 + 缓存 + Web 服务器  
- 数据持久化：使用 Docker 卷保存数据库数据  
- 可扩展：可以在 `applications` 中添加更多测试应用  

---

## ⚙️ 使用方法

### 1. 克隆项目
```bash
git clone https://github.com/your-username/docker-test-environment.git
cd docker-test-environment
docker-compose up -d
MySQL → localhost:3306 / testuser:test123

PostgreSQL → localhost:5432 / testuser:test123

MongoDB → localhost:27017 / admin:admin123

Redis → localhost:6379 / 密码: redis123

applications → localhost:3000 / 一个启动页面


docker-test-environment/
├── applications/        # 前端小项目（Node.js）
├── init-scripts/        # 数据库初始化脚本
├── nginx/               # Nginx 配置
├── web-content/         # 静态网页
├── docker-compose.yml   # Docker Compose 配置
├── .gitignore
└── README.md
```
<img width="1889" height="476" alt="image" src="https://github.com/user-attachments/assets/07952eef-36de-46a0-958e-4a2b96192dea" />


applications 文件夹内包含一个自制的简单的基于 Node.js 的项目，可以扩展 API 或前端组件。
