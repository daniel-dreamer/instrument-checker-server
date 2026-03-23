const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// 数据存储目录
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 内存中的数据缓存
let mainData = [];
let mappingData = [];
let dataLastUpdated = null;

// 文件上传配置
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 压缩数据函数（与管理界面相同）
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

// 保存数据到文件
function saveDataToFile() {
    const data = {
        mainData,
        mappingData,
        lastUpdated: dataLastUpdated
    };
    fs.writeFileSync(path.join(DATA_DIR, 'instrument-data.json'), JSON.stringify(data, null, 2));
}

// 从文件加载数据
function loadDataFromFile() {
    const dataFile = path.join(DATA_DIR, 'instrument-data.json');
    if (fs.existsSync(dataFile)) {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        mainData = data.mainData || [];
        mappingData = data.mappingData || [];
        dataLastUpdated = data.lastUpdated;
        console.log('已从文件加载数据:', {
            mainDataCount: mainData.length,
            mappingDataCount: mappingData.length,
            lastUpdated: dataLastUpdated
        });
    }
}

// 启动时加载数据
loadDataFromFile();

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
        saveDataToFile();
        
        res.json({
            success: true,
            message: '数据保存成功',
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
        
        const dataFile = path.join(DATA_DIR, 'instrument-data.json');
        if (fs.existsSync(dataFile)) {
            fs.unlinkSync(dataFile);
        }
        
        res.json({
            success: true,
            message: '所有数据已清除'
        });
    } catch (error) {
        console.error('清除数据错误:', error);
        res.status(500).json({ error: '清除失败: ' + error.message });
    }
});

// 启动服务器 - 监听所有网络接口
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('仪器主板检查工具服务器已启动');
    console.log('='.repeat(60));
    console.log(`本机访问: http://localhost:${PORT}`);
    console.log(`局域网访问: http://0.0.0.0:${PORT}`);
    console.log(`管理界面: http://localhost:${PORT}/server/admin-server.html`);
    console.log(`查询界面: http://localhost:${PORT}/server/query-server.html`);
    console.log('='.repeat(60));
    console.log('提示: 其他电脑请使用服务器IP地址访问');
    console.log('      例如: http://192.168.1.xxx:' + PORT);
    console.log('='.repeat(60));
    console.log('按 Ctrl+C 停止服务器');
    console.log('='.repeat(60));
});
