import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'seats.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Helper to generate initial data
const generateSeats = (tablePrefix, count, names) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${tablePrefix}-s${i + 1}`,
    seatNumber: i + 1,
    attendeeName: names[i] || null,
  }));
};

const INITIAL_DATA = [
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
app.use(express.static(path.join(__dirname, 'dist')));

// API: Get Tables
app.get('/api/tables', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      if (data && data.trim()) {
         const json = JSON.parse(data);
         if (Array.isArray(json)) {
             return res.json(json);
         }
      }
      console.warn("Data file exists but is invalid or empty. Resetting.");
    }
  } catch (error) {
    console.error("Error reading data file:", error);
  }

  // Fallback
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    res.json(INITIAL_DATA);
  } catch (writeError) {
    console.error("Failed to write initial data:", writeError);
    res.json(INITIAL_DATA);
  }
});

// API: Save Tables
app.post('/api/tables', (req, res) => {
  try {
    const newTables = req.body;
    if (!Array.isArray(newTables)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(newTables, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save data', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// API: Generate Fortune (Proxy to Gemini)
app.post('/api/fortune', async (req, res) => {
  const { name, tableName } = req.body;
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY is not set on server");
    return res.status(500).json({ text: "系统配置错误：未找到 API Key" });
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

// Serve React App for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});