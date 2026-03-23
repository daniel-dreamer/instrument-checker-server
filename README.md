# 仪器主板检查工具 - 服务器版

## 📋 概述

服务器版实现了数据共享功能，所有用户可以通过网络访问同一套数据。

## 🚀 快速启动

### 步骤1：安装Node.js

1. 访问 https://nodejs.org/
2. 下载并安装 LTS 版本（长期支持版）
3. 安装完成后，打开命令行验证：
   ```bash
   node --version
   npm --version
   ```

### 步骤2：安装依赖

在 `server` 文件夹中打开命令行，执行：

```bash
cd server
npm install
```

这会安装以下依赖：
- express - Web服务器框架
- cors - 跨域支持
- multer - 文件上传
- xlsx - Excel文件解析

### 步骤3：启动服务器

```bash
npm start
```

或者使用开发模式（自动重启）：

```bash
npm run dev
```

### 步骤4：访问系统

服务器启动后，会显示以下地址：

- **管理界面**：http://localhost:3000/server/admin-server.html
- **查询界面**：http://localhost:3000/server/query-server.html

## 📁 文件结构

```
server/
├── package.json          # 项目配置
├── server.js             # 服务器主程序
├── admin-server.html     # 管理界面（服务器版）
├── query-server.html     # 查询界面（服务器版）
├── data/                 # 数据存储目录
│   └── instrument-data.json
└── README.md            # 本文件
```

## 🔌 API接口

### 1. 获取数据状态
```
GET /api/status
```

### 2. 上传主数据文件
```
POST /api/upload/main
Content-Type: multipart/form-data
参数: file (Excel文件)
```

### 3. 上传匹配数据文件
```
POST /api/upload/mapping
Content-Type: multipart/form-data
参数: file (Excel文件)
```

### 4. 保存数据
```
POST /api/save
```

### 5. 查询仪器信息
```
GET /api/search?sn=序列号
```

### 6. 清除所有数据
```
POST /api/clear
```

## 💻 使用流程

### 管理员操作：

1. **启动服务器**
   ```bash
   npm start
   ```

2. **打开管理界面**
   - 浏览器访问：http://localhost:3000/server/admin-server.html

3. **上传数据文件**
   - 上传"生产和出货信息追溯"Excel文件
   - 上传"主板型号和软件匹配关系"Excel文件
   - 点击"保存数据到服务器"

4. **保持服务器运行**
   - 不要关闭命令行窗口
   - 服务器需要持续运行以提供服务

### 用户操作：

1. **打开查询界面**
   - 浏览器访问：http://服务器IP:3000/server/query-server.html
   - 例如：http://192.168.1.100:3000/server/query-server.html

2. **查询仪器信息**
   - 输入仪器序列号
   - 点击查询按钮
   - 查看主板信息

## 🌐 局域网访问

如果希望其他电脑访问，需要：

1. **查看服务器IP地址**
   - Windows：在命令行执行 `ipconfig`
   - 找到 IPv4 地址，如：`192.168.1.100`

2. **其他电脑访问**
   - 管理界面：http://192.168.1.100:3000/server/admin-server.html
   - 查询界面：http://192.168.1.100:3000/server/query-server.html

3. **防火墙设置**
   - 如果无法访问，可能是防火墙阻止了3000端口
   - 需要在服务器电脑防火墙中允许3000端口

## 🔒 安全建议

1. **仅在内网使用**
   - 当前版本适合企业内部网络使用
   - 不建议直接暴露到互联网

2. **数据备份**
   - 数据保存在 `server/data/` 目录
   - 定期备份 `instrument-data.json` 文件

3. **访问控制**
   - 如需更严格的访问控制，建议添加登录功能
   - 或部署在VPN环境中

## 🛠️ 故障排除

### 问题1：无法启动服务器
**解决：**
- 检查Node.js是否安装正确
- 检查端口3000是否被占用
- 尝试修改 `server.js` 中的端口号

### 问题2：其他电脑无法访问
**解决：**
- 检查服务器防火墙设置
- 确认服务器IP地址正确
- 确保所有电脑在同一网络

### 问题3：上传文件失败
**解决：**
- 检查文件格式（支持.xlsx, .xls, .csv）
- 检查文件是否损坏
- 查看服务器控制台错误信息

### 问题4：查询无结果
**解决：**
- 确认数据已正确上传到服务器
- 检查序列号是否正确
- 在管理界面查看数据状态

## 📞 技术支持

如有问题，请：
1. 查看服务器控制台错误信息
2. 检查浏览器开发者工具（F12）网络请求
3. 确认所有步骤正确执行

## 📝 更新日志

### v1.0.0
- 初始版本发布
- 支持Excel文件上传
- 支持数据共享
- 支持局域网访问
