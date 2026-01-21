import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { GoogleGenAI } from "@google/genai";
import DatabaseService from './services/databaseService.js';
import { TableData } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 在生产环境中，server.js 在 dist-server 目录，静态文件在 dist 目录
// 在开发环境中，server.ts 在根目录，静态文件在 dist 目录
const distPath = __dirname.includes('dist-server') 
  ? path.join(__dirname, '..', 'dist')
  : path.join(__dirname, 'dist');

const app = express();
const PORT = process.env.PORT || 3000;
const dbService = new DatabaseService();

// 创建uploads目录（如果不存在）
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// 获取客户端IP地址的辅助函数
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.socket.remoteAddress || 'unknown';
  return ip.trim();
}

// Helper to generate initial data
const generateSeats = (tablePrefix: string, count: number, names: (string | null)[]): Array<{ id: string; seatNumber: number; attendeeName: string | null }> => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${tablePrefix}-s${i + 1}`,
    seatNumber: i + 1,
    attendeeName: names[i] || null,
  }));
};

const INITIAL_DATA: TableData[] = [
  {
    id: 't1',
    name: 'VIP 主桌',
    x: 300,
    y: 50,
    seats: generateSeats('t1', 8, ['张总', '李总', '王董', '赵总', '孙总', 'Alice', 'Bob', 'Charlie']),
  },
  {
    id: 't2',
    name: '技术部 (Tech)',
    x: 100,
    y: 350,
    seats: generateSeats('t2', 10, ['张三', '李四', '王五', '赵六', 'Dev1', 'Dev2', 'Dev3', 'Dev4', 'Dev5', 'Dev6']),
  },
  {
    id: 't3',
    name: '市场部 (Sales)',
    x: 500,
    y: 350,
    seats: generateSeats('t3', 10, ['Sarah', 'Mike', 'Jenny', 'Tom', 'Jerry', 'Sales1', 'Sales2', 'Sales3', 'Sales4', 'Sales5']),
  },
  {
    id: 't4',
    name: '运营部 (Ops)',
    x: 100,
    y: 650,
    seats: generateSeats('t4', 10, ['OpsLead', 'Ops2', 'Ops3', 'Ops4', 'Ops5', 'Ops6', 'Ops7', 'Ops8', 'Ops9', 'Ops10']),
  },
  {
    id: 't5',
    name: '新人桌 (New)',
    x: 500,
    y: 650,
    seats: generateSeats('t5', 8, ['Intern1', 'Intern2', 'Intern3', 'Intern4', 'Intern5', 'Intern6', 'Intern7', 'Intern8']),
  },
];

app.use(cors());
app.use(express.json());
app.use(express.static(distPath));

// 提供上传的照片文件
app.use('/uploads', express.static(uploadsDir));

// API: Get Tables
app.get('/api/tables', async (req: Request, res: Response) => {
  try {
    const tables = await dbService.getTables();
    if (tables.length === 0) {
      // 如果没有数据，初始化默认数据
      await dbService.initializeData(INITIAL_DATA);
      const initializedTables = await dbService.getTables();
      return res.json(initializedTables);
    }
    res.json(tables);
  } catch (error) {
    console.error("Error getting tables:", error);
    res.status(500).json({ error: 'Failed to get tables' });
  }
});

// API: Save Tables
app.post('/api/tables', async (req: Request, res: Response) => {
  try {
    const newTables = req.body as TableData[];
    if (!Array.isArray(newTables)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }
    await dbService.saveTables(newTables);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save data', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// API: Generate Fortune (Proxy to Gemini)
app.post('/api/fortune', async (req: Request, res: Response) => {
  const { name, tableName } = req.body as { name?: string; tableName?: string };
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY is not set on server");
    return res.status(500).json({ text: "系统配置错误：未找到 API Key" });
  }

  if (!name || !tableName) {
    return res.status(400).json({ text: "缺少必要参数" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are the host of a lively corporate annual meeting in China.
      Generate a short, witty, and encouraging "2025 Annual Fortune" (新年签) for an attendee named "${name}" who is sitting at the "${tableName}".
      
      Requirements:
      - Language: Chinese (Simplified).
      - Tone: Festive, professional yet fun, slightly humorous.
      - Length: Under 50 words.
      - Include a lucky number or lucky color based on their table name randomly.
      - Do not output markdown, just plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ text: "新年快乐！(AI 生成失败，请重试)" });
  }
});

// ========== 照片上传和投票相关API ==========

// API: 上传照片
app.post('/api/photos/upload', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的照片' });
    }

    const clientIp = getClientIp(req);
    const photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const filePath = `/uploads/${req.file.filename}`;

    await dbService.addPhoto({
      id: photoId,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filePath: filePath,
      uploaderIp: clientIp,
      voteCount: 0,
    });

    res.json({
      success: true,
      photo: {
        id: photoId,
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        filePath: filePath,
        imageUrl: filePath,
        uploaderIp: clientIp,
        voteCount: 0,
      }
    });
  } catch (error) {
    console.error('Failed to upload photo:', error);
    if (req.file) {
      // 删除上传失败的文件
      fs.unlinkSync(path.join(uploadsDir, req.file.filename));
    }
    res.status(500).json({ error: '上传失败，请重试' });
  }
});

// API: 获取所有照片
app.get('/api/photos', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    const photos = await dbService.getPhotos(clientIp);
    
    // 添加图片URL
    const photosWithUrl = photos.map(photo => ({
      ...photo,
      imageUrl: photo.filePath,
    }));

    res.json(photosWithUrl);
  } catch (error) {
    console.error('Failed to get photos:', error);
    res.status(500).json({ error: '获取照片列表失败' });
  }
});

// API: 投票
app.post('/api/photos/:id/vote', async (req: Request, res: Response) => {
  try {
    const photoId = req.params.id;
    const clientIp = getClientIp(req);

    // 检查投票状态
    const votingStatus = await dbService.getVotingStatus();
    if (!votingStatus.votingEnabled || votingStatus.votingStopped) {
      return res.status(403).json({ error: '投票已关闭' });
    }

    const success = await dbService.votePhoto(photoId, clientIp);
    
    if (!success) {
      return res.status(400).json({ error: '您已经投过票了' });
    }

    // 获取更新后的照片信息
    const photos = await dbService.getPhotos(clientIp);
    const updatedPhoto = photos.find(p => p.id === photoId);

    res.json({
      success: true,
      photo: updatedPhoto ? { ...updatedPhoto, imageUrl: updatedPhoto.filePath } : null,
    });
  } catch (error) {
    console.error('Failed to vote:', error);
    res.status(500).json({ error: '投票失败，请重试' });
  }
});

// API: 获取投票状态
app.get('/api/voting/status', async (req: Request, res: Response) => {
  try {
    const status = await dbService.getVotingStatus();
    res.json(status);
  } catch (error) {
    console.error('Failed to get voting status:', error);
    res.status(500).json({ error: '获取投票状态失败' });
  }
});

// API: 更新投票状态（管理员）
app.post('/api/voting/status', async (req: Request, res: Response) => {
  try {
    const { votingEnabled, votingStopped } = req.body as { votingEnabled?: boolean; votingStopped?: boolean };
    
    await dbService.updateVotingStatus({
      votingEnabled,
      votingStopped,
    });

    const status = await dbService.getVotingStatus();
    res.json(status);
  } catch (error) {
    console.error('Failed to update voting status:', error);
    res.status(500).json({ error: '更新投票状态失败' });
  }
});

// Serve React App for any other route
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 启动服务器
async function startServer(): Promise<void> {
  // 测试数据库连接
  console.log('Testing database connection...');
  const isConnected = await dbService.testConnection();
  
  if (!isConnected) {
    console.error('Failed to connect to database. Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
    return;
  }

  console.log('Database connected successfully');

  // 初始化数据（如果数据库为空）
  try {
    await dbService.initializeData(INITIAL_DATA);
  } catch (error) {
    console.error('Failed to initialize data:', error);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connections...');
  await dbService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connections...');
  await dbService.close();
  process.exit(0);
});

startServer();
