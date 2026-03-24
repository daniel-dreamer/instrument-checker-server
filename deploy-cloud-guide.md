# 仪器主板检查工具 - 云端部署指南

## 方案1：使用 Railway（推荐，最简单）

Railway 提供免费额度，支持一键部署 Node.js 应用。

### 步骤1：准备代码

1. **创建 Git 仓库**（如果还没有）
   ```bash
   cd "c:\Users\liujia\Documents\trae_projects\SN_MB check\server"
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **创建 GitHub 仓库**
   - 访问 https://github.com/
   - 创建新仓库（如：instrument-checker-server）
   - 上传代码

### 步骤2：部署到 Railway

1. **注册 Railway**
   - 访问 https://railway.app/
   - 用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **自动部署**
   - Railway 会自动识别 Node.js 项目
   - 自动安装依赖并部署
   - 会分配一个外网域名，如：`https://instrument-checker-server.up.railway.app`

4. **访问地址**
   - 管理界面：`https://instrument-checker-server.up.railway.app/admin-server.html`
   - 查询界面：`https://instrument-checker-server.up.railway.app/query-server.html`

---

## 方案2：使用 Render（免费稳定）

Render 提供免费的 Web 服务，适合长期运行。

### 步骤1：准备代码

同上，确保代码已推送到 GitHub。

### 步骤2：部署到 Render

1. **注册 Render**
   - 访问 https://render.com/
   - 用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New" → "Web Service"
   - 连接 GitHub 仓库
   - 填写配置：
     ```
     Name: instrument-checker-server
     Runtime: Node
     Build Command: npm install
     Start Command: npm start
     ```

3. **部署**
   - 点击 "Create Web Service"
   - 等待部署完成（约2-3分钟）
   - 会获得域名，如：`https://instrument-checker-server.onrender.com`

---

## 方案3：使用 Vercel（国内访问快）

Vercel 国内访问速度较好，但需要注意：
- 免费版有使用时长限制
- 适合演示和轻量使用

### 部署步骤

1. **注册 Vercel**
   - 访问 https://vercel.com/
   - 用 GitHub 登录

2. **导入项目**
   - 点击 "Add New Project"
   - 导入 GitHub 仓库
   - 框架选择 "Other"
   - 构建命令：`npm install`
   - 启动命令：`npm start`

3. **部署**
   - 点击 Deploy
   - 等待完成

---

## 方案4：使用云服务器（最稳定）

如果有阿里云、腾讯云等云服务器：

### 步骤1：购买云服务器
- 推荐：阿里云 ECS、腾讯云 CVM
- 配置：1核2G 即可
- 系统：Ubuntu 20.04/22.04 或 Windows Server

### 步骤2：部署代码

**Linux 系统：**
```bash
# 连接服务器
ssh root@你的服务器IP

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 克隆代码
git clone https://github.com/你的用户名/instrument-checker-server.git
cd instrument-checker-server

# 安装依赖
npm install

# 启动服务（使用 PM2 保持后台运行）
sudo npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

**配置域名（可选）：**
- 购买域名并解析到服务器 IP
- 配置 Nginx 反向代理
- 申请 SSL 证书（HTTPS）

---

## 🔒 安全建议

### 1. 添加访问密码
修改 `server.js`，添加基础认证：

```javascript
const auth = require('basic-auth');

// 添加在 app.use(cors()) 之后
app.use((req, res, next) => {
    const user = auth(req);
    if (!user || user.name !== 'admin' || user.pass !== '你的密码') {
        res.set('WWW-Authenticate', 'Basic realm="Instrument Checker"');
        return res.status(401).send('需要认证');
    }
    next();
});
```

### 2. 限制上传文件大小
```javascript
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 限制10MB
});
```

### 3. 定期备份数据
```bash
# 添加备份脚本
crontab -e
# 添加：每天凌晨3点备份
0 3 * * * cp /path/to/data/instrument-data.json /path/to/backup/instrument-data-$(date +\%Y\%m\%d).json
```

---

## 📊 方案对比

| 方案 | 费用 | 稳定性 | 国内访问 | 难度 |
|------|------|--------|----------|------|
| Railway | 免费额度 | ⭐⭐⭐ | ⭐⭐ | 简单 |
| Render | 免费 | ⭐⭐⭐⭐ | ⭐⭐ | 简单 |
| Vercel | 免费 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 简单 |
| 云服务器 | 付费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 复杂 |

---

## 🚀 推荐方案

**初学者/测试使用：** Railway 或 Render
**生产环境/长期使用：** 云服务器

---

## 💡 注意事项

1. **免费额度限制**
   - Railway：每月 $5 免费额度
   - Render：每月 750 小时免费
   - Vercel： hobby 版免费但有功能限制

2. **数据持久化**
   - 部分平台重启后会丢失数据
   - 建议添加数据库（如 MongoDB Atlas）
   - 或定期备份数据文件

3. **访问速度**
   - 国外平台国内访问可能较慢
   - 可以考虑 CDN 加速
   - 或使用国内云平台

---

## 📞 需要帮助？

如果在部署过程中遇到问题：
1. 查看平台官方文档
2. 检查服务器日志
3. 确认环境变量配置正确

祝你部署成功！🎉
