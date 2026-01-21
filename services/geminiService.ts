import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateFortune = async (name: string, tableName: string): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "祝你新年快乐，万事如意！（API Key missing）";
  }

  try {
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

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "新年快乐！Gemini 正在思考你的运势...";
  } catch (error) {
    console.error("Error generating fortune:", error);
    return "新年快乐！愿你2025年好运连连！(Network Error)";
  }
};
