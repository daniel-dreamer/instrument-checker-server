const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 内存存储（Vercel 无文件系统持久化）
let mainData = [];
let mappingData = [];
let dataLastUpdated = null;

// 账户信息存储（云端存储）
let accountCredentials = {
    username: 'admin',
    password: 'admin123'
};

// 文件上传配置 - 使用内存存储
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 压缩数据函数
function compressData(data) {
    const essentialFields = {
        serialNumber: ['主机序列号', 'SN', '序列号', 'Serial Number', '仪器序列号', '设备序列号', 'S/N', 's/n', 'column_5'],
        materialNumber: ['物料号', '主板物料号', '主板编号', '板号', 'Board Number', 'MB', 'Part Number', '主板IPN', 'IPN']
    };
    
    return data.map(record => {
        const compressed = {};
        
        for (let field of essentialFields.serialNumber) {
            if (record[field] !== undefined && record[field] !== '') {
                compressed.sn = record[field];
                break;
            }
        }
        
        for (let field of essentialFields.materialNumber) {
            if (record[field] !== undefined && record[field] !== '') {
                compressed.mn = record[field];
                break;
            }
        }
        
        return compressed;
    }).filter(r => r.sn);
}

function compressMappingData(data) {
    const essentialFields = {
        materialNumber: ['物料号', '主板物料号', '主板编号', '板号', 'Board Number', 'MB', 'Part Number', '主板IPN', 'IPN'],
        model: ['型号', '主板型号', 'Model', 'Board Model'],
        softwareVersion: ['可安装软件版本', '软件版本', 'Software Version', '版本']
    };
    
    return data.map(record => {
        const compressed = {};
        
        for (let field of essentialFields.materialNumber) {
            if (record[field] !== undefined && record[field] !== '') {
                compressed.mn = record[field];
                break;
            }
        }
        
        for (let field of essentialFields.model) {
            if (record[field] !== undefined && record[field] !== '') {
                compressed.md = record[field];
                break;
            }
        }
        
        for (let field of essentialFields.softwareVersion) {
            if (record[field] !== undefined && record[field] !== '') {
                compressed.sv = record[field];
                break;
            }
        }
        
        return compressed;
    }).filter(r => r.mn);
}

// API 路由

// 获取数据状态
app.get('/api/status', (req, res) => {
    res.json({
        isDataLoaded: mainData.length > 0 && mappingData.length > 0,
        mainDataCount: mainData.length,
        mappingDataCount: mappingData.length,
        lastUpdated: dataLastUpdated
    });
});

// 上传主数据文件
app.post('/api/upload/main', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        let allData = [];
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet);
            allData = allData.concat(sheetData);
        });

        mainData = compressData(allData);
        
        res.json({
            success: true,
            message: '主数据上传成功',
            originalCount: allData.length,
            compressedCount: mainData.length
        });
    } catch (error) {
        console.error('上传主数据错误:', error);
        res.status(500).json({ error: '上传失败: ' + error.message });
    }
});

// 上传匹配数据文件
app.post('/api/upload/mapping', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        let allData = [];
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet);
            allData = allData.concat(sheetData);
        });

        mappingData = compressMappingData(allData);
        
        res.json({
            success: true,
            message: '匹配数据上传成功',
            originalCount: allData.length,
            compressedCount: mappingData.length
        });
    } catch (error) {
        console.error('上传匹配数据错误:', error);
        res.status(500).json({ error: '上传失败: ' + error.message });
    }
});

// 保存数据
app.post('/api/save', (req, res) => {
    try {
        dataLastUpdated = new Date().toLocaleString();
        
        res.json({
            success: true,
            message: '数据保存成功（注意：Vercel 重启后数据会丢失）',
            mainDataCount: mainData.length,
            mappingDataCount: mappingData.length,
            lastUpdated: dataLastUpdated
        });
    } catch (error) {
        console.error('保存数据错误:', error);
        res.status(500).json({ error: '保存失败: ' + error.message });
    }
});

// 获取所有数据（用于查询）
app.get('/api/data', (req, res) => {
    res.json({
        mainData,
        mappingData,
        lastUpdated: dataLastUpdated
    });
});

// 查询仪器信息
app.get('/api/search', (req, res) => {
    const { sn } = req.query;
    
    if (!sn) {
        return res.status(400).json({ error: '请提供序列号' });
    }

    // 在主数据中查找
    const foundRecord = mainData.find(record => {
        const recordSN = record.sn || '';
        return recordSN.toString().trim().toUpperCase() === sn.toUpperCase();
    });

    if (!foundRecord) {
        return res.json({
            found: false,
            message: '未找到该序列号'
        });
    }

    // 获取物料号
    const materialNumber = foundRecord.mn || '';

    // 在匹配数据中查找
    let model = '';
    let softwareVersions = '';
    
    if (materialNumber) {
        const mapping = mappingData.find(m => {
            const mapMaterialNumber = m.mn || '';
            return mapMaterialNumber.toString().trim().toUpperCase() === materialNumber.toString().trim().toUpperCase();
        });
        
        if (mapping) {
            model = mapping.md || '';
            softwareVersions = mapping.sv || '';
        }
    }

    res.json({
        found: true,
        serialNumber: sn,
        materialNumber,
        model,
        softwareVersions
    });
});

// 清除所有数据
app.post('/api/clear', (req, res) => {
    try {
        mainData = [];
        mappingData = [];
        dataLastUpdated = null;
        
        res.json({
            success: true,
            message: '所有数据已清除'
        });
    } catch (error) {
        console.error('清除数据错误:', error);
        res.status(500).json({ error: '清除失败: ' + error.message });
    }
});

// 账户管理 API

// 登录验证
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: '请提供用户名和密码' });
    }
    
    if (username === accountCredentials.username && password === accountCredentials.password) {
        res.json({
            success: true,
            message: '登录成功',
            username: accountCredentials.username
        });
    } else {
        res.status(401).json({
            success: false,
            error: '用户名或密码错误'
        });
    }
});

// 获取当前账户信息（仅返回用户名）
app.get('/api/auth/account', (req, res) => {
    res.json({
        username: accountCredentials.username
    });
});

// 修改账户密码
app.post('/api/auth/change-password', (req, res) => {
    const { currentUsername, currentPassword, newUsername, newPassword } = req.body;
    
    if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
        return res.status(400).json({ error: '请提供完整的账户信息' });
    }
    
    // 验证当前账户密码
    if (currentUsername !== accountCredentials.username || currentPassword !== accountCredentials.password) {
        return res.status(401).json({
            success: false,
            error: '当前用户名或密码错误'
        });
    }
    
    // 更新账户信息
    accountCredentials.username = newUsername;
    accountCredentials.password = newPassword;
    
    res.json({
        success: true,
        message: '账户密码修改成功',
        username: newUsername
    });
});

// 健康检查
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: '仪器主板检查工具 API 服务正常运行',
        version: '1.0.0'
    });
});

module.exports = app;
